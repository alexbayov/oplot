# Handoff — Artist M5 (Боссы и инстансы)

> Этот документ — подробный брифинг для Artist на вехе M5. Ты генерируешь 3 boss спрайта (128×128), 3 boss-drop иконки (64×64), 3 T3 item иконки (64×64), 1 gas zone overlay (256×256) через детерминированный Pillow (`tools/art/gen_m5_assets.py`). Бюджет: M5-add ≤ 80 KB, project total ≤ 600 KB.

## Preconditions

- GD M5 amendment PR `m5/gd-amendment` merged в `m5-integration` (тебе нужны id'ы из GDD §9.2 + balance §M5).
- QA Spec M5 verdict = APPROVE.
- Параллельно с тобой работают Content M5 (синхронизуй id'ы по GDD) и Engineer M5.
- Текущий project assets total: ~259 KB (81 M1 + 130 M3 + 24.2 M4 + M3 preload additions) — у тебя ~341 KB budget остаётся.

## Контекст файлов

**Читать:**
1. `staff/CONTEXT.md`
2. `staff/LINKS.md`
3. `staff/status/M5.md`
4. `staff/handoff/M5-ARTIST.md` (этот файл)
5. `staff/handoff/M4-SUMMARY.md` (M4 baseline)
6. `staff/handoff/M3-SUMMARY.md` (5 mob sprites pattern)
7. `docs/style-guide.md` (палитра / detail level / mob silhouette rules)
8. `docs/GDD.md` §9.2 (boss roster — id'ы / тип / archetype lore)
9. `docs/balance.md` §M5.2 (boss-drop id'ы), §M5.4 (T3 item id'ы)
10. `tools/art/gen_m3_assets.py` (паттерн детерминированного Pillow gen)
11. `tools/art/gen_m4_assets.py` (паттерн M4 perk icons 64×64)
12. Существующие ассеты `assets/` (M1+M3 sprites/icons как reference для consistency)

## Deliverables (5-7 deliverables)

### 1. `tools/art/gen_m5_assets.py` — детерминированный скрипт

- Pillow (PIL) only. `random.seed(42)` или схожий fixed seed в начале.
- Одна команда `python tools/art/gen_m5_assets.py` пересоздаёт **все 10 M5 файлов** в `assets/m5/` (или соответствующих подпапках per existing convention).
- Структура (по образу `gen_m3_assets.py` / `gen_m4_assets.py`):
  - `def gen_boss_sprite(id, name, palette_key, output_path): ...` — 128×128 RGBA PNG.
  - `def gen_resource_icon(id, palette_key, output_path): ...` — 64×64 RGBA PNG.
  - `def gen_item_icon(id, type, slot, palette_key, output_path): ...` — 64×64 RGBA PNG.
  - `def gen_gas_overlay(output_path): ...` — 256×256 RGBA PNG (полупрозрачный textured noise).
- Palette: из `docs/style-guide.md` (M3-M4 reuse).

### 2. 3 boss спрайтa (128×128 RGBA PNG)

- `assets/mobs/<boss_id>.png` (или `assets/m5/mobs/`, follow M3 convention) — для каждого из 3 boss id'ов из GDD §9.2:
  - `forest_alpha_mutant.png` (mutant archetype — крупный, асимметричный силуэт, mutated growths, lore: «альфа-самец мутировавшей стаи»).
  - `warehouse_drone_prime.png` (mech archetype — индустриальный силуэт с антеннами / гидравликой, металлические оттенки, lore: «прайм-дрон reliquary»).
  - `city_guard_captain.png` (human archetype — крупный с тяжёлым доспехом / тактическим шлемом, lore: «капитан городской охраны»).
- Все sprites должны быть **визуально отличимы** от M1+M3 mobs (M3 5 mobs — те же archetype'ы, но T2; boss — T3 visual upgrade с очевидной хищностью).
- Optional: phase 2 sprite (`<boss_id>_phase2.png`) — если бюджет позволяет. Иначе Engineer применит phase 2 tint (red overlay) к phase 1 sprite.

### 3. 3 boss-drop иконки (64×64 RGBA PNG)

- `assets/items/<boss_drop_id>.png` per balance §M5.2:
  - `mutated_gland.png` (биологическая ткань, зелёно-розовый).
  - `prime_circuit.png` (электронная схема, металлик-синий с golden traces).
  - `captain_insignia.png` (геральдический знак, бронза с эмалью).
- Имена должны **совпадать** с Content `content/items.json` id'ами (single source of truth: GDD §M5.2 / balance §M5.2).

### 4. 3 T3 item иконки (64×64 RGBA PNG)

- `assets/items/<t3_item_id>.png` per balance §M5.4:
  - `composite_blade.png` (T3 weapon — длинный клинок с composite материалами).
  - `prime_shotgun.png` (T3 weapon — модифицированный дробовик с prime_circuit детальками).
  - `captain_armor.png` (T3 armor — тяжёлый доспех с captain_insignia на нагруднике).
- T3 visual upgrade vs T2 (M3 items): больше деталей, glow / metallic accents, distinguishable от T2 base.

### 5. 1 gas zone overlay (256×256 RGBA PNG)

- `assets/overlays/gas_overlay.png` (или `assets/m5/`, follow convention).
- Полупрозрачный textured noise pattern, зелёно-жёлтый, для use в CombatScene как фоновый overlay над зоной (когда `zone.is_gas: true`).
- Decorative — не critical, can be omitted если бюджет под давлением. Engineer fallback: solid color tint.

### 6. Manifest sanity

- После gen — `ls -la assets/...` показывает 10 файлов (3 boss + 3 boss-drop + 3 T3 + 1 gas overlay).
- `du -sk assets/` — общий размер ≤ **600 KB** (точно).
- M5-add (diff vs m5-integration baseline): `du -sk <new files>` ≤ **80 KB** (точно).
- M1+M3+M4 ассеты **не пересоздаются** (только добавление M5).
- Имена файлов совпадают с Content `content/*.json` id'ами (cross-ref check).

### 7. `staff/status/ARTIST.md` update

- Status: IN_PROGRESS → DONE после merge.
- Список изменений: «10 M5 ассетов (3 boss 128×128, 3 boss-drop 64×64, 3 T3 64×64, 1 gas overlay 256×256)».
- Точные числа: M5-add KB, project total KB.
- Открытые вопросы / fallback'и для PM (если phase 2 sprite не успел).

## DoD (Artist M5)

1. [ ] `tools/art/gen_m5_assets.py` — детерминированный, fixed seed, одна команда пересоздаёт все M5 ассеты.
2. [ ] 3 boss спрайтa 128×128 RGBA PNG в `assets/` с именами `<boss_id>.png` (id'ы из GDD §9.2).
3. [ ] 3 boss-drop иконки 64×64 RGBA PNG в `assets/` с именами из balance §M5.2.
4. [ ] 3 T3 item иконки 64×64 RGBA PNG в `assets/` с именами из balance §M5.4.
5. [ ] 1 gas zone overlay 256×256 RGBA PNG (optional — fallback Engineer).
6. [ ] M5-add размер ≤ **80 KB** (точное число в PR description).
7. [ ] Project total assets ≤ **600 KB** (точное число).
8. [ ] M1+M3+M4 ассеты **не пересозданы** (git diff показывает только новые files).
9. [ ] `staff/status/ARTIST.md` обновлён.
10. [ ] Recovery-safe: первый scaffold-commit (`tools/art/gen_m5_assets.py` + 1 boss sprite) + Draft PR в 5-10 мин. Push после каждой подгруппы (boss → boss-drop → T3 → gas overlay).
11. [ ] PR base = `m5-integration` (НЕ `main`). PR scope = только `assets/` + `tools/art/gen_m5_assets.py` + `staff/status/ARTIST.md`. **Никаких** `docs/`, `src/`, `content/`, чужих `staff/`.

## Anti-scope (твой)

- НЕ менять `docs/`, `src/`, `content/`, чужие `staff/`.
- НЕ self-merge.
- НЕ использовать **GAN / Stable Diffusion / DALL-E / любые ML модели**. **ТОЛЬКО детерминированный Pillow** (`tools/art/gen_m5_assets.py` с fixed seed).
- НЕ перегенерация M1+M3+M4 ассетов (только добавление M5).
- НЕ превышать **80 KB** M5-add или **600 KB** project total.
- НЕ sound / animation / video файлы (M7 polish).
- НЕ animated phase 2 transition (M7 polish). Если делаешь phase 2 sprite — это static second sprite (`<boss_id>_phase2.png`), Engineer переключит при transition.

## Ключевые файлы (expected create)

| Файл | Action | Notes |
|---|---|---|
| `tools/art/gen_m5_assets.py` | CREATE | Детерминированный Pillow gen |
| `assets/mobs/<boss_id>.png` × 3 | CREATE | 128×128 RGBA |
| `assets/items/<boss_drop_id>.png` × 3 | CREATE | 64×64 RGBA |
| `assets/items/<t3_item_id>.png` × 3 | CREATE | 64×64 RGBA |
| `assets/overlays/gas_overlay.png` | CREATE (optional) | 256×256 RGBA |
| `staff/status/ARTIST.md` | MODIFY | M5 status |

## Cross-refs (dependencies)

- **GD M5**: GDD §9.2 + balance §M5.2/§M5.4 — твой single source of truth для id'ов.
- **Content M5** (параллельно): cross-ref id'ы. Если он зашёл первым с другими id'ами — **эскалация в PM**, не resolve самовольно. Если ты зашёл первым — координируй через GDD §9 id'ы (immutable single source).
- **Engineer M5** (параллельно): он использует твои PNG для CombatScene boss spawn / LootScene boss-drop icon / CraftScene T3 icon. Если sprite отсутствует — Engineer применяет fallback (existing M3 sprite + tint).
- **QA Acceptance M5**: проверит размер budget + manifest match с `content/*.json` id'ами.

## Token-budget

~30-60 min на 10 файлов + gen script + status update. План должен быть ≤ 7 пунктов.

## Lessons learned M2+M3+M4 (применить)

- **Детерминированный Pillow only**: M3 урок (`gen_m3_assets.py` повторяемый, no GAN). M4 продолжил pattern (`gen_m4_assets.py` perk icons). Повтори.
- **DoD-precision**: точные размеры в KB (например, M5-add: 65 KB / 80 KB budget — 81% used), не «≤80 KB».
- **Cross-ref naming**: имена файлов = id'ы в `content/*.json` (Engineer ассеты loadит по id). M3 урок — это работает.
- **Budget**: M3-add ≤ 50 KB (achieved 24.2 KB), M5-add ≤ 80 KB (boss 128×128 тяжелее, но reasonable budget).
- **Recovery-safe**: Draft PR в 5-10 мин с gen script scaffold + 1 boss sprite. Push после каждой подгруппы.

База для твоего PR: `m5-integration` (НЕ `main`).
