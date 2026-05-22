# Kickoff: Engineer — Веха M4

Ты — **Engineer** на вехе M4 проекта «Оплот».

Репо: https://github.com/alexbayov/oplot
Твой брифинг: `staff/handoff/M4-ENG.md`

## Действуй так:

1. Клонируй репо и переключись на интеграционную ветку M4:
   ```
   git clone https://github.com/alexbayov/oplot.git
   cd oplot
   git checkout m4-integration
   ```
2. Прочитай в порядке:
   - `staff/CONTEXT.md`
   - `staff/LINKS.md`
   - `staff/status/M4.md`
   - `staff/handoff/M4-ENG.md` (твой подробный брифинг)
   - `staff/handoff/M3-SUMMARY.md` (что унаследовано)
   - `docs/GDD.md` §Прогрессия + §6.X Perk schema (M4 amendment)
   - `docs/balance.md` §M4 (XP-curve + 8 perk numbers)
3. Прогони `npm install && npm run typecheck && npm run lint && npm run test && npm run build` — baseline 89 тестов (49 M2 + 40 M3).
4. Напиши план (**строго 5-7 пунктов**, не больше) → отправь Alex'у блокирующим: «План готов, жду апрува PM».
5. После апрува — `git checkout -b m4/progression`, сделай первый commit и **сразу push + Draft PR** `m4/progression → m4-integration` (recovery-safe, lesson M2+M3).
6. Реализуй по плану:
   - `src/systems/xp.ts` — `awardXP(state, amount)`, `getNextLevelThreshold(level)`, `checkLevelUp(state) → boolean`. XP-curve берёшь из `balance.md` §M4. Unit-tests ≥ 10.
   - `src/systems/perks.ts` — `applyPerk(state, perkId)`, `getModifier(state, stat) → number`. Модификаторы применяются в combat.ts / weight.ts / craft.ts / loot.ts через `getModifier`. Unit-tests ≥ 10.
   - `src/scenes/ProgressionScene.ts` — UI list текущих перков + XP-bar + next-level threshold.
   - `src/scenes/LevelUpScene.ts` — popup с 3 рандомными perk-cards + choice. Открывается из любой сцены через `scene.launch("LevelUpScene")` когда `checkLevelUp` true.
   - Интеграция: `combat.ts` (`getModifier("damage")`, `getModifier("crit_chance")`, `getModifier("armor_efficiency")`), `weight.ts` (`getModifier("weight_penalty_multiplier")`), `craft.ts` (`getModifier("crafting_speed_multiplier")`), `loot.ts` (`getModifier("loot_quantity_multiplier")`), мобы выдают XP через `applyAttack` → `awardXP` при kill.
   - **3 M3 NB follow-ups (фиксируй в этом же PR):** RadioScene `rowHeight 96→120`, BootScene preload M3 ассетов (mob sprites + item icons + zone backgrounds + radio_icon — все в `BootScene.preload`), `MobRole = "regular" | "boss"` enum формализация в `src/types/mob.ts` (existing string literal placeholder в `zoneUnlock.ts` мигрировать на enum).
7. Прогони все `npm` команды + runtime smoke:
   - **M2 7-step Forest regression** работает (knife + makeshift_pistol, loot, return, craft).
   - **M3 multi-zone** — Forest + Warehouse (после crafting `pipe_rifle`) + City (locked до M5 boss) — работает.
   - **M4 progression** — после kill моба XP награждается, при достижении threshold открывается LevelUpScene с 3 случайными перками, выбор применяется (например, после `+damage` перка следующий бой даёт больший урон).
   - **ProgressionScene** показывает текущий уровень + XP-bar + список взятых перков.
8. Обнови `staff/status/ENGINEER.md` под M4.
9. Переведи PR в Ready, сообщи Alex'у: «Engineer M4 PR <ссылка>, готов к ревью PM».

## Можно параллельно с

Content (`m4/content`), Artist (`m4/art`). Cross-refs:
- Perk `id` enum'ы — синхронизируешь с Content через PR comment (Content пишет JSON, ты импортишь).
- Perk icon имена — синхронизируешь с Artist (Artist пишет `assets/sprites/perks/perk_<id>.png`, ты загружаешь в `BootScene.preload`).

## Нельзя до

GD M4 PR merged в `m4-integration` + QA Spec M4 APPROVE.

## Запрещено

- Self-merge. Push в `main` / `m4-integration` напрямую.
- PAT-токен в URL / echo / print.
- Любые правки `content/*.json`, `assets/*`, `docs/*`, чужие `staff/status/*.md`.
- **M5+ фичи:** skill tree (поинты + ноды + prereq'и) — anti-scope M4. Только flat 8 пассивных перков из JSON. Активные ability / cooldowns — anti-scope M4 (M5+).
- Боссы (M5), полная радио-логика (M6), модули оружия, Yandex SDK (M8), сторонние UI-библиотеки, анимации, звуки.
- План > 7 пунктов (разбивай на continuation).

База для твоего PR: `m4-integration` (НЕ `main`).
