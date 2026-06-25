/**
 * loadout (M19-PR1) — чистая модель «что брать в вылазку».
 *
 * До этого `SortieScene.takeConsumables` безусловно сметала в рюкзак ВЕСЬ
 * стек расходников из стеша (бинты/аптечки/патроны/еда/вода). Игрок не
 * выбирал, и лишний вес до боя съедал вместимость под лут (LootScene гейтит
 * по HERO_MAX_WEIGHT_KG). Этот модуль выносит выбор в чистую функцию: UI
 * (M19-PR2) даёт picks, сцена применяет результат. Поведение прежнего
 * авто-свипа сохранено через allLoadoutPicks (PR1 behavior-preserving).
 *
 * Чистый: без мутаций GameState и I/O.
 */
import type { InventoryStack } from "../state/types";
import type { Item } from "../types";
import { computeWeight } from "./weight";

/**
 * Расходники, доступные к взятию в вылазку. Совпадает с прежним passthrough-
 * набором SortieScene — набор не расширяем в этом PR, только делаем выбор.
 */
export const LOADOUT_ITEM_IDS = [
  "bandage",
  "medkit",
  "ammo_pistol",
  "canned_food",
  "water",
] as const;

const LOADOUT_SET: ReadonlySet<string> = new Set(LOADOUT_ITEM_IDS);

export const isLoadoutItem = (itemId: string): boolean => LOADOUT_SET.has(itemId);

export interface LoadoutResult {
  /** Несомое в вылазку. */
  backpack: InventoryStack[];
  /** Стеш после изъятия выбранного. */
  keptStash: InventoryStack[];
  /** Вес backpack, кг. */
  weightKg: number;
  /** Превышен ли вес-кап. */
  overCap: boolean;
}

/**
 * Чистая сборка лоадаута: из стеша берём по `picks[item_id]` штук (клампится
 * к наличию и к ≥0), остальное остаётся в стеше. Вход не мутируется.
 */
export function buildLoadout(
  stash: readonly InventoryStack[],
  picks: Readonly<Record<string, number>>,
  items: Record<string, Item>,
  capKg: number,
): LoadoutResult {
  const backpack: InventoryStack[] = [];
  const keptStash: InventoryStack[] = [];
  for (const stack of stash) {
    const want = Math.max(0, Math.floor(picks[stack.item_id] ?? 0));
    const take = Math.min(want, stack.count);
    if (take > 0) backpack.push({ item_id: stack.item_id, count: take });
    const left = stack.count - take;
    if (left > 0) keptStash.push({ item_id: stack.item_id, count: left });
  }
  const weightKg = computeWeight(backpack, items);
  return { backpack, keptStash, weightKg, overCap: weightKg > capKg };
}

/** Picks = «взять весь eligible-стек» — поведение прежнего авто-свипа. */
export function allLoadoutPicks(
  stash: readonly InventoryStack[],
): Record<string, number> {
  const picks: Record<string, number> = {};
  for (const stack of stash) {
    if (isLoadoutItem(stack.item_id) && stack.count > 0) {
      picks[stack.item_id] = stack.count;
    }
  }
  return picks;
}

/** Безопасный дефолт первого открытия пикера: до 2 бинтов, прочее — 0. */
export function defaultLoadoutPicks(
  stash: readonly InventoryStack[],
): Record<string, number> {
  const picks: Record<string, number> = {};
  const bandage = stash.find((s) => s.item_id === "bandage");
  if (bandage && bandage.count > 0) picks["bandage"] = Math.min(2, bandage.count);
  return picks;
}

/** Eligible-стеки, присутствующие в стеше (вход для UI-пикера). */
export function loadoutOptions(
  stash: readonly InventoryStack[],
): InventoryStack[] {
  return stash
    .filter((s) => isLoadoutItem(s.item_id) && s.count > 0)
    .map((s) => ({ item_id: s.item_id, count: s.count }));
}
