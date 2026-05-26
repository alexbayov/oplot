# Handoff — Game Designer M8b

GD пишет спецификацию монетизации (§13b GDD + §M8b balance). Только spec, без кода/контента/ассетов.

## Preconditions

- M8a closed, `m8b-integration` created from `main`.
- `staff/status/M8b.md` read.
- Yandex SDK monetization API docs прочитаны (ads + IAP + banner).

## Deliverables

1. **`docs/GDD.md` §13b** — 5 подсекций + anti-scope:
   - **§13b.1 Rewarded Video.** API: `ysdk.adv.showRewardedVideo({callbacks: {onOpen, onRewarded, onClose(wasShown), onError}})`. 4 триггера:
     1. **×2 looting after sortie** — ReturnScene, кнопка рядом с "Return to Base". Reward: удвоить все ресурсы из sortie loot (инвентарь → +копия каждого resource item). Fail-soft: если ad не загрузился → обычный возврат без удвоения.
     2. **Second chance in combat** — CombatScene, on death (player HP ≤ 0). Reward: восстановить 50% max HP, продолжить бой с того же раунда. Fail-soft: без ad → обычная смерть (return to map, lose loot).
     3. **Daily reset skip** — MapScene/SortieScene, если daily_instance на кулдауне. Reward: сброс daily-таймера мгновенно (можно зайти в daily). Fail-soft: ждать таймер.
     4. **Gas refill +1** — MapScene, если gas < GAS_MAX. Reward: +1 gas. Fail-soft: ждать пассивной регенерации.
   - **§13b.2 Interstitial.** API: `ysdk.adv.showFullscreenAdv({callbacks: {onOpen, onClose(wasShown), onError}})`. 1 размещение: **post-sortie → BaseScene** (последовательно: ReturnScene result показан → пользователь жмёт "Return" → interstitial показывается → переход в BaseScene). Частота контролируется Yandex. Не показывать если `disable_ads` active.
   - **§13b.3 Sticky Banner.** API: `showBannerAdv()` / `hideBannerAdv()` / `getBannerAdvStatus()`. Видимость: показывать в BaseScene/CraftScene/InventoryScene/MapScene (non-combat), скрывать в CombatScene/SortieScene/LootScene/RegionScene (gameplay). Позиция bottom (portrait/landscape) — настраивается в консоли.
   - **§13b.4 In-App Purchases.** API: `ysdk.getPayments()` → `payments.purchase({id})`, `payments.getPurchases()`, `payments.getCatalog()`, `payments.consumePurchase(token)`. Client-side `signed: false`. IAP catalog:
     | ID | Name | Type | Price (YAN) | Reward |
     |---|---|---|---|---|
     | `disable_ads` | Отключить рекламу | non-consumable | ~99 YAN | Все rewarded → instant (без просмотра), interstitial/banner отключены |
     | `starter_pack` | Стартовый набор | consumable | ~49 YAN | +5 bandage, +3 scrap, +2 electronics → baseStash |
     | `gas_pack` | Бак топлива | consumable | ~29 YAN | +3 gas (сверх капа) |
     **Mandatory unprocessed-check** (модерация §1.13.1): на boot вызывать `payments.getPurchases()`, для каждого consumable: выдать reward → `consumePurchase(token)`. Consume ПОСЛЕ выдачи.
   - **§13b.5 Ads-Remover Logic.** Если `disable_ads` куплен (проверка через `getPurchases()` на boot + в рантайме):
     - Rewarded-кнопки → нажатие мгновенно даёт reward (без `showRewardedVideo`)
     - Interstitial → не показывается
     - Banner → скрыт, не показывается ни в каких сценах
     - Текст на кнопке меняется: "Смотреть рекламу → ×2" → "×2 (без рекламы)"
   - **§13b.0 Anti-scope.** NO leaderboards/achievements, NO server-side IAP, NO telemetry, NO new content/mechanics, NO music/voice.

2. **`docs/balance.md` §M8b** — таблица:

| Parameter | Value | Notes |
|---|---|---|
| `REWARDED_LOOT_MULTIPLIER` | 2.0 | ×2 all looting resources |
| `SECOND_CHANCE_HP_FRACTION` | 0.5 | 50% max HP |
| `SECOND_CHANCE_MAX_PER_SORTIE` | 1 | Один per вылазка |
| `DAILY_RESET_REWARDED_COOLDOWN` | 1 | Один per 24h (если кулдаун > 0) |
| `GAS_REWARDED_AMOUNT` | 1 | +1 gas |
| `GAS_REWARDED_COOLDOWN_S` | 300 | 5 min между rewarded gas refills |
| `IAP_ADS_REMOVER_PRICE_YAN` | 99 | ~99 YAN |
| `IAP_STARTER_PACK_PRICE_YAN` | 49 | ~49 YAN |
| `IAP_GAS_PACK_PRICE_YAN` | 29 | ~29 YAN |
| `IAP_STARTER_PACK_BANDAGE` | 5 | |
| `IAP_STARTER_PACK_SCRAP` | 3 | |
| `IAP_STARTER_PACK_ELECTRONICS` | 2 | |
| `IAP_GAS_PACK_AMOUNT` | 3 | |

## Forbidden

No `src/`, `content/`, `assets/`, other staff files (только `staff/status/GAME_DESIGNER.md`). No код/контент/ассеты. No self-merge. No PAT в URL/echo/print.

## Acceptance

PR `m8b/gd-amendment → m8b-integration`. Только `docs/GDD.md`, `docs/balance.md`, `staff/status/GAME_DESIGNER.md`.
