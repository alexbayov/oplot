// M14 PR-2 — чистые хелперы для экрана «Арсенал» (CraftedWeaponsScene).
// Инвариант «systems pure / scenes Phaser»: сортировка + equip-гейт живут
// здесь и покрыты unit-тестами; форматирование/рендер — в сцене.
import type { WeaponInstance } from "./weaponAssembly";
import { isBroken } from "./durability";
import { isStructuralPart } from "./assemblyValidation";
import { addToStack } from "../state/GameState";
import { HERO_START_WEAPON_ID, DISASSEMBLE_RECOVERY_RATE } from "../state/balance";
import { resolveEquippedDamage } from "./weaponDamage";
import type { EquippedWeapon, InventoryStack } from "../state/types";
import type { Item } from "../types/item";

/**
 * Можно ли экипировать инстанс из «Арсенала». Сломанный
 * (`durability_current <= 0`) — нельзя.
 *
 * Почему не просто «можно, а игра разберётся»: equip сломанного инстанса —
 * ДВЕ тихие подмены, а не одна (см. SortieRunScene):
 *   1. `snapshotHero` (SortieRunScene:113-141) ТОЛЬКО читает: сломанный
 *      инстанс остаётся equipped, но урон молча падает в bare-hands
 *      fallback 4/7 — игрок этого не видит.
 *   2. `applyPerEncounterDurabilityHit` (SortieRunScene:185-204) срабатывает
 *      ТОЛЬКО на исходе `won` и молча сбрасывает `equipped_weapon` в
 *      дефолтный catalog `craft_knife` (тот же, что у createDefaultPlayer).
 * Поэтому кнопку «Экипировать» на сломанном держим disabled — иначе trap.
 */
export const canEquipInstance = (inst: WeaponInstance): boolean => !isBroken(inst);

/**
 * Порядок показа инстансов в «Арсенале»: экипированный первым, далее
 * новые→старые.
 *
 * «Новизна» определяется ИСКЛЮЧИТЕЛЬНО порядком в массиве `crafted_weapons`
 * (append = newest last, см. WeaponAssemblyScene.tryAssemble), поэтому
 * берём `slice().reverse()`. Сортировать по `inst.id` НЕЛЬЗЯ:
 * `nextWeaponInstanceId` генерирует `wi_<random36>` без timestamp —
 * лексикографический порядок id не несёт никакой временно́й семантики.
 *
 * Чистая функция: вход не мутируется (копия через slice).
 */
export const sortInstancesForDisplay = (
  instances: readonly WeaponInstance[],
  equippedCraftedId: string | null,
): WeaponInstance[] => {
  const byNewest = instances.slice().reverse();
  if (equippedCraftedId === null) return byNewest;
  const equipped = byNewest.filter((w) => w.id === equippedCraftedId);
  const rest = byNewest.filter((w) => w.id !== equippedCraftedId);
  return [...equipped, ...rest];
};

// ─── M14-PR3 (B) — disassembly «Разобрать» ─────────────────────────

/**
 * Результат разбора инстанса. Чистое зеркало consume-ветки сборки
 * (`assembleFromStash`): там parts списываются из стеша, здесь —
 * возвращаются. Caller (CraftedWeaponsScene) применяет ровно три поля
 * state (`crafted_weapons` / `baseStash` / `equipped_weapon`);
 * `returned_parts` / `was_equipped` — только для UI-фидбэка (тост).
 */
export interface DisassembleResult {
  crafted_weapons: WeaponInstance[];
  baseStash: InventoryStack[];
  equipped_weapon: EquippedWeapon | null;
  returned_parts: string[];
  was_equipped: boolean;
}

/**
 * M15-PR2 (DF2) — лоссовый возврат частей при разборе. Возвращаем
 * `K = max(1, floor(N × DISASSEMBLE_RECOVERY_RATE))` частей; остальные
 * (N−K) теряются как лом. Оставляем САМЫЕ ценные, выбрасываем дешёвые.
 *
 * Drop-приоритет (что выбрасываем ПЕРВЫМ), сортировка ASC:
 *   1. non-structural (`mod_*`/стволы/слайды) раньше structural (frame/
 *      receiver) — «скелет» оружия ценнее навесок, его и возвращаем;
 *   2. tier ASC — низкий тир дешевле, выбрасываем первым;
 *   3. id ASC — детерминированный tiebreak (никакого rng);
 *   4. исходный индекс — стабильность для полностью идентичных дублей.
 * Возвращаем «хвост» отсортированного массива (самые ценные K) в drop-
 * priority-порядке — детерминированно и тестируемо.
 *
 * min-1 floor: 1-партовый инстанс всегда отдаёт ≥1 (RATE=0.5 даёт
 * floor(0.5)=0 — заменяем на 1, иначе feel-bad полной потери). При RATE≥1
 * (или K≥N) — возврат всех частей (lossless вырожденный режим).
 *
 * `tierOf` инжектится caller'ом (сцена → `GameState.data.items[id]?.tier`,
 * deprecated id → дефолт). Чистая, детерминированная, без побочных эффектов.
 */
export const disassembleRefund = (
  parts: readonly string[],
  tierOf: (id: string) => number,
): string[] => {
  const n = parts.length;
  if (n === 0) return [];
  const keep = Math.max(1, Math.floor(n * DISASSEMBLE_RECOVERY_RATE));
  if (keep >= n) return parts.slice();

  const ranked = parts
    .map((id, i) => ({ id, i }))
    .sort((a, b) => {
      const sa = isStructuralPart(a.id) ? 1 : 0;
      const sb = isStructuralPart(b.id) ? 1 : 0;
      if (sa !== sb) return sa - sb; // non-structural first (dropped first)
      const ta = tierOf(a.id);
      const tb = tierOf(b.id);
      if (ta !== tb) return ta - tb; // tier asc
      if (a.id !== b.id) return a.id < b.id ? -1 : 1; // id asc
      return a.i - b.i; // stable order for identical dups
    });

  // Первые (n−keep) — лом, хвост (keep) — самые ценные, их возвращаем.
  return ranked.slice(n - keep).map((r) => r.id);
};

/**
 * Разобрать инстанс из «Арсенала»: вернуть ЧАСТЬ его `parts` на склад (по 1
 * каждой, см. `disassembleRefund` — M15-PR2 DF2 лоссовый возврат) и убрать
 * инстанс из `crafted_weapons[]`. До M15-PR2 возврат был 1:1 (lossless).
 *
 * Решения (M14-PR3 preflight):
 * - **D2** энергию НЕ трогаем (ни cost, ни refund): энергия сборки = уже
 *   потраченный труд, ценность разбора — возврат деталей. Здесь её нет.
 * - **D3** сломанный (`durability_current ≤ 0`) разбирается штатно —
 *   рекавери частей из мёртвого инстанса и есть главный кейс B
 *   (сознательный контраст с equip, который на сломанном disabled).
 * - **D4** если разбираемый инстанс — текущий экипированный crafted,
 *   `equipped_weapon` падает в канонический `{kind:"catalog",
 *   id: HERO_START_WEAPON_ID}` (= craft_knife), ровно как durability-reset
 *   при поломке (durability.ts). НЕ null (bare-hands хуже), НЕ «следующий
 *   инстанс» (implicit magic).
 *
 * Чистая функция: входные массивы не мутируются (новые массивы на выход).
 * `addToStack` — data-операция над `InventoryStack[]` (item_id/count),
 * каталог НЕ валидируется. Поэтому deprecated part-id (старый сейв, parts
 * менялись между релизами) безопасно создаёт стек (forward-compat); render
 * стеша гардит `if (!item)` (InventoryScene, computeWeight) — не падает.
 *
 * Defensive: если `instanceId` не найден (рассинхрон UI vs state,
 * теоретически невозможен) → no-op, входы возвращаются как новые массивы.
 */
export const disassembleInstance = (
  instanceId: string,
  crafted_weapons: readonly WeaponInstance[],
  baseStash: readonly InventoryStack[],
  equipped_weapon: EquippedWeapon | null,
  tierOf: (id: string) => number,
): DisassembleResult => {
  const target = crafted_weapons.find((wi) => wi.id === instanceId);
  if (!target) {
    return {
      crafted_weapons: crafted_weapons.slice(),
      baseStash: baseStash.slice(),
      equipped_weapon,
      returned_parts: [],
      was_equipped: false,
    };
  }

  // M15-PR2 (DF2): лоссовый возврат — на склад идёт только подмножество.
  const returned = disassembleRefund(target.parts, tierOf);
  let nextStash: InventoryStack[] = baseStash.slice();
  for (const partId of returned) {
    nextStash = addToStack(nextStash, partId, 1);
  }

  const nextCrafted = crafted_weapons.filter((wi) => wi.id !== instanceId);

  const wasEquipped =
    equipped_weapon?.kind === "crafted" && equipped_weapon.id === instanceId;
  const nextEquipped: EquippedWeapon | null = wasEquipped
    ? { kind: "catalog", id: HERO_START_WEAPON_ID }
    : equipped_weapon;

  return {
    crafted_weapons: nextCrafted,
    baseStash: nextStash,
    equipped_weapon: nextEquipped,
    returned_parts: returned,
    was_equipped: wasEquipped,
  };
};

// ── M15-PR3: Arsenal stat-delta (Variant B) ─────────────────────────
// Сравнение урона осматриваемого инстанса против ЭФФЕКТИВНОГО урона
// текущего эквипа. «Эффективный» = тот, что реально уходит в бой:
// резолвится через `resolveEquippedDamage` (тот же путь, что snapshotHero,
// R1). Catalog-эквип (вкл. стартовый craft_knife 4/7) сравним и потому
// показывается — это доминирующий ранний кейс, не «не с чем сравнить».
// Damage-only (D-PR3): accuracy/weight/durability в бой не идут до M16.

export interface WeaponStatDelta {
  /** Эффективный урон кандидата (broken → bare-hands 4/7, R3). */
  candidate: { damage_min: number; damage_max: number };
  /** Эффективный урон текущего эквипа (catalog/crafted/null/broken). */
  equipped: { damage_min: number; damage_max: number };
  /** candidate − equipped (может быть отрицательной/смешанной по знаку). */
  delta_min: number;
  delta_max: number;
  /** Кандидат == текущий эквип-crafted → метка «Экипировано», не нулевая дельта. */
  is_equipped_self: boolean;
  /** Кандидат сломан → его боевой урон = 4/7 (для UI-ноты). */
  candidate_broken: boolean;
}

/**
 * Дельта урона кандидата против текущего эквипа. Чистая, без Phaser.
 *
 * Кандидат всегда crafted-инстанс (Арсенал). Его эффективный урон берём
 * через тот же `resolveEquippedDamage`, что и бой — для сломанного это даёт
 * 4/7 (R3), а не его замороженные `stats`. Эквип резолвится так же.
 * `crafted` — полный список инстансов героя (резолвер ищет по id).
 */
export const weaponStatDelta = (
  candidate: WeaponInstance,
  equipped: EquippedWeapon | null,
  items: Record<string, Item>,
  crafted: readonly WeaponInstance[],
): WeaponStatDelta => {
  const cand = resolveEquippedDamage({ kind: "crafted", id: candidate.id }, items, crafted);
  const eqDmg = resolveEquippedDamage(equipped, items, crafted);
  return {
    candidate: cand,
    equipped: eqDmg,
    delta_min: cand.damage_min - eqDmg.damage_min,
    delta_max: cand.damage_max - eqDmg.damage_max,
    is_equipped_self: equipped?.kind === "crafted" && equipped.id === candidate.id,
    candidate_broken: candidate.durability_current <= 0,
  };
};
