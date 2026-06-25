/**
 * heroPassives (M20-PR2) — наложение пассивов дерева навыков на боевой
 * снапшот героя.
 *
 * Дерево считает богатый PassiveEffectsBundle, но авто-резолв вылазки его
 * не видел: оффенс/защита fighter-ветки были косметикой. Здесь — чистое
 * наложение однозначных эффектов на HeroSnapshot перед computeHeroPower.
 *
 * Скоуп PR2 — только эффекты с непротиворечивым домом в post-pivot модели:
 *  - accuracy_bonus → weapon_accuracy (additive, как у оружейного accuracy);
 *  - damage_mul → weapon_damage_avg (multiplicative);
 *  - defense_mul → armor_reduction (multiplicative, клампим 0..0.9 как резолвер).
 * hp_max в снапшот НЕ трогаем: он уже персистентно выведен из дерева в
 * M20-PR1 (иначе двойной учёт). crit и эффекты снесённых пивотом тактик-
 * механик (cover/reload/ходы) — отдельный design-fork, см. M20-PR3.
 *
 * Нейтральный бандл (ничего не открыто: damage_mul=1, defense_mul=1,
 * accuracy_bonus=0) даёт снапшот бит-в-бит как до пакета.
 */
import type { HeroSnapshot } from "../types/sortie";
import type { PassiveEffectsBundle } from "../types/skillNode";

export function applyPassivesToHero(
  hero: HeroSnapshot,
  bundle: PassiveEffectsBundle,
): HeroSnapshot {
  return {
    ...hero,
    weapon_accuracy: hero.weapon_accuracy + bundle.accuracy_bonus,
    weapon_damage_avg: hero.weapon_damage_avg * bundle.damage_mul,
    armor_reduction: Math.max(
      0,
      Math.min(0.9, hero.armor_reduction * bundle.defense_mul),
    ),
  };
}
