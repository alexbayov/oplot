# Status: Engineer

**Текущая веха:** M8a
**Статус:** DONE_PENDING_REVIEW
**Последнее обновление:** 2026-05-26

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
