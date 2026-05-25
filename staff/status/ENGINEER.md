# Status: Engineer

**Текущая веха:** M7
**Статус:** READY_FOR_REVIEW
**Последнее обновление:** 2026-05-25

## Что сделано (M7)

Ветка `m7/polish` от `m7-integration`. PR: `m7/polish → m7-integration`.

Все 4 проверки зелёные:
- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm run test` ✅ (**176/176**, 164 baseline M6 + 12 M7)
- `npm run build` ✅

### Audio system

- `src/systems/audio.ts` — `loadSfxRegistry()`, `playSfx(triggerId, volumeOverride?)`, `preloadSfx(scene)`. Fail-soft (dev-only console.warn) при отсутствии registry или asset. Использует Phaser built-in Sound API.
- `src/scenes/BootScene.ts` — optional `preloadSfx` call если `content/sfx.json` загружен.

### Settings

- `src/state/types.ts` / `src/state/GameState.ts` — добавлены `sfxMuted: boolean` и `sfxVolume: number` (0.0–1.0, default 1.0) в `GameState.settings`.
- `setSfxMute(value)`, `setSfxVolume(value)` с clamp.
- `src/scenes/BaseScene.ts` — минимальные controls: mute toggle (`SFX ON/OFF`) и volume step (`Vol 100%`) в верхнем правом углу, без redesign.

### Tweens

- `src/systems/tweens.ts` — `runTween(scene, eventId, target, ...)` registry-based helper. 16 event IDs из `balance.md` §M7.5. Visual-only, нет игровой логики в callbacks.
- Интеграция по сценам:
  - `CombatScene` — `tween_damage_flash`, `tween_hit_shake`, `tween_heal_pulse`, `tween_gas_warning`, `tween_boss_phase_red`, `tween_defeat_fade`
  - `LootScene` — `tween_loot_bounce`
  - `CraftScene` — `tween_craft_spin`
  - `LevelUpScene` — `tween_level_up_glow`, `tween_xp_bar_fill`, `tween_perk_card_deal`
  - `RadioScene` — `tween_radio_static`
  - `ReturnScene` — `tween_return_walk`
  - `SortieScene` — `tween_sortie_enter`
  - `BaseScene` — `tween_menu_hover`
  - `InventoryScene` — `tween_item_tooltip`

### Runtime validation

- `src/systems/dataValidation.ts` — `softWarnCounts(data, expected?)` (zones=9/items=80/recipes=42/mobs=11/sfx=10) и `validateRecipeRefs(data)`. Soft-warn в dev-only через `console.warn`.
- `src/scenes/BootScene.ts` — вызов validation после загрузки контента.

### Тесты (vitest) +12

| Файл | Кол-во | Δ | Покрытие |
|---|---|---|---|
| `audio.test.ts` | 3 | +3 | registry fail-soft, play by trigger, mute + volume scaling |
| `settings.test.ts` | 3 | +3 | mute toggle, volume clamp high/low |
| `tweens.test.ts` | 3 | +3 | 16 IDs в registry, runTween для каждого, unknown id warns |
| `dataValidation.test.ts` | 3 | +3 | soft-warn counts, recipe refs resolve, missing recipe refs flagged |

Итог: **176 vitest passed** (164 baseline M6 + 12 M7). 0 failed. M6 regression PASS.

## PR

- `m7/polish → m7-integration` — Ready for review.
