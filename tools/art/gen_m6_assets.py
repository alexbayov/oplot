#!/usr/bin/env python3
"""M6 Artist asset generator — radio UI icons + panel background via Pillow.

Deterministic (fixed seed 42). Run from repo root:

    python3 tools/art/gen_m6_assets.py

Outputs into:
    assets/sprites/radio/radio_truth.png       — 64×64 RGBA
    assets/sprites/radio/radio_trap.png        — 64×64 RGBA
    assets/sprites/radio/radio_ambiguous.png   — 64×64 RGBA
    assets/sprites/radio/radio_panel_bg.png    — 256×128 RGBA

Style-guide compliance (docs/style-guide.md):
    - "Military Graphic Novel" palette.
    - PNG, transparent background, 2-3 px black outlines on icons.
    - Palette HEX values from style-guide §Палитра.
    - Snake_case ASCII naming.

Never touches M1/M3/M4/M5 assets.
"""

from __future__ import annotations

import random
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


REPO_ROOT = Path(__file__).resolve().parents[2]
ASSETS_DIR = REPO_ROOT / "assets"

random.seed(42)

# Style-guide palette (HEX → RGBA).
P_TRANSPARENT = (0, 0, 0, 0)
P_BLACK = (0, 0, 0, 255)
P_SAND = (0xD4, 0xC5, 0xA0, 255)
P_STEEL_BLUE = (0x46, 0x82, 0xB4, 255)
P_HP_RED = (0x8B, 0x00, 0x00, 255)
P_BG_NIGHT = (0x1A, 0x1A, 0x1A, 255)
P_BG_PANEL = (0x2D, 0x2D, 0x2A, 255)
P_DANGER_AMBER = (0xFF, 0xB3, 0x00, 255)
P_CRIT_SCARLET = (0xD3, 0x2F, 0x2F, 255)

# Radio-specific palette.
P_WAVE_GREEN = (0x4C, 0xAF, 0x50, 255)
P_WAVE_RED = (0xD3, 0x2F, 0x2F, 255)
P_WAVE_AMBER = (0xFF, 0xB3, 0x00, 255)
P_SCANLINE = (0x3D, 0x3D, 0x3A, 120)
P_METAL_DARK = (0x33, 0x33, 0x2E, 255)
P_METAL_LIGHT = (0x4A, 0x4A, 0x40, 255)
P_KNOB = (0x5E, 0x5E, 0x50, 255)

SUPERSAMPLE = 2
ICON_SIZE = 64
PANEL_W = 256
PANEL_H = 128
OUTLINE_W = 4


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def new_canvas(w: int, h: int) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGBA", (w * SUPERSAMPLE, h * SUPERSAMPLE), P_TRANSPARENT)
    draw = ImageDraw.Draw(img)
    return img, draw


def downsample_save(img: Image.Image, target: tuple[int, int], out: Path) -> int:
    resized = img.resize(target, Image.Resampling.LANCZOS)
    ensure_dir(out.parent)
    resized.save(out, format="PNG", optimize=True)
    return out.stat().st_size


def _ellipse(draw, bbox, fill, outline=P_BLACK, w=OUTLINE_W):
    draw.ellipse(bbox, fill=fill, outline=outline, width=w)


def _poly(draw, pts, fill, outline=P_BLACK, w=OUTLINE_W):
    draw.polygon(pts, fill=fill)
    pts_c = list(pts) + [pts[0]]
    draw.line(pts_c, fill=outline, width=w, joint="curve")


def _rect(draw, bbox, fill, outline=P_BLACK, w=OUTLINE_W):
    draw.rectangle(bbox, fill=fill, outline=outline, width=w)


def _draw_sine_wave(draw, x0, y0, w, h, color, amplitude, phase=0, broken=False):
    """Draw a sine-wave motif. If broken, draw with gaps/static."""
    cx = x0 + w / 2
    cy = y0 + h / 2
    mid = cy
    amp = amplitude
    steps = w * SUPERSAMPLE
    points = []
    gap = 0
    for i in range(steps):
        if broken and i % 12 < 4:
            continue
        if broken and random.random() < 0.15:
            continue
        t = (i / steps) * 4 * math.pi + phase
        x = x0 + i
        y = mid - amp * math.sin(t)
        if broken:
            draw.line([(x, y - 2 * SUPERSAMPLE), (x, y + 2 * SUPERSAMPLE)], fill=color, width=2)
        else:
            points.append((x, y))
    if not broken and len(points) > 1:
        for p1, p2 in zip(points, points[1:]):
            draw.line([p1, p2], fill=color, width=3)


# ---------- radio_truth ----------

def gen_radio_truth() -> Image.Image:
    """Greenish stable waveform on dark radio panel."""
    img, draw = new_canvas(ICON_SIZE, ICON_SIZE)
    s = SUPERSAMPLE
    # Background pill
    _ellipse(draw, (2 * s, 2 * s, (ICON_SIZE - 2) * s, (ICON_SIZE - 2) * s), P_BG_NIGHT, P_METAL_DARK, 2)
    # Stable sine wave
    _draw_sine_wave(draw, 8 * s, 12 * s, 48 * s, 40 * s, P_WAVE_GREEN, 8 * s, phase=0, broken=False)
    # Baseline
    draw.line([(8 * s, 32 * s), (56 * s, 32 * s)], fill=P_METAL_LIGHT, width=1)
    # Small dot indicators
    for x in range(14 * s, 52 * s, 8 * s):
        draw.ellipse([x - 1, 30 * s, x + 1, 34 * s], fill=P_WAVE_GREEN)
    return img


# ---------- radio_trap ----------

def gen_radio_trap() -> Image.Image:
    """Red broken waveform with warning notch / static teeth."""
    img, draw = new_canvas(ICON_SIZE, ICON_SIZE)
    s = SUPERSAMPLE
    _ellipse(draw, (2 * s, 2 * s, (ICON_SIZE - 2) * s, (ICON_SIZE - 2) * s), P_BG_NIGHT, P_METAL_DARK, 2)
    # Warning triangle
    _poly(draw, [(20 * s, 6 * s), (34 * s, 22 * s), (6 * s, 22 * s)], P_DANGER_AMBER, P_BLACK, 2)
    draw.line([(20 * s, 12 * s), (20 * s, 17 * s)], fill=P_BLACK, width=2)
    draw.ellipse([19 * s, 19 * s, 21 * s, 21 * s], fill=P_BLACK)
    # Broken waveform
    _draw_sine_wave(draw, 8 * s, 28 * s, 48 * s, 32 * s, P_WAVE_RED, 10 * s, phase=math.pi, broken=True)
    # Baseline
    draw.line([(8 * s, 44 * s), (56 * s, 44 * s)], fill=P_METAL_LIGHT, width=1)
    return img


# ---------- radio_ambiguous ----------

def gen_radio_ambiguous() -> Image.Image:
    """Split signal: left half clean green, right half broken amber."""
    img, draw = new_canvas(ICON_SIZE, ICON_SIZE)
    s = SUPERSAMPLE
    _ellipse(draw, (2 * s, 2 * s, (ICON_SIZE - 2) * s, (ICON_SIZE - 2) * s), P_BG_NIGHT, P_METAL_DARK, 2)
    mid_x = 32 * s
    # Left half: clean green wave
    draw_line = ImageDraw.Draw(img)
    cx_left = 16 * s
    cy = 32 * s
    for i in range(24 * s):
        t = (i / (24 * s)) * 2 * math.pi
        x = 8 * s + i
        y = cy - 8 * s * math.sin(t)
        if x < mid_x:
            draw_line.point((x, y), fill=P_WAVE_GREEN)
    # Right half: broken amber
    for i in range(24 * s):
        if random.random() < 0.25:
            continue
        if i % 10 < 3:
            continue
        t = (i / (24 * s)) * 2 * math.pi + math.pi
        x = mid_x + i
        y = cy - 8 * s * math.sin(t)
        draw_line.line([(x, y - 2 * s), (x, y + 2 * s)], fill=P_WAVE_AMBER, width=2)
    # Divider line
    draw.line([(mid_x, 8 * s), (mid_x, 56 * s)], fill=P_METAL_LIGHT, width=1)
    # Baseline
    draw.line([(8 * s, cy), (56 * s, cy)], fill=P_METAL_LIGHT, width=1)
    return img


# ---------- radio_panel_bg ----------

def gen_radio_panel_bg() -> Image.Image:
    """Dark radio metal panel with scanlines and subtle UI frame."""
    s = SUPERSAMPLE
    img = Image.new("RGBA", (PANEL_W * s, PANEL_H * s), P_METAL_DARK)
    draw = ImageDraw.Draw(img)

    # Subtle bezel/frame
    _rect(draw, (0, 0, (PANEL_W - 1) * s, (PANEL_H - 1) * s), None, P_METAL_LIGHT, 2)
    _rect(draw, (2 * s, 2 * s, (PANEL_W - 3) * s, (PANEL_H - 3) * s), None, P_KNOB, 1)

    # Scanlines (horizontal every 4px)
    for y in range(4 * s, PANEL_H * s, 4 * s):
        draw.line([(2 * s, y), ((PANEL_W - 2) * s, y)], fill=P_SCANLINE, width=1)

    # Knob indicators bottom left
    _ellipse(draw, (10 * s, (PANEL_H - 30) * s, 26 * s, (PANEL_H - 14) * s), P_KNOB, P_BLACK, 2)
    _ellipse(draw, (14 * s, (PANEL_H - 26) * s, 22 * s, (PANEL_H - 18) * s), P_METAL_DARK)
    _ellipse(draw, (34 * s, (PANEL_H - 30) * s, 50 * s, (PANEL_H - 14) * s), P_KNOB, P_BLACK, 2)
    _ellipse(draw, (38 * s, (PANEL_H - 26) * s, 46 * s, (PANEL_H - 18) * s), P_METAL_DARK)

    # Signal strength indicator (LED-like dots top right)
    led_y = 12 * s
    for i, color in enumerate([P_WAVE_GREEN, P_WAVE_AMBER, P_WAVE_RED]):
        lx = (PANEL_W - 60) * s + i * 18 * s
        _ellipse(draw, (lx, led_y, lx + 8 * s, led_y + 8 * s), color, P_BLACK, 1)

    # Subtle noise grain (very sparse)
    grain = Image.new("RGBA", img.size, P_TRANSPARENT)
    gdraw = ImageDraw.Draw(grain)
    for _ in range(PANEL_W * PANEL_H // 40):
        x = random.randint(0, img.width - 1)
        y = random.randint(0, img.height - 1)
        alpha = random.randint(0, 30)
        gdraw.point((x, y), fill=(0xFF, 0xFF, 0xFF, alpha))

    img = Image.alpha_composite(img, grain)
    return img


# ---------- Main ----------

def main():
    radio_dir = ASSETS_DIR / "sprites" / "radio"
    ensure_dir(radio_dir)

    assets = {
        radio_dir / "radio_truth.png": (gen_radio_truth(), (ICON_SIZE, ICON_SIZE)),
        radio_dir / "radio_trap.png": (gen_radio_trap(), (ICON_SIZE, ICON_SIZE)),
        radio_dir / "radio_ambiguous.png": (gen_radio_ambiguous(), (ICON_SIZE, ICON_SIZE)),
        radio_dir / "radio_panel_bg.png": (gen_radio_panel_bg(), (PANEL_W, PANEL_H)),
    }

    total = 0
    for path, (img, target) in assets.items():
        size = downsample_save(img, target, path)
        total += size
        print(f"  {path.name:30s} {size:>6} B")

    print(f"\n  M6 total:     {total:>6} B")
    print(f"  M6 budget:    ≤ 40 KB ({total / 1024:.1f} KB used)")


if __name__ == "__main__":
    main()
