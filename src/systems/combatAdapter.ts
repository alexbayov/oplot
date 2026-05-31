import type { SortieState } from "../state/types";
import type { Mob } from "../types";
import type { WeaponInstance } from "../types/items";
import type { CombatActor, CombatState, Position } from "./combatTypes";
import type { MobRuntimeState } from "./mobAI";

const DEFAULT_POSITION: Position = "mid";

export interface CombatAdapterPlayerInput {
  hp: number;
  hp_max: number;
  nameRu?: string;
  equipped?: WeaponInstance | null;
  magazine?: number | null;
  magazineMax?: number | null;
}

export interface CombatAdapterMobInput {
  mob: Mob;
  state: MobRuntimeState;
}

export interface CombatStateSnapshotInput {
  sortie: Pick<SortieState, "zone_id" | "cover_active"> | null | undefined;
  player: CombatAdapterPlayerInput;
  mobs: readonly CombatAdapterMobInput[];
  turn?: number;
  scenario?: CombatState["scenario"];
  heroActorId?: string;
}

const safeHp = (value: number, fallback = 0): number =>
  Number.isFinite(value) ? Math.max(0, value) : fallback;

const safeMaxHp = (value: number, hp: number): number => {
  if (Number.isFinite(value) && value > 0) return value;
  return Math.max(1, hp);
};

export const buildCombatStateSnapshot = (
  input: CombatStateSnapshotInput,
): CombatState => {
  const heroId = input.heroActorId ?? "hero";
  const heroHp = safeHp(input.player.hp);
  const heroMaxHp = safeMaxHp(input.player.hp_max, heroHp);

  const hero: CombatActor = {
    id: heroId,
    kind: "hero",
    nameRu: input.player.nameRu ?? "Герой",
    hp: heroHp,
    maxHp: heroMaxHp,
    position: DEFAULT_POSITION,
    equipped: input.player.equipped ?? null,
    magazine: input.player.magazine ?? null,
    magazineMax: input.player.magazineMax ?? null,
    cooldowns: {},
    statuses: [],
    phase: 1,
    telegraph: null,
    coverActive: input.sortie?.cover_active ?? false,
  };

  const mobActors = input.mobs.map(({ mob, state }, index): CombatActor => {
    const hp = safeHp(state.hp, safeHp(mob.hp));
    const maxHp = safeMaxHp(state.hp_max, hp || safeHp(mob.hp, 1));
    return {
      id: `mob:${index}:${mob.id}`,
      kind: "mob",
      nameRu: mob.name_ru || mob.id || `Моб ${index + 1}`,
      hp,
      maxHp,
      position: DEFAULT_POSITION,
      equipped: null,
      magazine: null,
      magazineMax: null,
      cooldowns: {},
      statuses: [],
      phase: state.phase ?? 1,
      telegraph: null,
      coverActive: state.cover_active ?? false,
    };
  });

  return {
    turn: input.turn ?? 0,
    actors: [hero, ...mobActors],
    initiativeOrder: [],
    activeActorId: null,
    targetId: mobActors[0]?.id ?? null,
    environment: [],
    log: [],
    zoneId: input.sortie?.zone_id ?? "unknown",
    scenario: input.scenario ?? "sortie",
  };
};
