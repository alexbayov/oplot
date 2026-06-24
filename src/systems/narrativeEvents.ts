/**
 * narrativeEvents (M18-PR1) — выбор события между энкаунтерами + чистый
 * резолв исхода выбора. См. content/narrative_events.json.
 *
 * Цикл (UI проводит M18-PR2): между энкаунтерами в SortieRunScene с шансом
 * NARRATIVE_EVENT_CHANCE показывается одно eligible-событие зоны; игрок
 * выбирает choice; resolveNarrativeChoice отдаёт чистую дельту
 * (loot / hp / consume), сцена применяет её тем же путём, что лут боя.
 *
 * Fork C (M18): trust_delta из NarrativeEventOutcome выкинут (см. types.ts)
 * — стат-долг под одно событие заводить рано, механики на доверие выживших
 * ещё нет. Резолвер doverie не трогает. Радио-trust (types/encounter.ts) —
 * другая система, не затронута.
 *
 * Модуль чистый: без мутаций GameState и без I/O. Тот же контракт, что у
 * systems/encounters.ts (zone-filter + selectable-гейт, UI решает рендер).
 */
import type { InventoryStack, NarrativeEvent, NarrativeEventChoice } from "../state/types";
import type { Rng } from "./sortieResolve";
import { NARRATIVE_EVENT_CHANCE } from "../state/balance";
import { addToStack, countInStacks, removeFromStack } from "../state/GameState";

/**
 * Дельта от выбора, применяемая сценой. item_id/count — нормализованная
 * форма (в JSON лут хранится как {id, n}). consume отражает требование
 * выбора; сцена снимает предмет тем же гейтом наличия, что бой-консумы.
 */
export interface NarrativeChoiceResult {
  loot: { item_id: string; count: number }[];
  hp_delta: number;
  consume: { item_id: string; count: number } | null;
}

/** События, eligible для зоны. zones=["*"] = универсальное. */
export function eligibleNarrativeEvents(
  all: readonly NarrativeEvent[],
  zoneId: string,
): NarrativeEvent[] {
  return all.filter((e) => e.zones.includes("*") || e.zones.includes(zoneId));
}

/**
 * Ролл события для контекста: сначала частотный гейт NARRATIVE_EVENT_CHANCE,
 * затем uniform-выбор из eligible зоны. null = в этот раз события нет (гейт
 * не прошёл) или зона пуста.
 */
export function pickNarrativeEvent(
  all: readonly NarrativeEvent[],
  zoneId: string,
  rng: Rng = Math.random,
): NarrativeEvent | null {
  if (rng() >= NARRATIVE_EVENT_CHANCE) return null;
  const pool = eligibleNarrativeEvents(all, zoneId);
  if (pool.length === 0) return null;
  const idx = Math.min(pool.length - 1, Math.floor(rng() * pool.length));
  return pool[idx] ?? null;
}

/**
 * Можно ли выбрать choice. Единственный гейт — наличие consume_item в
 * рюкзаке (UI грейит недоступное). Прочие choice всегда доступны.
 */
export function canSelectNarrativeChoice(
  choice: NarrativeEventChoice,
  backpackCount: (itemId: string) => number,
): boolean {
  const need = choice.outcome.consume_item;
  if (!need) return true;
  return backpackCount(need) >= (choice.outcome.consume_n ?? 1);
}

/**
 * Чистый резолв дельты выбора. Не мутирует state. Неизвестный choiceId
 * (или пустой outcome у «пройти мимо») → нулевая дельта.
 */
export function resolveNarrativeChoice(
  event: NarrativeEvent,
  choiceId: string,
): NarrativeChoiceResult {
  const outcome = event.choices.find((c) => c.id === choiceId)?.outcome ?? {};
  return {
    loot: (outcome.loot ?? []).map((l) => ({ item_id: l.id, count: l.n })),
    hp_delta: outcome.hp_delta ?? 0,
    consume: outcome.consume_item
      ? { item_id: outcome.consume_item, count: outcome.consume_n ?? 1 }
      : null,
  };
}

/** Срез state, который трогает narrative-исход. */
export interface NarrativeApplyState {
  hp: number;
  hp_max: number;
  backpack: InventoryStack[];
  pending_loot: InventoryStack[];
}

/**
 * Применяет дельту выбора к срезу состояния и возвращает новый срез (вход
 * не мутируется). Тот же путь, что бой в SortieRunScene.applyResult:
 *  - consume снимается только если в рюкзаке хватает (иначе no-op — но UI
 *    уже грейит недоступный выбор через canSelectNarrativeChoice);
 *  - hp клампится в [0, hp_max] (узел может и лечить, и ранить);
 *  - loot уходит в pending_loot тем же addToStack, что лут энкаунтера.
 */
export function applyNarrativeChoice(
  state: NarrativeApplyState,
  result: NarrativeChoiceResult,
): NarrativeApplyState {
  let backpack = state.backpack;
  if (
    result.consume &&
    countInStacks(backpack, result.consume.item_id) >= result.consume.count
  ) {
    backpack = removeFromStack(backpack, result.consume.item_id, result.consume.count);
  }
  const hp = Math.max(0, Math.min(state.hp_max, state.hp + result.hp_delta));
  let pending_loot = state.pending_loot;
  for (const l of result.loot) {
    pending_loot = addToStack(pending_loot, l.item_id, l.count);
  }
  return { hp, hp_max: state.hp_max, backpack, pending_loot };
}
