"""
Prepare stage photographs for the deck on the Creative page.

    python scripts/live-photos.py _incoming/live/*.jpg
    python scripts/live-photos.py _incoming/live/summer-2022.jpg --name oneirism-summer-2022

Each photograph is written to public/creative/live/<name>.jpg, no larger than
1800px on its long edge, and the entry for src/content/performances.ts is
printed for pasting.

🔴 **Every scrap of metadata is dropped.** A phone's EXIF block carries the
time the picture was taken, the device, and very often the GPS position of the
venue. None of that belongs on a public site. The orientation tag is applied to
the pixels *before* it is discarded, so a photograph shot sideways still comes
out the right way up.

Originals stay in _incoming/, which is gitignored. Name the output by content
(the band, the festival, the year) rather than by the camera's counter: public/
URLs do not change when a file does, and replacing a photograph in place would
leave the image optimiser serving the old one.
"""

import argparse
import re
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "creative" / "live"
LONG_EDGE = 1800
QUALITY = 84


def slug(text: str) -> str:
    text = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return text or "photo"


def prepare(source: Path, name: str | None) -> None:
    img = ImageOps.exif_transpose(Image.open(source)).convert("RGB")
    img.thumbnail((LONG_EDGE, LONG_EDGE), Image.LANCZOS)

    OUT.mkdir(parents=True, exist_ok=True)
    target = OUT / f"{slug(name or source.stem)}.jpg"
    if target.exists():
        raise SystemExit(f"{target.relative_to(ROOT)} exists — pick another --name rather than replacing it")

    # No `exif=` argument, so nothing from the source's metadata is carried
    # across; `optimize` and `progressive` are for the wire, not the look.
    img.save(target, "JPEG", quality=QUALITY, optimize=True, progressive=True)

    w, h = img.size
    print(f"  {target.relative_to(ROOT)}  {w}×{h}  {target.stat().st_size / 1024:.0f} KB")
    print(f'  {{ src: "/creative/live/{target.name}", width: {w}, height: {h}, alt: "" }},')


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("photos", type=Path, nargs="+")
    ap.add_argument("--name", help="output name (only with a single photograph)")
    args = ap.parse_args()

    if args.name and len(args.photos) != 1:
        raise SystemExit("--name applies to one photograph at a time")

    for photo in args.photos:
        if not photo.is_file():
            raise SystemExit(f"not found: {photo}")
        prepare(photo, args.name)


if __name__ == "__main__":
    main()
