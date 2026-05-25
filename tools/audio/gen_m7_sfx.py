#!/usr/bin/env python3
"""M7 SFX generator — deterministic mono 8-bit PCM WAV using stdlib only.

Requirements (PM-approved guardrails):
- stdlib only: wave, struct, math, random. No numpy/scipy/pydub.
- Deterministic: random.seed(42) for identical bytes/MD5 across reruns.
- Low-rate mono 8-bit to stay ≤ 80 KB total for 10 files.
- Output path: assets/audio/<id>.wav

Run from repo root:

    python3 tools/audio/gen_m7_sfx.py
"""

from __future__ import annotations

import math
import os
import random
import struct
import wave
from pathlib import Path

# Determinism guard ----------------------------------------------------------
random.seed(42)

REPO_ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = REPO_ROOT / "assets" / "audio"

# Sample-rate registry (mono, 8-bit unsigned PCM)
RATE_11K = 11025
RATE_8K = 8000


def _float_to_u8(samples: list[float]) -> bytes:
    """Convert float samples [-1.0, 1.0] → unsigned 8-bit PCM [0, 255]."""
    return bytes(int(max(0.0, min(1.0, (s + 1.0) / 2.0)) * 255.0) for s in samples)


def _write_wav(path: Path, rate: int, samples: list[float]) -> int:
    """Write mono 8-bit PCM WAV. Returns file size in bytes."""
    path.parent.mkdir(parents=True, exist_ok=True)
    data = _float_to_u8(samples)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(1)
        w.setframerate(rate)
        w.writeframes(data)
    return path.stat().st_size


# ---- Waveform primitives ----------------------------------------------------

def _sine(t: float, freq: float) -> float:
    return math.sin(2.0 * math.pi * freq * t)


def _square(t: float, freq: float) -> float:
    return 1.0 if math.sin(2.0 * math.pi * freq * t) >= 0 else -1.0


def _saw(t: float, freq: float) -> float:
    phase = (freq * t) % 1.0
    return 2.0 * phase - 1.0


def _noise() -> float:
    return random.uniform(-1.0, 1.0)


def _sweep(t: float, f0: float, f1: float, duration: float) -> float:
    frac = t / duration
    freq = f0 + (f1 - f0) * frac
    return _sine(t, freq)


def _samples(rate: int, duration: float) -> int:
    return int(rate * duration)


# ---- SFX builders -----------------------------------------------------------

def build_ui_click(rate: int = RATE_11K) -> list[float]:
    """Short tick (~0.3 s): square wave burst with fast decay."""
    dur = 0.30
    n = _samples(rate, dur)
    freq = 1200.0
    out = []
    for i in range(n):
        t = i / rate
        env = max(0.0, 1.0 - t / 0.08)
        out.append(_square(t, freq) * env * 0.6)
    return out


def build_ui_blocked(rate: int = RATE_11K) -> list[float]:
    """Error tone (~0.4 s): low-freq saw + noise."""
    dur = 0.40
    n = _samples(rate, dur)
    freq = 180.0
    out = []
    for i in range(n):
        t = i / rate
        env = max(0.0, 1.0 - t / 0.25)
        saw = _saw(t, freq) * 0.5
        nse = _noise() * 0.4
        out.append((saw + nse) * env)
    return out


def build_combat_hit(rate: int = RATE_11K) -> list[float]:
    """Impact thud (~0.25 s): noise burst + exponential decay."""
    dur = 0.25
    n = _samples(rate, dur)
    out = []
    for i in range(n):
        t = i / rate
        env = math.exp(-t / 0.04)
        out.append(_noise() * env * 0.9)
    return out


def build_combat_heal(rate: int = RATE_11K) -> list[float]:
    """Positive chime (~0.3 s): sine sweep up."""
    dur = 0.30
    n = _samples(rate, dur)
    f0, f1 = 400.0, 1200.0
    out = []
    for i in range(n):
        t = i / rate
        env = max(0.0, 1.0 - t / 0.25)
        out.append(_sweep(t, f0, f1, dur) * env * 0.7)
    return out


def build_loot_pickup(rate: int = RATE_11K) -> list[float]:
    """Light pop (~0.5 s): short sine + decay."""
    dur = 0.50
    n = _samples(rate, dur)
    freq = 800.0
    out = []
    for i in range(n):
        t = i / rate
        env = math.exp(-t / 0.10)
        out.append(_sine(t, freq) * env * 0.7)
    return out


def build_craft_success(rate: int = RATE_11K) -> list[float]:
    """Satisfying ding (~0.7 s): two-tone sine."""
    dur = 0.70
    n = _samples(rate, dur)
    out = []
    split = int(rate * 0.32)
    freq1, freq2 = 600.0, 900.0
    for i in range(n):
        t = i / rate
        if i < split:
            env = max(0.0, 1.0 - t / 0.22)
            s = _sine(t, freq1) * env
        else:
            env = max(0.0, 1.0 - (t - split / rate) / 0.22)
            s = _sine(t, freq2) * env
        out.append(s * 0.7)
    return out


def build_radio_signal(rate: int = RATE_8K) -> list[float]:
    """Static burst (~0.9 s): white noise + sine tone."""
    dur = 0.90
    n = _samples(rate, dur)
    out = []
    tone_freq = 440.0
    for i in range(n):
        t = i / rate
        env = max(0.0, 1.0 - t / 0.65)
        tone = _sine(t, tone_freq) * 0.3
        nse = _noise() * 0.6
        out.append((tone + nse) * env)
    return out


def build_level_up(rate: int = RATE_8K) -> list[float]:
    """Ascending chime (~1.0 s): sine arpeggio C-E-G-C."""
    dur = 1.00
    n = _samples(rate, dur)
    notes = [523.25, 659.25, 783.99, 1046.50]
    seg = n // len(notes)
    out = []
    for i in range(n):
        idx = min(i // seg, len(notes) - 1)
        freq = notes[idx]
        t = i / rate
        seg_t = (i - idx * seg) / rate
        env = max(0.0, 1.0 - seg_t / 0.18)
        out.append(_sine(t, freq) * env * 0.7)
    return out


def build_boss_phase(rate: int = RATE_8K) -> list[float]:
    """Heavy transition (~1.0 s): low drone + sweep."""
    dur = 1.00
    n = _samples(rate, dur)
    out = []
    for i in range(n):
        t = i / rate
        drone = _sine(t, 100.0) * 0.5
        sweep = _sweep(t, 200.0, 50.0, dur) * 0.3
        env = max(0.0, 1.0 - t / 0.75)
        out.append((drone + sweep) * env)
    return out


def build_confirm_success(rate: int = RATE_11K) -> list[float]:
    """Bright confirm (~0.4 s): short bright sine."""
    dur = 0.40
    n = _samples(rate, dur)
    freq = 1200.0
    out = []
    for i in range(n):
        t = i / rate
        env = max(0.0, 1.0 - t / 0.15)
        out.append(_sine(t, freq) * env * 0.8)
    return out


# ---- Registry ---------------------------------------------------------------

SFX_REGISTRY = [
    ("ui_click.wav", RATE_11K, build_ui_click),
    ("ui_blocked.wav", RATE_11K, build_ui_blocked),
    ("combat_hit.wav", RATE_11K, build_combat_hit),
    ("combat_heal.wav", RATE_11K, build_combat_heal),
    ("loot_pickup.wav", RATE_11K, build_loot_pickup),
    ("craft_success.wav", RATE_11K, build_craft_success),
    ("radio_signal.wav", RATE_8K, build_radio_signal),
    ("level_up.wav", RATE_8K, build_level_up),
    ("boss_phase.wav", RATE_8K, build_boss_phase),
    ("confirm_success.wav", RATE_11K, build_confirm_success),
]


def generate_all() -> list[tuple[str, int]]:
    results: list[tuple[str, int]] = []
    for fname, rate, builder in SFX_REGISTRY:
        path = OUT_DIR / fname
        samples = builder(rate)
        size = _write_wav(path, rate, samples)
        results.append((fname, size))
    return results


def main() -> None:
    results = generate_all()
    total = sum(size for _, size in results)
    max_name = max(len(name) for name, _ in results)
    print(f"{'File':<{max_name}}  Size (bytes)")
    print(f"{'-' * max_name}  -----------")
    for name, size in results:
        print(f"{name:<{max_name}}  {size:>11}")
    print(f"{'TOTAL':<{max_name}}  {total:>11}")

    # Quick budget check
    total_kb = total / 1024.0
    print(f"\nM7 audio add: {total_kb:.1f} KB (budget ≤ 80 KB)")


if __name__ == "__main__":
    main()
