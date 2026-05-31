# Status: Engineer

## Current status (2026-05-30)

- **Current phase:** M11/M12 QA hardening + release readiness.
- **Role responsibility:** support QA with engineering triage, keep release gates green, and fix confirmed blockers without changing gameplay scope or balance unless explicitly approved.
- **Immediate next actions:**
  1. Be ready to investigate Combat Overhaul regressions found by QA.
  2. Verify platform-sensitive flows on Yandex Draft with QA: SDK init, cloud save, ads, IAP, LoadingAPI/orientation.
  3. Keep `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` green after any fix.
- **Blockers / risks:** acceptance issues in combat state/durability/statuses may block release readiness; bundle-size warning remains a non-blocking hardening item.

## Archive / history below

## Что сделано (M8b)

Ветка `m8b/monetization` от `m8b-integration`. Draft PR: `m8b/monetization → m8b-integration`.

Все 4 проверки зелёные:
- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm run test` ✅ (**213/213**, 193 M8a + 20 M8b)
- `npm run build` ✅ (JS 1.5 MB ≤ 2 MB)

### 1. Rewarded Video — `src/systems/ads.ts`

- `showRewardedVideo(context, onRewarded, onClose)` — fail-soft, 4 коллбэка
- `showInterstitial(onClose)` — fail-soft
- `setAdsRemoved(boolean)` / `isAdsRemoved()` — integration with IAP
- 4 контекста: loot_double, second_chance, daily_reset, gas_refill

### 2. T1-T3 rewarded triggers в сценах

- **ReturnScene:** кнопка "×2 лут (реклама)" → дублирует resource-типы в рюкзаке перед merge. Interstitial при переходе в BaseScene.
- **CombatScene:** кнопка "Второй шанс (реклама)" → +50% HP. Max 1/sortie.
- **MapScene:** daily-кнопка на кулдауне → `showRewardedVideo("daily_reset")` → сбрасывает таймер.

### 3. Sticky Banner — `src/systems/banner.ts`

- `showBanner()` / `hideBanner()` — fail-soft no-op
- Scene-aware: show (Base/Craft/Inventory/Map), hide (Combat/Sortie)
- При `isAdsRemoved()` → всегда скрыт

### 4. IAP — `src/systems/iap.ts`

- `initIap()` / `purchaseProduct(id)` / `getPurchases()` / `getCatalog()` / `consumePurchase(token)`
- `checkUnprocessedPurchases()` — boot check: disable_ads → setAdsRemoved, consumable → reward → consume. Moderation §1.13.1 compliance.
- `registerConsumable(productId, handler)` — паттерн для consumable rewards
- Client-side `signed: false`

### 5. Инфраструктура

- `PlayerState.gas` (default 5), cloud save persist
- `main.ts`: `initPlatform()` → `initIap()` → `checkUnprocessedPurchases()`

### Что НЕ сделано
- T4 gas refill: counter и cloud save готовы, но нет depletion mechanics (sortie cost) — anti-scope. Кнопка не показывается (газ всегда max).
- Gas display в UI

### Тесты (20 новых)
- ads.test.ts: 10 tests (rewarded 5 + interstitial 4 + availability 1)
- iap.test.ts: 10 tests (init 3, purchase 3, unprocessed 2, catalog 2)

### PR
- Branch: `m8b/monetization` → `m8b-integration`
- Self-merge запрещён

---

## Что сделано (M8a)

Ветка `m8a/eng-platform` от `m8a-integration`. PR: `m8a/eng-platform → m8a-integration`.

Все 4 проверки зелёные:
- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm run test` ✅ (**193/193**, 176 baseline M7 + 17 M8a)
- `npm run build` ✅ (JS 1,531.46 kB ≈1.49 MB, ≤2 MB)

### 1. Yandex SDK platform wrapper

- `src/systems/platform.ts` — `initPlatform()` singleton, fail-soft на 4 failure modes (YaGames undefined, init reject, getPlayer reject). `console.warn` только, никаких `throw`/`console.error`.
- `index.html` — добавлен `<script src="https://yandex.ru/games/sdk/v2">` перед bundle.
- `src/main.ts` — вызов `void initPlatform()` сразу при старте.
- `BootScene` — `LoadingAPI?.ready()` после загрузки контента, перед переходом в BaseScene.

### 2. Cloud save

- `src/systems/cloudSave.ts` — `serializeGameState()` / `deserializeSnapshot()`, `saveToCloud()` (throttled 10s), `saveToCloudImmediate()` (bypass throttle), `loadFromCloud()`, `resolveConflict()` (remote newer wins).
- Snapshot covers all GDD §13a.2 fields: level, xp, perks, inventory, baseStash, radio_trust, resolvedSignals, settings, saved_at.
- **Fail-soft:** если platform unavailable → save/load no-op, локальная сессия идентична M7.
- **7 critical triggers:**
  - post-sortie return: `CombatScene.endSortie()` + `ReturnScene.completeReturn()`
  - post-craft: `CraftScene` craft onClick
  - post-level-up perk commit: `LevelUpScene.selectPerk()`
  - settings change: `BaseScene` mute/volume handlers
  - `visibilitychange='hidden'` / `beforeunload` — bypass throttle, immediate save

### 3. Locale RU lock

- `src/systems/locale.ts` — `t(key)` returning RU from single registry. Only for new M8a strings (e.g. "Ошибка сохранения"). Mass-migration → BACKLOG.

### 4. Mobile-first viewport

- `index.html` — viewport meta: `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover`.
- CSS `#game` safe-area-inset-*.
- `src/utils/audioUnlock.ts` — one-shot listener на pointerdown/touchstart resume AudioContext.
- `src/main.ts` — `touchstart preventDefault` на canvas (iOS double-tap suppression).
- Portrait orientation via `screen.orientation?.lock("portrait")` in future.

### 5. Settings persistence

- M7 settings (mute/volume) persisted via cloud save snapshot field `settings`.
- BootScene: load cloud snapshot → apply settings if available; defaults `mute=false, volume=1.0`.
- Settings change in BaseScene → throttled `saveToCloud()`.

### Тесты (vitest) +17

| Файл | Кол-во | Δ | Покрытие |
|---|---|---|---|
| `platform.test.ts` | 4 | +4 | fail-soft 4 modes (YaGames undef, init reject, success+player, success-no-player) |
| `cloudSave.test.ts` | 8 | +8 | serialize round-trip all fields, conflict policy (4 cases), throttle, no-op |
| `locale.test.ts` | 2 | +2 | t() returns RU for registered key, fallback for unknown |
| `audioUnlock.test.ts` | 3 | +3 | first gesture resumes, idempotent second gesture, running ctx noop |

Итог: **193 vitest passed** (176 baseline M7 + 17 M8a). 0 failed. M7 regression PASS.

## Recovery note

Если PR конфликтует с `m8a-integration`:
- Конфликты только если параллельные PR меняли `index.html`, `main.ts`, или scene-файлы.
- `src/systems/{platform,cloudSave,locale}.ts` и `src/utils/audioUnlock.ts` — новые файлы, конфликтов нет.
- Тесты — новые файлы, конфликтов нет.
- Проще всего: взять наши scene-hooks (1-2 строки на файл) и накатить поверх их изменений.

## Anti-scope

- `grep -rn 'setAds\|getPayments\|getLeaderboards\|getAchievements' src/` → CLEAN.
- No `content/*.json`, `assets/*`, `docs/*` changes.
- No new mobs/bosses/zones/items/recipes/perks/radio/SFX/tweens/mechanics/music/voice/UI redesign.
- No third-party npm deps (package.json untouched).

## PR

- `m8a/eng-platform → m8a-integration` — Draft PR, ready for PM review.
