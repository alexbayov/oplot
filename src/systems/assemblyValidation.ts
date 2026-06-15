// M13 PR-6b-2 — Validation for free-form weapon assembly (Model C).
//
// Замороженный контракт Model C: ровно 3 reason-кода для player-facing
// invalid input. Контракт зафиксирован в PR-6b-2 preflight и НЕ
// расширяется в этом же PR (см. `assembleFromStash` defensive integrity
// — там throws plain Error с `/missing part/i`, отдельный канал).
//
// Family-gate (химера типа `pm_frame + akm_barrel`) — UI-only по D2:
// валидатор без `mixed_family`-кода, UI группирует выбор так что
// межсемейную сборку физически нельзя инициировать. Решение сознательно
// уважает контракт «3 reason-кода ни больше».
//
// Порядок проверок (D7, детерминизм): empty → duplicate → no_structural.
// Фиксирован, чтобы UI-сообщения и тесты были предсказуемы при
// нескольких одновременных нарушениях.

import type { ComponentItem } from "../types";

export type AssemblyInvalidReason =
  | "empty_parts"
  | "duplicate_part"
  | "no_structural_part";

export type AssemblyValidationResult =
  | { ok: true }
  | { ok: false; reason: AssemblyInvalidReason };

/**
 * Структурный парт = frame или receiver. 15 семейств: 3 frame (pm/tt/aps)
 * + 12 receiver. `mod_*` структурными не бывают (универсальные модификаторы).
 */
export const isStructuralPart = (id: string): boolean =>
  /_(frame|receiver)$/.test(id);

/**
 * Семейство компонента для UI-gate. `mod_*` → `"universal"` (комбинируется
 * с любым семейством). Остальные — префикс до первого подчёркивания
 * (pm/tt/aps/ak74/akm/...).
 */
export const weaponFamily = (id: string): string => {
  if (id.startsWith("mod_")) return "universal";
  const prefix = id.split("_")[0];
  return prefix === undefined || prefix === "" ? id : prefix;
};

export const validateAssemblyParts = (
  parts: ComponentItem[],
): AssemblyValidationResult => {
  if (parts.length === 0) return { ok: false, reason: "empty_parts" };

  const ids = parts.map((p) => p.id);
  if (new Set(ids).size !== ids.length) {
    // Set-check блокирует stack-эксплойт (5× `pm_frame`) до прихода
    // slot-таксономии в M14.
    return { ok: false, reason: "duplicate_part" };
  }

  if (!parts.some((p) => isStructuralPart(p.id))) {
    return { ok: false, reason: "no_structural_part" };
  }

  return { ok: true };
};

export class AssemblyError extends Error {
  public readonly reason: AssemblyInvalidReason;
  public constructor(reason: AssemblyInvalidReason) {
    super(`assembly_invalid:${reason}`);
    this.name = "AssemblyError";
    this.reason = reason;
  }
}
