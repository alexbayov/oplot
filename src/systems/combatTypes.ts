/**
 * M12.0 — Combat State Shape.
 *
 * Это shape "готов к расширению": все будущие подвехи M12.1-M12.6 дописывают
 * только ПОВЕДЕНИЕ, не структуру. Поля position/cooldowns/statuses/phase/
 * telegraph/environment появляются здесь сразу, инициализируются дефолтами,
 * и постепенно начинают использоваться в последующих подвехах.
 *
 * Старая `combat.ts` остаётся low-level calc и не зависит от этих типов —
 * её функции принимают примитивы (number, Item), и engine их вызывает.
 *
 * Спека: `docs/redesign/m12/M12.0-foundation.md` §2.
 */

import type { WeaponInstance } from "../types/items";

// ============================================================================
// Position (M12.3 ready, default "mid" в M12.0)
// ============================================================================

export type Position = "front" | "mid" | "back";

// ============================================================================
// Statuses (M12.1 ready, всегда [] в M12.0)
// ============================================================================

export type StatusId = "bleed" | "stun" | "expose" | "fear" | "burn" | "frenzy";

export interface StatusInstance {
  id: StatusId;
  /** Ходов осталось. -1 = пассив (frenzy). */
  remaining: number;
  /** Источник наложения (для UI, telemetry). */
  source: string;
  /** Стак (для DoT). Большинство статусов не стакаются — stacks=1. */
  stacks: number;
}

// ============================================================================
// Telegraph (M12.2 ready, всегда null в M12.0)
// ============================================================================

export interface TelegraphIntent {
  /** Что моб собирается делать в следующем ходу. */
  kind: "attack" | "ability" | "reposition" | "phase_shift";
  /** Target actor id (для UI стрелочки). */
  targetId?: string;
  /** Имя приёма для tooltip ("Прицельный выстрел"). */
  labelRu: string;
  /** Время до execution: 1 = в следующем ходу, 2 = через ход. */
  inTurns: number;
}

// ============================================================================
// CombatActor — единый shape для героя и мобов
// ============================================================================

export type ActorKind = "hero" | "mob";

export interface CombatActor {
  id: string;
  kind: ActorKind;
  /** Display name (для UI и log). */
  nameRu: string;

  // --- HP ---
  hp: number;
  maxHp: number;

  // --- Position (M12.3 ready) ---
  position: Position;

  // --- Equipped weapon (M12.0 wire-up) ---
  /** Для героя — текущее снаряжение из inventory. Для моба — null (моб использует innate damage). */
  equipped: WeaponInstance | null;

  /** Текущий магазин (для ranged drop weapons). null для мили или мобов. */
  magazine: number | null;

  /** Cap магазина с учётом модов. null если weapon не ranged. */
  magazineMax: number | null;

  // --- Cooldowns (M12.1 ready, {} в M12.0) ---
  /** abilityId → turns remaining. 0 или отсутствует = ready. */
  cooldowns: Record<string, number>;

  // --- Statuses (M12.1 ready) ---
  statuses: StatusInstance[];

  // --- Phase (M12.4 ready, всегда 1 в M12.0) ---
  phase: 1 | 2;

  // --- Telegraph (M12.2 ready, null в M12.0) ---
  telegraph: TelegraphIntent | null;

  // --- Cover (legacy, mobAI.ts использует) ---
  coverActive: boolean;
}

// ============================================================================
// Environment Object (M12.3 ready, [] в M12.0)
// ============================================================================

export type EnvKind = "barrel" | "car" | "body" | "wall" | "fire";

export interface EnvObject {
  id: string;
  kind: EnvKind;
  position: Position;
  hp: number;
  /** Описание интеракции для tooltip. */
  labelRu: string;
}

// ============================================================================
// Combat Log
// ============================================================================

export type LogKind =
  | "attack"
  | "ability"
  | "consumable"
  | "status_apply"
  | "status_tick"
  | "status_expire"
  | "phase_shift"
  | "cooldown_tick"
  | "magazine"
  | "durability"
  | "kill"
  | "miss"
  | "info";

export interface CombatLogEntry {
  turn: number;
  kind: LogKind;
  sourceId: string;
  targetId?: string;
  /** Локализованная строка для UI лога. */
  messageRu: string;
  /** Опциональный числовой контекст (урон, HP, etc) для analytics. */
  amount?: number;
}

// ============================================================================
// CombatState — единый snapshot
// ============================================================================

export interface CombatState {
  turn: number;
  actors: CombatActor[];
  /** Ordered actor ids по initiative. Пересчитывается на startTurn. */
  initiativeOrder: string[];
  /** Текущий active actor (тот чей ход). */
  activeActorId: string | null;
  /** Target для главного действия игрока (M12.0 UI). null = автовыбор. */
  targetId: string | null;
  /** M12.3 ready, [] в M12.0. */
  environment: EnvObject[];
  /** Лог боя (для UI и тестов). */
  log: CombatLogEntry[];
  /** Зона/контекст откуда пришли (для drop tables). */
  zoneId: string;
  /** Сценарий боя. */
  scenario: "sortie" | "spot" | "dungeon" | "test";
}

// ============================================================================
// Action Request / Result (M12.0 контракт между UI и Engine)
// ============================================================================

export type ActionKind =
  | "attack"
  | "ability"
  | "consumable"
  | "reload"
  | "move"
  | "cover"
  | "retreat"
  | "wait";

export interface ActionRequest {
  actorId: string;
  kind: ActionKind;
  /** Для attack/ability — target actor id. */
  targetId?: string;
  /** Для ability — id приёма. */
  abilityId?: string;
  /** Для consumable — item id. */
  itemId?: string;
  /** Для move — куда. */
  toPosition?: Position;
}

export interface ActionResult {
  /** Запрос исполнился. */
  ok: boolean;
  /** Если !ok — причина для UI. */
  reasonRu?: string;
  /** Новые лог-записи добавленные этим действием. */
  logEntries: CombatLogEntry[];
  /** Изменился ли список живых актёров (для UI revalidation). */
  rosterChanged: boolean;
}

// ============================================================================
// Turn Context — для resolveMobActions и phase checks
// ============================================================================

export interface TurnContext {
  turn: number;
  activeActorId: string;
  /** Кто живой в начале хода. */
  aliveActorIds: string[];
}

// ============================================================================
// Combat Outcome
// ============================================================================

export type CombatOutcome = "victory" | "defeat" | "retreat";

export interface EndTurnResult {
  combatEnded: boolean;
  outcome?: CombatOutcome;
  /** Лут готов к pickup (для M12.5 loot-per-kill, в M12.0 — конец боя). */
  pendingLoot?: { fromActorId: string; itemIds: string[] }[];
}
