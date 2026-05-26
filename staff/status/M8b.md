# Status Dashboard: M8b — Монетизация

**Статус:** PM_KICKOFF 2026-05-25 (PM kickoff PR `pm/m8b-kickoff → main`).

## Контекст

M8a закрыта (gate-close PR #71 `m8a-integration → main`, `main` HEAD `c88f395`). M8 был разделён по согласию Заказчика:

- **M8a (DONE) — Platform & Persistence:** Yandex SDK lifecycle, cloud save, mobile viewport, locale, settings.
- **M8b (этот dashboard) — Monetization:** реклама (rewarded + interstitial), IAP, sticky banner. Требует GD §13b amendment.

M8a baseline: 193/193 vitest, JS 1.49 MB, platform.ts/cloudSave.ts/locale.ts/audioUnlock.ts готовы. SDK `ysdk` singleton доступен через `initPlatform()`.

Owners по PLAN §3: **Engineer + QA** (+ GD для §13b). Content / Artist в M8b не участвуют.

## Scope M8b

### 1. Rewarded видео-реклама

- `ysdk.adv.showRewardedVideo()` — 4 коллбэка (onOpen, onRewarded, onClose(wasShown), onError).
- 4 rewarded-триггера в игре:
  1. **×2 looting after sortie** — награда удваивается (ресурсы ×2) после успешной вылазки
  2. **Second chance in combat** — после смёрти предложить продолжить бой с 50% HP
  3. **Daily reset skip** — watch ad = сброс дейли-таймера без ожидания
  4. **Gas refill +1** — получить +1 gas сверх капа
- Fail-soft: если SDK/ad недоступен — кнопка не показывается (M7 fallback)
- No `setInterval` auto-calls — только по explicit user action

### 2. Interstitial полноэкранная реклама

- `ysdk.adv.showFullscreenAdv()` — 3 коллбэка (onOpen, onClose(wasShown), onError)
- 1 размещение: **post-sortie return to BaseScene** (естественная пауза после вылазки)
- Частота: Yandex контролирует frequency cap автоматически
- Request → show → proceed независимо от wasShown
- No interstitial during combat/crafting/looting

### 3. Sticky banner

- `ysdk.adv.getBannerAdvStatus()` / `showBannerAdv()` / `hideBannerAdv()`
- Позиция: **bottom (portrait) / bottom (landscape)** — настраивается в консоли
- Видимость: показывается в BaseScene, скрывается в CombatScene/SortieScene (не перекрывает UI)
- API-based display toggle через консоль

### 4. In-app purchases (IAP)

- `ysdk.getPayments()` → `payments.purchase({ id })` / `payments.getPurchases()` / `payments.getCatalog()` / `payments.consumePurchase(token)`
- Client-side processing (`signed: false`) — MVP, без server-side верификации
- Запуск check-unprocessed-purchases при каждом boot (требование модерации §1.13.1)
- IAP-каталог (создаётся в Developer Console; GD/Engineer используют фиктивные ID для кода):
  | ID | Название | Тип | Описание |
  |---|---|---|---|
  | `disable_ads` | Отключить рекламу | non-consumable | Убирает rewarded/interstitial/banner |
  | `starter_pack` | Стартовый набор | consumable | ×5 bandage + ×3 scrap + ×2 electronics |
  | `gas_pack` | Бак топлива | consumable | ×3 gas (сверх капа) |
- `payments.getPurchases()` — проверка `disable_ads` на boot (non-consumable)
- `payments.consumePurchase(token)` — для consumable после выдачи
- `payments.getCatalog()` — динамические цены/валюты из консоли

### 5. Ads-remover логика

- Если `disable_ads` куплен:
  - Rewarded-кнопки не показываются (вместо rewarded используется instant-reward без просмотра)
  - Interstitial не показывается
  - Sticky banner скрыт
- Проверка на boot через `payments.getPurchases()`

## Anti-scope M8b (явный)

- **NO leaderboards / achievements** — пост-релиз BACKLOG
- **NO server-side IAP verification** (`signed: true`) — MVP client-side only
- **NO backend / telemetry / analytics**
- **NO новых languages** — только RU
- **NO новых mobs / bosses / zones / items / recipes / perks / radio signals / SFX / tweens** — контент заморожен на M7
- **NO новых combat / craft / radio / progression механик** — gameplay заморожен на M7
- **NO music / voice / ambience**
- **NO UI redesign** — только монетизационные кнопки поверх существующих сцен
- **NO third-party libs** кроме YaGames SDK
- **NO interstitials во время gameplay** (combat/craft/loot) — §4.4 compliance

## Baseline from M8a

193/193 vitest, JS 1.49 MB, platform.ts (ysdk singleton), cloudSave.ts (7 triggers), locale.ts (t()), audioUnlock.ts, mobile-first viewport. SDK init + fail-soft работают.

## Deliverables / branches

| Owner | Branch | Deliverable |
|---|---|---|
| PM | `pm/m8b-kickoff` | dashboard + 4 kickoff + 4 handoff + PLAN/CONTEXT/DECISIONS/CHANGELOG updates |
| GD | `m8b/gd-amendment` | GDD §13b (ads/IAP/banner/ads-remover) + balance.md §M8b + IAP catalog spec |
| QA Spec | `qa/m8b-spec-review` | verdict APPROVE/CHANGES_REQUESTED на GD §13b |
| Engineer | `m8b/monetization` | ads.ts (rewarded + interstitial), iap.ts, banner.ts, 4 rewarded-триггера, 1 interstitial placement, ~16 новых vitest |
| QA Acceptance | `qa/m8b-acceptance-test` | local merge dry-run + 3-Gate acceptance |

## DoD

- `docs/GDD.md` §13b добавлена (ads API, IAP API, banner, ads-remover, 4 rewarded triggers, IAP catalog)
- `docs/balance.md` §M8b (если нужны числа: rewarded rewards, interstitial cooldown override, IAP prices в YAN)
- Engineer: `src/systems/ads.ts`, `src/systems/iap.ts`, `src/systems/banner.ts`, 4 rewarded hooks в сценах, 1 interstitial в ReturnScene, ads-remover логика
- Vitest target: **~210/210 PASS** (193 M8a + ~17 M8b)
- `npm run typecheck` / `lint` / `build` clean
- JS bundle ≤ 2 MB
- IAP check-unprocessed-purchases на boot (модерация §1.13.1)
- Anti-scope grep clean: no leaderboards/achievements/telemetry

## Sequence

1. PM kickoff PR → merge → создать `m8b-integration`
2. GD §13b amendment → PR m8b/gd-amendment → m8b-integration
3. QA Spec review → PR qa/m8b-spec-review
4. Engineer M8b → PR m8b/monetization → m8b-integration
5. QA Acceptance → local merge dry-run + 3 Gates → PR qa/m8b-acceptance-test
6. PM merge sequence: Engineer → QA Acceptance
7. Gate-close m8b-integration → main

## M8b research notes (Yandex SDK API summary)

| API | Method | Key detail |
|---|---|---|
| Interstitial | `ysdk.adv.showFullscreenAdv({callbacks})` | onOpen/onClose(wasShown)/onError; frequency controlled by Yandex |
| Rewarded | `ysdk.adv.showRewardedVideo({callbacks})` | +onRewarded callback; no frequency limit; reward in onRewarded |
| Banner | `ysdk.adv.showBannerAdv()` / `hideBannerAdv()` | API toggle must be enabled in console |
| IAP init | `ysdk.getPayments()` | Preload or lazy; client-side `signed: false` for MVP |
| IAP purchase | `payments.purchase({id, developerPayload?})` | Resolves with purchase or rejects (user cancelled) |
| IAP list | `payments.getPurchases()` | Check for non-consumable (disable_ads) |
| IAP catalog | `payments.getCatalog()` | Dynamic prices/currencies from console |
| IAP consume | `payments.consumePurchase(token)` | Required for moderation; marks consumed |
| Unprocessed | `payments.getPurchases()` on boot | Mandatory for moderation §1.13.1 |

## Recovery hooks

Draft PR early; commit/push after each logical sub-step; PR Recovery block. No PAT in URL/echo/print.
