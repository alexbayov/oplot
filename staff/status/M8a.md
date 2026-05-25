# Status Dashboard: M8a — Платформа и персистентность

**Статус:** PM_KICKOFF 2026-05-25 (PM kickoff PR `pm/m8a-kickoff → main`).

## Контекст

M7 закрыта (gate-close PR #65 `m7-integration → main`, `main` HEAD `2399b7b`). Заказчик одобрил **split M8 → M8a + M8b**:

- **M8a (этот dashboard) — Platform & Persistence:** Yandex Games SDK init lifecycle, cloud save, mobile-first viewport polish, locale RU lock, перенос M7 settings в cloud-save schema. **Без монетизации** (нет дизайн-гейта).
- **M8b (отдельный future dashboard) — Monetization:** ads (rewarded + interstitial), IAP (catalog + purchase + restore). Требует §13b GD-amendment с монетизационной моделью (Заказчик определяет каталог SKU + ads policy ПОСЛЕ работающего M8a SDK).

Owners по PLAN §3: **Engineer + QA**. Content / Artist в M8a не участвуют.

## Текущий gate

**M8a_PM_KICKOFF_PR_OPEN → after merge → GD §13a amendment.**

## Scope M8a

### 1. Yandex Games SDK init lifecycle
- `<script src="https://yandex.ru/games/sdk/v2">` в `index.html`.
- `YaGames.init()` → singleton sdk instance в `src/systems/platform.ts`.
- `sdk.features.LoadingAPI?.ready()` после Boot preload.
- **Fail-soft:** если SDK не загрузился (нет сети, adblock, локальный dev), игра запускается без SDK-фич; никаких `throw`.

### 2. Cloud save
- `sdk.getPlayer()` → player object (или fallback "guest" если SDK недоступен).
- `player.setData(snapshot)` / `player.getData(keys)` для save/load.
- **Schema:** сериализуем весь `GameState`: player progress (level/xp/perks), inventory/baseStash, radio_trust + resolved signals, settings (mute/volume из M7), `saved_at: ISO8601`.
- **Conflict policy:** "remote newer wins by `saved_at`". При старте: load remote, compare к local in-memory; если remote `saved_at > local saved_at` → load remote, иначе keep local.
- **Throttle:** не чаще чем раз в `MIN_CLOUD_SAVE_INTERVAL_S` секунд (избегаем Yandex quota).
- **Critical save triggers:** post-sortie return, post-craft, post-level-up, settings change.
- **Fail-soft:** локальная in-memory сессия работает идентично если SDK недоступен.

### 3. Mobile-first polish
- `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">`.
- `safe-area-inset-{top,bottom,left,right}` через CSS `env()` для notch-устройств.
- **iOS audio autoplay unlock:** первый user gesture создаёт/resume `AudioContext` (Chrome/Safari iOS требует gesture).
- Portrait orientation lock через Yandex SDK или manifest.
- `touchstart preventDefault` на canvas для подавления iOS double-tap zoom.

### 4. Locale RU lock + i18n stub
- `<html lang="ru">` уже есть.
- `src/systems/locale.ts`: `t(key)` функция возвращает RU string из единого reg.
- На M8a: только RU (никаких переводов); готовим хук на пост-релизный EN.

### 5. Settings persistence
- M7 `Settings` (mute/volume) переезжают в cloud-save schema.
- Изменение в SettingsScene триггерит throttled cloudSave.

## Anti-scope M8a (явный)

- **NO ads / rewarded / interstitial** — отложено в M8b.
- **NO IAP / catalog / purchase / restore** — отложено в M8b.
- **NO leaderboards / achievements** — пост-релиз (BACKLOG Приоритет 2).
- **NO backend / telemetry / analytics**.
- **NO новых languages** — только RU.
- **NO новых mobs / bosses / zones / items / recipes / perks / radio signals / SFX / tweens** — контент заморожен на M7.
- **NO новых combat / craft / radio / progression механик** — gameplay заморожен на M7.
- **NO music / voice / ambience** — аудио заморожено на 10 SFX M7.
- **NO UI redesign** — только viewport polish поверх существующих сцен.
- **NO third-party libs** кроме `YaGames` SDK (внешний script tag, не npm-зависимость).

## Baseline from M7

9 zones, 80 items, 42 recipes, 11 mobs, 3 boss, 8 perks, 6 radio signals, 10 SFX, 16 tweens, **176/176 vitest PASS**, JS 1.49 MB / 2 MB, project assets 524 KB / 730 KB.

## Deliverables / branches

| Owner | Branch | Deliverable |
|---|---|---|
| PM | `pm/m8a-kickoff` | dashboard + 4 kickoff + 4 handoff + PLAN/CONTEXT/DECISIONS/CHANGELOG updates + M7-SUMMARY |
| GD | `m8a/gd-amendment` | GDD §13a (Platform/Persistence/Mobile) + balance §M8a (если нужны числа throttle/quota) |
| QA Spec | `qa/m8a-spec-review` | verdict APPROVE/CHANGES_REQUESTED на GD §13a |
| Engineer | `m8a/platform` | `src/systems/{platform,cloudSave,locale}.ts`, `src/utils/audioUnlock.ts`, `index.html` SDK + viewport, BootScene/SettingsScene integration, ~14 новых vitest |
| QA Acceptance | `qa/m8a-acceptance` | local octopus-merge (single role-PR) + 3-Gate acceptance |

## DoD

- `docs/GDD.md` §13a добавлена с полной spec'ой по 5 блокам выше.
- `docs/balance.md` §M8a (optional — только если нужны throttle/quota numbers).
- Engineer: SDK init lifecycle, cloud save round-trip, mobile-first polish, locale stub, settings persistence — все 5 блоков работают.
- Vitest target: **~190/190 PASS** (176 M7 + ~14 M8a; точное число фиксируется QA Spec'ом).
- `npm run typecheck` / `lint` / `build` clean.
- JS bundle ≤ 2 MB (M7 baseline 1.49 MB + ~50 KB SDK wrapper).
- Yandex SDK script tag загружается; в чистом браузере (без сети) fail-soft (игра запускается, нет console.error).
- Cloud save: save → reload page → resume from cloud snapshot. Conflict-policy "remote newer wins" подтверждён тестами.
- Mobile viewport: portrait, safe-area visible в Chrome mobile-emulator (iPhone 14 + Pixel 7).
- Audio: первый user gesture resume AudioContext; SFX работают на iOS Safari.
- Anti-scope grep clean: no `setAds`, no `getPayments`, no `getLeaderboards`, no `getAchievements`.

## Sequence

1. PM kickoff PR `pm/m8a-kickoff → main` (этот) — Alex review + merge.
2. Alex создаёт `m8a-integration` от свежего main.
3. GD M8a amendment session → PR `m8a/gd-amendment → m8a-integration`.
4. QA Spec M8a session → PR `qa/m8a-spec-review → m8a-integration` (verdict).
5. (Optional GD fix + QA re-review).
6. Engineer M8a session → PR `m8a/platform → m8a-integration`.
7. QA Acceptance M8a session → local octopus-merge (single PR) + 3 Gates → PR `qa/m8a-acceptance-test → m8a-integration` (verdict).
8. PM merge sequence: Engineer → QA Acceptance.
9. PM finalize PR (`pm/m8a-finalize`) + gate-close PR `m8a-integration → main`.

## Recovery hooks

Open Draft PR early; commit/push после каждого логического под-шага; PR Recovery block (как M5/M6/M7). Если git proxy returns 403, использовать safe `GIT_ASKPASS`/PAT env only. Никогда не печатать токен и не ставить в URL.

## Forward: M8b (отложен)

После закрытия M8a и решения Заказчика по монетизационной модели:
- GD §13b amendment: ads policy (rewarded для ×2 лут / second-chance / daily-reset; interstitial где), IAP catalog (что продаём; ads-remover / cosmetics / time-skip / soft-currency).
- Engineer M8b: `src/systems/ads.ts`, `src/systems/iap.ts`, `content/iap_catalog.json`.
- Yandex partner console SKU + ad-units (Alex side, вне Devin-сессии).
- QA Spec / Acceptance M8b по тому же паттерну.
