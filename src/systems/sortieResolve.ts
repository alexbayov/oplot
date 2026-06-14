// M13: авторесолв вылазки.
//
// Заменяет CombatScene + combatEngine + всю combat-семью. Принимает чистый
// снимок героя и параметры вылазки, возвращает результат без побочных
// эффектов. GameState мутируется только на стороне сцен.
//
// Контракт и тестовые gate-ы: docs/redesign/M13-PIVOT.md §«Авторесолв».

import type { InventoryStack } from "../state/types";
import type { ZoneLootCategory, ZoneLootProfile } from "../types/zone";
import type {
  BaseResourceId,
  EncounterInput,
  EncounterResult,
  HeroSnapshot,
  InjuryState,
  SortieGoal,
  SortieGoalDef,
  SortiePlanInput,
  SortiePlanResult,
} from "../types/sortie";

export type Rng = () => number;

/** Каталог целей вылазки. Источник истины для UI и формулы. */
export const SORTIE_GOALS: Readonly<Record<SortieGoal, SortieGoalDef>> = {
  quiet: {
    id: "quiet",
    name_ru: "Тихо",
    description_ru: "Меньше потерь, меньше лута. Безопаснее.",
    hp_damage_modifier: 0.75,
    loot_count_modifier: 0.85,
  },
  greedy: {
    id: "greedy",
    name_ru: "Жадно",
    description_ru: "Лута больше, потерь тоже.",
    hp_damage_modifier: 1.25,
    loot_count_modifier: 1.3,
  },
  targeted_fuel: {
    id: "targeted_fuel",
    name_ru: "Точечно: топливо",
    description_ru: "Перекос на топливо, меньше всего остального.",
    hp_damage_modifier: 1.0,
    loot_count_modifier: 0.9,
    loot_bias: "fuel",
  },
  targeted_metal: {
    id: "targeted_metal",
    name_ru: "Точечно: металл",
    description_ru: "Перекос на металл и электронику.",
    hp_damage_modifier: 1.0,
    loot_count_modifier: 0.9,
    loot_bias: "metal",
  },
  targeted_food: {
    id: "targeted_food",
    name_ru: "Точечно: еда",
    description_ru: "Перекос на еду.",
    hp_damage_modifier: 1.0,
    loot_count_modifier: 0.9,
    loot_bias: "food",
  },
  targeted_water: {
    id: "targeted_water",
    name_ru: "Точечно: вода",
    description_ru: "Перекос на воду.",
    hp_damage_modifier: 1.0,
    loot_count_modifier: 0.9,
    loot_bias: "water",
  },
};

/** Какие item_id считаются принадлежащими ресурсу базы. */
export const BASE_RESOURCE_ITEMS: Readonly<Record<BaseResourceId, readonly string[]>> = {
  water: ["water"],
  fuel: ["fuel", "machine_oil", "oil"],
  metal: ["scrap_metal", "scrap", "metal", "electronics", "circuitry", "industrial_cable"],
  food: ["canned_food", "food", "ration_bar"],
};

const DEPTH_THREAT_MULTIPLIER: Readonly<Record<1 | 2 | 3, number>> = {
  1: 1.0,
  2: 1.4,
  3: 1.8,
};

const INJURY_KINDS: InjuryState["kind"][] = ["arm", "leg", "head"];

const BANDAGE_HEAL = 15;
const MEDKIT_HEAL = 40;
const INJURY_HP_THRESHOLD_RATIO = 0.4;
const INJURY_BASE_CHANCE = 0.3;

const clamp = (n: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, n));

/**
 * Маппит экипированную броню в `armor_reduction` для HeroSnapshot.
 * Источник истины для одного места, где данные брони встречают авторесолв —
 * до PR-3 эта логика жила инлайном в SortieRunScene.snapshotHero() и
 * существовала отдельно от тестов авторесолва (которые принимают уже
 * готовый armor_reduction). После миграции items.json (PR-5) броня
 * перейдёт на M13-схему со stats.armor_value, до неё боевая броня всё ещё
 * лежит как stats.defense. Хелпер покрывает оба пути плюс легаси-формы
 * на верхнем уровне, чтобы один проход тесты + рантайм.
 */
export const computeArmorReduction = (armor: unknown): number => {
  if (!armor || typeof armor !== "object") return 0.1;
  const a = armor as {
    stats?: { armor_value?: unknown; defense?: unknown };
    armor_reduction?: unknown;
    defense?: unknown;
  };
  if (typeof a.stats?.armor_value === "number") {
    return clamp(a.stats.armor_value / 10, 0, 0.9);
  }
  if (typeof a.stats?.defense === "number") {
    return clamp(a.stats.defense / 10, 0, 0.9);
  }
  if (typeof a.armor_reduction === "number") {
    return clamp(a.armor_reduction, 0, 0.9);
  }
  if (typeof a.defense === "number") {
    return clamp(a.defense / 10, 0, 0.9);
  }
  return 0.1;
};

const jitter = (rng: Rng, min = 0.85, max = 1.15): number =>
  min + rng() * (max - min);

const rollInt = (rng: Rng, min: number, max: number): number => {
  if (max <= min) return min;
  return min + Math.floor(rng() * (max - min + 1));
};

/**
 * Считает «сырую угрозу» врагов в энкаунтере. Без модификаторов цели.
 * Используется как `mob_total_threat` в EncounterInput.
 */
export const computeMobThreat = (
  mob_ids: string[],
  mobsData: Record<string, { hp?: number; danger?: number; damage_min?: number; damage_max?: number }>,
): number => {
  let total = 0;
  for (const id of mob_ids) {
    const mob = mobsData[id];
    if (!mob) continue;
    if (typeof mob.danger === "number") {
      total += mob.danger;
      continue;
    }
    const dmgAvg = ((mob.damage_min ?? 4) + (mob.damage_max ?? 8)) / 2;
    const hpFactor = (mob.hp ?? 20) / 10;
    total += dmgAvg + hpFactor;
  }
  return total;
};

/**
 * Считает «силу героя» против энкаунтера. С учётом цели, ранений и скилла.
 */
const computeHeroPower = (hero: HeroSnapshot, goal: SortieGoalDef): number => {
  const skillBonus = 1 + Math.min(10, hero.skill_combat) * 0.08;
  const levelBonus = 1 + hero.level * 0.05;
  const injuryPenalty = Math.max(0, 1 - hero.injuries.length * 0.1);
  const base = (hero.weapon_damage_avg + 2) * skillBonus * levelBonus * injuryPenalty;
  // Цель «Тихо» снижает урон, «Жадно» оставляет как есть, точечные нейтральны.
  const goalDamageScale =
    goal.id === "quiet" ? 0.9 : goal.id === "greedy" ? 1.05 : 1.0;
  return base * goalDamageScale;
};

const decideOutcome = (
  heroPower: number,
  mobThreat: number,
  rng: Rng,
): EncounterResult["outcome"] => {
  if (mobThreat <= 0) return "won";
  const ratio = heroPower / mobThreat;
  if (ratio < 0.4) {
    return "knocked_out";
  }
  if (ratio < 0.7) {
    return rng() < 0.5 ? "fled" : "won";
  }
  return "won";
};

/**
 * Какие категории `loot_profile.base_weights` различает rollLoot.
 * Совпадает с BaseResourceId плюс "other" для не-базовых предметов.
 */
const CATEGORY_KEYS: ZoneLootCategory[] = ["water", "fuel", "metal", "food", "other"];

/**
 * M13 PR-2: пред-расчёт «к какой категории относится каждый item в пуле».
 * "other" — item не входит ни в одну BASE_RESOURCE_ITEMS-категорию.
 */
const partitionPoolByCategory = (
  pool: string[],
): Record<ZoneLootCategory, string[]> => {
  const out: Record<ZoneLootCategory, string[]> = {
    water: [],
    fuel: [],
    metal: [],
    food: [],
    other: [],
  };
  for (const id of pool) {
    let assigned = false;
    for (const cat of ["water", "fuel", "metal", "food"] as const) {
      if (BASE_RESOURCE_ITEMS[cat].includes(id)) {
        out[cat].push(id);
        assigned = true;
        break;
      }
    }
    if (!assigned) out.other.push(id);
  }
  return out;
};

/**
 * Катит категорию по нормализованным весам. Если в выпавшей категории нет
 * предметов в пуле — каскадим вниз по списку категорий, пока не найдём
 * непустую. В крайнем случае возвращаем uniform-choice из всего пула.
 */
const pickFromProfile = (
  partitioned: Record<ZoneLootCategory, string[]>,
  profile: ZoneLootProfile,
  pool: string[],
  rng: Rng,
): string | null => {
  let totalWeight = 0;
  for (const cat of CATEGORY_KEYS) {
    const w = profile.base_weights[cat] ?? 0;
    if (w > 0 && partitioned[cat].length > 0) totalWeight += w;
  }
  if (totalWeight <= 0) {
    // Профиль пустой или ни одна категория не пересекается с пулом.
    if (pool.length === 0) return null;
    const idx = Math.min(pool.length - 1, Math.floor(rng() * pool.length));
    return pool[idx] ?? null;
  }
  let roll = rng() * totalWeight;
  for (const cat of CATEGORY_KEYS) {
    const w = profile.base_weights[cat] ?? 0;
    if (w <= 0 || partitioned[cat].length === 0) continue;
    roll -= w;
    if (roll <= 0) {
      const bucket = partitioned[cat];
      const idx = Math.min(bucket.length - 1, Math.floor(rng() * bucket.length));
      return bucket[idx] ?? null;
    }
  }
  // Численный fallback на хвосте плавающей точки.
  const idx = Math.min(pool.length - 1, Math.floor(rng() * pool.length));
  return pool[idx] ?? null;
};

const rollLoot = (
  pool: string[],
  base_count: number,
  goal: SortieGoalDef,
  outcome: EncounterResult["outcome"],
  profile: ZoneLootProfile | undefined,
  rng: Rng,
): InventoryStack[] => {
  if (outcome === "knocked_out") return [];
  if (pool.length === 0 || base_count <= 0) return [];

  let count = Math.max(0, Math.round(base_count * goal.loot_count_modifier * jitter(rng, 0.9, 1.1)));
  if (outcome === "fled") {
    count = Math.max(0, Math.floor(count * 0.5));
  }

  const bias = goal.loot_bias;
  const biasIds = bias ? BASE_RESOURCE_ITEMS[bias] : null;
  const biasPresentInPool = biasIds ? pool.filter((id) => biasIds.includes(id)) : [];
  const biasActive = biasIds !== null && biasPresentInPool.length > 0;

  // Цельный goal-bias перебивает зональный профиль — игрок явно прицелился.
  // Если bias не активен и профиль задан — катим по профилю.
  const partitioned = !biasActive && profile ? partitionPoolByCategory(pool) : null;

  const counts = new Map<string, number>();
  for (let i = 0; i < count; i++) {
    let chosen: string | null = null;
    if (biasActive && rng() < 0.7) {
      const idx = Math.min(biasPresentInPool.length - 1, Math.floor(rng() * biasPresentInPool.length));
      chosen = biasPresentInPool[idx] ?? null;
    } else if (partitioned && profile) {
      chosen = pickFromProfile(partitioned, profile, pool, rng);
    }
    if (!chosen) {
      const idx = Math.min(pool.length - 1, Math.floor(rng() * pool.length));
      chosen = pool[idx] ?? null;
    }
    if (!chosen) continue;
    counts.set(chosen, (counts.get(chosen) ?? 0) + 1);
  }

  const result: InventoryStack[] = [];
  for (const [item_id, n] of counts.entries()) {
    if (n > 0) result.push({ item_id, count: n });
  }
  return result;
};

const applyConsumables = (
  hp_lost_raw: number,
  consumables: InventoryStack[],
  rng: Rng,
): { hp_lost: number; consumables_used: InventoryStack[] } => {
  if (hp_lost_raw <= 0) {
    return { hp_lost: 0, consumables_used: [] };
  }
  let remaining = hp_lost_raw;
  const used: InventoryStack[] = [];
  // Логика простая: при сильном уроне берём аптечку, при умеренном — бинт.
  // Один расходник на энкаунтер, чтобы не пожирать всю аптечку за раз.
  const has = (item_id: string): boolean =>
    consumables.some((s) => s.item_id === item_id && s.count > 0);

  if (remaining >= 30 && has("medkit")) {
    used.push({ item_id: "medkit", count: 1 });
    remaining = Math.max(0, remaining - MEDKIT_HEAL);
  } else if (remaining >= 10 && has("bandage")) {
    used.push({ item_id: "bandage", count: 1 });
    remaining = Math.max(0, remaining - BANDAGE_HEAL);
  } else if (remaining > 0 && has("bandage") && rng() < 0.5) {
    used.push({ item_id: "bandage", count: 1 });
    remaining = Math.max(0, remaining - BANDAGE_HEAL);
  }
  return { hp_lost: remaining, consumables_used: used };
};

const rollInjury = (
  hp_lost_final: number,
  hp_max: number,
  outcome: EncounterResult["outcome"],
  rng: Rng,
): InjuryState | undefined => {
  if (outcome === "knocked_out") {
    return {
      kind: INJURY_KINDS[rollInt(rng, 0, INJURY_KINDS.length - 1)] ?? "head",
      duration_days: rollInt(rng, 2, 4),
    };
  }
  if (hp_max <= 0) return undefined;
  if (hp_lost_final < hp_max * INJURY_HP_THRESHOLD_RATIO) return undefined;
  if (rng() >= INJURY_BASE_CHANCE) return undefined;
  return {
    kind: INJURY_KINDS[rollInt(rng, 0, INJURY_KINDS.length - 1)] ?? "arm",
    duration_days: rollInt(rng, 1, 3),
  };
};

/**
 * Главная функция: разрулить один энкаунтер.
 *
 * Чистая. Не пишет в GameState, не зависит от Phaser. Возвращает результат,
 * который сцена применяет одним atomic-апдейтом.
 */
export const resolveEncounter = (input: EncounterInput, rng: Rng): EncounterResult => {
  const goalDef = SORTIE_GOALS[input.goal];
  const mobThreatAdjusted = input.mob_total_threat * DEPTH_THREAT_MULTIPLIER[input.depth];
  const heroPower = computeHeroPower(input.hero, goalDef);

  const outcome = decideOutcome(heroPower, mobThreatAdjusted, rng);

  // Базовый урон по герою = угроза * (1 - armor) * goal_modifier * jitter.
  const armor = clamp(input.hero.armor_reduction, 0, 0.9);
  const baseDamage =
    mobThreatAdjusted * (1 - armor) * goalDef.hp_damage_modifier * jitter(rng);

  let hp_lost_raw =
    outcome === "knocked_out"
      ? Math.max(input.hero.hp, Math.round(baseDamage * 1.5))
      : outcome === "fled"
        ? Math.round(baseDamage * 0.7)
        : Math.round(baseDamage);

  hp_lost_raw = Math.max(0, hp_lost_raw);

  const { hp_lost, consumables_used } = applyConsumables(hp_lost_raw, input.consumables, rng);
  // hp_lost не может превысить текущее hp героя.
  const hp_lost_capped = Math.min(input.hero.hp, hp_lost);

  const loot_rolled = rollLoot(
    input.loot_pool,
    input.loot_base_count,
    goalDef,
    outcome,
    input.loot_profile,
    rng,
  );
  const injury = rollInjury(hp_lost_capped, input.hero.hp_max, outcome, rng);

  const narrative_lines = pickNarrativeLines(input.zone_id, outcome, rng);

  return {
    narrative_lines,
    hp_lost: hp_lost_capped,
    loot_rolled,
    consumables_used,
    injury,
    outcome,
  };
};

/**
 * Удобный wrapper для расчёта всей вылазки сразу (для не-интерактивных
 * сценариев, тестов и miграции «застрял в бою» → recover).
 *
 * Интерактивный путь (между энкаунтерами игрок выбирает «идти/вернуться»)
 * вызывает resolveEncounter напрямую.
 */
export const resolveFullSortie = (input: SortiePlanInput, rng: Rng): SortiePlanResult => {
  let heroState = { ...input.hero };
  const encounter_results: EncounterResult[] = [];
  let outcome: SortiePlanResult["outcome"] = "success";
  let encounters_completed = 0;

  for (const enc of input.encounters) {
    const result = resolveEncounter({ ...enc, hero: heroState }, rng);
    encounter_results.push(result);
    encounters_completed++;

    if (result.outcome === "knocked_out") {
      outcome = "knocked_out";
      break;
    }
    if (result.outcome === "fled") {
      outcome = "retreat";
      break;
    }
    heroState = {
      ...heroState,
      hp: Math.max(0, heroState.hp - result.hp_lost),
      injuries: result.injury ? [...heroState.injuries, result.injury] : heroState.injuries,
    };
    if (heroState.hp <= 0) {
      outcome = "knocked_out";
      break;
    }
  }

  const totals = aggregateTotals(encounter_results, encounters_completed);

  return {
    goal_intro: pickGoalIntro(input.goal, rng),
    return_intro: pickReturnIntro(outcome, rng),
    encounter_results,
    totals,
    outcome,
  };
};

const aggregateTotals = (
  results: EncounterResult[],
  encounters_completed: number,
): SortiePlanResult["totals"] => {
  let hp_lost = 0;
  const lootMap = new Map<string, number>();
  const consMap = new Map<string, number>();
  for (const r of results) {
    hp_lost += r.hp_lost;
    for (const s of r.loot_rolled) {
      lootMap.set(s.item_id, (lootMap.get(s.item_id) ?? 0) + s.count);
    }
    for (const s of r.consumables_used) {
      consMap.set(s.item_id, (consMap.get(s.item_id) ?? 0) + s.count);
    }
  }
  return {
    hp_lost,
    loot: Array.from(lootMap.entries()).map(([item_id, count]) => ({ item_id, count })),
    consumables_used: Array.from(consMap.entries()).map(([item_id, count]) => ({ item_id, count })),
    encounters_completed,
  };
};

// ── narrative ──

interface NarrativeBundle {
  encounters: { tags: string[]; lines: string[] }[];
  goal_intros: Record<string, string[]>;
  return_intros: Record<string, string[]>;
}

let narrativeCache: NarrativeBundle | null = null;

/** Подгружаем nar-content из ContentData один раз. Можно прокидывать в тестах. */
export const setNarrative = (data: NarrativeBundle | null): void => {
  narrativeCache = data;
};

export const getNarrative = (): NarrativeBundle | null => narrativeCache;

const pickFromArray = <T>(arr: T[], rng: Rng): T | null => {
  if (arr.length === 0) return null;
  const idx = Math.min(arr.length - 1, Math.floor(rng() * arr.length));
  return arr[idx] ?? null;
};

const pickNarrativeLines = (
  zone_id: string,
  outcome: EncounterResult["outcome"],
  rng: Rng,
): string[] => {
  const nar = narrativeCache;
  if (!nar) return [];
  const candidates: string[][] = [];
  for (const bucket of nar.encounters) {
    if (bucket.tags.includes(outcome) && (bucket.tags.includes(zone_id) || bucket.tags.includes("any"))) {
      if (bucket.lines.length > 0) candidates.push(bucket.lines);
    }
  }
  if (candidates.length === 0) return [];
  // Чуть приоритизируем bucket'ы под конкретную зону.
  const zonedFirst = candidates.sort((a, b) => {
    const aZoned = a.some(() => true) ? 1 : 0;
    const bZoned = b.some(() => true) ? 1 : 0;
    return bZoned - aZoned;
  });
  const bucket = zonedFirst[0] ?? candidates[0];
  if (!bucket) return [];
  const line = pickFromArray(bucket, rng);
  return line ? [line] : [];
};

const pickGoalIntro = (goal: SortieGoal, rng: Rng): string => {
  const nar = narrativeCache;
  if (!nar) return "";
  const arr = nar.goal_intros[goal] ?? [];
  return pickFromArray(arr, rng) ?? "";
};

const pickReturnIntro = (
  outcome: SortiePlanResult["outcome"],
  rng: Rng,
): string => {
  const nar = narrativeCache;
  if (!nar) return "";
  const arr = nar.return_intros[outcome] ?? [];
  return pickFromArray(arr, rng) ?? "";
};

// ── helpers used by SortieScene ──

/**
 * Считает loot-pool для энкаунтера в зоне на основе уровня глубины.
 * Простая обёртка вокруг Zone.levels — сцена сама подготавливает массив.
 */
export const buildEncounterLootPool = (
  resources: readonly string[],
  resource_count_range: readonly [number, number],
  rng: Rng,
): { pool: string[]; base_count: number } => {
  const [min, max] = resource_count_range;
  return {
    pool: Array.from(resources),
    base_count: rollInt(rng, min, max),
  };
};
