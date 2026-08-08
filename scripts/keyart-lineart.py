"""
Derive public/creative/dear-suspect-figure.png from the DEAR SUSPECT key art.

    python scripts/keyart-lineart.py

Requires pillow and numpy. The source lives outside the repo, in the studio's
press kit, and is not committed — this script is here so the derived plate can
be regenerated or re-tuned rather than being an unexplained binary.

Why keying and not edge detection: the artwork is already brush strokes on
near-black. Running an edge filter over brushwork gives you a doubled outline
around every stroke and loses the weight that makes it read as ink. Keying the
black out keeps the strokes exactly as drawn, which is what "hollow it out and
leave the lines" means for this image.

Ink presence is max(R, G, B), not luminance. The red strokes sit near 0.1
luminance and would vanish; their max channel is about 0.63.
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path(
    r"C:\Users\shiyi\OneDrive\ELEGISTS STUDIO\DEAR SUSPECT"
    r"\MARKETING ASSET\1_PRESS KIT\Key Art\key_art_main.png"
)
OUT = Path(sys.argv[1] if len(sys.argv) > 1 else "public/creative/dear-suspect-figure.png")

BONE = (242, 239, 233)
TARGET_H = 1200

# Right edge stops at 2480: past that the S of SUSPECT creeps into frame.
CROP = (100, 60, 2480, None)

# Below LO is background, above HI is a full-strength stroke. Taken from the
# percentile spread of the source, not guessed.
LO, HI = 0.14, 0.72

img = Image.open(SRC).convert("RGB")
left, top, right, _ = CROP
crop = img.crop((left, top, right, img.size[1]))
crop = crop.resize((round(crop.size[0] * TARGET_H / crop.size[1]), TARGET_H), Image.LANCZOS)

ink = np.asarray(crop).astype(np.float32).max(axis=2) / 255.0
alpha = np.clip((ink - LO) / (HI - LO), 0.0, 1.0) ** 0.85


def ramp(n: int, frac: float) -> np.ndarray:
    edge = max(1, int(n * frac))
    r = np.ones(n, dtype=np.float32)
    r[:edge] = np.linspace(0.0, 1.0, edge)
    return r


# The source cuts the dress off at its own bottom edge; left alone that reads
# as a mistake. Fading the borders makes the plate emerge from the dark.
h, w = alpha.shape
alpha *= np.outer(ramp(h, 0.06) * ramp(h, 0.20)[::-1], ramp(w, 0.07) * ramp(w, 0.07)[::-1])

rgb = np.zeros((*alpha.shape, 3), dtype=np.uint8)
rgb[..., 0], rgb[..., 1], rgb[..., 2] = BONE
OUT.parent.mkdir(parents=True, exist_ok=True)
Image.fromarray(np.dstack([rgb, (alpha * 255).astype(np.uint8)]), "RGBA").save(OUT, optimize=True)
print(f"wrote {OUT} ({OUT.stat().st_size / 1024:.0f} KB)")
