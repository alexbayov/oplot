#!/usr/bin/env python3
"""
process_painted.py — обработка painted-референсов в игровые ассеты.

Pipeline:
  JPG из oplot-redesign/references/ → rembg (отрезаем фон) → trim → square pad
  → resize → PNG в assets/.

Usage:
  python tools/art/process_painted.py character <input.jpg> <out.png> [--size 128]
  python tools/art/process_painted.py background <input.jpg> <out.png> [--size 800x600]
  python tools/art/process_painted.py icon <input.jpg> <out.png> [--size 64]

Запускать строго последовательно для character — rembg грузит 176MB модель
в RAM и параллельные вызовы валят контейнер OOM.
"""

import argparse
import sys
from pathlib import Path
from PIL import Image
from rembg import remove, new_session

_SESSION = None
def get_session():
    global _SESSION
    if _SESSION is None:
        _SESSION = new_session("u2net")
    return _SESSION


def trim_transparent(img: Image.Image, threshold: int = 8) -> Image.Image:
    """Обрезает прозрачные поля по бокам."""
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    alpha = img.split()[-1]
    bbox = alpha.point(lambda p: 255 if p > threshold else 0).getbbox()
    if bbox is None:
        return img
    return img.crop(bbox)


def pad_to_square(img: Image.Image, color=(0, 0, 0, 0)) -> Image.Image:
    """Дополняет до квадрата прозрачным фоном (или фоном color), центрируя сабжект."""
    w, h = img.size
    side = max(w, h)
    bg = Image.new("RGBA", (side, side), color)
    bg.paste(img, ((side - w) // 2, (side - h) // 2), img)
    return bg


def process_character(in_path: Path, out_path: Path, size: int):
    raw = Image.open(in_path).convert("RGBA")
    cut = remove(raw, session=get_session())
    trimmed = trim_transparent(cut)
    squared = pad_to_square(trimmed)
    final = squared.resize((size, size), Image.LANCZOS)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    final.save(out_path, "PNG", optimize=True)
    print(f"  ✓ {out_path.name} ({size}×{size})")


def process_background(in_path: Path, out_path: Path, size_str: str):
    w, h = map(int, size_str.split("x"))
    raw = Image.open(in_path).convert("RGB")
    final = raw.resize((w, h), Image.LANCZOS)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    final.save(out_path, "PNG", optimize=True)
    print(f"  ✓ {out_path.name} ({w}×{h})")


def process_icon(in_path: Path, out_path: Path, size: int):
    raw = Image.open(in_path).convert("RGBA")
    cut = remove(raw, session=get_session())
    trimmed = trim_transparent(cut)
    squared = pad_to_square(trimmed)
    final = squared.resize((size, size), Image.LANCZOS)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    final.save(out_path, "PNG", optimize=True)
    print(f"  ✓ {out_path.name} ({size}×{size})")


def main():
    parser = argparse.ArgumentParser(description="Process painted refs into game assets.")
    parser.add_argument("kind", choices=["character", "background", "icon"])
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--size", default=None, help="Output size (int for char/icon, WxH for bg)")
    args = parser.parse_args()

    if not args.input.exists():
        print(f"ERROR: input not found: {args.input}", file=sys.stderr)
        sys.exit(1)

    if args.kind == "character":
        size = int(args.size or 128)
        process_character(args.input, args.output, size)
    elif args.kind == "background":
        size_str = args.size or "800x600"
        process_background(args.input, args.output, size_str)
    elif args.kind == "icon":
        size = int(args.size or 64)
        process_icon(args.input, args.output, size)


if __name__ == "__main__":
    main()
