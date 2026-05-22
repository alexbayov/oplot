import { MARAUDER_FLEE_HP_RATIO } from "../state/balance";
import type { Item, Mob } from "../types";

export interface MobRuntimeState {
  hp: number;
  hp_max: number;
  damage_min: number;
  damage_max: number;
  base_speed: number;
  fled: boolean;
  turn_count: number;
  berserk_triggered: boolean;
  cover_active: boolean;
  // M5 GDD §9: boss 2-phase tracking. Regular mobs always phase=1, no transition.
  phase: 1 | 2;
  phase_transition_done: boolean;
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
  phase: 1,
  phase_transition_done: false,
});

export const computePhaseTransition = (
  mob: Mob,
  runtimeState: MobRuntimeState,
): { newPhase: 1 | 2; newBehaviorId: string | null } => {
  if (mob.role !== "boss") {
    return { newPhase: 1, newBehaviorId: null };
  }
  if (runtimeState.phase_transition_done) {
    return { newPhase: runtimeState.phase, newBehaviorId: null };
  }
  const threshold = mob.phase_threshold ?? 0.5;
  if (runtimeState.hp_max > 0 && runtimeState.hp / runtimeState.hp_max < threshold) {
    return { newPhase: 2, newBehaviorId: mob.phase_2_behavior_id ?? null };
  }
  return { newPhase: runtimeState.phase, newBehaviorId: null };
};

export type MobActionV2 =
  | {
      kind: "attack";
      damage_multiplier: number;
      ignore_armor_defense: boolean;
    }
  | { kind: "cover" }
  | { kind: "flee" };

export interface MobAIContext {
  mob: Mob;
  state: MobRuntimeState;
  allies: { mob: Mob; state: MobRuntimeState }[];
  heroEquippedWeapon: Item | null;
}

const maybeTriggerBerserk = (state: MobRuntimeState): void => {
  if (state.berserk_triggered) return;
  if (state.hp_max <= 0) return;
  if (state.hp / state.hp_max >= 0.5) return;
  state.damage_min *= 2;
  state.damage_max *= 2;
  state.base_speed = Math.max(0, state.base_speed - 30);
  state.berserk_triggered = true;
};

export const chooseMobActionV2 = (ctx: MobAIContext): MobActionV2 => {
  const { mob, state, allies, heroEquippedWeapon } = ctx;

  // M5: phase transition check before action selection.
  const transition = computePhaseTransition(mob, state);
  if (transition.newPhase !== state.phase) {
    state.phase = transition.newPhase;
    state.phase_transition_done = true;
  }
  const effectiveBehaviorId =
    transition.newBehaviorId ?? mob.behavior_id;

  if (!effectiveBehaviorId) {
    if (
      mob.id === "marauder" &&
      state.hp_max > 0 &&
      state.hp / state.hp_max < MARAUDER_FLEE_HP_RATIO
    ) {
      return { kind: "flee" };
    }
    return { kind: "attack", damage_multiplier: 1.0, ignore_armor_defense: false };
  }

  if (effectiveBehaviorId === "berserker_low_hp") {
    maybeTriggerBerserk(state);
  }

  if (effectiveBehaviorId === "defensive_cover") {
    state.turn_count += 1;
    if (state.turn_count % 2 === 0) {
      state.cover_active = true;
      return { kind: "cover" };
    }
    state.cover_active = false;
    return { kind: "attack", damage_multiplier: 1.0, ignore_armor_defense: false };
  }

  state.turn_count += 1;

  switch (effectiveBehaviorId) {
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
      return { kind: "attack", damage_multiplier: 1.0, ignore_armor_defense: false };
  }
};
