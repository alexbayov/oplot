/**
 * encounters — pool selection + effect application (M10.2).
 *
 * См.: docs/redesign/m10/M10.2-encounter-taxonomy.md
 *
 * Правила:
 *  - Зональная фильтрация (zones=["*"] = универсальный)
 *  - Cooldown: один и тот же encounter не повторяется 5 вылазок подряд
 *  - Lore rarity: weight 0.5× vs другие категории
 *  - Skill check fallback: если requires не выполнены — choice показывается,
 *    но selectable=false (greyed-out). UI решает.
 */

import type {
  Encounter,
  EncounterChoice,
  EncounterOutcome,
  EncounterRequirement,
} from "../types/encounter";

/**
 * Cooldown-trail последних N показанных encounter id'ов. Хранится в памяти
 * процесса; на M10.2 в save не сериализуется (это допустимо — после reload
 * пул просто свежий).
 */
const COOLDOWN_LEN = 5;
const recentEncounterIds: string[] = [];

export function resetEncounterCooldown(): void {
  recentEncounterIds.length = 0;
}

export function getRecentEncounterIds(): readonly string[] {
  return recentEncounterIds.slice();
}

export interface PlayerSnapshot {
  hp: number;
  hp_max: number;
  max_weight_kg: number;
  cur_weight: number;
  backpack_items: ReadonlyMap<string, number>; // item_id → count
  perks: readonly string[];
}

/**
 * Выбор encounter'а для текущего контекста. Возвращает null если pool пустой.
 *
 * @param all — все загруженные encounter'ы
 * @param zoneId — id зоны вылазки ("forest", "city", …)
 * @param rng — функция [0..1) (для тестов)
 */
export function pickEncounter(
  all: readonly Encounter[],
  zoneId: string,
  rng: () => number = Math.random,
): Encounter | null {
  // 1. Zone filter
  const zoneMatches = all.filter(
    (e) => e.zones.includes("*") || e.zones.includes(zoneId),
  );
  // 2. Cooldown filter — но если pool окажется пустым, игнорируем cooldown
  let pool = zoneMatches.filter((e) => !recentEncounterIds.includes(e.id));
  if (pool.length === 0) pool = zoneMatches;
  if (pool.length === 0) return null;

  // 3. Weighted random by rarity
  const totalWeight = pool.reduce((s, e) => s + (e.rarity ?? 1), 0);
  let roll = rng() * totalWeight;
  for (const e of pool) {
    roll -= e.rarity ?? 1;
    if (roll <= 0) {
      pushCooldown(e.id);
      return e;
    }
  }
  // Fallback (numerical edge)
  const last = pool[pool.length - 1]!;
  pushCooldown(last.id);
  return last;
}

function pushCooldown(id: string): void {
  recentEncounterIds.push(id);
  if (recentEncounterIds.length > COOLDOWN_LEN) {
    recentEncounterIds.shift();
  }
}

/**
 * Проверяет, выполнены ли все requirements у choice. Если нет, choice
 * должен быть disabled.
 */
export function canSelectChoice(
  choice: EncounterChoice,
  player: PlayerSnapshot,
): boolean {
  if (!choice.requires || choice.requires.length === 0) return true;
  return choice.requires.every((r) => checkRequirement(r, player));
}

function checkRequirement(req: EncounterRequirement, p: PlayerSnapshot): boolean {
  switch (req.type) {
    case "has_item": {
      const have = p.backpack_items.get(req.id) ?? 0;
      return have >= (req.min ?? 1);
    }
    case "has_perk":
      return p.perks.includes(req.id);
    case "max_weight_pct":
      return p.max_weight_kg > 0 && p.cur_weight / p.max_weight_kg <= req.value;
    default:
      return false;
  }
}

/**
 * Взвешенный выбор одного outcome из choice.outcomes.
 */
export function rollOutcome(
  choice: EncounterChoice,
  rng: () => number = Math.random,
): EncounterOutcome {
  if (choice.outcomes.length === 0) {
    return { weight: 1 };
  }
  if (choice.outcomes.length === 1) {
    return choice.outcomes[0]!;
  }
  const total = choice.outcomes.reduce((s, o) => s + o.weight, 0);
  let roll = rng() * total;
  for (const o of choice.outcomes) {
    roll -= o.weight;
    if (roll <= 0) return o;
  }
  return choice.outcomes[choice.outcomes.length - 1]!;
}
