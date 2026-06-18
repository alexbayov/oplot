# M15-PR2 — Disassembly economy (DF2 resolved)

> Аддендум к `M15-PREFLIGHT.md` §7. Фиксирует **решённый** DF2 и финальный
> план реализации. Base: main `cf2767b` (после merge PR #198, M15-PR1).
> SAVE_VERSION=8 — **без bump** (schema-neutral).

## DF2 — РЕШЕНО (Alex GO, 2026-06-18)

**Вариант 1 — плоский лоссовый возврат, с min-1 floor, детерминированно (без rng).**

- `K = max(1, floor(N × DISASSEMBLE_RECOVERY_RATE))`, RATE=0.5 дефолт.
- Возвращаем САМЫЕ ценные K частей, выбрасываем (N−K) дешёвых.
- **Drop-приоритет** (что выбрасываем первым), ASC:
  1. non-structural (`mod_*`/стволы/слайды) раньше structural (`*_frame`/`*_receiver`);
  2. tier ASC;
  3. id ASC (детерминированный tiebreak);
  4. исходный индекс (стабильность для идентичных дублей).
- **min-1 floor:** 1-партовый инстанс всегда отдаёт ≥1 (иначе feel-bad полной
  потери сильнее выгоды от закрытия «frame-only» лазейки, которая и так bounded
  слабыми статами + видна через family-табы M14).

### Почему лосс (а не lossless / condition-scaled)
- *vs lossless (Var 3):* без утечки петля repair→decay→`beyond_repair`→разбор
  возвращает 100% частей ⇒ оружие де-факто вечное, металл единственный сток.
  Утечка делает каждую сборку обязательством + образует пару к
  `METAL_PER_DURABILITY_POINT`.
- *vs condition-scaled (Var 2):* масштаб возврата от износа наказывает за
  «доносил оружие до полного износа» — ровно то поведение, которое M15-PR1
  (repair→decay→`beyond_repair`) поощряет. Перверз. Если возвращать влияние
  состояния — в M16 как множитель аффиксов, не как штраф здесь.

## Файлы
- `state/balance.ts` — `DISASSEMBLE_RECOVERY_RATE = 0.5` (тюнится; RATE=1.0 ⇒
  lossless вырожденный режим через тот же путь).
- `systems/craftedWeapons.ts` — новый чистый `disassembleRefund(parts, tierOf)
  → string[]`; `disassembleInstance` получает 5-й арг `tierOf` и возвращает
  на склад только подмножество (`returned_parts` = это подмножество).
- `scenes/CraftedWeaponsScene.ts` — резолвер `partTier(id) =
  GameState.data.items[id]?.tier ?? 1` (deprecated id → дефолт 1); футер копия
  «Части вернутся на склад» → точное «Вернётся K из N (теряется M)» через ТОТ ЖЕ
  `disassembleRefund` (превью == факт); confirm-предупреждение и тост — то же.
- `systems/__tests__/craftedWeapons.test.ts` — лоссовые тесты (см. ниже).

## Тесты (+11 нетто: 443 → 454)
- `disassembleRefund` (11): empty→[]; min-1 (1-парт → length 1, НЕ 0);
  K=floor (N=3→1, не round/ceil); инвариант 1≤K≤N для N=1..8; подмножество;
  drop non-structural первым; tier ASC; id-tiebreak; детерминизм (2 вызова ==);
  structural > любой тир non-structural; дубликаты суммируются.
- `disassembleInstance` lossy (перепис.): structural остаётся/non-structural лом;
  merge-стек; дубликаты; D3 broken штатно; remove из массива; D4 equipped→
  craft_knife; не-экип/catalog нетронуты; forward-compat (deprecated id, 1-парт);
  defensive no-op; immutability; **`round_trip_lossy`** — бывший anchor
  переписан в MONOTONIC (`count(after) ≤ count(before)` для каждого id +
  суммарно СТРОГО меньше → доказывает реальную лоссовость).

## QA guards
- `K ≤ N`, `K ≥ 1` (N≥1), `[]` на пустой вход; floor зафиксирован тестом.
- Детерминизм — никакого rng; tiebreak по id.
- min-1 floor — отдельный инвариант (1-парт → 1).
- Чистота `disassembleRefund`/`disassembleInstance` (immutability snapshot).
- Сцена: превью «K из N» считается тем же helper'ом, что execute → не разъедутся.
- D2/D3/D4 из M14-PR3 сохранены; энергия не трогается (M14-D2).
- Schema-neutral: SAVE_VERSION=8, ни одного нового поля в персисте.
- Gates (Node 20): tsc 0 · eslint 0 · vitest 454 · build ✓ (chunk-warning =
  pre-existing Phaser bundle, не регресс).
