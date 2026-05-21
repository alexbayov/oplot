#!/usr/bin/env python3
"""M3 Artist asset generator — placeholder-class sprites/icons/backgrounds via Pillow.

Deterministic (no randomness; if random is ever added, it must be seeded).
Reproducibility per M1 PM-decision (staff/decisions/DECISIONS.md 2026-05-19):
the generator script is committed to the repo so any future session can
regenerate identical assets.

Run from repo root:

    python3 tools/art/gen_m3_assets.py

Outputs into:
    assets/sprites/mobs/{looter_sniper,armored_guard,fanatic_berserker,pack_rat,relic_drone}.png
    assets/sprites/items/{electronics,oil,medical_supplies,circuitry,
                          pipe_rifle,crowbar,
                          tactical_vest,helmet,gas_mask,
                          large_medkit,energy_drink,emp_grenade,smoke_bomb,ammo_rifle}.png
    assets/backgrounds/{warehouse,city}.png
    assets/ui/radio_icon.png

Style-guide compliance (docs/style-guide.md):
    - "Military Graphic Novel" — Darkest Dungeon contrast, post-apoc palette.
    - Sprites/icons: PNG, transparent background, 2-3 px black outlines.
    - Backgrounds: PNG, opaque, no UI, no characters.
    - Palette HEX values are sourced from style-guide §Палитра.
    - All file names snake_case, ASCII; match Content/Balance ids.

The script never touches M1 assets:
    assets/sprites/hero.png, assets/sprites/items/{cloth,food,gunpowder,
    leather,rope,scrap,water,wood}.png, assets/backgrounds/forest.png.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

from PIL import Image, ImageDraw, ImageFilter


REPO_ROOT = Path(__file__).resolve().parents[2]
ASSETS_DIR = REPO_ROOT / "assets"

# Style-guide palette (HEX → RGBA tuples for Pillow).
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

# Common derivative shades.
P_KHAKI_DARK = (0x33, 0x33, 0x28, 255)
P_RUST_DARK = (0x5E, 0x4D, 0x39, 255)
P_BG_PANEL_LIGHT = (0x3D, 0x3D, 0x3A, 255)
P_GREY_COLD = (0x4F, 0x55, 0x5C, 255)
P_GREY_COLDER = (0x35, 0x3B, 0x42, 255)
P_BLUE_GREY = (0x5A, 0x6B, 0x7A, 255)
P_CIRCUIT_GREEN = (0x4C, 0x7A, 0x4C, 255)
P_DRONE_BODY = (0x55, 0x55, 0x52, 255)
P_DRONE_LENS = (0xD3, 0x2F, 0x2F, 255)

# Super-sampling factor for smoother sprite outlines (down-sampled to target).
SUPERSAMPLE = 2

OUTLINE_WIDTH_SPRITE = 4  # in 2x space → 2 px in final
OUTLINE_WIDTH_ICON = 4  # in 2x space → 2 px in final


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def new_sprite_canvas(w: int, h: int) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    """RGBA, transparent. Coords are in 2x super-sampled space."""
    img = Image.new("RGBA", (w * SUPERSAMPLE, h * SUPERSAMPLE), P_TRANSPARENT)
    draw = ImageDraw.Draw(img)
    return img, draw


def downsample_save(img: Image.Image, target_size: tuple[int, int], out_path: Path) -> int:
    """Downsample 2x → target size with LANCZOS for smooth edges, save PNG optimized."""
    out = img.resize(target_size, Image.Resampling.LANCZOS)
    ensure_dir(out_path.parent)
    out.save(out_path, format="PNG", optimize=True)
    return out_path.stat().st_size


# ---------- Mob sprites (128×128 transparent) ----------


def _draw_outlined_polygon(draw: ImageDraw.ImageDraw, pts, fill, outline=P_BLACK, w=OUTLINE_WIDTH_SPRITE):
    draw.polygon(pts, fill=fill)
    # Close polygon by adding first point at end
    pts2 = list(pts) + [pts[0]]
    draw.line(pts2, fill=outline, width=w, joint="curve")


def _draw_outlined_ellipse(draw: ImageDraw.ImageDraw, bbox, fill, outline=P_BLACK, w=OUTLINE_WIDTH_SPRITE):
    draw.ellipse(bbox, fill=fill, outline=outline, width=w)


def _draw_outlined_rect(draw: ImageDraw.ImageDraw, bbox, fill, outline=P_BLACK, w=OUTLINE_WIDTH_SPRITE):
    draw.rectangle(bbox, fill=fill, outline=outline, width=w)


def gen_looter_sniper() -> Image.Image:
    """Tall human in a low ranged stance with horizontal rifle. Warehouse mob."""
    img, draw = new_sprite_canvas(128, 128)
    # 2x coords (256×256).
    # Head
    _draw_outlined_ellipse(draw, (108, 38, 152, 80), P_KHAKI)
    # Hat brim (peaked cap)
    _draw_outlined_polygon(draw, [(104, 58), (156, 58), (148, 44), (112, 44)], P_KHAKI_DARK)
    # Torso (crouched, leaning forward) — trapezoid
    _draw_outlined_polygon(draw, [(96, 80), (164, 78), (172, 150), (88, 152)], P_KHAKI)
    # Sniper vest detail (rust accent)
    _draw_outlined_rect(draw, (108, 96, 152, 128), P_RUST_DARK, w=2)
    # Back leg (kneel)
    _draw_outlined_polygon(draw, [(110, 150), (140, 150), (148, 210), (118, 218)], P_KHAKI_DARK)
    # Front knee
    _draw_outlined_polygon(draw, [(140, 148), (170, 150), (176, 200), (152, 208)], P_KHAKI_DARK)
    # Boots
    _draw_outlined_rect(draw, (110, 208, 148, 226), P_BLACK, w=2)
    _draw_outlined_rect(draw, (150, 198, 180, 216), P_BLACK, w=2)
    # Rifle barrel — long horizontal
    _draw_outlined_rect(draw, (160, 100, 240, 110), P_RUST, w=3)
    # Rifle stock
    _draw_outlined_polygon(draw, [(82, 96), (160, 96), (160, 116), (82, 122)], P_RUST_DARK)
    # Scope on rifle
    _draw_outlined_rect(draw, (180, 86, 210, 100), P_BLACK, w=2)
    # Eye glint (small)
    draw.ellipse((126, 56, 134, 64), fill=P_DANGER_AMBER)
    return img


def gen_armored_guard() -> Image.Image:
    """Bulky human in heavy armor with riot shield. Warehouse mob."""
    img, draw = new_sprite_canvas(128, 128)
    # Shield first (background layer)
    _draw_outlined_polygon(
        draw, [(36, 70, ), (96, 70), (108, 200), (24, 200)], P_BG_PANEL_LIGHT, w=4
    )
    # Shield emblem
    draw.line([(56, 110), (84, 110)], fill=P_RUST, width=4)
    draw.line([(70, 96), (70, 138)], fill=P_RUST, width=4)
    # Head with helmet
    _draw_outlined_ellipse(draw, (96, 36, 152, 90), P_BG_PANEL_LIGHT)
    # Helmet visor (dark band)
    _draw_outlined_rect(draw, (96, 56, 152, 76), P_BLACK, w=2)
    # Bulky torso
    _draw_outlined_polygon(
        draw, [(88, 90), (172, 90), (188, 180), (76, 180)], P_KHAKI_DARK
    )
    # Chest plate
    _draw_outlined_rect(draw, (108, 108, 156, 156), P_BG_PANEL_LIGHT, w=3)
    # Plate rivets
    for cx, cy in [(116, 116), (148, 116), (116, 148), (148, 148)]:
        draw.ellipse((cx - 4, cy - 4, cx + 4, cy + 4), fill=P_RUST_DARK)
    # Legs
    _draw_outlined_rect(draw, (96, 180, 132, 232), P_KHAKI_DARK)
    _draw_outlined_rect(draw, (132, 180, 168, 232), P_KHAKI_DARK)
    # Boots
    _draw_outlined_rect(draw, (94, 226, 134, 244), P_BLACK, w=2)
    _draw_outlined_rect(draw, (130, 226, 170, 244), P_BLACK, w=2)
    return img


def gen_fanatic_berserker() -> Image.Image:
    """Half-naked cultist with a torch raised. City mob."""
    img, draw = new_sprite_canvas(128, 128)
    # Torch handle (held high in right hand)
    _draw_outlined_rect(draw, (180, 30, 196, 110), P_RUST_DARK, w=3)
    # Torch flame (multi-layer)
    _draw_outlined_polygon(
        draw, [(168, 38), (208, 38), (200, 12), (188, 22), (176, 14)], P_CRIT_SCARLET
    )
    _draw_outlined_polygon(
        draw, [(174, 32), (202, 32), (196, 18), (184, 22)], P_DANGER_AMBER, w=2
    )
    # Head (no helmet, bald-ish)
    _draw_outlined_ellipse(draw, (96, 50, 144, 100), P_SAND)
    # Manic eyes (two amber dots)
    draw.ellipse((108, 70, 116, 78), fill=P_CRIT_SCARLET)
    draw.ellipse((124, 70, 132, 78), fill=P_CRIT_SCARLET)
    # Open mouth (downward triangle)
    _draw_outlined_polygon(
        draw, [(110, 86), (130, 86), (120, 96)], P_BLACK, w=2
    )
    # Bare torso with ragged cloak strips
    _draw_outlined_polygon(
        draw, [(84, 100), (156, 100), (164, 170), (76, 174)], P_RUST_DARK
    )
    # Ribs hint
    for y in [120, 132, 144]:
        draw.line([(98, y), (142, y)], fill=P_BLACK, width=2)
    # Right arm raised holding torch
    _draw_outlined_polygon(
        draw, [(150, 100), (172, 100), (192, 60), (178, 50)], P_SAND
    )
    # Left arm down
    _draw_outlined_polygon(
        draw, [(68, 102), (90, 100), (94, 168), (74, 172)], P_SAND
    )
    # Ragged loincloth
    _draw_outlined_polygon(
        draw, [(78, 170), (162, 170), (158, 210), (104, 208), (96, 224), (82, 214)], P_BG_PANEL
    )
    # Legs (bare)
    _draw_outlined_rect(draw, (98, 208, 122, 244), P_SAND)
    _draw_outlined_rect(draw, (130, 208, 154, 244), P_SAND)
    # Feet
    _draw_outlined_rect(draw, (96, 240, 124, 250), P_BLACK, w=2)
    _draw_outlined_rect(draw, (128, 240, 156, 250), P_BLACK, w=2)
    return img


def gen_pack_rat() -> Image.Image:
    """Four-legged hunched mutant rat. City mob."""
    img, draw = new_sprite_canvas(128, 128)
    # Body — horizontal elongated oval (hunched)
    _draw_outlined_polygon(
        draw, [(56, 120), (208, 120), (220, 168), (44, 168)], P_FOLIAGE
    )
    # Back fur dark accent
    draw.line([(72, 122), (200, 122)], fill=P_BG_PANEL, width=6)
    # Head — tapered snout pointing right (towards viewer-right)
    _draw_outlined_polygon(
        draw, [(196, 108), (232, 132), (232, 152), (196, 168)], P_FOLIAGE
    )
    # Eye (small red)
    draw.ellipse((212, 124, 220, 132), fill=P_CRIT_SCARLET)
    # Teeth
    _draw_outlined_polygon(draw, [(224, 144), (232, 144), (228, 152)], P_SAND, w=2)
    # Front legs (under body)
    _draw_outlined_rect(draw, (74, 168, 90, 212), P_FOLIAGE)
    _draw_outlined_rect(draw, (170, 168, 186, 212), P_FOLIAGE)
    # Back legs (under body, slightly behind)
    _draw_outlined_rect(draw, (110, 168, 126, 212), P_FOLIAGE)
    _draw_outlined_rect(draw, (140, 168, 156, 212), P_FOLIAGE)
    # Paws
    for x0, x1 in [(70, 94), (106, 130), (136, 160), (166, 190)]:
        _draw_outlined_rect(draw, (x0, 208, x1, 222), P_BG_PANEL, w=2)
    # Long thin tail trailing left
    draw.line([(56, 144), (24, 110), (16, 64)], fill=P_RUST_DARK, width=6)
    draw.line([(56, 144), (24, 110), (16, 64)], fill=P_BLACK, width=2)
    # Ears (small triangles on head)
    _draw_outlined_polygon(draw, [(184, 110), (200, 86), (204, 112)], P_FOLIAGE, w=2)
    return img


def gen_relic_drone() -> Image.Image:
    """Hexagonal mech drone with optical lens. Warehouse+City bridge."""
    img, draw = new_sprite_canvas(128, 128)
    # Hover shadow (below)
    draw.ellipse((52, 210, 204, 234), fill=(0, 0, 0, 100))
    # Main hexagonal body
    hex_pts = [(64, 92), (128, 56), (192, 92), (192, 168), (128, 204), (64, 168)]
    _draw_outlined_polygon(draw, hex_pts, P_DRONE_BODY)
    # Inner secondary hex (panel)
    inner = [(82, 104), (128, 78), (174, 104), (174, 156), (128, 182), (82, 156)]
    _draw_outlined_polygon(draw, inner, P_BG_PANEL_LIGHT, w=3)
    # Central optical lens
    _draw_outlined_ellipse(draw, (108, 110, 148, 150), P_BLACK)
    draw.ellipse((118, 120, 138, 140), fill=P_DRONE_LENS)
    # Lens highlight
    draw.ellipse((122, 124, 128, 130), fill=P_SAND)
    # Rotor arms (top-left, top-right, bottom-left, bottom-right)
    for cx, cy in [(72, 78), (184, 78), (72, 182), (184, 182)]:
        _draw_outlined_ellipse(
            draw, (cx - 14, cy - 14, cx + 14, cy + 14), P_RUST_DARK
        )
        # Spinning blur (cross)
        draw.line([(cx - 22, cy), (cx + 22, cy)], fill=P_BG_PANEL, width=3)
        draw.line([(cx, cy - 22), (cx, cy + 22)], fill=P_BG_PANEL, width=3)
    # Antenna on top
    draw.line([(128, 50), (128, 24)], fill=P_BLACK, width=4)
    draw.ellipse((122, 18, 134, 30), fill=P_DANGER_AMBER, outline=P_BLACK, width=2)
    return img


# ---------- Item icons (64×64 transparent) ----------


def _draw_tier_frame(draw: ImageDraw.ImageDraw, color: tuple, w: int = 64, h: int = 64) -> None:
    """Tier frame in 2x super-sampled space (128×128). Drawn as a rounded rect outline."""
    # Outer subtle dark backplate
    draw.rounded_rectangle((6, 6, w * 2 - 6, h * 2 - 6), radius=14, outline=color, width=4)


def gen_electronics() -> Image.Image:
    """Green PCB-style chip with traces."""
    img, draw = new_sprite_canvas(64, 64)
    _draw_tier_frame(draw, P_TIER1_FRAME)
    # PCB body
    _draw_outlined_rect(draw, (28, 30, 100, 96), P_CIRCUIT_GREEN, w=3)
    # IC chip
    _draw_outlined_rect(draw, (44, 46, 84, 80), P_BLACK, w=2)
    # Pins
    for y in [48, 58, 68, 78]:
        draw.line([(40, y), (44, y)], fill=P_SAND, width=3)
        draw.line([(84, y), (88, y)], fill=P_SAND, width=3)
    # Traces
    draw.line([(34, 36), (60, 36), (60, 46)], fill=P_SAND, width=2)
    draw.line([(94, 90), (70, 90), (70, 80)], fill=P_SAND, width=2)
    return img


def gen_oil() -> Image.Image:
    """Tin can of motor oil with spout."""
    img, draw = new_sprite_canvas(64, 64)
    _draw_tier_frame(draw, P_TIER1_FRAME)
    # Can body
    _draw_outlined_rect(draw, (32, 36, 92, 102), P_RUST_DARK, w=3)
    # Cap stripe
    _draw_outlined_rect(draw, (32, 36, 92, 50), P_RUST, w=2)
    # Spout
    _draw_outlined_polygon(draw, [(70, 36), (88, 16), (96, 24), (78, 44)], P_RUST_DARK)
    # Oil drop falling
    _draw_outlined_polygon(draw, [(98, 40), (104, 52), (94, 52)], P_BLACK, w=2)
    # Label rectangle
    _draw_outlined_rect(draw, (42, 64, 82, 90), P_SAND, w=2)
    return img


def gen_medical_supplies() -> Image.Image:
    """Pill bottle + red cross packet."""
    img, draw = new_sprite_canvas(64, 64)
    _draw_tier_frame(draw, P_TIER1_FRAME)
    # Bottle body
    _draw_outlined_rect(draw, (30, 44, 70, 100), P_SAND, w=3)
    # Bottle cap
    _draw_outlined_rect(draw, (30, 32, 70, 50), P_HP_RED, w=2)
    # Pills line
    draw.line([(36, 70), (64, 70)], fill=P_BG_PANEL, width=2)
    draw.line([(36, 80), (64, 80)], fill=P_BG_PANEL, width=2)
    # Red cross packet right-bottom
    _draw_outlined_rect(draw, (74, 60, 110, 96), P_SAND, w=3)
    draw.line([(82, 78), (102, 78)], fill=P_HP_RED, width=6)
    draw.line([(92, 68), (92, 88)], fill=P_HP_RED, width=6)
    return img


def gen_circuitry() -> Image.Image:
    """Square integrated circuit with many pins."""
    img, draw = new_sprite_canvas(64, 64)
    _draw_tier_frame(draw, P_TIER1_FRAME)
    # Chip body
    _draw_outlined_rect(draw, (32, 32, 96, 96), P_BG_PANEL_LIGHT, w=3)
    # Pin dot indicator
    draw.ellipse((40, 38, 50, 48), fill=P_DANGER_AMBER, outline=P_BLACK, width=2)
    # Surface trace
    draw.line([(50, 50), (80, 50), (80, 70), (62, 70), (62, 88)], fill=P_CIRCUIT_GREEN, width=3)
    # Pins (12 per side)
    for i in range(6):
        y = 38 + i * 10
        draw.line([(24, y), (32, y)], fill=P_SAND, width=2)  # left pins
        draw.line([(96, y), (104, y)], fill=P_SAND, width=2)  # right pins
    for i in range(6):
        x = 38 + i * 10
        draw.line([(x, 24), (x, 32)], fill=P_SAND, width=2)
        draw.line([(x, 96), (x, 104)], fill=P_SAND, width=2)
    return img


def gen_pipe_rifle() -> Image.Image:
    """Improvised long rifle silhouette."""
    img, draw = new_sprite_canvas(64, 64)
    _draw_tier_frame(draw, P_TIER2_FRAME)
    # Barrel
    _draw_outlined_rect(draw, (16, 56, 112, 70), P_RUST_DARK, w=2)
    # Stock
    _draw_outlined_polygon(draw, [(16, 56), (40, 56), (40, 82), (16, 90)], P_RUST_DARK, w=2)
    # Grip
    _draw_outlined_polygon(draw, [(60, 70), (76, 70), (76, 96), (62, 96)], P_KHAKI_DARK, w=2)
    # Front sight + scope
    _draw_outlined_rect(draw, (96, 48, 110, 58), P_BLACK, w=2)
    return img


def gen_crowbar() -> Image.Image:
    """L-shaped crowbar."""
    img, draw = new_sprite_canvas(64, 64)
    _draw_tier_frame(draw, P_TIER2_FRAME)
    # Long shaft (diagonal)
    _draw_outlined_polygon(
        draw, [(30, 30), (96, 96), (84, 108), (18, 42)], P_RUST_DARK
    )
    # Hook end
    _draw_outlined_polygon(
        draw, [(96, 96), (114, 86), (118, 100), (104, 110)], P_RUST_DARK
    )
    # Slot in hook
    _draw_outlined_polygon(draw, [(102, 96), (108, 92), (110, 100), (104, 104)], P_BG_PANEL, w=1)
    return img


def gen_tactical_vest() -> Image.Image:
    """Tactical vest silhouette with pouches."""
    img, draw = new_sprite_canvas(64, 64)
    _draw_tier_frame(draw, P_TIER2_FRAME)
    # Shoulder yoke
    _draw_outlined_polygon(
        draw, [(36, 30), (92, 30), (96, 42), (32, 42)], P_KHAKI_DARK
    )
    # Front panel
    _draw_outlined_polygon(
        draw, [(28, 42), (100, 42), (104, 96), (24, 96)], P_KHAKI
    )
    # Mag pouches
    _draw_outlined_rect(draw, (38, 54, 58, 78), P_KHAKI_DARK, w=2)
    _draw_outlined_rect(draw, (70, 54, 90, 78), P_KHAKI_DARK, w=2)
    # Straps
    draw.line([(48, 30), (48, 22)], fill=P_BLACK, width=3)
    draw.line([(80, 30), (80, 22)], fill=P_BLACK, width=3)
    return img


def gen_helmet() -> Image.Image:
    """Combat helmet dome."""
    img, draw = new_sprite_canvas(64, 64)
    _draw_tier_frame(draw, P_TIER2_FRAME)
    # Dome
    _draw_outlined_polygon(
        draw, [(24, 88), (104, 88), (96, 40), (32, 40)], P_KHAKI
    )
    # Visor band
    _draw_outlined_rect(draw, (24, 80, 104, 92), P_BG_PANEL, w=2)
    # Chin strap loop
    draw.line([(24, 88), (16, 100)], fill=P_BLACK, width=3)
    draw.line([(104, 88), (112, 100)], fill=P_BLACK, width=3)
    # Top detail
    _draw_outlined_rect(draw, (56, 44, 72, 58), P_KHAKI_DARK, w=2)
    return img


def gen_gas_mask() -> Image.Image:
    """Gas mask: round face with circular filter cylinder."""
    img, draw = new_sprite_canvas(64, 64)
    _draw_tier_frame(draw, P_TIER2_FRAME)
    # Face mask
    _draw_outlined_ellipse(draw, (28, 28, 92, 100), P_KHAKI_DARK)
    # Eye lenses
    _draw_outlined_ellipse(draw, (38, 46, 58, 66), P_STEEL_BLUE)
    _draw_outlined_ellipse(draw, (62, 46, 82, 66), P_STEEL_BLUE)
    # Filter
    _draw_outlined_rect(draw, (52, 76, 68, 110), P_RUST_DARK, w=2)
    # Filter cap
    _draw_outlined_rect(draw, (48, 104, 72, 114), P_BG_PANEL_LIGHT, w=2)
    return img


def gen_large_medkit() -> Image.Image:
    """Large medkit box with red cross."""
    img, draw = new_sprite_canvas(64, 64)
    _draw_tier_frame(draw, P_TIER2_FRAME)
    # Box body
    _draw_outlined_rect(draw, (24, 36, 104, 100), P_SAND, w=3)
    # Lid line
    draw.line([(24, 52), (104, 52)], fill=P_BLACK, width=3)
    # Red cross
    draw.line([(50, 76), (78, 76)], fill=P_HP_RED, width=10)
    draw.line([(64, 62), (64, 90)], fill=P_HP_RED, width=10)
    # Handle on lid
    _draw_outlined_rect(draw, (54, 30, 74, 42), P_BG_PANEL, w=2)
    return img


def gen_energy_drink() -> Image.Image:
    """Energy drink can with lightning bolt."""
    img, draw = new_sprite_canvas(64, 64)
    _draw_tier_frame(draw, P_TIER2_FRAME)
    # Can
    _draw_outlined_rect(draw, (44, 30, 84, 104), P_BG_PANEL_LIGHT, w=3)
    # Top
    _draw_outlined_rect(draw, (44, 30, 84, 40), P_RUST, w=2)
    # Lightning bolt label (amber)
    _draw_outlined_polygon(
        draw, [(58, 50), (68, 50), (62, 70), (74, 70), (60, 96), (66, 76), (54, 76)], P_DANGER_AMBER, w=2
    )
    return img


def gen_emp_grenade() -> Image.Image:
    """Sphere grenade with antenna and blue indicator."""
    img, draw = new_sprite_canvas(64, 64)
    _draw_tier_frame(draw, P_TIER2_FRAME)
    # Sphere
    _draw_outlined_ellipse(draw, (28, 44, 100, 116), P_BG_PANEL_LIGHT)
    # Equator band
    draw.line([(28, 80), (100, 80)], fill=P_STEEL_BLUE, width=4)
    # Indicator LED
    draw.ellipse((58, 70, 70, 82), fill=P_STEEL_BLUE, outline=P_BLACK, width=2)
    # Top cap
    _draw_outlined_rect(draw, (52, 28, 76, 46), P_RUST_DARK, w=2)
    # Antenna
    draw.line([(64, 28), (64, 14)], fill=P_BLACK, width=3)
    return img


def gen_smoke_bomb() -> Image.Image:
    """Cylindrical canister with smoke puffs."""
    img, draw = new_sprite_canvas(64, 64)
    _draw_tier_frame(draw, P_TIER2_FRAME)
    # Canister
    _draw_outlined_rect(draw, (46, 56, 82, 110), P_KHAKI_DARK, w=3)
    # Top cap
    _draw_outlined_rect(draw, (46, 50, 82, 60), P_BG_PANEL, w=2)
    # Smoke puffs above
    for cx, cy, r in [(54, 38, 10), (74, 30, 11), (90, 44, 9), (40, 46, 8)]:
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=P_BG_PANEL_LIGHT, outline=P_BLACK, width=2)
    # Label stripe
    draw.line([(46, 80), (82, 80)], fill=P_SAND, width=3)
    return img


def gen_ammo_rifle() -> Image.Image:
    """Vertical rifle cartridge (large)."""
    img, draw = new_sprite_canvas(64, 64)
    _draw_tier_frame(draw, P_TIER2_FRAME)
    # Case
    _draw_outlined_rect(draw, (52, 40, 76, 102), P_RUST, w=3)
    # Bullet tip
    _draw_outlined_polygon(draw, [(52, 40), (76, 40), (64, 18)], P_BG_PANEL_LIGHT)
    # Rim
    _draw_outlined_rect(draw, (50, 100, 78, 110), P_RUST_DARK, w=2)
    # Side bullet for variety
    _draw_outlined_rect(draw, (28, 60, 44, 96), P_RUST, w=2)
    _draw_outlined_polygon(draw, [(28, 60), (44, 60), (36, 46)], P_BG_PANEL_LIGHT, w=2)
    return img


# ---------- Backgrounds (800×600 opaque, no transparency) ----------


def new_bg_canvas(w: int, h: int, base: tuple) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGB", (w * SUPERSAMPLE, h * SUPERSAMPLE), base[:3])
    draw = ImageDraw.Draw(img)
    return img, draw


def gen_warehouse_bg() -> Image.Image:
    """Abandoned warehouse: shelves, beam, dim overhead light. Warm-grey palette."""
    img, draw = new_bg_canvas(800, 600, P_BG_NIGHT)
    W, H = 1600, 1200
    # Floor (lighter near the bottom)
    draw.rectangle((0, int(H * 0.7), W, H), fill=P_BG_PANEL[:3])
    # Concrete floor lines (perspective hint)
    for y in range(int(H * 0.72), H, 60):
        draw.line([(0, y), (W, y)], fill=P_BG_PANEL_LIGHT[:3], width=2)
    # Vertical perspective lines on floor
    cx = W // 2
    floor_top = int(H * 0.7)
    for offset in range(-7, 8):
        if offset == 0:
            continue
        x_end = cx + offset * 180
        draw.line([(cx, floor_top), (x_end, H)], fill=P_BG_PANEL_LIGHT[:3], width=1)
    # Ceiling beam (horizontal) with shadow
    draw.rectangle((0, 140, W, 200), fill=P_KHAKI_DARK[:3])
    draw.rectangle((0, 200, W, 220), fill=P_BG_NIGHT[:3])
    # Hanging lamp (centered)
    draw.line([(cx, 200), (cx, 280)], fill=P_BLACK[:3], width=4)
    draw.polygon([(cx - 60, 280), (cx + 60, 280), (cx + 40, 320), (cx - 40, 320)], fill=P_RUST_DARK[:3])
    # Light cone (soft amber)
    light_overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    odraw = ImageDraw.Draw(light_overlay)
    odraw.polygon([(cx, 320), (cx - 360, H), (cx + 360, H)], fill=(0xFF, 0xB3, 0x00, 60))
    light_overlay = light_overlay.filter(ImageFilter.GaussianBlur(radius=24))
    img.paste(light_overlay, (0, 0), light_overlay)
    draw = ImageDraw.Draw(img)
    # Left shelving unit
    sh_l_x0, sh_l_x1 = 60, 360
    for y0 in [320, 460, 600, 740]:
        draw.rectangle((sh_l_x0, y0, sh_l_x1, y0 + 14), fill=P_RUST_DARK[:3])
    # Side rails
    draw.rectangle((sh_l_x0, 320, sh_l_x0 + 16, 760), fill=P_RUST_DARK[:3])
    draw.rectangle((sh_l_x1 - 16, 320, sh_l_x1, 760), fill=P_RUST_DARK[:3])
    # Boxes on left shelf
    for shelf_y in [320, 460, 600]:
        for bx in range(80, 350, 70):
            draw.rectangle((bx, shelf_y - 50, bx + 50, shelf_y), fill=P_KHAKI[:3])
            draw.rectangle((bx, shelf_y - 50, bx + 50, shelf_y), outline=P_BLACK[:3], width=2)
    # Right shelving unit
    sh_r_x0, sh_r_x1 = W - 360, W - 60
    for y0 in [340, 480, 620, 760]:
        draw.rectangle((sh_r_x0, y0, sh_r_x1, y0 + 14), fill=P_RUST_DARK[:3])
    draw.rectangle((sh_r_x0, 340, sh_r_x0 + 16, 780), fill=P_RUST_DARK[:3])
    draw.rectangle((sh_r_x1 - 16, 340, sh_r_x1, 780), fill=P_RUST_DARK[:3])
    for shelf_y in [340, 480, 620]:
        for bx in range(W - 350, W - 80, 70):
            draw.rectangle((bx, shelf_y - 50, bx + 50, shelf_y), fill=P_KHAKI[:3])
            draw.rectangle((bx, shelf_y - 50, bx + 50, shelf_y), outline=P_BLACK[:3], width=2)
    # Broken pallet on floor center-front
    for px in range(cx - 200, cx + 200, 50):
        draw.rectangle((px, H - 120, px + 40, H - 100), fill=P_RUST_DARK[:3])
    draw.rectangle((cx - 220, H - 100, cx + 220, H - 80), fill=P_RUST_DARK[:3])
    # Faint scratches / dirt overlay
    for sx in range(0, W, 30):
        draw.line([(sx, H - 60), (sx + 10, H - 50)], fill=P_BG_PANEL_LIGHT[:3], width=1)
    return img


def gen_city_bg() -> Image.Image:
    """Ruined city block: broken buildings, asphalt cracks. Cold blue-grey palette."""
    img, draw = new_bg_canvas(800, 600, P_BG_NIGHT)
    W, H = 1600, 1200
    # Sky (dark cold blue-grey, gradient via horizontal bands)
    bands = 12
    for i in range(bands):
        y0 = int(i * H * 0.55 / bands)
        y1 = int((i + 1) * H * 0.55 / bands)
        # gradient from #1A1A1A to #353B42
        t = i / bands
        r = int(0x1A + t * (0x35 - 0x1A))
        g = int(0x1A + t * (0x3B - 0x1A))
        b = int(0x1A + t * (0x42 - 0x1A))
        draw.rectangle((0, y0, W, y1), fill=(r, g, b))
    # Distant skyline silhouettes (far back)
    distant = [
        (40, 480, 240, 660),
        (240, 520, 480, 660),
        (480, 460, 700, 660),
        (700, 500, 920, 660),
        (920, 440, 1140, 660),
        (1140, 500, 1340, 660),
        (1340, 470, 1560, 660),
    ]
    for x0, y0, x1, y1 in distant:
        draw.rectangle((x0, y0, x1, y1), fill=P_GREY_COLDER[:3])
    # Mid buildings (broken edges)
    mid = [
        (60, 360, 360, 880),
        (360, 300, 700, 880),
        (700, 340, 1000, 880),
        (1000, 260, 1280, 880),
        (1280, 340, 1540, 880),
    ]
    for x0, y0, x1, y1 in mid:
        draw.rectangle((x0, y0, x1, y1), fill=P_GREY_COLD[:3])
        # Broken top: triangle "bite"
        bite_w = (x1 - x0) // 4
        draw.polygon([(x0 + bite_w, y0), (x0 + bite_w + 40, y0 - 30), (x0 + bite_w + 80, y0)], fill=P_BG_NIGHT[:3])
        bite2 = (x1 - x0) // 2 + 60
        draw.polygon([(x0 + bite2, y0), (x0 + bite2 + 30, y0 - 20), (x0 + bite2 + 60, y0)], fill=P_BG_NIGHT[:3])
        # Window grid
        for wy in range(y0 + 40, y1 - 80, 70):
            for wx in range(x0 + 24, x1 - 40, 60):
                col = P_BG_PANEL_LIGHT[:3] if ((wx + wy) // 30) % 2 == 0 else P_BG_NIGHT[:3]
                draw.rectangle((wx, wy, wx + 36, wy + 44), fill=col)
                draw.rectangle((wx, wy, wx + 36, wy + 44), outline=P_BG_NIGHT[:3], width=2)
    # Foreground rubble row
    draw.rectangle((0, 880, W, H), fill=P_BG_PANEL[:3])
    # Rubble piles (irregular angular shapes, no eye-like ellipses)
    rubble_offsets = [(120, 40, 90, 30), (340, 60, 110, 50), (560, 30, 80, 20),
                      (780, 70, 130, 60), (1000, 40, 90, 30), (1220, 60, 110, 50),
                      (1440, 30, 80, 20)]
    for cx0, peak_dx, peak_dy, mid_off in rubble_offsets:
        pts = [
            (cx0, H - 40),
            (cx0 + 40, H - 100 - mid_off),
            (cx0 + peak_dx + 20, H - 140 - peak_dy),
            (cx0 + 120, H - 110 - mid_off),
            (cx0 + 180, H - 60),
            (cx0 + 180, H),
            (cx0, H),
        ]
        draw.polygon(pts, fill=P_GREY_COLDER[:3])
        # Concrete chunks (angular tiny rectangles, not eye-like ellipses)
        draw.polygon([(cx0 + 30, H - 80), (cx0 + 60, H - 90), (cx0 + 50, H - 60)],
                     fill=P_BLUE_GREY[:3])
        draw.polygon([(cx0 + 100, H - 110), (cx0 + 140, H - 120), (cx0 + 130, H - 90)],
                     fill=P_BLUE_GREY[:3])
    # Asphalt cracks
    for i in range(8):
        x = 80 + i * 200
        draw.line([(x, 880), (x + 40, 1000), (x + 20, 1120)], fill=P_BG_NIGHT[:3], width=3)
    # Dust/fog overlay
    fog = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    fdraw = ImageDraw.Draw(fog)
    fdraw.rectangle((0, 600, W, 880), fill=(0xD4, 0xC5, 0xA0, 30))
    fog = fog.filter(ImageFilter.GaussianBlur(radius=40))
    img_rgba = img.convert("RGBA")
    img_rgba = Image.alpha_composite(img_rgba, fog)
    img = img_rgba.convert("RGB")
    return img


# ---------- Radio UI icon (64×64 transparent) ----------


def gen_radio_icon() -> Image.Image:
    """Old portable radio receiver — handheld."""
    img, draw = new_sprite_canvas(64, 64)
    _draw_tier_frame(draw, P_TIER1_FRAME)
    # Body
    _draw_outlined_rect(draw, (28, 38, 100, 110), P_KHAKI_DARK, w=3)
    # Speaker grille
    _draw_outlined_rect(draw, (38, 50, 90, 80), P_BG_PANEL, w=2)
    for gy in range(54, 80, 6):
        draw.line([(40, gy), (88, gy)], fill=P_BLACK[:3], width=2)
    # Tuner knob
    draw.ellipse((40, 86, 58, 104), fill=P_RUST_DARK, outline=P_BLACK, width=2)
    # Volume knob
    draw.ellipse((72, 86, 90, 104), fill=P_RUST_DARK, outline=P_BLACK, width=2)
    # Antenna
    draw.line([(74, 38), (108, 8)], fill=P_BLACK[:3], width=4)
    # Antenna tip
    draw.ellipse((104, 4, 114, 14), fill=P_DANGER_AMBER, outline=P_BLACK, width=2)
    return img


# ---------- Asset registry ----------


@dataclass(frozen=True)
class AssetSpec:
    out_path: Path
    target_size: tuple[int, int]
    builder: Callable[[], Image.Image]


def all_assets() -> list[AssetSpec]:
    s = ASSETS_DIR
    return [
        # Mob sprites (128×128)
        AssetSpec(s / "sprites/mobs/looter_sniper.png", (128, 128), gen_looter_sniper),
        AssetSpec(s / "sprites/mobs/armored_guard.png", (128, 128), gen_armored_guard),
        AssetSpec(s / "sprites/mobs/fanatic_berserker.png", (128, 128), gen_fanatic_berserker),
        AssetSpec(s / "sprites/mobs/pack_rat.png", (128, 128), gen_pack_rat),
        AssetSpec(s / "sprites/mobs/relic_drone.png", (128, 128), gen_relic_drone),
        # Item icons (64×64) — zone-exclusive resources T1
        AssetSpec(s / "sprites/items/electronics.png", (64, 64), gen_electronics),
        AssetSpec(s / "sprites/items/oil.png", (64, 64), gen_oil),
        AssetSpec(s / "sprites/items/medical_supplies.png", (64, 64), gen_medical_supplies),
        AssetSpec(s / "sprites/items/circuitry.png", (64, 64), gen_circuitry),
        # T2 weapons
        AssetSpec(s / "sprites/items/pipe_rifle.png", (64, 64), gen_pipe_rifle),
        AssetSpec(s / "sprites/items/crowbar.png", (64, 64), gen_crowbar),
        # T2 armor
        AssetSpec(s / "sprites/items/tactical_vest.png", (64, 64), gen_tactical_vest),
        AssetSpec(s / "sprites/items/helmet.png", (64, 64), gen_helmet),
        AssetSpec(s / "sprites/items/gas_mask.png", (64, 64), gen_gas_mask),
        # T2 consumables
        AssetSpec(s / "sprites/items/large_medkit.png", (64, 64), gen_large_medkit),
        AssetSpec(s / "sprites/items/energy_drink.png", (64, 64), gen_energy_drink),
        AssetSpec(s / "sprites/items/emp_grenade.png", (64, 64), gen_emp_grenade),
        AssetSpec(s / "sprites/items/smoke_bomb.png", (64, 64), gen_smoke_bomb),
        AssetSpec(s / "sprites/items/ammo_rifle.png", (64, 64), gen_ammo_rifle),
        # Backgrounds (800×600 opaque)
        AssetSpec(s / "backgrounds/warehouse.png", (800, 600), gen_warehouse_bg),
        AssetSpec(s / "backgrounds/city.png", (800, 600), gen_city_bg),
        # Radio UI icon (64×64)
        AssetSpec(s / "ui/radio_icon.png", (64, 64), gen_radio_icon),
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
