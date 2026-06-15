// M13 PR-6b-2 — Pure orchestrator: consume parts from stash + assemble.
//
// Контракт separation:
// - `validateAssemblyParts` (assemblyValidation.ts) — player-facing invalid
//   input, ровно 3 reason-кода (empty / duplicate / no_structural), throws
//   `AssemblyError`. UI ловит и локализует.
// - `assembleFromStash` (этот файл) — defensive integrity check. Если
//   UI почему-то передал id которого нет в `baseStash`, throws plain Error
//   с `/missing part/i`. НЕ расширяет замороженный 3-reason контракт.
//
// Атомарность (QA-штрих Виктора): pre-check всех партов в стеше ДО
// первого `removeFromStack`. Throw на отсутствующем → `nextStash`
// буквально не построен, возвращаем ссылку на вход. No half-consume
// гарантируется конструкцией, не дисциплиной.

import type { ComponentItem } from "../types";
import type { InventoryStack } from "../state/types";
import { countInStacks, removeFromStack } from "../state/GameState";
import { AssemblyError, validateAssemblyParts } from "./assemblyValidation";
import type { AssemblyInvalidReason } from "./assemblyValidation";
import {
  assembleWeapon,
  nextWeaponInstanceId,
  type WeaponInstance,
} from "./weaponAssembly";

export interface AssemblyFlowResult {
  instance: WeaponInstance;
  nextStash: InventoryStack[];
}

/**
 * Consume + assemble в одном проходе. Pure (без чтения GameState
 * напрямую) для тестируемости без Phaser.
 *
 * Сначала валидирует, что КАЖДЫЙ выбранный part-id присутствует в
 * `stash` (count ≥ 1) — если хоть один отсутствует, throws plain Error
 * и возвращает входной стеш бит-в-бит (ref-equal). Только если все
 * присутствуют → cascade `removeFromStack` по 1 каждого.
 *
 * Затем зовёт `assembleWeapon`, который сам валидирует player-facing
 * инварианты (3 reason-кода) и throws `AssemblyError` — пробрасываем.
 */
export const assembleFromStash = (
  parts: ComponentItem[],
  stash: InventoryStack[],
  rng: () => number,
): AssemblyFlowResult => {
  // Player-facing 3-reason контракт сначала. Throws AssemblyError до
  // первого touch'а стеша — invalid input не съест ни одной детали.
  const validation = validateAssemblyParts(parts);
  if (!validation.ok) throw new AssemblyError(validation.reason);

  for (const part of parts) {
    if (countInStacks(stash, part.id) < 1) {
      throw new Error(`missing part in stash: ${part.id}`);
    }
  }

  let nextStash = stash;
  for (const part of parts) {
    nextStash = removeFromStack(nextStash, part.id, 1);
  }

  const instance = assembleWeapon(parts, nextWeaponInstanceId(rng));
  return { instance, nextStash };
};

// ─── M13 PR-6b-3 — pure decision helper для Verstak energy gate ─────

/**
 * Результат `attemptAssembly` — discriminated union, чтобы caller (UI)
 * не дублировал логику gate'а. Все три формы взаимоисключающие.
 */
export type AssemblyAttemptResult =
  | {
      kind: "ok";
      instance: WeaponInstance;
      nextStash: InventoryStack[];
      energy_spent: number;
    }
  | { kind: "no_energy"; required: number; available: number }
  | { kind: "invalid"; reason: AssemblyInvalidReason };

/**
 * Pure-helper для G4 atomic energy×parts ordering. Принимает входное
 * состояние, возвращает либо «ok + updates», либо «no_energy» (gate),
 * либо «invalid» (parts validator). Caller (UI) применяет updates ИЛИ
 * показывает ошибку — без своей gate-логики.
 *
 * Инвариант: _energy списана ⟺ оружие создано._ В этой функции это
 * означает: только `kind:"ok"` несёт `energy_spent`, остальные ветки
 * не трогают энергию.
 *
 * Порядок проверок строгий, как в `tryAssemble` (preflight §10 G4):
 *   1. Energy pre-check → `no_energy`, parts/stash не тронуты.
 *   2. `assembleFromStash` атомарно (валидация + consume).
 *      - `AssemblyError` → `invalid`, energy не списана.
 *      - missing part → bubbles up как plain Error.
 *   3. Success → `ok` с `energy_spent = cost`. Caller списывает.
 */
export const attemptAssembly = (
  parts: ComponentItem[],
  stash: InventoryStack[],
  energy: number,
  cost: number,
  rng: () => number,
): AssemblyAttemptResult => {
  if (energy < cost) {
    return { kind: "no_energy", required: cost, available: energy };
  }
  try {
    const { instance, nextStash } = assembleFromStash(parts, stash, rng);
    return { kind: "ok", instance, nextStash, energy_spent: cost };
  } catch (e) {
    if (e instanceof AssemblyError) {
      return { kind: "invalid", reason: e.reason };
    }
    // missing-part defensive Error — bubble up, не маскируем
    // (это integrity-bug, не player-facing).
    throw e;
  }
};
