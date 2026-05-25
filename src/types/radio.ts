export type RadioSignalType = "truth" | "trap" | "ambiguous";
export type RadioSignalOptionId = "respond" | "ignore";

export interface RadioSignalOption {
  id: RadioSignalOptionId;
  label_ru: string;
}

export interface RadioReward {
  item_id: string;
  count: number;
}

export interface RadioTrustImpact {
  respond: number;
  ignore: number;
}

export interface RadioSignal {
  id: string;
  from: string;
  subject: string;
  body_ru: string;
  type: RadioSignalType;
  zone_id: "forest" | "warehouse" | "city";
  options: RadioSignalOption[];
  reward: RadioReward | null;
  trap_mob_id: string | null;
  trust_impact: RadioTrustImpact;
  expires_after_sorties: number;
  chosen_option: RadioSignalOptionId | null;
  resolved: boolean;
}
