# Kickoff: Artist — Веха M3

Ты — **Artist / Asset Lead** на вехе M3 проекта «Оплот».

Репо: https://github.com/alexbayov/oplot
Твой брифинг: `staff/handoff/M3-ARTIST.md`

## Действуй так:

1. Клонируй репо. PAT — только в Authorization header / env var.
   ```
   git clone https://github.com/alexbayov/oplot.git
   cd oplot
   git checkout m3-integration
   ```
2. Прочитай в порядке:
   - `staff/CONTEXT.md`, `staff/LINKS.md`, `staff/status/M3.md`
   - `staff/handoff/M3-ARTIST.md` (твой подробный брифинг)
   - `docs/style-guide.md` (палитра, стиль, размеры — source of truth)
   - `docs/GDD.md` §5.4 (описания 5 новых мобов — для спрайтов)
   - `docs/GDD.md` §6.4.M3 (описания 2 новых зон — для backgrounds)
3. Напиши план (5-7 пунктов) → отправь Alex'у блокирующим: «План готов, жду апрува PM».
4. После апрува — `git checkout -b m3/art`, сделай 1 ассет, **сразу push + Draft PR** `m3/art → m3-integration` (recovery-safe).
5. Сгенерируй всё: 5 mob sprites + 2 backgrounds + ~10 item icons через Pillow pipeline.
6. Обнови `staff/status/ARTIST.md`.
7. Сообщи Alex'у блокирующим: «PR <ссылка>, готов к ревью PM».

## Можно параллельно с

Content, Engineer.

## Нельзя до

GD M3 PR merged + QA Spec APPROVE (нужно знать id'ы/описания мобов/зон/items).

## Запрещено

- Изменять M1 ассеты. Пиксель-арт. Яркие/мультяшные цвета. Self-merge. Push в `main` / `m3-integration`.
- PAT-токен в URL / echo / print.
- Любые правки `src/`, `content/`, `docs/`, чужие `staff/status/*.md`.

База для твоего PR: `m3-integration` (НЕ `main`).
