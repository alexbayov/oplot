export type CombatStatusId =
  | "bleed"
  | "exposed"
  | "suppressed";

export type CombatStatusTarget =
  | "hero"
  | "enemy"
  | "both";

export interface CombatStatusDefinition {
  id: CombatStatusId;
  labelRu: string;
  target: CombatStatusTarget;
  visible: boolean;
  isHarmful: boolean;
  displayPriority: number;
  canStack: boolean;
  canRefreshDuration: boolean;
}

export interface CombatStatusInstance {
  id: CombatStatusId;
  durationTurns: number;
  stacks?: number;
  source?: string;
}

const definitions: Record<CombatStatusId, CombatStatusDefinition> = {
  bleed: {
    id: "bleed",
    labelRu: "Кровь",
    target: "both",
    visible: true,
    isHarmful: true,
    displayPriority: 1,
    canStack: false,
    canRefreshDuration: true,
  },
  exposed: {
    id: "exposed",
    labelRu: "Открыт",
    target: "both",
    visible: true,
    isHarmful: true,
    displayPriority: 2,
    canStack: false,
    canRefreshDuration: true,
  },
  suppressed: {
    id: "suppressed",
    labelRu: "Подавлен",
    target: "both",
    visible: true,
    isHarmful: true,
    displayPriority: 3,
    canStack: false,
    canRefreshDuration: true,
  },
};

export const getCombatStatusDefinition = (id: CombatStatusId): CombatStatusDefinition => {
  const definition = definitions[id];
  if (!definition) {
    throw new Error(`Unknown status ID: ${id}`);
  }
  return definition;
};

export const formatCombatStatusChip = (status: CombatStatusInstance): string => {
  const def = getCombatStatusDefinition(status.id);
  const duration = status.durationTurns;

  let normalizedDuration = duration;
  if (!Number.isFinite(duration) || !Number.isInteger(duration) || duration < 0) {
    normalizedDuration = 0;
  }

  if (normalizedDuration === 0) {
    return def.labelRu;
  }

  return `${def.labelRu} ${normalizedDuration}`;
};

export const normalizeCombatStatusInstance = (input: unknown): CombatStatusInstance | null => {
  if (!input || typeof input !== "object") {
    return null;
  }

  const obj = input as Record<string, unknown>;
  const id = obj.id;
  if (id !== "bleed" && id !== "exposed" && id !== "suppressed") {
    return null;
  }

  const duration = obj.durationTurns;
  let normalizedDuration = 0;
  if (typeof duration === "number" && Number.isFinite(duration) && Number.isInteger(duration) && duration >= 0) {
    normalizedDuration = duration;
  }

  const result: CombatStatusInstance = {
    id,
    durationTurns: normalizedDuration,
  };

  if ("stacks" in obj) {
    const s = obj.stacks;
    if (typeof s === "number" && Number.isFinite(s) && Number.isInteger(s) && s >= 0) {
      result.stacks = s;
    }
  }

  if ("source" in obj) {
    const src = obj.source;
    if (typeof src === "string") {
      result.source = src;
    }
  }

  return result;
};

export const sortCombatStatusesForDisplay = (statuses: CombatStatusInstance[]): CombatStatusInstance[] => {
  if (!Array.isArray(statuses)) {
    return [];
  }

  const normalized = statuses
    .map((s) => normalizeCombatStatusInstance(s))
    .filter((s): s is CombatStatusInstance => s !== null);

  const withIndex = normalized.map((item, index) => ({ item, index }));

  withIndex.sort((a, b) => {
    const priorityA = getCombatStatusDefinition(a.item.id).displayPriority;
    const priorityB = getCombatStatusDefinition(b.item.id).displayPriority;
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    return a.index - b.index;
  });

  return withIndex.map((x) => x.item);
};

export const limitCombatStatusesForDisplay = (
  statuses: CombatStatusInstance[],
  maxVisible = 3
): {
  visible: CombatStatusInstance[];
  overflowCount: number;
} => {
  const sorted = sortCombatStatusesForDisplay(statuses);

  if (maxVisible <= 0) {
    return {
      visible: [],
      overflowCount: sorted.length,
    };
  }

  if (sorted.length <= maxVisible) {
    return {
      visible: sorted,
      overflowCount: 0,
    };
  }

  const limit = maxVisible - 1;
  const visible = sorted.slice(0, limit);
  const overflowCount = sorted.length - limit;

  return {
    visible,
    overflowCount,
  };
};

export const formatStatusOverflowChip = (overflowCount: number): string | null => {
  if (!Number.isFinite(overflowCount) || overflowCount <= 0) {
    return null;
  }
  return `+${overflowCount}`;
};
