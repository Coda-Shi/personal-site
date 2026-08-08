"""
Derive the Creative sector's line plates from the studio's press kit.

    python scripts/keyart-lineart.py

Requires pillow and numpy. The sources live outside the repo and are not
committed; this script is here so the plates can be regenerated or re-tuned
rather than sitting in public/ as unexplained binaries.

Why keying and not edge detection: both sources are already line work. Running
an edge filter over a brush stroke gives you a doubled outline around it and
throws away the weight that makes it read as ink. Keying the ground out keeps
the strokes exactly as drawn.

The two sources need opposite metrics:
  key art  — cream and red strokes on near-black. Ink is max(R,G,B); the red
             strokes sit near 0.1 luminance and would vanish, but their max
             channel is 0.63.
  ES logo  — near-white strokes on saturated blue. Ink is min(R,G,B); blue has
             a low red channel, white is high in all three. Separation is
             almost binary: p97 = 0.11, p99 = 0.87.
"""

from pathlib import Path

import numpy as np
from PIL import Image

PRESS = Path(
    r"C:\Users\shiyi\OneDrive\ELEGISTS STUDIO\DEAR SUSPECT\MARKETING ASSET\1_PRESS KIT"
)
BONE = (242, 239, 233)


def ramp(n: int, frac: float) -> np.ndarray:
    edge = max(1, int(n * frac))
    r = np.ones(n, dtype=np.float32)
    r[:edge] = np.linspace(0.0, 1.0, edge)
    return r


def plate(
    src: Path,
    out: Path,
    *,
    metric: str,
    crop: tuple[int, int, int, int],
    lo: float,
    hi: float,
    height: int,
    gamma: float = 0.85,
    feather: tuple[float, float, float] | None = None,
    trim: bool = False,
) -> None:
    img = Image.open(src).convert("RGB").crop(crop)
    a = np.asarray(img).astype(np.float32) / 255.0
    ink = a.max(axis=2) if metric == "max" else a.min(axis=2)
    alpha = np.clip((ink - lo) / (hi - lo), 0.0, 1.0) ** gamma

    if trim:
        ys, xs = np.where(alpha > 0.08)
        pad = 12
        alpha = alpha[
            max(0, ys.min() - pad) : ys.max() + pad,
            max(0, xs.min() - pad) : xs.max() + pad,
        ]

    if feather:
        top, bottom, side = feather
        h, w = alpha.shape
        alpha *= np.outer(
            ramp(h, top) * ramp(h, bottom)[::-1], ramp(w, side) * ramp(w, side)[::-1]
        )

    h, w = alpha.shape
    plate_img = Image.fromarray((alpha * 255).astype(np.uint8), "L").resize(
        (round(w * height / h), height), Image.LANCZOS
    )
    rgb = np.zeros((height, plate_img.size[0], 3), dtype=np.uint8)
    rgb[..., 0], rgb[..., 1], rgb[..., 2] = BONE
    out.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(np.dstack([rgb, np.asarray(plate_img)]), "RGBA").save(out, optimize=True)
    print(f"wrote {out}  {plate_img.size[0]}x{height}  ({out.stat().st_size / 1024:.0f} KB)")


# Right edge stops at 2480: past that the S of SUSPECT creeps into frame. The
# source cuts the dress off at its own bottom edge, so the borders are feathered
# — left hard, that reads as a mistake rather than as a crop.
plate(
    PRESS / "Key Art" / "key_art_main.png",
    Path("public/creative/dear-suspect-figure.png"),
    metric="max",
    crop=(100, 60, 2480, 2943),
    lo=0.14,
    hi=0.72,
    # 980 rather than 1200: this sits at ~20% opacity behind notation, and the
    # extra detail cost 180 KB that nobody can see.
    height=980,
    feather=(0.06, 0.20, 0.07),
)

# The lyre mark only. The ELEGISTS STUDIO wordmark below it would compete with
# the notation in the same field, and the mark alone is the stronger drawing.
plate(
    PRESS / "Studio Logo" / "ES Logo.png",
    Path("public/creative/elegists-mark.png"),
    metric="min",
    crop=(400, 85, 615, 350),
    lo=0.30,
    hi=0.70,
    height=520,
    gamma=0.9,
    trim=True,
)
