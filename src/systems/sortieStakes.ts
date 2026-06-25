/**
 * sortieStakes (M19-PR3) — делает выбор цели читаемым, а лоадаут —
 * consequential.
 *
 * - formatGoalRisk: строка риск/награда цели для пикера (раньше игрок видел
 *   только описание, без чисел).
 * - survivesKnockout: что остаётся от стека после нокаута. Раньше половинился
 *   только pending_loot (в SortieRunScene локальным halveStacks); несомые
 *   расходники возвращались целыми, обнуляя смысл лоадаут-решения. Теперь
 *   одно правило (через LOOT_LOSS_ON_DEFEAT) применяется и к луту, и к несомому.
 *
 * Чистый: без мутаций и I/O.
 */
import type { InventoryStack } from "../state/types";
import type { SortieGoalDef } from "../types/sortie";
import { LOOT_LOSS_ON_DEFEAT } from "../state/balance";

/**
 * Что уцелеет от стеков после нокаута: оставляем долю (1 − LOOT_LOSS_ON_DEFEAT),
 * округляя вниз; обнулённые позиции выбрасываем. Вход не мутируется.
 */
export function survivesKnockout(
  stacks: readonly InventoryStack[],
): InventoryStack[] {
  const keepRatio = 1 - LOOT_LOSS_ON_DEFEAT;
  return stacks
    .map((s) => ({ item_id: s.item_id, count: Math.floor(s.count * keepRatio) }))
    .filter((s) => s.count > 0);
}

const RU_BIAS: Record<string, string> = {
  fuel: "топливо",
  metal: "металл",
  food: "еда",
  water: "вода",
  energy: "энергия",
};

/**
 * Строка риск/награда цели: «Урон ×1.25 · Лут ×1.3» (+ «уклон: …» если есть).
 */
export function formatGoalRisk(def: SortieGoalDef): string {
  const parts = [
    `Урон ×${def.hp_damage_modifier}`,
    `Лут ×${def.loot_count_modifier}`,
  ];
  if (def.loot_bias) {
    parts.push(`уклон: ${RU_BIAS[def.loot_bias] ?? def.loot_bias}`);
  }
  return parts.join(" · ");
}
