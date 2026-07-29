# R0 — Foundation (Babylon.js + изометрия)

> Зависит от: ничего (старт серии).
> Блокирует: R1.

## Цель
Подключить Babylon.js рядом с Phaser, открыть изометрическую сцену, не сломать существующий boot/cloudSave.

## Задачи
1. `npm i @babylonjs/core @babylonjs/materials` (без тяжёлых extras на старте).
2. Новая сцена `src/scenes3d/Boot3DScene.ts` + entry hook из `main.ts` (feature flag `USE_3D_COMBAT=true` в config).
3. Камера: `ArcRotateCamera` locked orthographic-like iso (alpha=π/4, beta=π/3, radius fixed, wheel zoom clamp).
4. Свет: Hemispheric + Directional soft shadow map low-res (mobile).
5. Ground plane 20×20, grid helper, placeholder hero box.
6. SAVE_VERSION bump stub → 10 + no-op migration (поля для 3D позже).
7. Vite: chunk split phaser / babylon.
8. Tests: smoke «Boot3D mounts without throw» (jsdom/node stub ok).

## DoD
- [ ] `npm run typecheck` 0
- [ ] `npm run lint` 0
- [ ] `npm run test` ≥592 green
- [ ] `npm run dev` — видна изо-сцена
- [ ] Critic: «сцена читается как изо, не free-look FPS» APPROVE

## Anti-scope R0
Нет pathfinding, нет боя, нет моделей оружия, нет UI hit%.
