// M14 PR-2 — чистые хелперы для экрана «Арсенал» (CraftedWeaponsScene).
// Инвариант «systems pure / scenes Phaser»: сортировка + equip-гейт живут
// здесь и покрыты unit-тестами; форматирование/рендер — в сцене.
import type { WeaponInstance } from "./weaponAssembly";
import { isBroken } from "./durability";
import { addToStack } from "../state/GameState";
import { HERO_START_WEAPON_ID } from "../state/balance";
import type { EquippedWeapon, InventoryStack } from "../state/types";

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
 * Разобрать инстанс из «Арсенала»: вернуть его `parts` на склад (по 1
 * каждой) и убрать из `crafted_weapons[]`.
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

  let nextStash: InventoryStack[] = baseStash.slice();
  for (const partId of target.parts) {
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
    returned_parts: target.parts.slice(),
    was_equipped: wasEquipped,
  };
};
