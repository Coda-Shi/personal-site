"""
Cut the hub portrait out of a photograph.

    python scripts/hub-portrait.py path/to/photo.jpg
    python scripts/hub-portrait.py path/to/photo.jpg --box 120 40 980 900

Writes two files so the choice can be made by looking rather than by arguing:

    public/hub/portrait.png         bone monochrome
    public/hub/portrait-colour.png  untouched colour

Monochrome is the one that fits the system. D9 gives each track a pigment —
Klein blue, oxblood, old gold — and leaves the hub deliberately uncoloured,
which is how the composition says the three public identities are encoded and
the private one is not. A full-colour photograph in the middle introduces a
fourth colour into a scheme where colour carries meaning, and quietly breaks
that rule. Toning it to bone keeps the face and drops the argument.

The circular alpha is feathered by a pixel or so. A hard-edged circle scaled
into a 145px hub aliases into a visible staircase.
"""

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "hub"
SIZE = 640  # generous for a hub that renders around 145px, and still tiny
BONE = (242, 239, 233)


def circular_alpha(size: int, feather: float = 1.4) -> Image.Image:
    """Anti-aliased disc, built by supersampling rather than by drawing."""
    y, x = np.mgrid[0:size, 0:size].astype(np.float32)
    centre = (size - 1) / 2
    r = np.hypot(x - centre, y - centre)
    edge = centre - 0.5
    alpha = np.clip((edge - r) / feather + 0.5, 0.0, 1.0)
    return Image.fromarray((alpha * 255).astype(np.uint8), "L")


def square(img: Image.Image, box: tuple[int, int, int, int] | None) -> Image.Image:
    if box:
        return img.crop(box)
    # Centre horizontally, but bias upward: a portrait's subject sits above the
    # midline far more often than below it, and a centred square on a tall
    # photo tends to cut the forehead.
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top = max(0, (h - side) // 2 - int(side * 0.08))
    return img.crop((left, top, left + side, top + side))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("photo", type=Path)
    ap.add_argument("--box", type=int, nargs=4, metavar=("L", "T", "R", "B"))
    args = ap.parse_args()

    if not args.photo.is_file():
        raise SystemExit(f"not found: {args.photo}")

    img = ImageOps.exif_transpose(Image.open(args.photo)).convert("RGB")
    img = square(img, tuple(args.box) if args.box else None)
    img = img.resize((SIZE, SIZE), Image.LANCZOS)
    mask = circular_alpha(SIZE)

    OUT.mkdir(parents=True, exist_ok=True)

    colour = img.copy()
    colour.putalpha(mask)
    colour.save(OUT / "portrait-colour.png", optimize=True)

    # Luminance, then tinted toward bone rather than left neutral grey — a pure
    # greyscale face reads cold against a warm off-white palette.
    grey = np.asarray(ImageOps.grayscale(img)).astype(np.float32) / 255.0
    grey = np.clip((grey - 0.5) * 1.12 + 0.5, 0, 1)  # a little contrast back
    toned = np.dstack([grey * c for c in BONE]).astype(np.uint8)
    mono = Image.fromarray(toned, "RGB")
    mono.putalpha(mask)
    mono.save(OUT / "portrait.png", optimize=True)

    for name in ("portrait.png", "portrait-colour.png"):
        path = OUT / name
        print(f"{path.relative_to(ROOT)}  {SIZE}x{SIZE}  {path.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
