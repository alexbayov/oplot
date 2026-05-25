# Handoff — Engineer M8a

Engineer implements M8a platform / persistence / mobile-first polish. No content, no audio asset generation, no docs, no game-mechanic changes.

## Preconditions

- GD M8a amendment merged (GDD §13a) and QA Spec M8a verdict APPROVE.
- M7 baseline: 9 zones, 80 items, 42 recipes, 10 SFX, 16 tweens, 176/176 vitest, JS 1.49 MB.

## Deliverables

1. **Yandex SDK platform wrapper.** `src/systems/platform.ts`:
   - Single async `initPlatform()` called from `main.ts` before scene start; resolves to `{ available: boolean, sdk: YaGames | null, player: Player | null }`.
   - Loads SDK from `<script src="https://yandex.ru/games/sdk/v2">` (added to `index.html`).
   - `sdk.features.LoadingAPI?.ready()` invoked at end of BootScene preload.
   - **Fail-soft:** if script fails to load, `YaGames` undefined, or `init()` rejects → resolve `{ available: false, sdk: null, player: null }`; no `throw`, no `console.error`.
   - Type contract: thin local types for what we use (no `any`); never import full SDK types.

2. **Cloud save system.** `src/systems/cloudSave.ts`:
   - `serializeGameState(state: GameState): CloudSaveSnapshot` and inverse `deserialize(snapshot): GameState`.
   - `saveToCloud(state)` throttled by `MIN_CLOUD_SAVE_INTERVAL_S` (per GDD §13a).
   - `loadFromCloud(): Promise<CloudSaveSnapshot | null>` using `player.getData([keys])`.
   - `resolveConflict(local, remote): CloudSaveSnapshot` — "remote newer wins by `saved_at`".
   - Snapshot includes all `GameState` fields enumerated in GDD §13a, plus `saved_at: ISO8601`.
   - **Fail-soft:** if platform `available === false` → both save and load are no-ops; game still mutates local in-memory `GameState`.
   - Critical save triggers wired in calling code (post-sortie return, post-craft, post-level-up, settings change, perk choice).

3. **Locale stub.** `src/systems/locale.ts`:
   - `t(key: string): string` returning RU strings from a single registry.
   - On M8a, `sdk.environment.i18n.lang` ignored — RU forced.
   - Only migrate to `t()` strings actually surfaced to user; no need to wrap every literal.

4. **Mobile-first viewport polish.**
   - `index.html`: add viewport meta `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover`.
   - Game container CSS: `padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)` (or equivalent per current scene-ui pattern).
   - Audio unlock: `src/utils/audioUnlock.ts` — single one-shot listener on `pointerdown` / `touchstart` resumes/creates `AudioContext`; integrated into existing M7 audio system.
   - `touchstart` `preventDefault` on Phaser canvas (only) to suppress iOS double-tap zoom; do not affect HUD touch.
   - Portrait orientation declared (Yandex SDK orientation API or manifest meta).

5. **Settings persistence.**
   - M7 mute / volume mutators trigger throttled `saveToCloud`.
   - BootScene loads cloud snapshot before SettingsScene reads defaults.
   - Defaults if no remote snapshot: `mute = false`, `volume = 1.0`.

6. **Tests.** Target **176 + ~14 = ~190 vitest PASS** (final exact target locked by QA Spec):
   - `tests/cloudSave.test.ts`: serialize round-trip (every GameState field), conflict policy (remote newer / local newer / equal), throttle (no save inside interval), no-op when platform unavailable.
   - `tests/platform.test.ts`: fail-soft when `YaGames` undefined / `init` rejects / script timeout; mock-based.
   - `tests/locale.test.ts`: `t()` returns RU for registered keys; falls back to key itself if missing (or whichever fallback policy GD pins).
   - `tests/audioUnlock.test.ts`: first gesture triggers unlock once; subsequent gestures no-op.

7. **Status:** update only `staff/status/ENGINEER.md` with commands run, vitest count, build size, recovery note.

## Commands

`npm install` (if package set unchanged, no new npm dep — SDK is external script tag), `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`. All must be green.

## Forbidden

- No `content/*.json`, `assets/*`, `docs/*`, other staff files.
- No ads / IAP / leaderboards / achievements code paths — that's M8b.
- No telemetry / analytics / backend / external HTTP except Yandex SDK script tag.
- No new mobs / bosses / zones / items / recipes / perks / radio / SFX / tweens.
- No new combat / craft / radio / progression mechanics.
- No music / voice / ambience.
- No UI redesign — only viewport / safe-area / mobile polish.
- No third-party libs (no npm-side Yandex SDK package; use script tag only).
- No `any` / lazy type escapes / `getattr`-style runtime access.
- No self-merge.
- No PAT in URL / echo / print.

## Acceptance

Only `src/`, `index.html`, `tests/`, `staff/status/ENGINEER.md` changed. PR `m8a/platform → m8a-integration`. Draft PR early with Recovery block (early scaffold commit, push, then iterate).
