#!/usr/bin/env python3
"""M5 Artist asset generator — boss sprites, boss-drop icons, T3 item icons, gas overlay via Pillow.

Deterministic (fixed seed). Reproducibility per M1 PM-decision
(staff/decisions/DECISIONS.md 2026-05-19): the generator script is committed
to the repo so any future session can regenerate identical assets.

Run from repo root:

    python3 tools/art/gen_m5_assets.py

Outputs into:
    assets/sprites/mobs/{forest_alpha_mutant,warehouse_drone_prime,city_guard_captain}.png
    assets/sprites/items/{mutated_gland,prime_circuit,captain_insignia,
                          composite_blade,prime_shotgun,captain_armor}.png
    assets/overlays/gas_overlay.png

Style-guide compliance (docs/style-guide.md):
    - "Military Graphic Novel" — Darkest Dungeon contrast, post-apoc palette.
    - Sprites/icons: PNG, transparent background, 2-3 px black outlines.
    - Overlay: PNG, semi-transparent textured noise, green-yellow.
    - Palette HEX values are sourced from style-guide §Палитра.
    - All file names snake_case, ASCII; match Content/Balance ids.

The script never touches M1/M3/M4 assets.
"""

from __future__ import annotations

import random
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

from PIL import Image, ImageDraw, ImageFilter


REPO_ROOT = Path(__file__).resolve().parents[2]
ASSETS_DIR = REPO_ROOT / "assets"

random.seed(42)

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
P_TIER3_FRAME = (0x21, 0x96, 0xF3, 255)
P_DANGER_AMBER = (0xFF, 0xB3, 0x00, 255)
P_CRIT_SCARLET = (0xD3, 0x2F, 0x2F, 255)
P_GOLD = (0xC5, 0xA2, 0x67, 255)
P_BLACK = (0x00, 0x00, 0x00, 255)
P_TRANSPARENT = (0, 0, 0, 0)

P_KHAKI_DARK = (0x33, 0x33, 0x28, 255)
P_RUST_DARK = (0x5E, 0x4D, 0x39, 255)
P_BG_PANEL_LIGHT = (0x3D, 0x3D, 0x3A, 255)
P_GREY_COLD = (0x4F, 0x55, 0x5C, 255)
P_GREY_COLDER = (0x35, 0x3B, 0x42, 255)
P_BLUE_GREY = (0x5A, 0x6B, 0x7A, 255)

# Boss-specific palette extensions.
P_MUTANT_FLESH = (0x5C, 0x4A, 0x3A, 255)
P_MUTANT_GROWTH = (0x3D, 0x7C, 0x3A, 255)
P_MUTANT_GROWTH_PINK = (0x8B, 0x4C, 0x6A, 255)
P_MUTANT_CLAW = (0x4A, 0x3A, 0x2A, 255)
P_DRONE_PRIME_BODY = (0x50, 0x55, 0x5A, 255)
P_DRONE_PRIME_ACCENT = (0x46, 0x82, 0xB4, 255)
P_DRONE_HYDRAULIC = (0x8B, 0x73, 0x55, 255)
P_GUARD_ARMOR = (0x4F, 0x55, 0x5C, 255)
P_GUARD_ARMOR_DARK = (0x35, 0x3B, 0x42, 255)
P_GUARD_ACCENT = (0xC5, 0xA2, 0x67, 255)
P_BRONZE = (0xCD, 0x7F, 0x32, 255)
P_BRONZE_DARK = (0x8B, 0x5A, 0x2B, 255)
P_ENAMEL_RED = (0x8B, 0x00, 0x00, 255)
P_CIRCUIT_GOLD = (0xC5, 0xA2, 0x67, 255)
P_CIRCUIT_BLUE = (0x46, 0x82, 0xB4, 255)
P_GAS_GREEN = (0x3D, 0x7C, 0x3A, 255)
P_GAS_YELLOW = (0xC8, 0xB4, 0x32, 255)

SUPERSAMPLE = 2
OUTLINE_WIDTH_SPRITE = 4
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


# ---------- Boss sprites (128×128 transparent) ----------


def _draw_outlined_polygon(draw: ImageDraw.ImageDraw, pts, fill, outline=P_BLACK, w=OUTLINE_WIDTH_SPRITE):
    draw.polygon(pts, fill=fill)
    pts2 = list(pts) + [pts[0]]
    draw.line(pts2, fill=outline, width=w, joint="curve")


def _draw_outlined_ellipse(draw: ImageDraw.ImageDraw, bbox, fill, outline=P_BLACK, w=OUTLINE_WIDTH_SPRITE):
    draw.ellipse(bbox, fill=fill, outline=outline, width=w)


def _draw_outlined_rect(draw: ImageDraw.ImageDraw, bbox, fill, outline=P_BLACK, w=OUTLINE_WIDTH_SPRITE):
    draw.rectangle(bbox, fill=fill, outline=outline, width=w)


def gen_forest_alpha_mutant() -> Image.Image:
    """Large asymmetric mutant boss — alpha of the mutant pack.
    Hulking left arm with growths, smaller right arm, hunched posture."""
    img, draw = new_sprite_canvas(128, 128)
    # Left massive arm (asymmetric — dominant side)
    _draw_outlined_polygon(
        draw, [(36, 108), (80, 100), (92, 170), (56, 190), (28, 174)],
        P_MUTANT_FLESH,
    )
    # Left giant claw
    _draw_outlined_polygon(
        draw, [(28, 174), (56, 190), (44, 218), (16, 204)],
        P_MUTANT_CLAW,
    )
    # Mutated growths on left shoulder (asymmetric detail)
    _draw_outlined_ellipse(draw, (32, 88, 64, 112), P_MUTANT_GROWTH)
    _draw_outlined_ellipse(draw, (52, 78, 80, 100), P_MUTANT_GROWTH_PINK, w=2)
    _draw_outlined_ellipse(draw, (20, 96, 44, 116), P_MUTANT_GROWTH, w=2)
    # Body — massive hunched torso (wider at top)
    _draw_outlined_polygon(
        draw, [(68, 82), (188, 90), (200, 196), (56, 200)],
        P_MUTANT_FLESH,
    )
    # Belly rib/detail lines
    for y in [140, 160, 180]:
        draw.line([(80, y), (180, y)], fill=P_KHAKI_DARK, width=3)
    # Growths on back (hump)
    _draw_outlined_ellipse(draw, (140, 64, 180, 96), P_MUTANT_GROWTH, w=3)
    _draw_outlined_ellipse(draw, (160, 52, 196, 84), P_MUTANT_GROWTH_PINK, w=2)
    _draw_outlined_ellipse(draw, (110, 72, 148, 100), P_MUTANT_GROWTH, w=2)
    # Head — small relative to body, pushed forward
    _draw_outlined_ellipse(draw, (100, 30, 160, 82), P_MUTANT_FLESH)
    # Jaw (wide, underbiting)
    _draw_outlined_polygon(
        draw, [(96, 66), (164, 66), (168, 88), (92, 88)],
        P_MUTANT_CLAW,
    )
    # Eyes (three — mutated, uneven)
    draw.ellipse((112, 42, 124, 52), fill=P_CRIT_SCARLET, outline=P_BLACK, width=2)
    draw.ellipse((132, 38, 148, 50), fill=P_CRIT_SCARLET, outline=P_BLACK, width=2)
    draw.ellipse((118, 54, 130, 62), fill=P_DANGER_AMBER, outline=P_BLACK, width=2)
    # Teeth
    for tx in [104, 116, 128, 140, 152]:
        draw.polygon([(tx, 66), (tx + 8, 66), (tx + 4, 76)], fill=P_SAND, outline=P_BLACK, width=1)
    # Right arm (smaller, normal)
    _draw_outlined_polygon(
        draw, [(184, 94), (216, 104), (224, 170), (196, 178)],
        P_MUTANT_FLESH,
    )
    # Right hand
    _draw_outlined_ellipse(draw, (204, 170, 228, 196), P_MUTANT_CLAW, w=2)
    # Right leg (thick)
    _draw_outlined_polygon(
        draw, [(80, 196), (120, 196), (128, 248), (72, 248)],
        P_MUTANT_FLESH,
    )
    # Left leg (thick)
    _draw_outlined_polygon(
        draw, [(130, 196), (176, 196), (184, 248), (124, 248)],
        P_MUTANT_FLESH,
    )
    # Feet
    _draw_outlined_rect(draw, (64, 244, 130, 256), P_MUTANT_CLAW, w=2)
    _draw_outlined_rect(draw, (118, 244, 188, 256), P_MUTANT_CLAW, w=2)
    # Spine bumps (down the back)
    for sy in [90, 108, 126, 144, 162]:
        _draw_outlined_polygon(
            draw, [(184, sy), (196, sy - 10), (208, sy)],
            P_MUTANT_GROWTH, w=2,
        )
    return img


def gen_warehouse_drone_prime() -> Image.Image:
    """Industrial mech boss — prime drone with antennas, hydraulics, metallic.
    Hovering hexagonal body with reinforced plating."""
    img, draw = new_sprite_canvas(128, 128)
    # Hover shadow (below)
    draw.ellipse((36, 216, 220, 248), fill=(0, 0, 0, 80))
    # Main hexagonal body (larger than relic_drone)
    hex_pts = [
        (40, 96), (80, 48), (176, 48), (216, 96),
        (216, 176), (176, 224), (80, 224), (40, 176),
    ]
    _draw_outlined_polygon(draw, hex_pts, P_DRONE_PRIME_BODY)
    # Reinforced plate overlay (inner octagon)
    inner = [
        (60, 104), (88, 68), (168, 68), (196, 104),
        (196, 168), (168, 204), (88, 204), (60, 168),
    ]
    _draw_outlined_polygon(draw, inner, P_BG_PANEL_LIGHT, w=3)
    # Central optic array (3 lenses)
    _draw_outlined_ellipse(draw, (88, 100, 120, 132), P_BLACK)
    draw.ellipse((96, 108, 112, 124), fill=P_CRIT_SCARLET)
    draw.ellipse((100, 112, 108, 120), fill=P_SAND)
    _draw_outlined_ellipse(draw, (136, 100, 168, 132), P_BLACK)
    draw.ellipse((144, 108, 160, 124), fill=P_DRONE_PRIME_ACCENT)
    draw.ellipse((148, 112, 156, 120), fill=P_SAND)
    # Third lens (between, slightly above)
    _draw_outlined_ellipse(draw, (110, 88, 146, 108), P_BLACK, w=2)
    draw.ellipse((120, 94, 136, 104), fill=P_DANGER_AMBER)
    # Antenna array (2 antennas)
    draw.line([(80, 48), (60, 16)], fill=P_BLACK, width=4)
    draw.ellipse((52, 8, 68, 24), fill=P_DANGER_AMBER, outline=P_BLACK, width=2)
    draw.line([(176, 48), (196, 16)], fill=P_BLACK, width=4)
    draw.ellipse((188, 8, 204, 24), fill=P_DANGER_AMBER, outline=P_BLACK, width=2)
    # Central mast antenna
    draw.line([(128, 48), (128, 12)], fill=P_BLACK, width=5)
    draw.ellipse((118, 4, 138, 16), fill=P_CRIT_SCARLET, outline=P_BLACK, width=3)
    # Hydraulic arms (left and right)
    _draw_outlined_rect(draw, (16, 96, 44, 136), P_DRONE_HYDRAULIC, w=3)
    _draw_outlined_rect(draw, (20, 128, 40, 160), P_BLACK, w=2)
    draw.ellipse((12, 156, 44, 176), fill=P_RUST_DARK, outline=P_BLACK, width=2)
    _draw_outlined_rect(draw, (212, 96, 240, 136), P_DRONE_HYDRAULIC, w=3)
    _draw_outlined_rect(draw, (216, 128, 236, 160), P_BLACK, w=2)
    draw.ellipse((212, 156, 244, 176), fill=P_RUST_DARK, outline=P_BLACK, width=2)
    # Vent/port details on body sides
    for vx in [52, 64, 192, 204]:
        for vy in [120, 136, 152]:
            draw.line([(vx, vy), (vx + 8, vy)], fill=P_GREY_COLD, width=2)
    # Blue accent stripes on body
    draw.line([(88, 68), (88, 48)], fill=P_DRONE_PRIME_ACCENT, width=4)
    draw.line([(168, 68), (168, 48)], fill=P_DRONE_PRIME_ACCENT, width=4)
    # Rotor thrusters (4 corners, larger than relic_drone)
    for cx, cy in [(52, 64), (204, 64), (52, 208), (204, 208)]:
        _draw_outlined_ellipse(
            draw, (cx - 16, cy - 16, cx + 16, cy + 16), P_RUST_DARK,
        )
        draw.line([(cx - 24, cy), (cx + 24, cy)], fill=P_BG_PANEL, width=4)
        draw.line([(cx, cy - 24), (cx, cy + 24)], fill=P_BG_PANEL, width=4)
    # Prime designation mark (chevron on front plate)
    _draw_outlined_polygon(
        draw, [(104, 140), (128, 128), (152, 140), (148, 148), (128, 138), (108, 148)],
        P_CIRCUIT_GOLD, w=2,
    )
    return img


def gen_city_guard_captain() -> Image.Image:
    """Human boss — heavy armor, tactical helmet, captain insignia.
    Bulky silhouette with prominent chest plate and visored helmet."""
    img, draw = new_sprite_canvas(128, 128)
    # Cape/cloak (behind body, slight drape)
    _draw_outlined_polygon(
        draw, [(72, 70), (184, 70), (200, 230), (56, 230)],
        P_GUARD_ARMOR_DARK,
    )
    # Body — heavy armored torso
    _draw_outlined_polygon(
        draw, [(76, 86), (180, 86), (194, 196), (62, 196)],
        P_GUARD_ARMOR,
    )
    # Chest plate (front plate with insignia)
    _draw_outlined_rect(draw, (96, 100, 164, 160), P_BG_PANEL_LIGHT, w=3)
    # Captain insignia on chest (chevron/star)
    _draw_outlined_polygon(
        draw, [(112, 116), (130, 108), (148, 116), (144, 128), (130, 120), (116, 128)],
        P_GUARD_ACCENT, w=2,
    )
    # Plate rivets
    for cx, cy in [(104, 108), (156, 108), (104, 152), (156, 152)]:
        draw.ellipse((cx - 4, cy - 4, cx + 4, cy + 4), fill=P_RUST_DARK, outline=P_BLACK, width=1)
    # Head with tactical helmet (full-face visor)
    _draw_outlined_ellipse(draw, (96, 24, 160, 86), P_GUARD_ARMOR)
    # Visor (dark band across face — no visible face)
    _draw_outlined_rect(draw, (94, 48, 162, 72), P_BLACK, w=3)
    # Visor glint (two blue dots)
    draw.ellipse((108, 54, 120, 64), fill=P_STEEL_BLUE)
    draw.ellipse((136, 54, 148, 64), fill=P_STEEL_BLUE)
    # Helmet crest/ridge
    _draw_outlined_rect(draw, (120, 20, 136, 50), P_GUARD_ARMOR_DARK, w=2)
    # Helmet side panels
    _draw_outlined_rect(draw, (92, 40, 100, 80), P_GUARD_ARMOR_DARK, w=2)
    _draw_outlined_rect(draw, (156, 40, 164, 80), P_GUARD_ARMOR_DARK, w=2)
    # Antenna on helmet (small)
    draw.line([(128, 20), (128, 6)], fill=P_BLACK, width=3)
    draw.ellipse((122, 2, 134, 10), fill=P_DANGER_AMBER, outline=P_BLACK, width=2)
    # Left arm (shield arm — round shield)
    _draw_outlined_ellipse(draw, (16, 96, 76, 164), P_GUARD_ARMOR_DARK)
    _draw_outlined_ellipse(draw, (24, 104, 68, 156), P_GUARD_ARMOR, w=3)
    # Shield boss (center circle)
    _draw_outlined_ellipse(draw, (38, 118, 54, 134), P_GUARD_ACCENT, w=2)
    # Right arm (sword arm)
    _draw_outlined_polygon(
        draw, [(178, 92), (220, 100), (230, 160), (190, 168)],
        P_GUARD_ARMOR,
    )
    # Sword
    _draw_outlined_rect(draw, (218, 48, 232, 168), P_SAND, w=3)
    # Sword guard
    _draw_outlined_rect(draw, (210, 148, 240, 160), P_RUST_DARK, w=2)
    # Sword pommel
    draw.ellipse((222, 162, 228, 174), fill=P_GUARD_ACCENT, outline=P_BLACK, width=2)
    # Gauntlet detail (right hand)
    _draw_outlined_rect(draw, (212, 148, 236, 168), P_KHAKI_DARK, w=2)
    # Legs (armored greaves)
    _draw_outlined_rect(draw, (82, 194, 124, 240), P_GUARD_ARMOR_DARK)
    _draw_outlined_rect(draw, (134, 194, 176, 240), P_GUARD_ARMOR_DARK)
    # Knee guards
    _draw_outlined_ellipse(draw, (86, 192, 120, 210), P_GUARD_ARMOR, w=2)
    _draw_outlined_ellipse(draw, (138, 192, 172, 210), P_GUARD_ARMOR, w=2)
    # Boots
    _draw_outlined_rect(draw, (78, 236, 128, 254), P_BLACK, w=2)
    _draw_outlined_rect(draw, (130, 236, 180, 254), P_BLACK, w=2)
    # Shoulder pauldrons
    _draw_outlined_ellipse(draw, (60, 72, 100, 98), P_GUARD_ARMOR, w=3)
    _draw_outlined_ellipse(draw, (156, 72, 196, 98), P_GUARD_ARMOR, w=3)
    # Pauldron rivets
    for cx, cy in [(72, 82), (88, 82), (168, 82), (184, 82)]:
        draw.ellipse((cx - 3, cy - 3, cx + 3, cy + 3), fill=P_RUST_DARK)
    return img


# ---------- Boss-drop icons (64×64 transparent) ----------


def _draw_tier_frame(draw: ImageDraw.ImageDraw, color: tuple, w: int = 64, h: int = 64) -> None:
    draw.rounded_rectangle((6, 6, w * 2 - 6, h * 2 - 6), radius=14, outline=color, width=4)


def gen_mutated_gland() -> Image.Image:
    """Biological tissue — green-pink organ with veins."""
    img, draw = new_sprite_canvas(64, 64)
    _draw_tier_frame(draw, P_TIER2_FRAME)
    # Main gland body (oval)
    _draw_outlined_ellipse(draw, (32, 36, 100, 100), P_MUTANT_GROWTH)
    # Pink lobes (asymmetric)
    _draw_outlined_ellipse(draw, (40, 44, 72, 72), P_MUTANT_GROWTH_PINK, w=2)
    _draw_outlined_ellipse(draw, (64, 56, 92, 84), P_MUTANT_GROWTH_PINK, w=2)
    # Vein lines
    draw.line([(48, 48), (56, 68)], fill=P_HP_RED, width=2)
    draw.line([(68, 52), (76, 76)], fill=P_HP_RED, width=2)
    draw.line([(82, 64), (90, 88)], fill=P_HP_RED, width=2)
    # Duct/tube at bottom
    _draw_outlined_rect(draw, (58, 92, 74, 114), P_MUTANT_FLESH, w=2)
    # Oozing drop
    _draw_outlined_polygon(draw, [(62, 112), (70, 112), (66, 122)], P_MUTANT_GROWTH, w=2)
    return img


def gen_prime_circuit() -> Image.Image:
    """Electronic circuit — metallic-blue with golden traces."""
    img, draw = new_sprite_canvas(64, 64)
    _draw_tier_frame(draw, P_TIER2_FRAME)
    # Circuit board (blue metallic)
    _draw_outlined_rect(draw, (28, 28, 100, 100), P_CIRCUIT_BLUE, w=3)
    # Central processor chip
    _draw_outlined_rect(draw, (48, 48, 80, 80), P_BG_PANEL_LIGHT, w=2)
    # Gold traces (horizontal and vertical)
    draw.line([(36, 40), (48, 40)], fill=P_CIRCUIT_GOLD, width=3)
    draw.line([(80, 40), (96, 40)], fill=P_CIRCUIT_GOLD, width=3)
    draw.line([(36, 88), (48, 88)], fill=P_CIRCUIT_GOLD, width=3)
    draw.line([(80, 88), (96, 88)], fill=P_CIRCUIT_GOLD, width=3)
    draw.line([(40, 36), (40, 48)], fill=P_CIRCUIT_GOLD, width=3)
    draw.line([(88, 36), (88, 48)], fill=P_CIRCUIT_GOLD, width=3)
    draw.line([(40, 80), (40, 92)], fill=P_CIRCUIT_GOLD, width=3)
    draw.line([(88, 80), (88, 92)], fill=P_CIRCUIT_GOLD, width=3)
    # Diagonal gold traces
    draw.line([(48, 56), (36, 56)], fill=P_CIRCUIT_GOLD, width=2)
    draw.line([(80, 72), (96, 72)], fill=P_CIRCUIT_GOLD, width=2)
    # Prime designation dot (center)
    draw.ellipse((60, 60, 68, 68), fill=P_CIRCUIT_GOLD, outline=P_BLACK, width=2)
    # Pins along edges
    for i in range(4):
        y = 36 + i * 16
        draw.line([(24, y), (28, y)], fill=P_SAND, width=2)
        draw.line([(100, y), (104, y)], fill=P_SAND, width=2)
    for i in range(4):
        x = 36 + i * 16
        draw.line([(x, 24), (x, 28)], fill=P_SAND, width=2)
        draw.line([(x, 100), (x, 104)], fill=P_SAND, width=2)
    return img


def gen_captain_insignia() -> Image.Image:
    """Heraldic badge — bronze with enamel."""
    img, draw = new_sprite_canvas(64, 64)
    _draw_tier_frame(draw, P_TIER2_FRAME)
    # Shield shape (heater shield)
    _draw_outlined_polygon(
        draw,
        [(34, 30), (94, 30), (94, 76), (64, 104), (34, 76)],
        P_BRONZE,
    )
    # Enamel field (inner)
    _draw_outlined_polygon(
        draw,
        [(42, 38), (86, 38), (86, 72), (64, 96), (42, 72)],
        P_ENAMEL_RED,
        w=2,
    )
    # Chevron on enamel
    _draw_outlined_polygon(
        draw,
        [(50, 68), (64, 52), (78, 68), (74, 74), (64, 60), (54, 74)],
        P_BRONZE,
        w=2,
    )
    # Central star/boss
    _draw_outlined_ellipse(draw, (56, 52, 72, 68), P_GUARD_ACCENT, w=2)
    draw.ellipse((60, 56, 68, 64), fill=P_DANGER_AMBER, outline=P_BLACK, width=1)
    # Top decoration (crown-like)
    for cx in [42, 52, 64, 76, 86]:
        draw.polygon([(cx - 4, 30), (cx + 4, 30), (cx, 22)], fill=P_BRONZE_DARK, outline=P_BLACK, width=1)
    # Rivets on shield border
    for cx, cy in [(38, 36), (90, 36), (38, 74), (90, 74)]:
        draw.ellipse((cx - 3, cy - 3, cx + 3, cy + 3), fill=P_RUST_DARK, outline=P_BLACK, width=1)
    return img


# ---------- T3 item icons (64×64 transparent) ----------


def gen_composite_blade() -> Image.Image:
    """Long blade with composite materials — T3 melee weapon."""
    img, draw = new_sprite_canvas(64, 64)
    _draw_tier_frame(draw, P_TIER3_FRAME)
    # Blade (long, slightly curved — diagonal)
    _draw_outlined_polygon(
        draw,
        [(24, 108), (88, 24), (96, 32), (32, 116)],
        P_SAND,
    )
    # Blade edge highlight
    draw.line([(28, 104), (90, 28)], fill=P_BG_PANEL_LIGHT, width=3)
    # Composite stripe (darker material band)
    _draw_outlined_polygon(
        draw,
        [(36, 96), (92, 28), (94, 34), (38, 100)],
        P_GREY_COLD,
        w=2,
    )
    # Fuller (groove along blade)
    draw.line([(40, 88), (84, 36)], fill=P_BG_PANEL, width=2)
    # Guard (crossguard)
    _draw_outlined_rect(draw, (14, 108, 40, 118), P_RUST_DARK, w=3)
    # Grip
    _draw_outlined_rect(draw, (20, 118, 34, 140), P_KHAKI_DARK, w=2)
    # Grip wrapping
    for gy in [122, 128, 134]:
        draw.line([(20, gy), (34, gy)], fill=P_RUST_DARK, width=2)
    # Pommel
    draw.ellipse((20, 138, 34, 150), fill=P_RUST_DARK, outline=P_BLACK, width=2)
    # T3 glow accent (blue highlight near tip)
    draw.line([(84, 28), (88, 24)], fill=P_TIER3_FRAME, width=4)
    return img


def gen_prime_shotgun() -> Image.Image:
    """Modified shotgun with prime_circuit details — T3 ranged weapon."""
    img, draw = new_sprite_canvas(64, 64)
    _draw_tier_frame(draw, P_TIER3_FRAME)
    # Main barrel (thick, horizontal)
    _draw_outlined_rect(draw, (14, 54, 112, 70), P_RUST_DARK, w=2)
    # Double barrel detail
    _draw_outlined_rect(draw, (14, 52, 112, 60), P_KHAKI_DARK, w=2)
    _draw_outlined_rect(draw, (14, 64, 112, 72), P_KHAKI_DARK, w=2)
    # Stock (wooden)
    _draw_outlined_polygon(
        draw, [(14, 54), (36, 54), (36, 90), (10, 98)],
        P_RUST_DARK, w=2,
    )
    # Grip
    _draw_outlined_polygon(
        draw, [(48, 70), (64, 70), (64, 104), (50, 104)],
        P_KHAKI_DARK, w=2,
    )
    # Trigger guard
    draw.arc((52, 90, 64, 108), start=0, end=180, fill=P_BLACK, width=2)
    # Prime circuit module (blue box on receiver)
    _draw_outlined_rect(draw, (68, 42, 96, 54), P_CIRCUIT_BLUE, w=2)
    # Circuit gold trace
    draw.line([(72, 46), (92, 46)], fill=P_CIRCUIT_GOLD, width=2)
    draw.line([(80, 46), (80, 52)], fill=P_CIRCUIT_GOLD, width=2)
    # Muzzle brake
    _draw_outlined_rect(draw, (108, 50, 118, 74), P_GREY_COLD, w=2)
    # Blue glow at muzzle (T3 accent)
    draw.line([(116, 56), (120, 56)], fill=P_TIER3_FRAME, width=3)
    draw.line([(116, 66), (120, 66)], fill=P_TIER3_FRAME, width=3)
    # Pump/foregrip
    _draw_outlined_rect(draw, (74, 70, 100, 82), P_KHAKI_DARK, w=2)
    return img


def gen_captain_armor() -> Image.Image:
    """Heavy armor with insignia on chest plate — T3 armor."""
    img, draw = new_sprite_canvas(64, 64)
    _draw_tier_frame(draw, P_TIER3_FRAME)
    # Shoulder yoke (wide)
    _draw_outlined_polygon(
        draw, [(24, 36), (104, 36), (108, 48), (20, 48)],
        P_GUARD_ARMOR,
    )
    # Front plate (large)
    _draw_outlined_polygon(
        draw, [(20, 48), (108, 48), (112, 104), (16, 104)],
        P_GUARD_ARMOR,
    )
    # Chest plate overlay
    _draw_outlined_rect(draw, (32, 52, 96, 92), P_BG_PANEL_LIGHT, w=2)
    # Captain insignia on chest plate (same as boss)
    _draw_outlined_polygon(
        draw,
        [(50, 62), (64, 56), (78, 62), (76, 70), (64, 64), (52, 70)],
        P_GUARD_ACCENT, w=2,
    )
    # Plate seam lines
    draw.line([(32, 72), (96, 72)], fill=P_GUARD_ARMOR_DARK, width=2)
    # Rivets
    for cx, cy in [(36, 56), (92, 56), (36, 88), (92, 88)]:
        draw.ellipse((cx - 3, cy - 3, cx + 3, cy + 3), fill=P_RUST_DARK, outline=P_BLACK, width=1)
    # T3 blue accent stripe
    draw.line([(24, 44), (104, 44)], fill=P_TIER3_FRAME, width=3)
    # Collar
    _draw_outlined_rect(draw, (44, 30, 84, 40), P_GUARD_ARMOR_DARK, w=2)
    # Straps
    draw.line([(48, 36), (48, 24)], fill=P_BLACK, width=3)
    draw.line([(80, 36), (80, 24)], fill=P_BLACK, width=3)
    # Side plates
    _draw_outlined_rect(draw, (16, 60, 30, 100), P_GUARD_ARMOR_DARK, w=2)
    _draw_outlined_rect(draw, (98, 60, 112, 100), P_GUARD_ARMOR_DARK, w=2)
    return img


# ---------- Gas overlay (256×256 semi-transparent) ----------


def gen_gas_overlay() -> Image.Image:
    """Semi-transparent green-yellow textured noise for gas zones.
    Optimized for small file size: uses quantized alpha bands and large
    uniform regions with minimal unique pixel values."""
    W, H = 256, 256
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    rng = random.Random(42)

    # Base fill — uniform semi-transparent green-yellow (single color for compression)
    draw.rectangle((0, 0, W, H), fill=(0x50, 0x90, 0x3A, 50))

    # Large soft blobs (fewer, larger — compresses better)
    blob_data = [
        (64, 64, 50, 40, (0x3D, 0x7C, 0x3A, 35)),
        (192, 64, 45, 35, (0x60, 0xA0, 0x3A, 30)),
        (128, 128, 60, 50, (0x50, 0x90, 0x3A, 40)),
        (64, 192, 40, 35, (0x7C, 0xB4, 0x3A, 35)),
        (192, 192, 55, 45, (0x3D, 0x7C, 0x3A, 30)),
        (128, 48, 35, 30, (0x60, 0xA0, 0x3A, 25)),
        (48, 128, 40, 30, (0x50, 0x90, 0x3A, 30)),
        (200, 128, 35, 30, (0x7C, 0xB4, 0x3A, 25)),
    ]
    for cx, cy, rx, ry, color in blob_data:
        draw.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=color)

    # Wisps (few, with uniform colors)
    wisps = [
        ((20, 40), (80, 60), (140, 30), (0x3D, 0x7C, 0x3A, 30), 4),
        ((180, 80), (220, 120), (160, 160), (0x60, 0xA0, 0x3A, 25), 3),
        ((60, 180), (120, 200), (180, 170), (0x7C, 0xB4, 0x3A, 20), 3),
        ((40, 100), (90, 80), (140, 110), (0x50, 0x90, 0x3A, 25), 2),
    ]
    for (x0, y0), (x1, y1), (x2, y2), color, width in wisps:
        draw.line([(x0, y0), (x1, y1), (x2, y2)], fill=color, width=width)

    # Mild blur — small radius to keep compression good
    img = img.filter(ImageFilter.GaussianBlur(radius=4))

    # Quantize alpha to reduce unique pixel count (helps PNG compression)
    pixels = img.load()
    for y in range(H):
        for x in range(W):
            r, g, b, a = pixels[x, y]
            a = (a // 8) * 8  # quantize to steps of 8
            if a < 8:
                pixels[x, y] = (0, 0, 0, 0)
            else:
                pixels[x, y] = (r, g, b, a)

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
        # Boss sprites (128×128)
        AssetSpec(s / "sprites/mobs/forest_alpha_mutant.png", (128, 128), gen_forest_alpha_mutant),
        AssetSpec(s / "sprites/mobs/warehouse_drone_prime.png", (128, 128), gen_warehouse_drone_prime),
        AssetSpec(s / "sprites/mobs/city_guard_captain.png", (128, 128), gen_city_guard_captain),
        # Boss-drop icons (64×64)
        AssetSpec(s / "sprites/items/mutated_gland.png", (64, 64), gen_mutated_gland),
        AssetSpec(s / "sprites/items/prime_circuit.png", (64, 64), gen_prime_circuit),
        AssetSpec(s / "sprites/items/captain_insignia.png", (64, 64), gen_captain_insignia),
        # T3 item icons (64×64)
        AssetSpec(s / "sprites/items/composite_blade.png", (64, 64), gen_composite_blade),
        AssetSpec(s / "sprites/items/prime_shotgun.png", (64, 64), gen_prime_shotgun),
        AssetSpec(s / "sprites/items/captain_armor.png", (64, 64), gen_captain_armor),
        # Gas overlay (256×256)
        AssetSpec(s / "overlays/gas_overlay.png", (256, 256), gen_gas_overlay),
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
