# Kickoff: Engineer — Веха M6

Ты — **Engineer** на вехе M6 проекта «Оплот».

Репо: https://github.com/alexbayov/oplot  
Твой брифинг: `staff/handoff/M6-ENG.md`

## Когда стартуешь

После того как PM merge'нул GD M6 amendment PR в `m6-integration` И QA Spec M6 verdict = APPROVE. Параллельно с Content M6 и Artist M6.

## Действуй так:

1. Клонируй репо, переключись на `m6-integration` (`git checkout m6-integration && git pull`).
2. Прочитай:
   - `staff/CONTEXT.md`
   - `staff/LINKS.md`
   - `staff/status/M6.md`
   - `staff/handoff/M6-ENG.md` (твой брифинг)
   - `staff/handoff/M5-SUMMARY.md`
   - `docs/GDD.md` §10.M6 + schema
   - `docs/balance.md` §M6
   - `content/radio.json`
3. Прогони baseline на `m6-integration`:
   ```
   npm install
   npm run typecheck
   npm run lint
   npm run test    # ожидаемо 152 / 152 (M5 baseline)
   npm run build
   ```
4. Напиши **короткий план** (5-7 пунктов):
   - Types/state: extend `RadioSignal`, `RadioSignalOption`, `GameProgress.radio_trust`, optional ambush state if needed.
   - Phaser-free `src/systems/radio.ts`: `resolveRadioChoice`, trust clamp, reward add-to-stash, ambush descriptor, expiry remains sortie-based.
   - `RadioScene`: show trust value, signal type/zone/deadline, apply consequence once, outcome summary, no duplicate rewards.
   - Ambush integration uses existing mobs/combat path; no new combat mechanics.
   - Tests: exact 12 new vitest (152 → 164), covering schema/outcome/trust/reward/ambush/expiry.
5. Отправь Alex'у блокирующим: «План готов, жду апрува PM».
6. После апрува — `git checkout -b m6/radio`, first scaffold commit + push + **Draft PR `m6/radio → m6-integration`**.
7. Итерируй подшагами, push после каждого. Gameplay logic in Phaser-free `src/systems/*` / `src/state/*`; scenes only render/call systems.
8. Self-check: `npm run typecheck && npm run lint && npm run test && npm run build` зелёные. Vitest count **164**.
9. Обнови `staff/status/ENGINEER.md` под M6.
10. Сообщи Alex'у: «Engineer M6 PR Ready, <ссылка>, vitest <X>, build <Y> KB».

## Можно параллельно с

Content M6, Artist M6 (после QA Spec M6 APPROVE).

## Нельзя до

QA Spec M6 verdict = APPROVE.

## Запрещено

- Self-merge.
- Push в `main` / `m6-integration` напрямую.
- Изменять `content/*.json` (Content owner) или `assets/*` (Artist owner) или `docs/*` (GD owner) или чужие `staff/`.
- Включение фич вне M6 scope: Yandex SDK/Cloud Saves/Leaderboards/IAP, новые zones/mobs/bosses/T4, module weapons, skill tree, faction-specific reputation, real-time timers, voice/audio.
- Новые combat mechanics for ambush — use existing CombatScene/mobs.
- PAT в URL / echo / print.
- План > 7 пунктов.
- Ломать M2 Forest MVP / M3 multi-zone + RadioScene / M4 Progression + LevelUp / M5 boss daily gas T3.
- **Cross-spec расхождение** (например, `content/radio.json` reward count vs `balance.md` §M6) → эскалация в PM, не резолвить.
- **DoD-precision:** 164 vitest, not «≥164».

База для твоего PR: `m6-integration` (НЕ `main`).

## Архитектурное правило (важно)

- Gameplay formulas / radio outcome transitions — **в Phaser-free `src/systems/*` и `src/state/*`**.
- Phaser scenes render state and call system functions only.
