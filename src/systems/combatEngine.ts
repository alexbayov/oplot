/**
 * M12.0 — CombatEngine.
 *
 * Тонкий фасад поверх существующих low-level функций (`combat.ts`, `mobAI.ts`).
 * Управляет жизненным циклом боя: startTurn → resolveHeroAction →
 * resolveMobActions → endTurn → status tick → cooldown tick → phase check.
 *
 * **M12.0 скоуп:** engine содержит структуру (методы как stub'ы), которая
 * последовательно наполняется реальным поведением в M12.0b (wire-up),
 * M12.0c (UI integration), M12.1+ (statuses, abilities).
 *
 * Старая CombatScene будет обращаться через `engine.resolveHeroAction(req)`
 * вместо прямых вызовов `applyAttack` в M12.0c.
 *
 * Спека: `docs/redesign/m12/M12.0-foundation.md` §1.
 */

import { type Rng } from "./combat";
import { chooseMobAction } from "./combat";
import { getItem } from "../state/ItemRegistry";
import { isCraftWeapon, isDropWeapon } from "../types/items";
import type {
  ActionRequest,
  ActionResult,
  CombatActor,
  CombatLogEntry,
  CombatOutcome,
  CombatState,
  EndTurnResult,
  Position,
  StatusInstance,
  TurnContext,
} from "./combatTypes";
import { aggregateModEffects } from "./modEffects";

const defaultRng: Rng = Math.random;

export class CombatEngine {
  public state: CombatState;
  private rng: Rng;

  constructor(state: CombatState, rng: Rng = defaultRng) {
    this.state = state;
    this.rng = rng;
  }

  // ==========================================================================
  // Turn lifecycle
  // ==========================================================================

  /** Начать новый ход. Пересчитывает initiative, тикает passive статусы (frenzy). */
  startTurn(): TurnContext {
    this.state.turn += 1;

    const alive = this.state.actors.filter((a) => a.hp > 0);
    // Initiative order: hero first by default. Refined in M12.4 (initiative timeline).
    const hero = alive.find((a) => a.kind === "hero");
    const mobs = alive.filter((a) => a.kind === "mob");
    this.state.initiativeOrder = [
      ...(hero ? [hero.id] : []),
      ...mobs.map((m) => m.id),
    ];
    this.state.activeActorId = this.state.initiativeOrder[0] ?? null;

    return {
      turn: this.state.turn,
      activeActorId: this.state.activeActorId ?? "",
      aliveActorIds: this.state.initiativeOrder,
    };
  }

  // ==========================================================================
  // Hero action resolution
  // ==========================================================================

  /**
   * Резолвит действие героя. M12.0a — только базовые attack/wait/retreat
   * (старая семантика). M12.0b добавит reload/ability/consumable/move/cover.
   */
  resolveHeroAction(req: ActionRequest): ActionResult {
    const actor = this.getActor(req.actorId);
    if (!actor) {
      return this.failure("Actor not found");
    }
    if (actor.kind !== "hero") {
      return this.failure("Не герой");
    }
    if (actor.hp <= 0) {
      return this.failure("Герой мёртв");
    }

    switch (req.kind) {
      case "attack":
        return this.executeAttack(actor, req.targetId ?? this.autoTarget());
      case "wait":
        return this.executeWait(actor);
      case "retreat":
        return this.executeRetreat(actor);
      // Stubs для M12.0b+
      case "reload": {
        if (!actor.equipped || actor.magazineMax == null) {
          return {
            ok: false,
            reasonRu: "Нечего перезаряжать",
            logEntries: [],
            rosterChanged: false,
          };
        }
        actor.magazine = actor.magazineMax;
        const entry: CombatLogEntry = {
          turn: this.state.turn,
          sourceId: "hero",
          kind: "reload",
          messageRu: `Перезарядка (${actor.magazineMax} патронов)`,
        };
        this.state.log.push(entry);
        return { ok: true, logEntries: [entry], rosterChanged: false };
      }
      case "ability":
      case "consumable":
      case "move":
      case "cover":
        return this.failure(`Действие "${req.kind}" будет в следующих PR M12`);
      default:
        return this.failure("Неизвестное действие");
    }
  }

  // ==========================================================================
  // Mob actions
  // ==========================================================================

  /** Резолвит ходы всех живых мобов после хода героя. */
  resolveMobActions(ctx: TurnContext): ActionResult[] {
    // ctx параметр зарезервирован под M12.0b (initiative-aware mob ordering)
    void ctx;
    const results: ActionResult[] = [];
    const hero = this.state.actors.find((a) => a.kind === "hero" && a.hp > 0);
    if (!hero) return results;

    for (const mob of this.state.actors.filter(
      (a) => a.kind === "mob" && a.hp > 0,
    )) {
      // Stub: бить героя (M12.0a — без mobAIv2, в M12.0b включим).
      const action = chooseMobAction(
        { id: mob.id } as never,
        mob.hp,
      );
      if (action.type === "flee") {
        results.push({
          ok: true,
          logEntries: [
            this.log(mob.id, undefined, "system", `${mob.nameRu} отступает`),
          ],
          rosterChanged: false,
        });
        continue;
      }
      // M12.0b добавит реальную mob damage roll. Сейчас — заглушка.
      results.push({
        ok: true,
        logEntries: [],
        rosterChanged: false,
      });
    }
    return results;
  }

  // ==========================================================================
  // End turn: status tick, cooldown tick, phase check, victory check
  // ==========================================================================

  endTurn(): EndTurnResult {
    // Status tick (M12.1 ready)
    for (const actor of this.state.actors) {
      if (actor.hp <= 0) continue;
      this.tickStatuses(actor);
    }
    // Cooldown tick (M12.1 ready)
    for (const actor of this.state.actors) {
      this.tickCooldowns(actor);
    }
    // Phase check (M12.4 ready)
    for (const actor of this.state.actors.filter((a) => a.kind === "mob")) {
      this.checkPhaseTransition(actor);
    }
    // Victory / defeat
    return this.evaluateOutcome();
  }

  // ==========================================================================
  // Internal helpers
  // ==========================================================================

  private getActor(id: string): CombatActor | undefined {
    return this.state.actors.find((a) => a.id === id);
  }

  private autoTarget(): string {
    const target = this.state.actors.find(
      (a) => a.kind === "mob" && a.hp > 0,
    );
    return target?.id ?? "";
  }

  private executeAttack(hero: CombatActor, targetId: string): ActionResult {
    const target = this.getActor(targetId);
    if (!target || target.hp <= 0) {
      return this.failure("Цель не найдена");
    }
    if (target.kind !== "mob") {
      return this.failure("Можно атаковать только мобов");
    }
    // M12.0a: lookup base item via Registry. M12.0b агрегирует mod effects.
    const base = hero.equipped ? getItem(hero.equipped.itemId) : null;
    const ranged = base !== null && isDropWeapon(base);
    if (ranged && hero.magazine !== null && hero.magazine <= 0) {
      return this.failure("Магазин пуст — перезаряди");
    }
    if (ranged && hero.magazine !== null) {
      hero.magazine -= 1;
    }
    const dmg = this.rollDamage(hero);
    // M12.0b — apply mod effects to damage
    const mods = aggregateModEffects(hero.equipped);
    const damage = Math.max(0, dmg + mods.damageDelta);
    target.hp = Math.max(0, target.hp - damage);

    // M12.0b — durability tick
    if (hero.equipped) {
      hero.equipped.durability = Math.max(0, hero.equipped.durability - 1);
      if (hero.equipped.durability === 0) {
        this.state.log.push({
          turn: this.state.turn,
          sourceId: "hero",
          kind: "weapon_break",
          messageRu: `Оружие сломалось`,
        });
        hero.equipped = null;
      }
    }

    const entries: CombatLogEntry[] = [
      this.log(hero.id, target.id, "attack", `${hero.nameRu} → ${target.nameRu}: ${damage} урона`, damage),
    ];
    let rosterChanged = false;
    if (target.hp === 0) {
      entries.push(this.log(hero.id, target.id, "kill", `${target.nameRu} убит`));
      rosterChanged = true;
    }
    return { ok: true, logEntries: entries, rosterChanged };
  }

  private executeWait(actor: CombatActor): ActionResult {
    return {
      ok: true,
      logEntries: [
        this.log(actor.id, undefined, "system", `${actor.nameRu} ждёт`),
      ],
      rosterChanged: false,
    };
  }

  private executeRetreat(actor: CombatActor): ActionResult {
    return {
      ok: true,
      logEntries: [
        this.log(actor.id, undefined, "system", `${actor.nameRu} отступает`),
      ],
      rosterChanged: false,
    };
  }

  /**
   * Базовая damage formula. M12.0a — статичный roll по weapon.damage*.
   * M12.0b: учёт mod effects (damageDelta), accuracy, calibre/armor interaction.
   */
  private rollDamage(hero: CombatActor): number {
    if (!hero.equipped) return 1;
    const base = getItem(hero.equipped.itemId);
    if (!base) return 1;
    if (isDropWeapon(base) || isCraftWeapon(base)) {
      const min = base.damageMin;
      const max = base.damageMax;
      return Math.floor(min + this.rng() * (max - min + 1));
    }
    return 1;
  }

  private tickStatuses(actor: CombatActor): void {
    const next: StatusInstance[] = [];
    for (const st of actor.statuses) {
      if (st.remaining === -1) {
        next.push(st);
        continue;
      }
      const remaining = st.remaining - 1;
      if (remaining > 0) {
        next.push({ ...st, remaining });
      }
    }
    actor.statuses = next;
  }

  private tickCooldowns(actor: CombatActor): void {
    const next: Record<string, number> = {};
    for (const [id, turns] of Object.entries(actor.cooldowns)) {
      if (turns > 1) next[id] = turns - 1;
    }
    actor.cooldowns = next;
  }

  private checkPhaseTransition(actor: CombatActor): void {
    if (actor.phase === 2) return;
    if (actor.hp <= actor.maxHp * 0.5) {
      actor.phase = 2;
      this.state.log.push(
        this.log(actor.id, undefined, "phase", `${actor.nameRu} переходит в фазу 2`),
      );
    }
  }

  private evaluateOutcome(): EndTurnResult {
    const hero = this.state.actors.find((a) => a.kind === "hero");
    const mobsAlive = this.state.actors.some(
      (a) => a.kind === "mob" && a.hp > 0,
    );
    if (!hero || hero.hp <= 0) {
      return { combatEnded: true, outcome: "defeat" as CombatOutcome };
    }
    if (!mobsAlive) {
      return { combatEnded: true, outcome: "victory" as CombatOutcome };
    }
    return { combatEnded: false };
  }

  private failure(reason: string): ActionResult {
    return { ok: false, reasonRu: reason, logEntries: [], rosterChanged: false };
  }

  private log(
    sourceId: string,
    targetId: string | undefined,
    kind: CombatLogEntry["kind"],
    message: string,
    amount?: number,
  ): CombatLogEntry {
    const entry: CombatLogEntry = {
      turn: this.state.turn,
      kind,
      sourceId,
      targetId,
      messageRu: message,
      amount,
    };
    this.state.log.push(entry);
    return entry;
  }
}

// ============================================================================
// Factory helpers
// ============================================================================

/** Создать чистый CombatActor с дефолтами M12-ready полей. */
export const createActor = (init: {
  id: string;
  kind: CombatActor["kind"];
  nameRu: string;
  maxHp: number;
  hp?: number;
  equipped?: CombatActor["equipped"];
  magazineMax?: number | null;
  position?: Position;
}): CombatActor => ({
  id: init.id,
  kind: init.kind,
  nameRu: init.nameRu,
  hp: init.hp ?? init.maxHp,
  maxHp: init.maxHp,
  position: init.position ?? "mid",
  equipped: init.equipped ?? null,
  magazine: init.magazineMax ?? null,
  magazineMax: init.magazineMax ?? null,
  cooldowns: {},
  statuses: [],
  phase: 1,
  telegraph: null,
  coverActive: false,
});

/** Создать пустое CombatState. */
export const createState = (init: {
  zoneId: string;
  scenario: CombatState["scenario"];
  actors?: CombatActor[];
}): CombatState => ({
  turn: 0,
  actors: init.actors ?? [],
  initiativeOrder: [],
  activeActorId: null,
  targetId: null,
  environment: [],
  log: [],
  zoneId: init.zoneId,
  scenario: init.scenario,
});
