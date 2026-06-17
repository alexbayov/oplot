// M14 PR-2 — чистые хелперы для экрана «Арсенал» (CraftedWeaponsScene).
// Инвариант «systems pure / scenes Phaser»: сортировка + equip-гейт живут
// здесь и покрыты unit-тестами; форматирование/рендер — в сцене.
import type { WeaponInstance } from "./weaponAssembly";
import { isBroken } from "./durability";

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
