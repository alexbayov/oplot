# Решения проекта «Оплот»

> Формат: дата — решение — кто принял — обоснование

## Принятые решения

### 2026-05-18 — Жанр и сеттинг
- **Решение:** Survival RPG, постапокалипсис, современное оружие, реалистичный стиль.
- **Кто:** Заказчик (dev07)
- **Обоснование:** Ниша на Яндекс.Играх пуста для глубокой крафтовой survival RPG. Без магии и фэнтези — выделяемся.

### 2026-05-18 — Боевая система
- **Решение:** Пошаговый бой (полу-авто), ближний + дальний бой, модульное оружие.
- **Кто:** Заказчик + PM
- **Обоснование:** Реализация проще real-time, сохраняет тактическую глубину, подходит для мобилки.

### 2026-05-18 — Визуальный стиль
- **Решение:** "Military Graphic Novel" — Darkest Dungeon meets Modern Military.
- **Кто:** Заказчик + PM
- **Обоснование:** Реалистичный рисованный стиль, не пиксели, не плоский мульт. AI-генерация портретов + обработка.

### 2026-05-18 — Коммуна отложена
- **Решение:** Система коммуны (NPC-члены) — пост-релиз.
- **Кто:** Заказчик
- **Обоснование:** Неясная реализация на старте, лучше добавить после стабильного кор-лупа.

### 2026-05-18 — Стек
- **Решение:** Phaser 3 + TypeScript + Vite + Yandex Games SDK.
- **Кто:** PM
- **Обоснование:** Проверенный стек для Яндекс Игр, хорошо документирован, < 5 MB.

### 2026-05-18 — Оркестрация через GitHub
- **Решение:** Все процессы, статусы, промты — в репозитории. GitHub = общая память команды.
- **Кто:** Заказчик + PM
- **Обоснование:** Переживает обрывы сессий, всегда актуальный контекст, recovery через status-файлы.

### 2026-05-19 — Integration-ветка на веху; merge в `main` только на gate-close
- **Решение:** Для каждой вехи M{N} создаётся долгоживущая ветка `m{N}-integration` от `main`. Все role PR (Engineer, Content, Artist) и PM/fix PR в рамках активной вехи таргетятся в `m{N}-integration`. PM мержит role PR в `m{N}-integration` сам после QA Acceptance approve. На gate-close PM открывает единственный PR `m{N}-integration → main`, который мержит Alex/Заказчик. `main` хранит только закрытые вехи. Межвеховые PM-process PR (между закрытием M{N} и стартом M{N+1}) могут таргетиться в `main` и мержатся вручную Alex'ом.
- **Кто:** Заказчик + PM
- **Обоснование:** Платформа Devin блокирует автономный PM-merge в `main`/`master` («Devin is subject to the exact same branch protections... Human engineers review PRs before merging»). Integration-ветка даёт PM фактическую автономию в рамках вехи, сохраняет `main` «release-quality», и сокращает вмешательство Alex'а до одного merge на веху. Не обходит платформенные ограничения в обход правил (PAT-header / proxy bypass запрещёны).

### 2026-05-19 — M1 Artist placeholders генерируются программно (Pillow); AI-пайплайн фиксируется для M2+
- **Решение:** На вехе M1 Artist создаёт placeholder-ассеты (hero 128×128, 8 item icons 64×64, forest bg 800×600, ≤300 КБ суммарно) программной генерацией через Pillow в стилистике `docs/style-guide.md` (HEX-палитра, прозрачный фон, contrast outlines). AI-пайплайн (Midjourney / Stable Diffusion / DALL-E) описан в `docs/style-guide.md` как процесс для M2+ — на M1 он не применяется.
- **Кто:** PM (Alex одобрил workflow в целом 2026-05-19)
- **Обоснование:** M1 явно описана в handoff как «минимальные ассеты» с целью unblock Engineer'а в Phaser. Programmatic generation детерминистична, не требует внешних API-ключей или платных сервисов, укладывается в timeframe Devin-сессии, и обеспечивает соблюдение бюджета ≤300 КБ. Финальный арт через AI-пайплайн придёт на M2+ когда визуальное качество станет приоритетом. Style-guide финализируется на M1 в полном виде (палитра + размеры + правила + AI-пайплайн), потому что это PM-документ, который используется всеми будущими Artist-сессиями.

### 2026-05-19 — На M1 формальная QA Acceptance-сессия заменена PM-integration smoke
- **Решение:** На вехе M1 финальный приёмочный gate отрабатывает PM сам: локально объединяет PR #6/#7/#11 в test-ветку `pm/integration-smoke` от `m1-integration`, прогоняет `npm install` / `npm run typecheck` / `npm run lint` / `npm run build`, а также cross-PR JSON consistency-чек (Engineer types ↔ Content JSON ↔ Artist asset names ↔ canonical `content/items.json`). При зелёном smoke PM сам мержит role-PR в `m1-integration` и открывает gate-close PR `m1-integration → main`. Отдельная Devin-сессия QA Acceptance на M1 не запускается. Чек-листы из `staff/handoff/M1-QA-ACCEPT.md` использованы как PM-чек-листы.
- **Кто:** Заказчик («можешь мержить», 2026-05-19) + PM (исполнение).
- **Обоснование:** К моменту запроса 80% чек-листа QA Acceptance уже отрабатывало через PM-review каждого role-PR (counts/refs/balance в Content; types-schema/scene-flow и Alex'овский runtime smoke на Engineer PR #7; дименсии/прозрачность/палитра/бюджет в Artist). Единственный неотработанный сигнал — cross-PR integration. PM выполнил его лично, результат: typecheck/lint/build clean, items=15 mobs=3 recipes=5 zones=1, все JSON-ссылки разрешаются, resource-id ↔ icon name set точное совпадение. Решение применимо только к M1 (минимальный скоуп, низкий риск). Начиная с M2 (играбельный MVP) формальная QA Acceptance возвращается как отдельный gate.

### 2026-05-25 — M8 split: M8a (Platform & Persistence) сейчас, M8b (Monetization) отложен
- **Решение:** PLAN §3 веха M8 разбита на две: **M8a (Platform & Persistence)** включает только Yandex Games SDK init lifecycle + cloud save (`player.setData/getData` с conflict policy «remote newer wins by `saved_at`» + throttle) + mobile-first viewport polish (safe-area + iOS audio autoplay unlock + portrait lock + double-tap suppression) + locale RU lock + `t(key)` stub + перенос M7 settings в cloud-save schema. **M8b (Monetization)** — отдельная веха, охватывает ads (rewarded + interstitial) + IAP (catalog + purchase + restore); запускается после закрытия M8a И после получения от Заказчика ads policy + IAP-каталога + Yandex partner-console SKU. На M8 не делаем leaderboards / achievements (post-release/BACKLOG), не делаем новых languages (RU only; EN — пост-релизный хук через `t()`), не делаем нового контента/механик (gameplay/контент заморожены на M7), не делаем telemetry/analytics/backend.
- **Кто:** Заказчик (ответ на PM-вопросы 2026-05-25: «Вариант Б — следую твоему мнению», «Ничего нет [монетизационной модели], как говорится в этом деле я лопух», «без конкретного апрува — собираем рабочую СДК — и потом уже рекламу настраиваем», «[leaderboards] эм..да пока не надо», «локали пока давай РУ, потом если что разойдёмся дальше») + PM (исполнение split-плана).
- **Обоснование:** На момент закрытия M7 у Заказчика нет монетизационной модели (нет каталога IAP, нет ads policy с раскадровкой rewarded/interstitial placements, нет Yandex partner-console SKU). Запуск M8 как единого блока заблокировал бы Engineer-сессию на дизайн-гейте (нечего реализовывать в `src/systems/ads.ts` / `src/systems/iap.ts` без spec'и). Split позволяет (а) развязать M8a-работу сразу — SDK, cloud save и mobile polish имеют чистый spec без бизнес-решений; (б) дать Заказчику время на проектирование монетизации параллельно с M8a-разработкой; (в) собрать рабочий SDK-каркас, на который потом «достроить» ads/IAP в M8b без переписывания platform.ts. M9 (submit на Yandex) требует только M8a в обязательном минимуме — без монетизации игру опубликовать можно; M8b — приоритет, но не блокер сабмита.
