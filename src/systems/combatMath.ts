/**
 * R2 combat math — pure, deterministic with injected RNG.
 * Spec: docs/redesign/R2-COMBAT.md
 */

export type BodyPart = "torso" | "head" | "arms" | "legs";
export type Cover = "none" | "half" | "full";

export interface ShotInput {
  baseHit?: number;
  marksmanship: number;
  weaponAccuracyMod: number;
  elevationBonus?: number;
  distance: number;
  optRange: number;
  cover: Cover;
  flanked?: boolean;
  bodyPart: BodyPart;
  suppressed?: boolean;
  injuryArm?: boolean;
}

export interface HitBreakdown {
  hitChance: number;
  parts: Array<{ label: string; value: number }>;
}

const BODY_PENALTY: Record<BodyPart, number> = {
  torso: 0,
  legs: 10,
  arms: 20,
  head: 30,
};

const COVER_PENALTY: Record<Cover, number> = {
  none: 0,
  half: 20,
  full: 40,
};

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function computeHitChance(input: ShotInput): HitBreakdown {
  const base = input.baseHit ?? 60;
  const skill = input.marksmanship * 3;
  const weapon = input.weaponAccuracyMod;
  const elev = input.elevationBonus ?? 0;
  const distPen = Math.max(0, input.distance - input.optRange) * 2;
  const coverPen = input.flanked ? 0 : COVER_PENALTY[input.cover];
  const bodyPen = BODY_PENALTY[input.bodyPart];
  const supp = input.suppressed ? 15 : 0;
  const injury = input.injuryArm ? 10 : 0;

  const parts = [
    { label: "base", value: base },
    { label: "skill", value: skill },
    { label: "weapon", value: weapon },
    { label: "elevation", value: elev },
    { label: "distance", value: -distPen },
    { label: "cover", value: -coverPen },
    { label: "body", value: -bodyPen },
    { label: "suppression", value: -supp },
    { label: "injury", value: -injury },
  ];

  const sum = parts.reduce((a, p) => a + p.value, 0);
  return { hitChance: clamp(sum, 5, 95), parts };
}

export interface DamageInput {
  dmgMin: number;
  dmgMax: number;
  bodyPart: BodyPart;
  crit: boolean;
  armor: number;
  armorPen?: number;
  rng: () => number;
}

const BODY_DMG: Record<BodyPart, number> = {
  torso: 1.0,
  head: 2.5,
  arms: 0.7,
  legs: 0.8,
};

export function rollDamage(input: DamageInput): number {
  const span = input.dmgMax - input.dmgMin;
  const rawRoll = input.dmgMin + input.rng() * span;
  const bodyMult = BODY_DMG[input.bodyPart];
  // Head already has 2.5x; extra crit mult only for non-head crits.
  const critMult = input.crit && input.bodyPart !== "head" ? 1.5 : 1.0;
  const raw = rawRoll * bodyMult * critMult;
  const pen = input.armorPen ?? 0;
  const mitigated = Math.max(1, raw - input.armor * (1 - pen));
  return Math.round(mitigated);
}

export function rollHit(hitChance: number, rng: () => number): boolean {
  return rng() * 100 < hitChance;
}

export function formatBreakdown(b: HitBreakdown): string {
  const bits = b.parts
    .filter((p) => p.value !== 0)
    .map((p) => `${p.value >= 0 ? "+" : ""}${p.value} ${p.label}`);
  return `${b.hitChance}% = ${bits.join(" ")}`;
}
