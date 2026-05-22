#!/usr/bin/env python3
"""M4 Artist asset generator — perk icons via Pillow.

Deterministic (no randomness; if random is ever added, it must be seeded).
Reproducibility per M1 PM-decision (staff/decisions/DECISIONS.md 2026-05-19):
the generator script is committed to the repo so any future session can
regenerate identical assets.

Run from repo root:

    python3 tools/art/gen_m4_assets.py

Outputs into:
    assets/sprites/perks/perk_{tough_skin,sharp_blade,lean_pack,lucky_scavenger,
                                keen_eye,reinforced_plates,quick_hands,fast_learner}.png

Style-guide compliance (docs/style-guide.md):
    - "Military Graphic Novel" — Darkest Dungeon contrast, post-apoc palette.
    - Icons: PNG, transparent background, 2-3 px black outlines.
    - Palette HEX values are sourced from style-guide §Палитра.
    - All file names snake_case, ASCII; match Content/Balance perk ids.

The script never touches M1/M3 assets.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

from PIL import Image, ImageDraw


REPO_ROOT = Path(__file__).resolve().parents[2]
ASSETS_DIR = REPO_ROOT / "assets"

P_BG_NIGHT = (0x1A, 0x1A, 0x1A, 255)
P_BG_PANEL = (0x2D, 0x2D, 0x2A, 255)
P_KHAKI = (0x4A, 0x4A, 0x3A, 255)
P_RUST = (0x8B, 0x73, 0x55, 255)
P_FOLIAGE = (0x3D, 0x5C, 0x3A, 255)
P_SAND = (0xD4, 0xC5, 0xA0, 255)
P_HP_RED = (0x8B, 0x00, 0x00, 255)
P_STEEL_BLUE = (0x46, 0x82, 0xB4, 255)
P_TIER1_FRAME = (0x9E, 0x9E, 0x9E, 255)
P_TIER2_FRAME = (0x4C, 0xAF, 0x50, 255)
P_DANGER_AMBER = (0xFF, 0xB3, 0x00, 255)
P_CRIT_SCARLET = (0xD3, 0x2F, 0x2F, 255)
P_GOLD = (0xC5, 0xA2, 0x67, 255)
P_BLACK = (0x00, 0x00, 0x00, 255)
P_TRANSPARENT = (0, 0, 0, 0)

P_KHAKI_DARK = (0x33, 0x33, 0x28, 255)
P_RUST_DARK = (0x5E, 0x4D, 0x39, 255)
P_BG_PANEL_LIGHT = (0x3D, 0x3D, 0x3A, 255)

P_PERK_RED = (0xB4, 0x3C, 0x3C, 255)
P_PERK_SILVER = (0xC0, 0xC0, 0xC8, 255)
P_PERK_YELLOW = (0xDC, 0xC8, 0x64, 255)
P_PERK_GOLD = (0xDC, 0xB4, 0x1E, 255)
P_PERK_CYAN = (0x50, 0xB4, 0xC8, 255)
P_PERK_STEEL = (0x78, 0x78, 0xB4, 255)
P_PERK_ORANGE = (0xC8, 0x8C, 0x3C, 255)
P_PERK_GREEN = (0x78, 0xB4, 0x64, 255)

SUPERSAMPLE = 2
OUTLINE_WIDTH_ICON = 4


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def new_sprite_canvas(w: int, h: int) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGBA", (w * SUPERSAMPLE, h * SUPERSAMPLE), P_TRANSPARENT)
    draw = ImageDraw.Draw(img)
    return img, draw


def downsample_save(img: Image.Image, target_size: tuple[int, int], out_path: Path) -> int:
    out = img.resize(target_size, Image.Resampling.LANCZOS)
    ensure_dir(out_path.parent)
    out.save(out_path, format="PNG", optimize=True)
    return out_path.stat().st_size


def _draw_outlined_polygon(draw: ImageDraw.ImageDraw, pts, fill, outline=P_BLACK, w=OUTLINE_WIDTH_ICON):
    draw.polygon(pts, fill=fill)
    pts2 = list(pts) + [pts[0]]
    draw.line(pts2, fill=outline, width=w, joint="curve")


def _draw_outlined_ellipse(draw: ImageDraw.ImageDraw, bbox, fill, outline=P_BLACK, w=OUTLINE_WIDTH_ICON):
    draw.ellipse(bbox, fill=fill, outline=outline, width=w)


def _draw_outlined_rect(draw: ImageDraw.ImageDraw, bbox, fill, outline=P_BLACK, w=OUTLINE_WIDTH_ICON):
    draw.rectangle(bbox, fill=fill, outline=outline, width=w)


def _draw_perk_frame(draw: ImageDraw.ImageDraw, w: int = 64, h: int = 64) -> None:
    draw.rounded_rectangle((6, 6, w * 2 - 6, h * 2 - 6), radius=14, outline=P_GOLD, width=4)


def gen_tough_skin() -> Image.Image:
    img, draw = new_sprite_canvas(64, 64)
    _draw_perk_frame(draw)
    _draw_outlined_polygon(draw, [(40, 100), (120, 100), (116, 48), (44, 48)], P_PERK_RED)
    _draw_outlined_rect(draw, (52, 60, 108, 68), P_BG_PANEL, w=2)
    _draw_outlined_rect(draw, (52, 78, 108, 86), P_BG_PANEL, w=2)
    draw.line([(72, 48), (72, 34)], fill=P_BLACK, width=3)
    draw.line([(88, 48), (88, 34)], fill=P_BLACK, width=3)
    draw.ellipse((68, 26, 76, 34), fill=P_CRIT_SCARLET, outline=P_BLACK, width=2)
    draw.ellipse((84, 26, 92, 34), fill=P_CRIT_SCARLET, outline=P_BLACK, width=2)
    return img


def gen_sharp_blade() -> Image.Image:
    img, draw = new_sprite_canvas(64, 64)
    _draw_perk_frame(draw)
    _draw_outlined_polygon(draw, [(64, 18), (80, 18), (82, 90), (62, 90)], P_PERK_SILVER)
    _draw_outlined_rect(draw, (56, 90, (88), 100), P_RUST_DARK, w=3)
    _draw_outlined_rect(draw, (54, 100, 90, 110), P_KHAKI_DARK, w=2)
    draw.line([(72, 34), (72, 72)], fill=P_BG_PANEL_LIGHT, width=2)
    draw.line([(64, 26), (80, 26)], fill=P_BG_PANEL_LIGHT, width=3)
    return img


def gen_lean_pack() -> Image.Image:
    img, draw = new_sprite_canvas(64, 64)
    _draw_perk_frame(draw)
    _draw_outlined_polygon(draw, [(36, 54), (54, 38), (74, 38), (92, 54), (92, 96), (36, 96)], P_PERK_YELLOW)
    _draw_outlined_polygon(draw, [(52, 68), (76, 68), (76, 88), (52, 88)], P_KHAKI_DARK, w=2)
    draw.line([(64, 38), (64, 26)], fill=P_KHAKI_DARK, width=3)
    for dy in [0, 8]:
        y = 34 + dy
        draw.line([(60, y), (68, y)], fill=P_BG_PANEL, width=2)
    _draw_outlined_polygon(draw, [(92, 56), (108, 40), (108, 72), (92, 72)], P_PERK_YELLOW, w=2)
    return img


def gen_lucky_scavenger() -> Image.Image:
    img, draw = new_sprite_canvas(64, 64)
    _draw_perk_frame(draw)
    _draw_outlined_ellipse(draw, (40, 34, 100, 94), P_PERK_GOLD)
    _draw_outlined_ellipse(draw, (50, 44, 90, 84), P_GOLD, w=2)
    _draw_outlined_polygon(draw, [(64, 42), (72, 58), (90, 58), (76, 68), (80, 84), (64, 76), (48, 84), (52, 68), (38, 58), (56, 58)], P_PERK_GOLD, w=2)
    draw.ellipse((60, 54, 68, 62), fill=P_DANGER_AMBER, outline=P_BLACK, width=2)
    return img


def gen_keen_eye() -> Image.Image:
    img, draw = new_sprite_canvas(64, 64)
    _draw_perk_frame(draw)
    _draw_outlined_ellipse(draw, (30, 48, 110, 88), P_SAND)
    _draw_outlined_ellipse(draw, (40, 54, 100, 82), P_PERK_CYAN, w=2)
    _draw_outlined_ellipse(draw, (56, 60, 84, 76), P_BLACK)
    draw.ellipse((64, 64, 76, 72), fill=P_CRIT_SCARLET)
    draw.ellipse((68, 66, 72, 70), fill=P_SAND)
    draw.line([(110, 68), (120, 62)], fill=P_BLACK, width=3)
    draw.line([(110, 68), (120, 74)], fill=P_BLACK, width=3)
    return img


def gen_reinforced_plates() -> Image.Image:
    img, draw = new_sprite_canvas(64, 64)
    _draw_perk_frame(draw)
    _draw_outlined_polygon(draw, [(36, 80), (100, 80), (96, 40), (40, 40)], P_PERK_STEEL)
    _draw_outlined_rect(draw, (44, 44, 92, 56), P_BG_PANEL_LIGHT, w=2)
    _draw_outlined_rect(draw, (44, 62, 92, 74), P_BG_PANEL_LIGHT, w=2)
    for cx, cy in [(52, 50), (80, 50), (52, 68), (80, 68)]:
        draw.ellipse((cx - 3, cy - 3, cx + 3, cy + 3), fill=P_RUST_DARK, outline=P_BLACK, width=1)
    draw.line([(68, 40), (68, 28)], fill=P_BLACK, width=3)
    draw.line([(52, 80), (52, 92)], fill=P_BLACK, width=3)
    draw.line([(84, 80), (84, 92)], fill=P_BLACK, width=3)
    return img


def gen_quick_hands() -> Image.Image:
    img, draw = new_sprite_canvas(64, 64)
    _draw_perk_frame(draw)
    _draw_outlined_polygon(draw, [(36, 52), (72, 36), (108, 52), (108, 84), (72, 100), (36, 84)], P_PERK_ORANGE)
    _draw_outlined_ellipse(draw, (54, 50, 90, 82), P_SAND, w=2)
    _draw_outlined_polygon(draw, [(72, 56), (78, 64), (72, 72), (66, 64)], P_PERK_ORANGE, w=2)
    draw.line([(54, 66), (44, 60)], fill=P_BLACK, width=3)
    draw.line([(90, 66), (100, 60)], fill=P_BLACK, width=3)
    return img


def gen_fast_learner() -> Image.Image:
    img, draw = new_sprite_canvas(64, 64)
    _draw_perk_frame(draw)
    _draw_outlined_rect(draw, (36, 30, 104, 102), P_PERK_GREEN)
    _draw_outlined_rect(draw, (44, 38, 96, 94), P_BG_PANEL_LIGHT, w=2)
    draw.line([(44, 50), (96, 50)], fill=P_BLACK, width=3)
    draw.line([(44, 62), (96, 62)], fill=P_BLACK, width=3)
    draw.line([(44, 74), (96, 74)], fill=P_BLACK, width=3)
    draw.line([(44, 86), (96, 86)], fill=P_BLACK, width=3)
    _draw_outlined_polygon(draw, [(36, 30), (70, 18), (104, 30)], P_PERK_GREEN, w=2)
    draw.ellipse((60, 26, 80, 38), fill=P_DANGER_AMBER, outline=P_BLACK, width=2)
    return img


@dataclass(frozen=True)
class AssetSpec:
    out_path: Path
    target_size: tuple[int, int]
    builder: Callable[[], Image.Image]


def all_assets() -> list[AssetSpec]:
    s = ASSETS_DIR
    return [
        AssetSpec(s / "sprites/perks/perk_tough_skin.png", (64, 64), gen_tough_skin),
        AssetSpec(s / "sprites/perks/perk_sharp_blade.png", (64, 64), gen_sharp_blade),
        AssetSpec(s / "sprites/perks/perk_lean_pack.png", (64, 64), gen_lean_pack),
        AssetSpec(s / "sprites/perks/perk_lucky_scavenger.png", (64, 64), gen_lucky_scavenger),
        AssetSpec(s / "sprites/perks/perk_keen_eye.png", (64, 64), gen_keen_eye),
        AssetSpec(s / "sprites/perks/perk_reinforced_plates.png", (64, 64), gen_reinforced_plates),
        AssetSpec(s / "sprites/perks/perk_quick_hands.png", (64, 64), gen_quick_hands),
        AssetSpec(s / "sprites/perks/perk_fast_learner.png", (64, 64), gen_fast_learner),
    ]


def main(only: list[str] | None = None) -> None:
    total = 0
    rows: list[tuple[str, int]] = []
    for spec in all_assets():
        if only and spec.out_path.name not in only and str(spec.out_path) not in only:
            continue
        img = spec.builder()
        size = downsample_save(img, spec.target_size, spec.out_path)
        rel = spec.out_path.relative_to(REPO_ROOT)
        rows.append((str(rel), size))
        total += size
    width = max((len(r[0]) for r in rows), default=10)
    print(f"{'Asset':<{width}}  Bytes")
    print(f"{'-' * width}  -----")
    for rel, size in rows:
        print(f"{rel:<{width}}  {size:>6}")
    print(f"{'TOTAL':<{width}}  {total:>6}")


if __name__ == "__main__":
    import sys

    args = sys.argv[1:]
    main(only=args or None)
