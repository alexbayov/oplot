# Handoff — Artist M6 (Радио и доверие)

> Подробный брифинг для Artist на M6. Ты создаёшь small deterministic UI assets for radio. Не пишешь код gameplay, контент или docs.

## Preconditions

- GD M6 amendment merged в `m6-integration`.
- QA Spec M6 verdict APPROVE.
- Ты стартуешь параллельно с Content M6 и Engineer M6.

## Контекст файлов

**Читать:**
1. `staff/CONTEXT.md`
2. `staff/LINKS.md`
3. `staff/status/M6.md`
4. `staff/handoff/M6-ARTIST.md`
5. `staff/handoff/M5-SUMMARY.md`
6. `docs/style-guide.md`
7. `docs/GDD.md` §10.M6
8. `docs/balance.md` §M6
9. `tools/art/gen_m5_assets.py`

## Deliverables

### 1. Deterministic generator

Create `tools/art/gen_m6_assets.py`.

Rules:
- Pillow only.
- Fixed seed.
- Running script from repo root regenerates all M6 assets deterministically.
- Do not touch M1/M3/M4/M5 assets.

### 2. Assets

Exactly 4 PNG files:

- `assets/sprites/radio/radio_truth.png` — 64×64 RGBA.
- `assets/sprites/radio/radio_trap.png` — 64×64 RGBA.
- `assets/sprites/radio/radio_ambiguous.png` — 64×64 RGBA.
- `assets/sprites/radio/radio_panel_bg.png` — 256×128 RGBA UI accent.

Visual motifs:
- Truth: clean signal wave / greenish stable waveform.
- Trap: red broken waveform / warning notch / static teeth.
- Ambiguous: split signal, half clean half noisy.
- Panel bg: dark radio metal with subtle scanlines, fits style-guide.

### 3. Budget

- M6-add ≤ 40 KB.
- Project total ≤ 650 KB.
- Record exact `du -sk assets` and per-file sizes in status.

### 4. Status

Update only `staff/status/ARTIST.md` with M6 asset list, generation command, budget, PR link.

## Forbidden

- No ML/GAN/DALL-E/Stable Diffusion.
- No audio/sound/animation.
- No changes to `src/`, `content/`, `docs/`, чужие `staff/`.
- No regeneration of old assets.

## Done

- Draft PR early.
- Exactly 4 PNG + generator.
- Generator rerun is deterministic.
- Budget met.
