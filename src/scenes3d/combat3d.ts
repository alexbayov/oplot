/**
 * R2 combat UI + turn resolution helpers.
 * Spec: docs/redesign/R2-COMBAT.md
 */
import {
  computeHitChance,
  formatBreakdown,
  rollDamage,
  rollHit,
  type BodyPart,
  type Cover,
} from "../systems/combatMath";

export interface CombatState {
  heroAP: number;
  heroHP: number;
  heroMaxHP: number;
  heroCover: Cover;
  heroPosition: { x: number; z: number };
  enemies: Array<{
    id: string;
    name: string;
    hp: number;
    maxHP: number;
    cover: Cover;
    position: { x: number; z: number };
    type: string;
    behavior: string;
  }>;
  turnOrder: number;
  noise: number;
  turnLog: string[];
}

declare global {
  interface Window {
    __oplotAim?: (part: BodyPart) => void;
  }
}

export function createCombatUI(state: CombatState, parentEl: HTMLElement): HTMLDivElement {
  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:20;";
  parentEl.style.position = "relative";
  parentEl.appendChild(overlay);

  const hud = document.createElement("div");
  hud.style.cssText =
    "position:absolute;top:8px;left:50%;transform:translateX(-50%);pointer-events:auto;" +
    "background:rgba(17,18,16,0.85);border:1px solid #5a4a32;border-radius:6px;padding:8px 16px;" +
    "font:13px/1.3 'Share Tech Mono',monospace;color:#e8dcc0;display:flex;gap:16px;";
  hud.innerHTML =
    `<span>AP: <b>${state.heroAP}</b></span>` +
    `<span>HP: <b>${state.heroHP}/${state.heroMaxHP}</b></span>` +
    `<span>Cover: <b>${state.heroCover}</b></span>` +
    `<span>Noise: <b>${state.noise}</b></span>` +
    `<span>Turn: <b>${state.turnOrder + 1}</b></span>`;
  overlay.appendChild(hud);

  const aimPanel = document.createElement("div");
  aimPanel.id = "aim-panel";
  aimPanel.style.cssText =
    "position:absolute;bottom:16px;left:50%;transform:translateX(-50%);pointer-events:auto;" +
    "background:rgba(17,18,16,0.92);border:1px solid #8a6e3e;border-radius:6px;padding:10px 14px;" +
    "font:13px/1.3 'Share Tech Mono',monospace;color:#e8dcc0;min-width:280px;";

  const title = document.createElement("div");
  title.style.cssText = "font-weight:bold;color:#d4a843;margin-bottom:6px;";
  title.textContent = "Прицельный выстрел";
  aimPanel.appendChild(title);

  const buttons = document.createElement("div");
  buttons.style.cssText = "display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;";
  const parts: Array<[BodyPart, string]> = [
    ["torso", "Торс (0%)"],
    ["legs", "Ноги (−10%)"],
    ["arms", "Руки (−20%)"],
    ["head", "Голова (−30%)"],
  ];
  for (const [part, label] of parts) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.style.cssText =
      "padding:4px 8px;background:#2a2a24;border:1px solid #5a4a32;border-radius:3px;color:#e8dcc0;cursor:pointer;";
    btn.addEventListener("click", () => {
      window.__oplotAim?.(part);
    });
    buttons.appendChild(btn);
  }
  aimPanel.appendChild(buttons);

  const breakdown = document.createElement("div");
  breakdown.id = "hit-breakdown";
  breakdown.style.cssText = "font-size:12px;color:#aaa;min-height:18px;";
  breakdown.textContent = "Выберите часть тела для анализа.";
  aimPanel.appendChild(breakdown);
  overlay.appendChild(aimPanel);

  window.__oplotAim = (part: BodyPart) => {
    const b = computeHitChance({
      baseHit: 60,
      marksmanship: 5,
      weaponAccuracyMod: 5,
      distance: 5,
      optRange: 12,
      cover: "none",
      bodyPart: part,
      flanked: false,
    });
    breakdown.textContent = formatBreakdown(b);
  };

  const logEl = document.createElement("div");
  logEl.style.cssText =
    "position:absolute;bottom:8px;left:8px;pointer-events:none;" +
    "background:rgba(17,18,16,0.7);border-radius:4px;padding:6px 10px;" +
    "font:11px/1.3 'Share Tech Mono',monospace;color:#aaa;max-height:120px;overflow:hidden;";
  overlay.appendChild(logEl);

  const refreshLog = (): void => {
    logEl.innerHTML = state.turnLog
      .slice(-5)
      .map((line) => `<div>${line}</div>`)
      .join("");
  };
  (overlay as HTMLDivElement & { __refreshLog?: () => void }).__refreshLog = refreshLog;
  refreshLog();

  return overlay;
}

export function resolveTurn(
  hero: { ap: number; hp: number },
  target: { hp: number; cover: Cover; type: string },
  action: "snap" | "aimed" | "move" | "reload" | "overwatch",
  bodyPart: BodyPart = "torso",
  rng: () => number = Math.random,
): {
  hero: { ap: number; hp: number };
  target: { hp: number; cover: Cover; type: string };
  log: string;
  hit?: boolean;
  dmg?: number;
} {
  if (action !== "snap" && action !== "aimed") {
    return { hero, target, log: `Turn: ${action}` };
  }

  const apCost = action === "aimed" ? 3 : 2;
  if (hero.ap < apCost) {
    return { hero, target, log: `Turn: ${action} — не хватает AP` };
  }

  const part = action === "snap" ? "torso" : bodyPart;
  const b = computeHitChance({
    baseHit: 60,
    marksmanship: 5,
    weaponAccuracyMod: 5,
    distance: 5,
    optRange: 12,
    cover: target.cover,
    bodyPart: part,
  });
  const hit = rollHit(b.hitChance, rng);
  const dmg = hit
    ? rollDamage({
        dmgMin: 20,
        dmgMax: 28,
        bodyPart: part,
        crit: part === "head",
        armor: 0,
        rng,
      })
    : 0;

  return {
    hero: { ...hero, ap: hero.ap - apCost },
    target: { ...target, hp: Math.max(0, target.hp - dmg) },
    log: `Turn: ${action}/${part} → ${hit ? `ПОПАДАНИЕ ${dmg} (${formatBreakdown(b)})` : `ПРОМАХ (${formatBreakdown(b)})`}`,
    hit,
    dmg,
  };
}
