# Kickoff: Artist — Веха M6

Ты — **Artist** на вехе M6 проекта «Оплот».

Репо: https://github.com/alexbayov/oplot
Твой брифинг: `staff/handoff/M6-ARTIST.md`

## Когда стартуешь

После того как PM merge'нул GD M6 amendment PR в `m6-integration` И QA Spec M6 verdict = APPROVE. Параллельно с Content M6 и Engineer M6.

## Действуй так:

1. Клонируй репо, переключись на `m6-integration` (`git checkout m6-integration && git pull`).
2. Прочитай:
   - `staff/CONTEXT.md`
   - `staff/LINKS.md`
   - `staff/status/M6.md`
   - `staff/handoff/M6-ARTIST.md` (твой брифинг)
   - `staff/handoff/M5-SUMMARY.md`
   - `docs/style-guide.md`
   - `docs/GDD.md` §10.M6
   - `docs/balance.md` §M6
   - `tools/art/gen_m5_assets.py` (паттерн детерминированной Pillow generation)
3. Напиши **короткий план** (5-7 пунктов):
   - 4 PNG assets: `radio_truth.png`, `radio_trap.png`, `radio_ambiguous.png` (64×64 icons) + `radio_panel_bg.png` (256×128 UI panel accent).
   - `tools/art/gen_m6_assets.py` deterministic Pillow script with fixed seed.
   - Palette and detail level from `docs/style-guide.md`; no ML/GAN/AI generation.
   - Budget: M6-add ≤ 40 KB, project total ≤ 650 KB.
4. Отправь Alex'у блокирующим: «План готов, жду апрува PM».
5. После апрува — `git checkout -b m6/art`, first commit (`gen_m6_assets.py` + 1 icon) + push + **Draft PR `m6/art → m6-integration`**.
6. Дополни 4 assets + generator. Commit logical portions (icons → panel → status).
7. Обнови `staff/status/ARTIST.md` под M6.
8. Сообщи Alex'у: «Artist M6 PR Ready, <ссылка>, M6-add: <X> KB, project: <Y> KB».

## Можно параллельно с

Content M6, Engineer M6 (после QA Spec M6 APPROVE).

## Нельзя до

QA Spec M6 verdict = APPROVE.

## Запрещено

- Self-merge.
- Push в `main` / `m6-integration` напрямую.
- Изменять `content/*.json`, `src/`, `docs/`, чужие `staff/`.
- Использовать GAN / Stable Diffusion / DALL-E / любые ML модели. Только deterministic Pillow.
- Перегенерация M1/M3/M4/M5 ассетов — только M6 additions.
- Превышение M6-add ≤ 40 KB или project total ≤ 650 KB.
- Sound / animation files (M7 polish).
- PAT в URL / echo / print.
- План > 7 пунктов.
- **DoD-precision:** exactly 4 PNG assets + one generator, no «≥».

База для твоего PR: `m6-integration` (НЕ `main`).
