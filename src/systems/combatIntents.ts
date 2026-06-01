import { MARAUDER_FLEE_HP_RATIO } from "../state/balance";
import type { Mob } from "../types";
import type { MobRuntimeState } from "./mobAI";

export interface CombatIntentPreview {
  readonly intent: "attack" | "aim" | "rush" | "guard_cover" | "reload" | "suppress" | "special" | "flee";
  readonly labelRu: string;
  readonly detailRu?: string;
  readonly confidence: "known" | "likely" | "fallback";
}

export const deriveVisibleEnemyIntent = (
  mob: Mob,
  state: MobRuntimeState,
): CombatIntentPreview => {
  // 1. flee: if already fled or marauder below flee threshold
  if (state.fled) {
    return {
      intent: "flee",
      labelRu: "сбежал",
      detailRu: "покинул поле боя",
      confidence: "known",
    };
  }

  if (
    mob.id === "marauder" &&
    state.hp_max > 0 &&
    state.hp / state.hp_max < MARAUDER_FLEE_HP_RATIO
  ) {
    return {
      intent: "flee",
      labelRu: "побег",
      detailRu: "готовится бежать",
      confidence: "likely",
    };
  }

  // 2. boss or special role/behavior
  if (mob.role === "boss") {
    const threshold = mob.phase_threshold ?? 0.5;
    const isPhase2 = state.phase === 2 || (state.hp_max > 0 && state.hp / state.hp_max < threshold);
    return {
      intent: "special",
      labelRu: "особое",
      detailRu: isPhase2 ? "босс: угроза фазы 2" : "босс: особая угроза",
      confidence: "likely",
    };
  }

  const behaviorId = mob.behavior_id;

  // 3. defensive/cover
  if (mob.behavior === "defensive" || behaviorId === "defensive_cover") {
    // defensive_cover rotates attack/cover. turn_count is incremented inside chooseMobActionV2,
    // so we predict based on next turn's count (state.turn_count + 1).
    const nextTurnCount = state.turn_count + 1;
    const isNextCover = nextTurnCount % 2 === 0;
    if (isNextCover) {
      return {
        intent: "guard_cover",
        labelRu: "укрытие",
        detailRu: "готовится спрятаться",
        confidence: "likely",
      };
    } else {
      return {
        intent: "attack",
        labelRu: "атака",
        detailRu: "готовится атаковать",
        confidence: "likely",
      };
    }
  }

  // 4. ranged_keep_distance -> attack
  if (behaviorId === "ranged_keep_distance") {
    return {
      intent: "attack",
      labelRu: "дальняя атака",
      detailRu: "удерживает дистанцию",
      confidence: "likely",
    };
  }

  // 5. armor_piercing_ranged -> attack
  if (behaviorId === "armor_piercing_ranged") {
    return {
      intent: "attack",
      labelRu: "бронебойная атака",
      detailRu: "игнорирует часть защиты",
      confidence: "likely",
    };
  }

  // 6. pack_bonus_when_paired -> attack
  if (behaviorId === "pack_bonus_when_paired") {
    return {
      intent: "attack",
      labelRu: "стайная атака",
      detailRu: "опаснее в группе",
      confidence: "likely",
    };
  }

  // 7. berserker_low_hp remains an attack preview; the warning copy says it is empowered.
  if (behaviorId === "berserker_low_hp") {
    const isBerserk = state.berserk_triggered || (state.hp_max > 0 && state.hp / state.hp_max < 0.5);
    if (isBerserk) {
      return {
        intent: "attack",
        labelRu: "атака усилена",
        detailRu: "ярость",
        confidence: "known",
      };
    } else {
      return {
        intent: "attack",
        labelRu: "атака",
        detailRu: "обычная атака",
        confidence: "likely",
      };
    }
  }

  // 8. default mapping
  return {
    intent: "attack",
    labelRu: "атака",
    detailRu: "обычная атака",
    confidence: "fallback",
  };
};
