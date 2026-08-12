"""
Cut the hub portrait out of a photograph.

    python scripts/hub-portrait.py path/to/photo.jpg
    python scripts/hub-portrait.py path/to/photo.jpg --box 120 40 980 900

    src/assets/portrait.png       colour — this is the one that ships
    src/assets/portrait-mono.png  bone monochrome, for comparison only

Written under src/ rather than public/ so it is imported as a module and Next
fingerprints it. A file in public/ keeps its URL when its contents change, and
the image optimiser caches on that URL: replacing this portrait in place once
left /_next/image serving the previous version, greyscale, with no error
anywhere to say so. A content hash in the filename makes that class of staleness
impossible rather than merely unlikely.

Colour, and not on aesthetic grounds. **A black-and-white portrait of a living
person reads as a funeral portrait to Chinese viewers** — 遗像 — and this site
has a Chinese half. That is not a preference to be weighed against composition;
it is a meaning the image carries whether or not it was intended.

The argument monochrome was chosen on, before the owner pointed this out: D9
gives each track a pigment and leaves the hub uncoloured, so a colour
photograph would put a fourth colour into a scheme where colour identifies a
track. It was also overstated. A photograph is not a flat field and does not
compete with the pigments; what D9 actually requires of the hub is the absence
of Klein blue, oxblood and old gold, and a portrait breaks none of that.

The circular alpha is feathered by a pixel or so. A hard-edged circle scaled
into a 145px hub aliases into a visible staircase.
"""

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "assets"
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
    colour.save(OUT / "portrait.png", optimize=True)

    # Luminance, then tinted toward bone rather than left neutral grey — a pure
    # greyscale face reads cold against a warm off-white palette.
    grey = np.asarray(ImageOps.grayscale(img)).astype(np.float32) / 255.0
    grey = np.clip((grey - 0.5) * 1.12 + 0.5, 0, 1)  # a little contrast back
    toned = np.dstack([grey * c for c in BONE]).astype(np.uint8)
    mono = Image.fromarray(toned, "RGB")
    mono.putalpha(mask)
    mono.save(OUT / "portrait-mono.png", optimize=True)

    for name in ("portrait.png", "portrait-mono.png"):
        path = OUT / name
        print(f"{path.relative_to(ROOT)}  {SIZE}x{SIZE}  {path.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
