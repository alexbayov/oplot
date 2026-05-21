// GDD §10.M3 — RadioSignal schema (M3 UI-stub).
// Anti-scope: no rewards, no ambush, no trust/reputation, no branching outcomes.
// M6 will extend this schema; on M3 only the fields below exist.

export type RadioSignalOptionId = "respond" | "ignore";

export interface RadioSignalOption {
  id: RadioSignalOptionId;
  label_ru: string;
}

export interface RadioSignal {
  id: string;
  from: string;
  subject: string;
  body_ru: string;
  options: RadioSignalOption[];
  // Decremented after each successful sortie return (ReturnScene); auto-dismiss at 0.
  expires_after_sorties: number;
  // M3: flipped to true on click of either option (or auto on expiry).
  dismissed: boolean;
}
