#!/usr/bin/env python3
"""M9 sprite generator — military graphic novel style backgrounds and item icons.

Uses Pillow (stdlib-free alternative: pure canvas via struct + wave as in M7,
but backgrounds need rich visuals, so Pillow is the right tool).
Style: Darkest Dungeon meets military post-apocalyptic.
"""

import json
import math
import os
import random
from pathlib import Path

random.seed(42)

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent.parent
ASSETS = ROOT / "assets"

# Style-guide palette
BG_CHARCOAL = (0x1A, 0x1A, 0x1A)
BG_DARK_GREY = (0x2D, 0x2D, 0x2A)
OLIVE = (0x4A, 0x4A, 0x3A)
RUST = (0x8B, 0x73, 0x55)
DARK_GREEN = (0x3D, 0x5C, 0x3A)
SAND = (0xD4, 0xC5, 0xA0)
BLOOD_RED = (0x8B, 0x00, 0x00)
AMBER = (0xFF, 0xB3, 0x00)
GOLD = (0xC5, 0xA2, 0x67)
DIM_YELLOW = (0x5A, 0x5A, 0x1A)

# Item rarity colors
T1_GREY = (0x9E, 0x9E, 0x9E)
T2_GREEN = (0x4C, 0xAF, 0x50)
T3_BLUE = (0x21, 0x96, 0xF3)
T4_PURPLE = (0x9C, 0x27, 0xB0)


def make_bg_width():
    return 800


def make_bg_height():
    return 600


# ── Zone backgrounds ──────────────────────────────────────────────

ZONE_PALETTES = {
    "suburbs": {
        "sky": (0x1A, 0x1C, 0x1A),
        "main": (0x3D, 0x42, 0x38),
        "accent": (0x5A, 0x4A, 0x3A),
        "detail": (0x8B, 0x80, 0x60),
    },
    "school": {
        "sky": (0x1A, 0x1A, 0x1E),
        "main": (0x2D, 0x2D, 0x35),
        "accent": (0x4A, 0x4A, 0x50),
        "detail": (0x6A, 0x5A, 0x45),
    },
    "factory": {
        "sky": (0x20, 0x18, 0x10),
        "main": (0x3D, 0x30, 0x28),
        "accent": (0x6A, 0x40, 0x20),
        "detail": (0x8B, 0x73, 0x55),
    },
    "hospital": {
        "sky": (0x1A, 0x1C, 0x1C),
        "main": (0x2A, 0x2D, 0x2A),
        "accent": (0x3D, 0x5C, 0x5A),
        "detail": (0x6A, 0x6A, 0x5A),
    },
    "metro": {
        "sky": (0x0A, 0x0A, 0x0A),
        "main": (0x1A, 0x1A, 0x18),
        "accent": (0x2D, 0x25, 0x20),
        "detail": (0x4A, 0x3A, 0x2A),
    },
    "power_plant": {
        "sky": (0x18, 0x18, 0x22),
        "main": (0x2D, 0x2A, 0x38),
        "accent": (0x3D, 0x5C, 0x3A),
        "detail": (0x5A, 0x80, 0x4A),
    },
}


def draw_zone_bg(zone_id: str):
    pal = ZONE_PALETTES[zone_id]
    w, h = make_bg_width(), make_bg_height()
    img = Image.new("RGB", (w, h), pal["sky"])
    draw = ImageDraw.Draw(img)

    # Ground
    ground_y = h - random.randint(180, 260)
    for y in range(ground_y, h):
        r = pal["main"][0] + random.randint(-8, 8)
        g = pal["main"][1] + random.randint(-8, 8)
        b = pal["main"][2] + random.randint(-8, 8)
        draw.line([(0, y), (w, y)], fill=(max(0, r), max(0, g), max(0, b)))

    # Horizon buildings
    num_buildings = random.randint(5, 10)
    for _ in range(num_buildings):
        bx = random.randint(0, w - 60)
        bw = random.randint(30, 120)
        bh = random.randint(60, min(160, ground_y - 20))
        by = ground_y - bh
        shading = random.randint(-15, 15)
        r = max(0, min(255, pal["accent"][0] + shading))
        g = max(0, min(255, pal["accent"][1] + shading))
        b = max(0, min(255, pal["accent"][2] + shading))
        draw.rectangle([bx, by, bx + bw, ground_y], fill=(r, g, b))
        draw.rectangle([bx, by, bx + bw, ground_y], outline=(0, 0, 0), width=2)

        # Windows
        for wy in range(by + 8, ground_y - 12, 16):
            wx = bx + random.randint(4, max(4, bw - 16))
            win_color = AMBER if random.random() < 0.3 else (20, 20, 20)
            draw.rectangle([wx, wy, wx + 8, wy + 10], fill=win_color)

    # Details: debris, rubble, craters
    for _ in range(random.randint(15, 30)):
        dx = random.randint(0, w)
        dy = random.randint(ground_y, h - 4)
        size = random.randint(2, 6)
        draw.rectangle(
            [dx, dy, dx + size, dy + size], fill=pal["detail"], outline=(0, 0, 0), width=1
        )

    # Atmospheric grain
    for _ in range(400):
        gx = random.randint(0, w - 1)
        gy = random.randint(0, h - 1)
        grain = random.randint(0, 20)
        pixel = img.getpixel((gx, gy))  # type: ignore[arg-type]
        r = max(0, min(255, pixel[0] + grain - 10))  # type: ignore[index]
        g = max(0, min(255, pixel[1] + grain - 10))  # type: ignore[index]
        b = max(0, min(255, pixel[2] + grain - 10))  # type: ignore[index]
        draw.point((gx, gy), fill=(r, g, b))

    return img


# ── Item icons ────────────────────────────────────────────────────

ITEM_TIERS = {
    # T1 — grey
    "bandage": 1, "wood": 1, "scrap": 1, "cloth": 1, "food": 1, "water": 1,
    "rope": 1, "medkit": 1, "herbs": 1, "string": 1, "nail": 1,
    "bottle": 1, "plastic": 1, "can": 1, "wire": 1, "battery": 1,
    "glass": 1, "brick": 1, "paper": 1, "tape": 1,
    # T2 — green
    "crowbar": 2, "pipe_rifle": 2, "tactical_vest": 2, "helmet": 2,
    "gas_mask": 2, "large_medkit": 2, "energy_drink": 2,
    "smoke_bomb": 2, "emp_grenade": 2, "leather": 2,
    "gunpowder": 2, "ammo_rifle": 2, "circuitry": 2, "electronics": 2,
    "oil": 2, "medical_supplies": 2, "police_baton": 2, "hunting_rifle": 2,
    "guard_armor": 2, "copper_coil": 2, "rail_shard": 2, "fuel_can": 2,
    "syringe": 2, "toolkit": 2, "chemical_reagent": 2, "fertilizer": 2,
    "seeds": 2, "lockpick": 2, "radio_part": 2, "cable": 2,
    "rusty_gear": 2, "lens": 2, "pipe": 2, "spring": 2,
    "generator_part": 2, "suburban_scrap": 2, "surgical_kit": 2,
    "antidote": 2, "soldering_iron": 2,
    # T3 — blue (items already exist but included for completeness)
    "composite_blade": 3, "prime_circuit": 3, "prime_shotgun": 3,
    "mutated_gland": 3, "captain_insignia": 3, "captain_armor": 3,
}

ICON_COLORS = {
    1: T1_GREY,
    2: T2_GREEN,
    3: T3_BLUE,
    4: T4_PURPLE,
}

ICON_SIZE = 64


def draw_item_icon(item_id: str):
    tier = ITEM_TIERS.get(item_id, 2)
    color = ICON_COLORS[tier]
    img = Image.new("RGBA", (ICON_SIZE, ICON_SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx, cy = ICON_SIZE // 2, ICON_SIZE // 2
    r = ICON_SIZE // 2 - 3

    # Background circle
    bg_r, bg_g, bg_b = BG_DARK_GREY
    draw.ellipse([3, 3, ICON_SIZE - 3, ICON_SIZE - 3], fill=(bg_r, bg_g, bg_b, 255))
    draw.ellipse([3, 3, ICON_SIZE - 3, ICON_SIZE - 3], outline=(0, 0, 0, 255), width=2)

    # Item symbol — deterministic from item_id
    seed = sum(ord(c) * (i + 1) for i, c in enumerate(item_id))
    rng = random.Random(seed)

    # Draw a stylized geometric shape based on the item
    shape_type = rng.randint(0, 5)

    if shape_type == 0:
        # Diamond
        pts = [
            (cx, cy - r + 8),
            (cx + r - 8, cy),
            (cx, cy + r - 8),
            (cx - r + 8, cy),
        ]
        draw.polygon(pts, fill=color, outline=SAND, width=1)
    elif shape_type == 1:
        # Cross
        bw = 5
        draw.rectangle([cx - bw, cy - r + 8, cx + bw, cy + r - 8], fill=color)
        draw.rectangle([cx - r + 8, cy - bw, cx + r - 8, cy + bw], fill=color)
        draw.rectangle([cx - bw, cy - r + 8, cx + bw, cy + r - 8], outline=SAND, width=1)
        draw.rectangle([cx - r + 8, cy - bw, cx + r - 8, cy + bw], outline=SAND, width=1)
    elif shape_type == 2:
        # Triangle (up)
        pts = [(cx, cy - r + 6), (cx + r - 8, cy + r - 6), (cx - r + 8, cy + r - 6)]
        draw.polygon(pts, fill=color, outline=SAND, width=1)
    elif shape_type == 3:
        # Stacked rectangles
        draw.rectangle([cx - r + 10, cy + 4, cx + r - 10, cy + r - 6], fill=color)
        draw.rectangle([cx - r + 10, cy + 4, cx + r - 10, cy + r - 6], outline=SAND, width=1)
        draw.rectangle([cx - r + 6, cy - r + 8, cx + r - 6, cy], fill=color)
        draw.rectangle([cx - r + 6, cy - r + 8, cx + r - 6, cy], outline=SAND, width=1)
    elif shape_type == 4:
        # Circle with dot
        draw.ellipse([cx - r + 10, cy - r + 10, cx + r - 10, cy + r - 10], fill=color)
        draw.ellipse([cx - r + 10, cy - r + 10, cx + r - 10, cy + r - 10], outline=SAND, width=1)
        draw.ellipse([cx - 4, cy - 4, cx + 4, cy + 4], fill=SAND)
    else:
        # Gear-like
        for angle in range(0, 360, 45):
            rad = math.radians(angle)
            tx = int(cx + (r - 8) * math.cos(rad))
            ty = int(cy + (r - 8) * math.sin(rad))
            draw.rectangle([tx - 3, ty - 8, tx + 3, ty + 8], fill=color)
            draw.rectangle([tx - 3, ty - 8, tx + 3, ty + 8], outline=SAND, width=1)
        draw.ellipse([cx - r + 14, cy - r + 14, cx + r - 14, cy + r - 14], fill=color)
        draw.ellipse(
            [cx - r + 14, cy - r + 14, cx + r - 14, cy + r - 14],
            outline=SAND, width=1,
        )

    # Bold black outline on the icon boundary
    draw.ellipse([3, 3, ICON_SIZE - 3, ICON_SIZE - 3], outline=(0, 0, 0, 255), width=2)

    return img


# ── Main ──────────────────────────────────────────────────────────

def main():
    # Zone backgrounds
    zones_dir = ASSETS / "backgrounds"
    existing = {f.stem for f in zones_dir.glob("*.png")}
    with open(ROOT / "content" / "zones.json") as f:
        all_zones = {z["id"] for z in json.load(f)}

    for zone_id in sorted(all_zones):
        if zone_id in existing:
            print(f"  SKIP bg_{zone_id} (exists)")
            continue
        img = draw_zone_bg(zone_id)
        path = zones_dir / f"{zone_id}.png"
        img.save(path, optimize=True)
        size_kb = os.path.getsize(path) / 1024
        print(f"  OK   bg_{zone_id} → {path.name} ({size_kb:.0f} KB)")

    # Item icons
    items_dir = ASSETS / "sprites" / "items"
    existing_items = {f.stem for f in items_dir.glob("*.png")}
    with open(ROOT / "content" / "items.json") as f:
        all_items = [it["id"] for it in json.load(f)]

    for item_id in sorted(all_items):
        if item_id in existing_items:
            continue
        img = draw_item_icon(item_id)
        path = items_dir / f"{item_id}.png"
        img.save(path, optimize=True)
        size_kb = os.path.getsize(path) / 1024
        print(f"  OK   item_{item_id} → {path.name} ({size_kb:.0f} KB)")

    print("\nDone.")


if __name__ == "__main__":
    main()
