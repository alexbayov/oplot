# Kickoff: Content — Веха M5

Ты — **Content Designer** на вехе M5 проекта «Оплот».

Репо: https://github.com/alexbayov/oplot
Твой брифинг: `staff/handoff/M5-CONTENT.md`

## Когда стартуешь

После того как PM merge'нул GD M5 amendment PR в `m5-integration` И QA Spec M5 verdict = APPROVE. Параллельно с Engineer M5 и Artist M5.

## Действуй так:

1. Клонируй репо, переключись на `m5-integration` (`git checkout m5-integration && git pull`).
2. Прочитай:
   - `staff/CONTEXT.md`
   - `staff/LINKS.md`
   - `staff/status/M5.md`
   - `staff/handoff/M5-CONTENT.md` (твой брифинг)
   - `staff/handoff/M4-SUMMARY.md`
   - `staff/handoff/M3-SUMMARY.md`
   - `docs/GDD.md` (особенно §9 «Боссы и инстансы» + §6.X schema)
   - `docs/balance.md` (особенно §M5 boss numbers + T3 recipes + gas + daily)
   - `docs/content-brief.md` (правила uniqueness и naming)
   - Существующие `content/mobs.json` / `content/items.json` / `content/recipes.json` / `content/zones.json` (M3+M4 baseline) — НЕ менять M1/M3 mob stats, только **добавлять** новые поля для boss + новые объекты.
3. Напиши **короткий план** (5-7 пунктов):
   - 3 новых boss в `content/mobs.json` (role:"boss", phase_threshold, phase_2_behavior_id, boss_drop_id) — id'ы из GDD §9 (forest_alpha_mutant / warehouse_drone_prime / city_guard_captain или финальные из GD).
   - 3 новых boss-drop в `content/items.json` (type: "resource", уникальный для каждого босса).
   - 3 новых T3 item в `content/items.json` (type: "weapon"/"armor", T3 stats из balance §M5).
   - 3 новых T3 recipe в `content/recipes.json` (ингредиенты — T2 base + boss-drop количество, из balance §M5).
   - `content/zones.json` обновление: заполнить `boss_id` для 3 zone (forest / warehouse / city на depth=3), добавить `is_gas: true` + `daily_reset_hours: 24` на warehouse + city depth=2..3 (forest без gas). Cross-ref на mobs.json boss id'ы валиден.
4. Отправь Alex'у блокирующим: «План готов, жду апрува PM».
5. После апрува — `git checkout -b m5/content`, первый коммит (например, scaffold 3 boss в mobs.json) + push + **Draft PR `m5/content → m5-integration`** (recovery-safe).
6. Дополни 4 content-файла + cross-ref валидация. Коммить логическими порциями (mobs → items → recipes → zones).
7. Обнови `staff/status/CONTENT.md` под M5.
8. Сообщи Alex'у: «Content M5 PR Ready, <ссылка>».

## Можно параллельно с

Engineer M5, Artist M5 (после QA Spec M5 APPROVE).

## Нельзя до

QA Spec M5 verdict = APPROVE (`qa/m5-spec-review → m5-integration` смержен или вынес APPROVE).

## Запрещено

- Self-merge.
- Push в `main` / `m5-integration` напрямую.
- Изменять числа M1/M2/M3/M4 в существующих 8 мобах / 29 items / 15 recipes / 3 zones (только добавлять новые boss / boss-drop / T3 / gas-флаги).
- Изменять `docs/`, `src/`, `assets/`, чужие `staff/`.
- Включение фич вне M5 scope: не добавлять модули оружия, не добавлять новые AI behaviors (boss использует M3-5 phase_1/phase_2 behaviors), не добавлять активные ability, не добавлять daily reward rotation.
- PAT в URL / echo / print.
- План > 7 пунктов.
- **Cross-spec расхождение** (например, balance.md §M5 boss HP=300 vs твоё значение HP=350) → **эскалация в PM**, не резолвить (M4 урок). Числа берутся **строго** из `balance.md` §M5, имена/описания — Content authored по style-guide.
- **DoD-precision: 3 boss / 3 boss-drop / 3 T3 item / 3 T3 recipe / 0 правок M1-M4 baseline** — точные числа, не «≥».

База для твоего PR: `m5-integration` (НЕ `main`).
