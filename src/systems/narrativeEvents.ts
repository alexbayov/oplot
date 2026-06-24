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
import type { NarrativeEvent, NarrativeEventChoice } from "../state/types";
import type { Rng } from "./sortieResolve";
import { NARRATIVE_EVENT_CHANCE } from "../state/balance";

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
