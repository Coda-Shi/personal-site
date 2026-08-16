"""
Draw the favicon and the Open Graph card from the same geometry as the disc.

    npm run build && python scripts/brand-images.py

Writes:
    src/app/icon.png              512×512, picked up by Next's file conventions
    src/app/apple-icon.png        180×180
    src/app/opengraph-image.png   1200×630

The icons are found by convention. The card is not — [lang]/layout.tsx names it
explicitly, for reasons recorded there. Moving this file will not change which
image is served.

Run it after a build. Cormorant and JetBrains are pulled out of whatever
next/font emitted into .next, so the card is set in the site's own faces rather
than in a Windows lookalike. They arrive as woff2, which Pillow cannot open, so
fontTools converts them in memory.

Two things here deliberately depart from the live disc:

The icon does not use the true pigments. Klein blue, oxblood and old gold were
chosen to sit on a near-black page at full size; at 16px they collapse into one
dark smudge. The icon lifts all three until the ring still reads as three
colours in a browser tab, which is the only job it has. The icon also drops the
portrait — a face at 16px is mud.

The card keeps the true pigments, the bone hairlines, the bezel and the
portrait, because it is only ever seen large.
"""

import io
import math
from pathlib import Path

from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
APP = ROOT / "src" / "app"

VOID = (5, 5, 5)
BONE = (242, 239, 233)

PIGMENT = {"scholarly": (0, 47, 167), "creative": (110, 20, 35), "professional": (106, 82, 22)}
# Lifted for the tab strip; see the note above.
ICON_PIGMENT = {"scholarly": (31, 79, 216), "creative": (168, 40, 58), "professional": (168, 138, 46)}

# The angles are TRACK_ARCS verbatim. The 4° gaps between sectors are already
# baked into them — do not subtract a further margin here or the ring opens up
# twice as wide as it does on the page.
ARCS = {"scholarly": (212, 328), "creative": (92, 208), "professional": (332, 448)}

# Radii as fractions of the board, taken from trinity-disc.tsx over its 400 unit
# viewBox so the proportions survive any output size.
R_OUTER, R_INNER = 172 / 400, 72 / 400
R_TICK_OUT, R_TICK_MINOR, R_TICK_MAJOR = 196 / 400, 189 / 400, 181 / 400
R_HUB = 0.15  # the hub is size-[30%] of the container


def pick_font(needle: str, text: str) -> io.BytesIO | None:
    """
    Locate a face next/font emitted, by reading each file's name table.

    next/font splits every family across many files, and the split is by usage,
    not by script: the first JetBrains file in sorted order carries ten glyphs.
    So matching the family name is not enough — the file also has to contain
    every character about to be drawn, and among those the widest cmap wins.
    """
    best: tuple[int, io.BytesIO] | None = None
    wanted = {ord(c) for c in text}

    for path in sorted((ROOT / ".next").rglob("*.woff2")):
        try:
            font = TTFont(path, lazy=True)
            family = " ".join(
                str(r) for r in font["name"].names if r.nameID == 1 and r.platformID == 3
            )
            if needle.lower() not in family.lower():
                continue
            cmap = font.getBestCmap()
            if not wanted <= set(cmap):
                continue
            if best is not None and len(cmap) <= best[0]:
                continue
            buf = io.BytesIO()
            font.flavor = None
            font.save(buf)
            best = (len(cmap), buf)
        except Exception:
            continue

    if best is None:
        return None
    return best[1]


def load(needle: str, text: str, size: int) -> ImageFont.ImageFont:
    buf = pick_font(needle, text)
    if buf is None:
        print(f"  ! no {needle} file in .next covers {text!r} — falling back")
        return ImageFont.load_default(size)
    buf.seek(0)
    return ImageFont.truetype(buf, size)


def annular_sector(c: float, s: float, start: float, end: float) -> list[tuple[float, float]]:
    """The same closed outer-arc / radial / inner-arc / radial contour as the SVG."""
    def at(radius: float, deg: float) -> tuple[float, float]:
        rad = math.radians(deg)
        return c + radius * s * math.cos(rad), c + radius * s * math.sin(rad)

    step = 0.5
    steps = round((end - start) / step)
    return (
        [at(R_OUTER, start + i * step) for i in range(steps + 1)]
        + [at(R_INNER, end - i * step) for i in range(steps + 1)]
    )


def disc(size: int, pigments, *, bezel: bool, hairline: bool, portrait: Path | None) -> Image.Image:
    """The ring, drawn at 4× and downsampled — Pillow does not anti-alias."""
    s = size * 4
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = s / 2

    for track, (start, end) in ARCS.items():
        d.polygon(annular_sector(c, s, start, end), fill=pigments[track] + (255,))

    # Everything bone is translucent, and ImageDraw writes pixels rather than
    # compositing them — drawing straight onto the image punches the pigment out
    # and leaves a dark edge instead of a hairline. Strokes go on their own
    # layer, which is then composited.
    ink = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    pen = ImageDraw.Draw(ink)

    if hairline:
        # Heavier than the page's 1.1 units at 45%. That weight is calibrated
        # for a disc you are looking at; a link preview is often rendered at a
        # third of this width, where a 1.3px line at 45% disappears entirely and
        # the ring flattens into a pie chart. Measured on the outer arc: at the
        # page's own values the edge pixel only lifts to (60,97,192).
        for start, end in ARCS.values():
            pts = annular_sector(c, s, start, end)
            pen.line(pts + [pts[0]], fill=BONE + (140,), width=max(1, round(s * 1.7 / 400)), joint="curve")

    if bezel:
        for a in range(0, 360, 3):
            r0 = (R_TICK_MAJOR if a % 15 == 0 else R_TICK_MINOR) * s
            rad = math.radians(a)
            pen.line(
                [c + math.cos(rad) * r0, c + math.sin(rad) * r0,
                 c + math.cos(rad) * R_TICK_OUT * s, c + math.sin(rad) * R_TICK_OUT * s],
                fill=BONE + (61,),
                width=max(1, round(s * 0.6 / 400)),
            )

    if portrait is not None:
        # The hub sits on the void, not on a hole: on the page the beam's apex
        # is hidden behind a filled circle of the page ground, and the face is
        # a smaller disc inside it.
        r = R_INNER * s
        d.ellipse([c - r, c - r, c + r, c + r], fill=VOID + (255,))

        hr = round(R_HUB * s)
        face = Image.open(portrait).convert("RGBA")
        side = min(face.size)
        face = face.crop((
            (face.width - side) // 2, (face.height - side) // 2,
            (face.width - side) // 2 + side, (face.height - side) // 2 + side,
        )).resize((hr * 2, hr * 2), Image.LANCZOS)
        mask = Image.new("L", (hr * 2, hr * 2), 0)
        ImageDraw.Draw(mask).ellipse([0, 0, hr * 2 - 1, hr * 2 - 1], fill=242)  # 0.95, as on the page
        img.paste(face, (round(c) - hr, round(c) - hr), mask)
        pen.ellipse([c - hr, c - hr, c + hr, c + hr], outline=BONE + (89,), width=max(1, round(s / 400)))
    else:
        r = R_INNER * s
        d.ellipse([c - r, c - r, c + r, c + r], fill=(0, 0, 0, 0))

    # Last, so the inner hairlines read over the void circle the way they do on
    # the page, and the hub ring reads over the face.
    img.alpha_composite(ink)
    return img.resize((size, size), Image.LANCZOS)


def tracked(d, xy, text, font, fill, em):
    """Letter-spaced text. Pillow has no tracking, and the site's .label is 0.13em."""
    x, y = xy
    extra = font.size * em
    for ch in text:
        d.text((x, y), ch, font=font, fill=fill)
        x += d.textlength(ch, font=font) + extra
    return x - extra


def coda_mark(size: int) -> Image.Image:
    """
    The coda sign, on the same 24-unit grid as track-mark.tsx.

    Bone on void, carrying none of the three pigments — the mark is Coda
    himself, not one of the three tracks, and D9 asks the private centre to
    stay unencoded.

    The ring is an outer ellipse with an inner one punched out, not a stroked
    ellipse: that is what gives the serif modulation, heavy on the flanks
    (2.8 units) and thin across the top and bottom (1.3). A stroke can only be
    uniform.
    """
    s = size * 4
    img = Image.new("RGBA", (s, s), VOID + (255,))
    d = ImageDraw.Draw(img)

    span = 0.82  # how much of the tile the 24-unit grid fills
    u = s * span / 24
    origin = (s - 24 * u) / 2

    def at(x: float, y: float) -> tuple[float, float]:
        return origin + x * u, origin + y * u

    d.ellipse([*at(4.4, 3.3), *at(19.6, 20.7)], fill=BONE + (255,))
    d.ellipse([*at(7.2, 4.6), *at(16.8, 19.4)], fill=VOID + (255,))

    # Heavier than the page's 1.25 units. At a 16px tab icon that weight lands
    # at 0.8px and washes out to nothing in the downsample, taking the sign's
    # defining feature with it — a coda without its cross is just a ring.
    bar = 2.1
    d.rectangle([*at(12 - bar / 2, 0.7), *at(12 + bar / 2, 23.3)], fill=BONE + (255,))
    d.rectangle([*at(0.5, 12 - bar / 2), *at(23.5, 12 + bar / 2)], fill=BONE + (255,))

    return img.resize((size, size), Image.LANCZOS)


def write_icons() -> None:
    for name, size in (("icon.png", 512), ("apple-icon.png", 180)):
        coda_mark(size).save(APP / name, optimize=True)
        print(f"  {name:22} {size}×{size}  {(APP / name).stat().st_size / 1024:>5.0f} KB")


def write_og() -> None:
    W, H, D = 1200, 630, 470
    canvas = Image.new("RGB", (W, H), VOID)

    ring = disc(D, PIGMENT, bezel=True, hairline=True, portrait=ROOT / "src" / "assets" / "portrait.png")
    canvas.paste(ring, (W - D - 70, (H - D) // 2), ring)

    d = ImageDraw.Draw(canvas)
    name = "Yixuan “Coda” Shi"
    tracks = "SCHOLARLY  ·  PROFESSIONAL  ·  CREATIVE"

    name_font = load("Cormorant", name, 78)
    label_font = load("JetBrains", tracks, 17)

    d.text((90, 246), name, font=name_font, fill=BONE)
    d.line([(90, 358), (90 + 96, 358)], fill=(121, 119, 116), width=1)
    tracked(d, (90, 386), tracks, label_font, (163, 160, 154), 0.13)

    canvas.save(APP / "opengraph-image.png", optimize=True)
    print(f"  opengraph-image.png    {W}×{H}  {(APP / 'opengraph-image.png').stat().st_size / 1024:>5.0f} KB")


if __name__ == "__main__":
    write_icons()
    write_og()
