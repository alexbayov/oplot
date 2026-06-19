// M16-PR3 — Реестр случайных аффиксов оружия + roll + применение.
//
// Аффиксы — это слой «качества» поверх собранного оружия (M13-BUILDS
// §«слой аффиксов»): 1 ролл на сборку (не на часть), 0-2 аффикса по
// максимальному тиру частей. Frozen на инстансе при сборке, применяются
// в эффективные combat-статы в резолвере (`resolveEquippedCombat`).
//
// === Защита петли M15 (preflight §5) ===
// `AffixStat` — УЗКИЙ union из combat-поверхности (damage/accuracy/weight).
// durability/repair/disassembly НЕДОСТУПНЫ как цели аффиксов by-construction:
// любой affix-def вне whitelist не скомпилируется. Структурный тест
// дополнительно проверяет «реестр ⊆ whitelist» в рантайме (belt-and-suspenders).
//
// === Freeze-on-assembly (C4) ===
// На инстансе хранится `WeaponAffix{id, value}` — value заморожен при ролле.
// Применение читает frozen value (баланс-патч реестра НЕ переписывает статы
// старых сейв-инстансов). Реестр нужен только для маппинга id → `stat`.

import type { ComponentItem } from "../types";
import type { WeaponAffix } from "./weaponAssembly";

/**
 * Hard whitelist поверхностей, на которые аффикс может влиять (preflight §5).
 * Узкий union ⇒ compile-time enforcement: durability_max/durability_current/
 * repair/disassembly как цель аффикса не скомпилируются.
 */
export type AffixStat = "damage_min" | "damage_max" | "accuracy" | "weight_kg";

/**
 * Определение аффикса в реестре. `value` — фиксированная магнитуда вклада
 * (тюнинг-константа; тесты бьют по знаку/структуре, не по точному числу —
 * баланс крутится после плейтеста). Знак определяет buff/debuff:
 *  - `accuracy`/`damage_*` > 0 — бонус;
 *  - `weight_kg` < 0 — облегчение (бонус к handling), > 0 — утяжеление.
 */
export interface AffixDef {
  id: string;
  kind: "prefix" | "suffix";
  stat: AffixStat;
  value: number;
  /** Имя для UI (Арсенал detail). Prefix — прилагательное, suffix — «… X». */
  name_ru: string;
}

/**
 * Пул аффиксов. Префиксы тяготеют к offense (Танк), суффиксы — к handling
 * (Стрелок), но roll не привязан к строю — это слой вариативности поверх
 * part-driven идентичности билда. Все `stat` ∈ AffixStat (whitelist).
 */
export const AFFIX_REGISTRY: readonly AffixDef[] = [
  { id: "pre_heavy", kind: "prefix", stat: "damage_max", value: 3, name_ru: "Тяжёлый" },
  { id: "pre_honed", kind: "prefix", stat: "damage_min", value: 2, name_ru: "Заточенный" },
  { id: "suf_precise", kind: "suffix", stat: "accuracy", value: 6, name_ru: "точности" },
  { id: "suf_marksman", kind: "suffix", stat: "accuracy", value: 3, name_ru: "снайпера" },
  { id: "suf_balanced", kind: "suffix", stat: "weight_kg", value: -0.4, name_ru: "баланса" },
];

const BY_ID: ReadonlyMap<string, AffixDef> = new Map(
  AFFIX_REGISTRY.map((a) => [a.id, a]),
);

/** Поиск определения по id. `undefined` — id не в реестре (старый сейв / удалённый аффикс). */
export const getAffixDef = (id: string): AffixDef | undefined => BY_ID.get(id);

/**
 * Порог тира для второго аффикса (preflight §6-fork-D): tier 1-2 → max 1
 * аффикс, tier 3-5 → max 2. Прокси «качества» без введения тира верстака
 * (тот — M17 base-sim).
 */
export const AFFIX_TIER2_THRESHOLD = 3;

/** Суммарный вклад combat-стат по списку frozen-аффиксов. Unknown id — skip. */
export interface AffixContribution {
  damage_min: number;
  damage_max: number;
  accuracy: number;
  weight_kg: number;
}

/**
 * Поэлементная сумма вкладов аффиксов в combat-статы. Читает frozen `value`
 * с инстанса (не реестровый — freeze-on-assembly), маппит на `stat` через
 * реестр. Аффикс с неизвестным id (удалён из реестра в новом релизе)
 * пропускается — старый сейв не падает, аффикс просто становится no-op.
 */
export const affixContribution = (
  affixes: readonly WeaponAffix[],
): AffixContribution => {
  const c: AffixContribution = {
    damage_min: 0,
    damage_max: 0,
    accuracy: 0,
    weight_kg: 0,
  };
  for (const a of affixes) {
    const def = BY_ID.get(a.id);
    if (!def) continue; // defensive: unknown id → no-op
    c[def.stat] += a.value;
  }
  return c;
};

/**
 * Ролл 0-2 аффиксов на собранное оружие. Детерминирован на seeded `rng`
 * (тот же, что генерит `nextWeaponInstanceId`; порядок id → affixes
 * зафиксирован в `assembleFromStash`, preflight §6-fork-G — для
 * стабильности save-snapshot тестов).
 *
 * Count-driver — максимальный тир частей сборки (fork D): 1-2 → [0,1],
 * 3-5 → [0,2]. Выбор без повторов из реестра. На инстансе замораживается
 * `{id, value}` (value = реестровое значение на момент ролла).
 */
export const rollAffixes = (
  parts: readonly ComponentItem[],
  rng: () => number,
): WeaponAffix[] => {
  const maxTier = parts.reduce((m, p) => Math.max(m, p.tier), 0);
  const maxCount = maxTier >= AFFIX_TIER2_THRESHOLD ? 2 : 1;
  // Uniform целое в [0, maxCount].
  const count = Math.min(maxCount, Math.floor(rng() * (maxCount + 1)));
  if (count <= 0) return [];

  const pool = [...AFFIX_REGISTRY];
  const rolled: WeaponAffix[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.min(pool.length - 1, Math.floor(rng() * pool.length));
    const [def] = pool.splice(idx, 1);
    if (!def) break;
    rolled.push({ id: def.id, value: def.value });
  }
  return rolled;
};

/**
 * UI-описание frozen-аффикса (Арсенал detail). `null` — id не в реестре
 * (старый сейв) ⇒ сцена скрывает строку. Эффект форматируется со знаком
 * относительно frozen value (не реестрового).
 */
const STAT_LABEL_RU: Readonly<Record<AffixStat, string>> = {
  damage_min: "мин. урон",
  damage_max: "макс. урон",
  accuracy: "точность",
  weight_kg: "вес, кг",
};

export const describeAffix = (
  affix: WeaponAffix,
): { name_ru: string; effect: string } | null => {
  const def = BY_ID.get(affix.id);
  if (!def) return null;
  const v = affix.value;
  const sign = v > 0 ? `+${v}` : `${v}`;
  return { name_ru: def.name_ru, effect: `${sign} ${STAT_LABEL_RU[def.stat]}` };
};
