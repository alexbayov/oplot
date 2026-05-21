import { MARAUDER_FLEE_HP_RATIO } from "../state/balance";
import type { Item, Mob } from "../types";

// Per-fight mutable runtime state for a mob — kept out of immutable Mob data so the
// content schema (mobs.json) stays untouched and inter-fight state doesn't leak.
// CombatScene stores one per spawned enemy and passes it by reference to the AI fns.
export interface MobRuntimeState {
  hp: number;
  hp_max: number;
  damage_min: number;
  damage_max: number;
  base_speed: number;
  fled: boolean;
  // Number of own turns this mob has taken (incremented at the start of each turn by AI).
  turn_count: number;
  // berserker_low_hp single-shot trigger flag (GDD §5.4.3).
  berserk_triggered: boolean;
  // defensive_cover sets this on a cover turn; calcDefenseAgainst consumes it on the
  // next incoming attack against this mob, then the caller flips it back to false.
  cover_active: boolean;
}

export const createMobRuntimeState = (mob: Mob): MobRuntimeState => ({
  hp: mob.hp,
  hp_max: mob.hp,
  damage_min: mob.damage_min,
  damage_max: mob.damage_max,
  base_speed: mob.base_speed,
  fled: false,
  turn_count: 0,
  berserk_triggered: false,
  cover_active: false,
});

export type MobActionV2 =
  | {
      kind: "attack";
      // Multiplier applied to the rolled mob damage (ranged_keep_distance, pack_bonus).
      damage_multiplier: number;
      // armor_piercing_ranged → target's Σ armor.defense is excluded from total defense.
      ignore_armor_defense: boolean;
    }
  | { kind: "cover" }
  | { kind: "flee" };

export interface MobAIContext {
  mob: Mob;
  state: MobRuntimeState;
  // All alive (or fled) enemy instances including self — pack_bonus queries this.
  allies: { mob: Mob; state: MobRuntimeState }[];
  heroEquippedWeapon: Item | null;
}

// GDD §5.4.3: when HP first drops below 50% the berserker permanently doubles damage
// and loses 30 base_speed. Runs once per fight — guarded by berserk_triggered.
const maybeTriggerBerserk = (state: MobRuntimeState): void => {
  if (state.berserk_triggered) return;
  if (state.hp_max <= 0) return;
  if (state.hp / state.hp_max >= 0.5) return;
  state.damage_min *= 2;
  state.damage_max *= 2;
  state.base_speed = Math.max(0, state.base_speed - 30);
  state.berserk_triggered = true;
};

// AI dispatch by Mob.behavior_id (GDD §5.4.6).
// Mutates state.turn_count / berserk_triggered / cover_active / damage_*  / base_speed
// per behavior; returns the action plus the modifiers CombatScene needs for damage calc.
// M1 mobs (no behavior_id) fall back to the legacy chooseMobAction semantics so the
// M2 7-step Forest flow stays binary-identical.
export const chooseMobActionV2 = (ctx: MobAIContext): MobActionV2 => {
  const { mob, state, allies, heroEquippedWeapon } = ctx;

  if (!mob.behavior_id) {
    if (
      mob.id === "marauder" &&
      state.hp_max > 0 &&
      state.hp / state.hp_max < MARAUDER_FLEE_HP_RATIO
    ) {
      return { kind: "flee" };
    }
    return { kind: "attack", damage_multiplier: 1.0, ignore_armor_defense: false };
  }

  // Berserker trigger runs first so the buff is visible to subsequent damage rolls.
  if (mob.behavior_id === "berserker_low_hp") {
    maybeTriggerBerserk(state);
  }

  // defensive_cover alternates attack/cover by parity of own-turn counter; cover_active
  // is set on a cover turn and read by calcDefenseAgainst on the next incoming attack.
  if (mob.behavior_id === "defensive_cover") {
    state.turn_count += 1;
    if (state.turn_count % 2 === 0) {
      state.cover_active = true;
      return { kind: "cover" };
    }
    state.cover_active = false;
    return { kind: "attack", damage_multiplier: 1.0, ignore_armor_defense: false };
  }

  state.turn_count += 1;

  switch (mob.behavior_id) {
    case "ranged_keep_distance": {
      const heroMelee = heroEquippedWeapon?.type === "weapon_melee";
      return {
        kind: "attack",
        damage_multiplier: heroMelee ? 0.5 : 1.0,
        ignore_armor_defense: false,
      };
    }
    case "pack_bonus_when_paired": {
      const livingPack = allies.filter(
        (a) =>
          a.mob.id === "pack_rat" && a.state.hp > 0 && !a.state.fled,
      ).length;
      return {
        kind: "attack",
        damage_multiplier: livingPack >= 2 ? 1.5 : 1.0,
        ignore_armor_defense: false,
      };
    }
    case "armor_piercing_ranged":
      return { kind: "attack", damage_multiplier: 1.0, ignore_armor_defense: true };
    case "berserker_low_hp":
      return { kind: "attack", damage_multiplier: 1.0, ignore_armor_defense: false };
    default:
      // Unknown behavior_id — soft fall through to plain attack so Content drift
      // doesn't crash combat; mismatch is already logged by BootScene soft-warn.
      return { kind: "attack", damage_multiplier: 1.0, ignore_armor_defense: false };
  }
};
