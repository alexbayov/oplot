# Kickoff: Artist — Веха M5

Ты — **Artist** на вехе M5 проекта «Оплот».

Репо: https://github.com/alexbayov/oplot
Твой брифинг: `staff/handoff/M5-ARTIST.md`

## Когда стартуешь

После того как PM merge'нул GD M5 amendment PR в `m5-integration` И QA Spec M5 verdict = APPROVE. Параллельно с Content M5 и Engineer M5.

## Действуй так:

1. Клонируй репо, переключись на `m5-integration` (`git checkout m5-integration && git pull`).
2. Прочитай:
   - `staff/CONTEXT.md`
   - `staff/LINKS.md`
   - `staff/status/M5.md`
   - `staff/handoff/M5-ARTIST.md` (твой брифинг)
   - `staff/handoff/M4-SUMMARY.md`
   - `staff/handoff/M3-SUMMARY.md` (5 mob sprites + 14 item icons как baseline)
   - `docs/style-guide.md` (палитра + правила detail level)
   - `docs/GDD.md` §9 (boss названия / лор + boss-drop id'ы + T3 item id'ы из GD M5 amendment)
   - `docs/balance.md` §M5
   - `tools/art/gen_m3_assets.py` и `tools/art/gen_m4_assets.py` (паттерн детерминированной генерации через Pillow)
3. Напиши **короткий план** (5-7 пунктов):
   - 3 boss спрайта 128×128 PNG (RGBA, palette из style-guide, seed-fixed детерминированный Pillow gen) — id'ы из GD §9 + Content `content/mobs.json` (например: `forest_alpha_mutant.png`, `warehouse_drone_prime.png`, `city_guard_captain.png`).
   - 3 boss-drop resource icons 64×64 PNG (например: `mutated_gland.png`, `prime_circuit.png`, `captain_insignia.png`).
   - 3 T3 item icons 64×64 PNG (например: `composite_blade.png`, `prime_shotgun.png`, `captain_armor.png`).
   - 1 gas zone overlay 256×256 PNG (полупрозрачный зелёно-жёлтый текстурный overlay для CombatScene газовых зон — декоративный, не critical).
   - `tools/art/gen_m5_assets.py` — детерминированный Pillow-скрипт (seed=42 или схожий), одна команда `python tools/art/gen_m5_assets.py` пересоздаёт все M5 ассеты.
   - Бюджет: M5-add ≤ 80 KB, project total ≤ 600 KB (текущее ~259 KB после M4 + M3 preload, остаётся ~341 KB budget).
   - Manifest sanity: все 3 boss / 3 boss-drop / 3 T3 / 1 gas-overlay присутствуют, имена совпадают с `content/*.json` id'ами Content'а.
4. Отправь Alex'у блокирующим: «План готов, жду апрува PM».
5. После апрува — `git checkout -b m5/art`, первый коммит (например, `tools/art/gen_m5_assets.py` + 1 boss sprite) + push + **Draft PR `m5/art → m5-integration`** (recovery-safe).
6. Дополни 10 ассетов + gen скрипт. Коммить логическими порциями (boss sprites → boss-drop → T3 → gas overlay).
7. Обнови `staff/status/ARTIST.md` под M5.
8. Сообщи Alex'у: «Artist M5 PR Ready, <ссылка>, M5-add: <X> KB, project: <Y> KB».

## Можно параллельно с

Content M5, Engineer M5 (после QA Spec M5 APPROVE).

## Нельзя до

QA Spec M5 verdict = APPROVE.

## Запрещено

- Self-merge.
- Push в `main` / `m5-integration` напрямую.
- Изменять `content/*.json`, `src/`, `docs/`, чужие `staff/`.
- Использовать **GAN / Stable Diffusion / DALL-E / любые ML модели**. **Только детерминированный Pillow** (`tools/art/gen_m5_assets.py` с фиксированным seed).
- Перегенерация M1 / M3 / M4 ассетов (только **добавление** M5 новых файлов).
- Превышение **80 KB** на M5-add или **600 KB** на project total.
- Sound / animation файлы (M7 polish).
- PAT в URL / echo / print.
- План > 7 пунктов.
- **DoD-precision: 3 boss / 3 boss-drop / 3 T3 / 1 gas-overlay = 10 файлов** (точные числа в финальном PR description). Размер M5-add и total — точные числа из `du -sk assets/`.

База для твоего PR: `m5-integration` (НЕ `main`).
