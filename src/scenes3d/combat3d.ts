import { Scene, Mesh, Vector3, AbstractMesh, PointerEventTypes } from "@babylonjs/core";
import { computeHitChance, formatBreakdown, rollHit, rollDamage, BodyPart, Cover } from "../systems/combatMath";

export interface CombatState {
  heroAP: number; heroHP: number; heroMaxHP: number;
  heroInjury: { arm?: boolean; leg?: boolean; head?: boolean };
  heroCover: Cover; heroPosition: { x: number; z: number };
  enemies: Array<{ id: string; name: string; hp: number; maxHP: number; cover: Cover; position: { x: number; z: number }; type: string; behavior: string; }>;
  turnOrder: number; noise: number; turnLog: string[];
}

export function createCombatUI(state: CombatState, parentEl: HTMLElement): HTMLDivElement {
  const overlay = document.createElement("div");
  overlay.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:20;";
  parentEl.style.position = "relative"; parentEl.appendChild(overlay);

  const hud = document.createElement("div");
  hud.style.cssText = "position:absolute;top:8px;left:50%;transform:translateX(-50%);pointer-events:auto;background:rgba(17,18,16,0.85);border:1px solid #5a4a32;border-radius:6px;padding:8px 16px;font:13px/1.3 'Share Tech Mono',monospace;color:#e8dcc0;display:flex;gap:16px;";
  hud.innerHTML = `<span>AP: <b>${state.heroAP}</b></span><span>HP: <b>${state.heroHP}/${state.heroMaxHP}</b></span><span>Cover: <b>${state.heroCover}</b></span><span>Noise: <b>${state.noise}</b></span><span>Turn: <b>${state.turnOrder + 1}</b></span>`;
  overlay.appendChild(hud);

  const aimPanel = document.createElement("div");
  aimPanel.id = "aim-panel";
  aimPanel.style.cssText = "position:absolute;bottom:16px;left:50%;transform:translateX(-50%);pointer-events:auto;background:rgba(17,18,16,0.92);border:1px solid #8a6e3e;border-radius:6px;padding:10px 14px;font:13px/1.3 'Share Tech Mono',monospace;color:#e8dcc0;min-width:260px;display:none;";
  aimPanel.innerHTML = `<div style="font-weight:bold;color:#d4a843;margin-bottom:6px;">Прицельный выстрел</div><div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;"><button onclick="window.__oplotAim('torso')" style="padding:4px 8px;background:#2a2a24;border:1px solid #5a4a32;border-radius:3px;color:#e8dcc0;cursor:pointer;">Торс (0%)</button><button onclick="window.__oplotAim('legs')" style="padding:4px 8px;background:#2a2a24;border:1px solid #5a4a32;border-radius:3px;color:#e8dcc0;cursor:pointer;">Ноги (−10%)</button><button onclick="window.__oplotAim('arms')" style="padding:4px 8px;background:#2a2a24;border:1px solid #5a4a32;border-radius:3px;color:#e8dcc0;cursor:pointer;">Руки (−20%)</button><button onclick="window.__oplotAim('head')" style="padding:4px 8px;background:#2a2a24;border:1px solid #5a4a32;border-radius:3px;color:#e8dcc0;cursor:pointer;">Голова (−30%)</button></div><div id="hit-breakdown" style="font-size:12px;color:#aaa;min-height:18px;">Выберите часть тела для анализа.</div>`;
  overlay.appendChild(aimPanel);

  (window as any).__oplotAim = (part: string) => {
    const b = computeHitChance({ baseHit: 60, marksmanship: 5, weaponAccuracyMod: 5, distance: 5, optRange: 12, cover: "none", bodyPart: part as any, flanked: false });
    const el = document.getElementById("hit-breakdown");
    if (el) el.innerText = formatBreakdown(b);
  };

  const logEl = document.createElement("div");
  logEl.style.cssText = "position:absolute;bottom:8px;left:8px;pointer-events:none;background:rgba(17,18,16,0.7);border-radius:4px;padding:6px 10px;font:11px/1.3 'Share Tech Mono',monospace;color:#aaa;max-height:120px;overflow:hidden;";
  overlay.appendChild(logEl);
  (overlay as any).__refreshLog = () => { logEl.innerHTML = state.turnLog.slice(-5).map((l) => `<div>${l}</div>`).join(""); };
  return overlay;
}

export function resolveTurn(hero: { ap: number; hp: number }, target: { hp: number; cover: Cover; type: string }, action: "snap" | "aimed" | "move" | "reload" | "overwatch", bodyPart?: BodyPart): { hero: typeof hero; target: typeof target; log: string; hit?: boolean; dmg?: number } {
  const log = `Turn: ${action}`;
  if (action === "snap") {
    const b = computeHitChance({ baseHit: 60, marksmanship: 5, weaponAccuracyMod: 5, distance: 5, optRange: 12, cover: target.cover, bodyPart: "torso" });
    const hit = rollHit(b.hitChance, () => Math.random());
    const dmg = hit ? rollDamage({ dmgMin: 20, dmgMax: 20, bodyPart: "torso", crit: false, armor: 0, rng: () => Math.random() }) : 0;
    return { hero: { ...hero, ap: Math.max(0, hero.ap - 2) }, target: { ...target, hp: Math.max(0, target.hp - dmg) }, log: `${log} → ${hit ? `ПОПАДАНИЕ ${dmg}` : "ПРОМАХ"}`, hit, dmg };
  }
  return { hero, target, log };
}
