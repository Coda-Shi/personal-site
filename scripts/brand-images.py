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

Run it after a build. Cormorant is pulled out of whatever next/font emitted into
.next, so the card is set in the site's own face rather than in a Windows
lookalike. The files arrive as woff2, which Pillow cannot open, so fontTools
converts them in memory.

🔴 **The card must show the composition the page shows.** It drew the old
annular ring for a month after the page had become three overlapping circles,
which meant every link preview — iMessage, WeChat, Slack — advertised a design
that no longer existed. The geometry below is transcribed from trinity-disc.tsx
constant for constant: the circles, the clockwise rule for the overlaps, the
turning middle, the Borromean breaks in the line work, the ring the lines
become. When that file changes, this one changes.

The icon is the coda sign alone, bone on void, and does not use the disc at all:
at 16px three dark pigments collapse into one smudge and a face is mud.
"""

import io
import math
from pathlib import Path

import numpy as np
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
APP = ROOT / "src" / "app"

VOID = (5, 5, 5)
BONE = (242, 239, 233)

PIGMENT = {"scholarly": (0, 47, 167), "creative": (110, 20, 35), "professional": (106, 82, 22)}

# ── The Venn, verbatim from trinity-disc.tsx ────────────────────────────────
# 400-unit board. Centres on a circle of radius CENTRE_D, 120° apart, each of
# radius R; CENTRE_D is solved so that R − CENTRE_D = R_PORTRAIT and the three
# arcs are tangent to the portrait. SVG convention: 90° is the bottom.
CX = CY = 200.0
R = 118.0
CENTRE_D = 72.0
R_PORTRAIT = 46.0
BREAK = 3.5
VENN = {"scholarly": 90.0, "creative": 210.0, "professional": 330.0}

# Each overlap takes one parent's pigment whole, decided clockwise: a circle's
# colour carries into the overlap ahead of it. The middle turns — each sliver
# takes the pigment of the circle 120° behind it. Neither is a choice here;
# both are transcribed. See the notes on CYCLE and MIDDLE in the component.
CYCLE = [("creative", "professional"), ("professional", "scholarly"), ("scholarly", "creative")]
OVER = {to: frm for frm, to in CYCLE}
UNDER = {frm: to for frm, to in CYCLE}
MIDDLE = [(30.0, 150.0, "professional"), (150.0, 270.0, "scholarly"), (270.0, 390.0, "creative")]


def centre_of(track: str) -> tuple[float, float]:
    rad = math.radians(VENN[track])
    return CX + CENTRE_D * math.cos(rad), CY + CENTRE_D * math.sin(rad)


CENTRES = {track: centre_of(track) for track in VENN}


def pick_font(needle: str, text: str, weight: int) -> io.BytesIO | None:
    """
    Locate a face next/font emitted, by reading each file's tables.

    next/font splits every family across many files — one per weight, and by
    usage rather than by script — so matching the family name is not enough.
    The file also has to be the wanted weight and upright, and has to contain
    every character about to be drawn; among those the widest cmap wins.

    Google serves Cormorant as a *variable* font — one file per subset, with
    a wght axis from 300 to 700 and a name table that calls every one of them
    "Cormorant Garamond Light". So there is no SemiBold file to find: the
    weight is made, by instancing the variable font at the wanted wght before
    Pillow sees it. A static face, should one ever appear here, is matched on
    its OS/2 weight class instead.
    """
    from fontTools.varLib import instancer

    best: tuple[int, io.BytesIO] | None = None
    wanted = {ord(c) for c in text}

    for path in sorted((ROOT / ".next").rglob("*.woff2")):
        try:
            font = TTFont(path)
            names = font["name"].names
            family = " ".join(str(r) for r in names if r.nameID == 1 and r.platformID == 3)
            if needle.lower() not in family.lower():
                continue
            os2 = font["OS/2"]
            if os2.fsSelection & 1:
                continue
            variable = "fvar" in font
            if not variable and os2.usWeightClass != weight:
                continue
            cmap = font.getBestCmap()
            if not wanted <= set(cmap):
                continue
            if best is not None and len(cmap) <= best[0]:
                continue
            if variable:
                font = instancer.instantiateVariableFont(font, {"wght": weight})
            buf = io.BytesIO()
            font.flavor = None
            font.save(buf)
            best = (len(cmap), buf)
        except Exception:
            continue

    if best is None:
        return None
    return best[1]


def load(needle: str, text: str, size: int, weight: int) -> ImageFont.ImageFont:
    buf = pick_font(needle, text, weight)
    if buf is None:
        print(f"  ! no {needle} {weight} file in .next covers {text!r} — falling back")
        return ImageFont.load_default(size)
    buf.seek(0)
    return ImageFont.truetype(buf, size)


def paint(s: int) -> Image.Image:
    """
    Every region painted exactly once, per pixel, by the rules the component
    paints them by: a point in one circle wears that circle; in two, the
    pigment the clockwise rule gives that lens; in all three, the pinwheel by
    bearing; inside the ring, the ground. Outside all three, nothing.

    Rasterised with numpy rather than drawn with polygons, because the shapes
    are intersections of circles and Pillow has no boolean geometry. Drawn at
    4× and downsampled by the caller, which is where the anti-aliasing comes
    from.
    """
    k = s / 400
    ys, xs = np.mgrid[0:s, 0:s].astype(np.float64)
    x = (xs + 0.5) / k
    y = (ys + 0.5) / k

    inside = {t: np.hypot(x - cx, y - cy) <= R for t, (cx, cy) in CENTRES.items()}
    count = sum(m.astype(np.int8) for m in inside.values())

    out = np.zeros((s, s, 4), np.uint8)
    for track in VENN:
        out[(count == 1) & inside[track]] = PIGMENT[track] + (255,)
    for frm, to in CYCLE:
        out[(count == 2) & inside[frm] & inside[to]] = PIGMENT[frm] + (255,)

    bearing = np.degrees(np.arctan2(y - CY, x - CX)) % 360
    for a, b, track in MIDDLE:
        wedge = ((bearing >= a) & (bearing < b)) | (bearing < b - 360)
        out[(count == 3) & wedge] = PIGMENT[track] + (255,)

    out[np.hypot(x - CX, y - CY) <= R_PORTRAIT] = VOID + (255,)
    return Image.fromarray(out, "RGBA")


def visible(track: str, x: float, y: float) -> bool:
    """
    The component's mask for one outline, white keeps and black cuts, painted
    in order: white everywhere; black where this circle runs under the one
    over it, BREAK wider than that circle so the break has air; white again
    for the half of the middle arc that is a real boundary; and the rim is
    never cut. The last layer covering a point decides.
    """
    if math.hypot(x - CX, y - CY) <= R_PORTRAIT + 2:
        return True
    ox, oy = CENTRES[OVER[track]]
    if math.hypot(x - ox, y - oy) > R + BREAK:
        return True
    ux, uy = CENTRES[UNDER[track]]
    if math.hypot(x - ux, y - uy) <= R:
        # The half-plane: a 600-wide rect on the left of centre, rotated by
        # VENN − 90 about the centre. Rotate the point back and test its side.
        theta = math.radians(VENN[track] - 90)
        side = (x - CX) * math.cos(theta) + (y - CY) * math.sin(theta)
        return side < 0
    return False


def outline_runs(track: str, step: float = 0.1) -> list[list[tuple[float, float]]]:
    """
    The one-stroke path from `outline()` — 270° round the circle from the
    outer crossing to the tangent point — cut into the runs the mask leaves
    visible. The rim the stroke goes on to lay down is drawn once, as a
    circle, by the caller: three 120° arcs meeting at joints would show seams.
    """
    cx, cy = CENTRES[track]
    start = VENN[track] - 90
    runs: list[list[tuple[float, float]]] = []
    current: list[tuple[float, float]] = []
    for i in range(int(270 / step) + 1):
        a = math.radians(start + i * step)
        px, py = cx + R * math.cos(a), cy + R * math.sin(a)
        if visible(track, px, py):
            current.append((px, py))
        elif current:
            runs.append(current)
            current = []
    if current:
        runs.append(current)
    return runs


def disc(size: int, *, portrait: Path) -> Image.Image:
    """The composition, drawn at 4× and downsampled — Pillow does not anti-alias."""
    s = size * 4
    k = s / 400
    img = paint(s)

    # Everything bone is translucent, and ImageDraw writes pixels rather than
    # compositing them — drawing straight onto the image punches the pigment
    # out and leaves a dark edge instead of a hairline. Strokes go on their
    # own layer, which is then composited.
    ink = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    pen = ImageDraw.Draw(ink)

    # Heavier than the page's 1.1 units at 75%. That weight is calibrated for
    # a disc you are looking at; a link preview is often rendered at a third
    # of this width, where a hairline disappears and the composition flattens
    # into three coloured blobs.
    width = max(1, round(1.6 * k))
    bone = BONE + (200,)
    for track in VENN:
        for run in outline_runs(track):
            pts = [(px * k, py * k) for px, py in run]
            if len(pts) > 1:
                pen.line(pts, fill=bone, width=width, joint="curve")

    # The ring the three lines become, drawn once.
    r = R_PORTRAIT * k
    c = s / 2
    pen.ellipse([c - r, c - r, c + r, c + r], outline=bone, width=width)

    # The face, inside the ring, at the page's 0.95.
    hr = round(R_PORTRAIT * k)
    face = Image.open(portrait).convert("RGBA")
    side = min(face.size)
    face = face.crop((
        (face.width - side) // 2, (face.height - side) // 2,
        (face.width - side) // 2 + side, (face.height - side) // 2 + side,
    )).resize((hr * 2, hr * 2), Image.LANCZOS)
    mask = Image.new("L", (hr * 2, hr * 2), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, hr * 2 - 1, hr * 2 - 1], fill=242)
    img.paste(face, (round(c) - hr, round(c) - hr), mask)

    # Last, so the ring reads over the face the way it does on the page.
    img.alpha_composite(ink)
    return img.resize((size, size), Image.LANCZOS)


def tracked(d, xy, text, font, fill, em):
    """Letter-spaced text. Pillow has no tracking, and the site's .label is 0.16em."""
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
    W, H, D = 1200, 630, 500
    canvas = Image.new("RGB", (W, H), VOID)

    ring = disc(D, portrait=ROOT / "src" / "assets" / "portrait.png")
    canvas.paste(ring, (W - D - 60, (H - D) // 2), ring)

    d = ImageDraw.Draw(canvas)
    name = "Yixuan “Coda” Shi"
    tracks = "SCHOLARLY  ·  PROFESSIONAL  ·  CREATIVE"

    # The name in the weight the page sets it in (font-light), the tracks in
    # the label's semibold at the label's tracking — Cormorant for both, since
    # mono left the interface (D12, D23).
    name_font = load("Cormorant", name, 78, 300)
    label_font = load("Cormorant", tracks, 17, 600)

    d.text((90, 246), name, font=name_font, fill=BONE)
    d.line([(90, 358), (90 + 96, 358)], fill=(121, 119, 116), width=1)
    tracked(d, (90, 386), tracks, label_font, (163, 160, 154), 0.16)

    canvas.save(APP / "opengraph-image.png", optimize=True)
    print(f"  opengraph-image.png    {W}×{H}  {(APP / 'opengraph-image.png').stat().st_size / 1024:>5.0f} KB")


if __name__ == "__main__":
    write_icons()
    write_og()
