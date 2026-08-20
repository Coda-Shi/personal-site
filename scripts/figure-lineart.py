"""
Turn the four reference diagrams into bone-white plates for the Scholarly field.

    python scripts/figure-lineart.py

Requires pillow and numpy. Sources live in `_incoming/`, which is gitignored;
this script is committed so the plates can be regenerated or re-tuned rather
than sitting in public/ as unexplained binaries.

Why treated scans and not drawings. The first attempt redrew all four in SVG,
which is right for a figure with ten labels and wrong for these: the R.S.I.
diagram alone carries four rings, nine named regions and nine annotations with
leader lines, and approximating that many tangencies by eye produced a figure
whose extra circles cut through the three registers instead of grazing them.
The owner's word for it was 奇怪的圆圈, and he was right. These are reference
diagrams with settled geometry — reproducing them is transcription, not
draughtsmanship, and a scan transcribes perfectly.

The metric is the inverse of the one in keyart-lineart.py, because the ground
is the opposite. There the strokes were light on near-black and ink was
max(R,G,B); here they are dark on white, so ink is 255-min(R,G,B). Using the
*minimum* channel rather than luminance is what keeps the semiotic square's
blue arrows and red captions: pure blue is (0,0,255), whose luminance is high
enough to fade badly but whose minimum channel is 0, the same as black ink.
Every coloured stroke therefore comes through at full strength and lands as
bone, which is what this layer wants — colour here would collide with the three
track pigments, and those are the site's only colour code (D7).
"""

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "_incoming"
OUT = ROOT / "public" / "scholarly"
BONE = (242, 239, 233)

# Sources are named by paste timestamp, which says nothing. Mapped here once so
# the rest of the file can talk about the figures.
#
# The third column is the emitted width, set at twice what each plate renders at
# on a 1512×944 laptop — 293px for the two wide figures, 236 and 227 for the two
# tall ones. Enough for a 2× display and no more: these are line drawings, so
# nearly all of the file is the antialiasing along the strokes, and every extra
# pixel of width is paid for four times over.
FIGURES = [
    ("image-1787189348897.png", "rsi.png", 640),
    ("image-1787189327869.png", "jung.png", 512),
    ("image-1787189319870.png", "graph-of-desire.png", 512),
    ("image-1787189335504.png", "semiotic-square.png", 640),
]

# Alpha is quantised to this many levels before saving. A line drawing's entropy
# is almost entirely in the soft edge of each stroke, so this is where the file
# size is: 24 levels costs a third of the bytes of 256 and there is nothing to
# see at the difference, because these plates render at 0.26 opacity over a
# flooded ground. Going to 16 starts to show as banding on the long shallow
# curves in the graph of desire.
LEVELS = 24

# Below `lo` is paper and goes fully transparent; above `hi` is solid ink. The
# gap between them is where antialiasing lives, and it has to stay a gap: a hard
# threshold turns every curve in these figures into a staircase, which at the
# size they render reads as a rendering fault rather than as a line.
LO, HI, GAMMA = 0.10, 0.55, 0.85


def plate(src: Path, out: Path, width: int) -> tuple[int, int]:
    img = Image.open(src).convert("RGB")
    a = np.asarray(img).astype(np.float32) / 255.0
    ink = 1.0 - a.min(axis=2)
    alpha = np.clip((ink - LO) / (HI - LO), 0.0, 1.0) ** GAMMA

    # Trim the paper margin. The boxes in symbol-field.tsx are set from the
    # emitted aspect ratio, so a figure that keeps a fat white border would be
    # scaled to fit the border rather than the drawing.
    ys, xs = np.where(alpha > 0.08)
    pad = 6
    alpha = alpha[
        max(0, ys.min() - pad) : ys.max() + pad,
        max(0, xs.min() - pad) : xs.max() + pad,
    ]

    h, w = alpha.shape
    height = round(h * width / w)
    scaled = np.asarray(
        Image.fromarray((alpha * 255).astype(np.uint8), "L").resize(
            (width, height), Image.LANCZOS
        )
    ).astype(np.float32)
    quantised = np.round(scaled / 255 * (LEVELS - 1)) / (LEVELS - 1) * 255

    # Kept as RGBA rather than greyscale-plus-alpha, which would be 14% smaller.
    # Greyscale cannot carry a hue, so bone would land at #F2F2F2 instead of
    # #F2EFE9 — invisible at these opacities, but the palette is the one thing
    # on this site that is pinned by decision rather than by taste (D7), and
    # dropping a track's worth of warmth out of it to save 34KB is the kind of
    # trade that is only ever noticed years later.
    rgb = np.zeros((height, width, 3), dtype=np.uint8)
    rgb[..., 0], rgb[..., 1], rgb[..., 2] = BONE
    plate_img = Image.fromarray(rgb, "RGB").convert("RGBA")
    plate_img.putalpha(Image.fromarray(quantised.astype(np.uint8), "L"))
    out.parent.mkdir(parents=True, exist_ok=True)
    plate_img.save(out, optimize=True)
    return width, height


def main() -> None:
    total = 0
    for name, target, width in FIGURES:
        src = SRC / name
        if not src.exists():
            raise SystemExit(f"missing source: {src}")
        w, h = plate(src, OUT / target, width)
        size = (OUT / target).stat().st_size
        total += size
        print(f"{target:24} {w}x{h}  ratio {w / h:.4f}  {size / 1024:.0f} KB")
    print(f"{'total':24} {total / 1024:.0f} KB")


if __name__ == "__main__":
    main()
