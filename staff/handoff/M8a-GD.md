# Handoff — Game Designer M8a

GD documents M8a platform / persistence / mobile spec in `docs/GDD.md` §13a and (if numeric) `docs/balance.md` §M8a. No code, no content JSON, no assets.

## Preconditions

- M7 closed (gate-close PR #65 merged), `main` HEAD `2399b7b`.
- `m8a-integration` branch exists from current `main`.
- PM kickoff PR `pm/m8a-kickoff → main` merged.

## Deliverables

Fill in `docs/GDD.md` §13a "Платформа Yandex Games, persistence, mobile-first M8a". Replace existing §13 placeholder by **expanding** it: add §13a body + reserve §13b placeholder for future monetization milestone.

### GDD §13a must include

1. **SDK lifecycle spec**
   - Load order: `<script src="https://yandex.ru/games/sdk/v2">` in `index.html` → `YaGames.init()` → singleton instance.
   - Ready signal: `sdk.features.LoadingAPI?.ready()` called after BootScene asset preload completes.
   - **Fail-soft contract:** describe explicit fallback for: no network, adblock, SDK script fails to load, `YaGames.init()` rejects. In all cases, game starts identically to M7 (no `throw`, no `console.error`).

2. **Cloud save schema**
   - Full `GameState` snapshot fields persisted: player level/xp/perks, inventory + baseStash, `radio_trust` + resolved signal ids, settings (mute/volume from M7), `saved_at: ISO8601`.
   - Storage API: `sdk.getPlayer()` → `player.setData(snapshot, true)` (flush) / `player.getData([keys])`.
   - **Conflict policy:** "remote newer wins by `saved_at`" — at boot, load remote; compare to local in-memory; if remote `saved_at > local saved_at` → use remote, else keep local.
   - **Throttle policy:** minimum interval `MIN_CLOUD_SAVE_INTERVAL_S` between saves (proposed: 5–10 s; pick one).
   - **Critical save triggers list:** explicit enumeration (post-sortie return, post-craft, post-level-up, settings change, perk-choice commit).
   - **Quota note:** Yandex player data quota ~200 KB; specify expected snapshot size and how schema stays under it.
   - **Fail-soft:** local in-memory session works identically when SDK / player unavailable.

3. **Locale RU lock**
   - `<html lang="ru">` already set.
   - `t(key)` stub: `src/systems/locale.ts` exports `t(key: string): string` returning RU string from single registry.
   - `sdk.environment.i18n.lang` is read but **ignored** for M8a (RU forced).
   - Forward hook: any string going to user goes through `t()`; future EN translation is plug-in.

4. **Mobile-first viewport polish**
   - Viewport meta: `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover`.
   - Safe-area: `env(safe-area-inset-{top,bottom,left,right})` applied to game container / HUD.
   - iOS audio autoplay unlock: first `touchstart` / `pointerdown` resumes/creates `AudioContext`; no autoplay attempt before gesture.
   - Portrait orientation: declared via Yandex SDK or manifest (portrait-only; no landscape support on M8a).
   - Double-tap zoom suppression: `touchstart` `preventDefault` on canvas only.

5. **Settings persistence migration**
   - M7 `Settings` (mute boolean + volume 0.0–1.0) migrates from session-memory to cloud-save schema.
   - Default if no remote snapshot: mute=false, volume=1.0.

### GDD §13a Anti-scope (explicit)

- **NO ads** (rewarded / interstitial) — M8b.
- **NO IAP** (catalog / purchase / restore) — M8b.
- **NO leaderboards** — пост-релиз (BACKLOG).
- **NO achievements** — пост-релиз.
- **NO telemetry / analytics / backend**.
- **NO new languages** (RU only on M8a).
- **NO new mobs / bosses / zones / items / recipes / perks / radio signals / SFX / tweens** — content frozen at M7.
- **NO new combat / craft / radio / progression mechanics** — gameplay frozen at M7.
- **NO music / voice / ambience** — audio frozen at 10 M7 SFX.
- **NO UI redesign** — only viewport polish overlay.

### balance.md §M8a (optional, only if numeric)

If `MIN_CLOUD_SAVE_INTERVAL_S` and/or expected snapshot size need a numeric anchor for QA, add `balance.md` §M8a with a small table: throttle interval, quota target, default settings. Otherwise skip and keep the numbers inside GDD §13a prose.

## Acceptance

Only `docs/GDD.md`, `docs/balance.md` (if used), `staff/status/GAME_DESIGNER.md`. Draft PR early with Recovery block. No code, no JSON, no assets, no other staff files.
