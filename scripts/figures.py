"""
Draw the Scholarly field's three vector plates.

    npm run build && python scripts/figures.py

Writes, as SVG, in bone on nothing:
    public/scholarly/normal.svg      the normal curve, with the 68–95–99.7 bands
    public/scholarly/hexagrams.svg   乾 and 坤, the first two hexagrams
    public/scholarly/luoshu.svg      the Luo Shu, the 3×3 magic square as dots

The four scanned plates (R.S.I., graph of desire, Jung, the semiotic square)
are photographs of settled diagrams and go through scripts/figure-lineart.py.
These three are pure geometry with a few labels, so they are drawn rather
than scanned — and drawn as SVG rather than PNG, because a curve and nine
dots have no reason to be pixels. Same treatment: bone strokes, transparent
ground, opacity applied by the field.

Every label is a glyph outline, not text. An SVG loaded through <image> gets
no web fonts, so text would fall back to whatever the OS has. The outlines
come from the site's own faces: Cormorant for the Latin figures (instanced
from the variable font next/font emitted into .next, which is why this runs
after a build) and Zhuque Fangsong for 乾 and 坤 (the upstream ttf in the
repo root, see D17).
"""

import io
import math
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "scholarly"
BONE = "#f2efe9"


def cormorant(weight: int, text: str) -> TTFont:
    """The Cormorant file next/font emitted that covers `text`, instanced at `weight`."""
    wanted = {ord(c) for c in text}
    for path in sorted((ROOT / ".next" / "static" / "media").glob("*.woff2")):
        font = TTFont(path)
        family = " ".join(str(r) for r in font["name"].names if r.nameID == 1 and r.platformID == 3)
        if "cormorant" not in family.lower() or font["OS/2"].fsSelection & 1:
            continue
        if wanted <= set(font.getBestCmap()):
            return instancer.instantiateVariableFont(font, {"wght": weight})
    raise SystemExit(f"no Cormorant file in .next covers {text!r} — run npm run build first")


class Type:
    """Set text as path data, in a given face at a given size."""

    def __init__(self, font: TTFont, size: float):
        self.font = font
        self.size = size
        self.glyphs = font.getGlyphSet()
        self.cmap = font.getBestCmap()
        self.scale = size / font["head"].unitsPerEm

    def width(self, text: str) -> float:
        return sum(self.glyphs[self.cmap[ord(c)]].width for c in text) * self.scale

    def path(self, text: str, x: float, y: float, anchor: str = "middle") -> str:
        """Path data for `text` with its baseline at y and its anchor at x."""
        w = self.width(text)
        if anchor == "middle":
            x -= w / 2
        elif anchor == "end":
            x -= w
        parts = []
        for c in text:
            name = self.cmap[ord(c)]
            pen = SVGPathPen(self.glyphs)
            self.glyphs[name].draw(TransformPen(pen, (self.scale, 0, 0, -self.scale, x, y)))
            d = pen.getCommands()
            if d:
                parts.append(d)
            x += self.glyphs[name].width * self.scale
        return " ".join(parts)


def svg(width: int, height: int, body: str) -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" '
        f'width="{width}" height="{height}">\n{body}\n</svg>\n'
    )


def normal_curve() -> str:
    """
    The standard normal density, with the bands between whole sigmas and the
    share of the area each holds — the figure on the first page of every
    statistics text, which is the point: the field is quantitative, and this
    is the shape everything else in it is measured against.
    """
    W, H = 520, 300
    left, right, base = 22, 498, 226
    z_span = 3.6
    px = (right - left) / (2 * z_span)  # pixels per sigma
    peak = 176

    def X(z: float) -> float:
        return left + (z + z_span) * px

    def Y(z: float) -> float:
        return base - peak * math.exp(-z * z / 2)

    pts = [f"{X(z):.1f} {Y(z):.1f}" for z in [i / 40 for i in range(-int(z_span * 40), int(z_span * 40) + 1)]]
    curve = "M " + " L ".join(pts)

    figures = Type(cormorant(500, "0123456789.%−"), 15)
    parts = [
        f'<g fill="none" stroke="{BONE}" stroke-linecap="round" stroke-linejoin="round">',
        f'  <path d="{curve}" stroke-width="2.4"/>',
        f'  <path d="M {left} {base} L {right} {base}" stroke-width="1.6"/>',
    ]
    for z in range(-3, 4):
        style = 'stroke-width="1.4"' if z == 0 else 'stroke-width="1.1" stroke-dasharray="4 4"'
        parts.append(f'  <path d="M {X(z):.1f} {base} L {X(z):.1f} {Y(z):.1f}" {style}/>')
        parts.append(f'  <path d="M {X(z):.1f} {base} L {X(z):.1f} {base + 7}" stroke-width="1.6"/>')
    parts.append("</g>")

    labels = []
    for z in range(-3, 4):
        text = str(z) if z >= 0 else "−" + str(-z)
        labels.append(figures.path(text, X(z), base + 26))
    # The area under each band, printed where there is room for it.
    bands = {0.5: "34.1%", 1.5: "13.6%", 2.5: "2.1%"}
    for centre, text in bands.items():
        for sign in (-1, 1):
            z = sign * centre
            y = Y(z) + (34 if centre == 0.5 else 30) if centre < 2 else Y(z) - 10
            if centre == 0.5:
                y = base - 44
            elif centre == 1.5:
                y = base - 16
            else:
                y = base - 14
            labels.append(figures.path(text, X(z), y))
    parts.append(f'<path fill="{BONE}" d="{" ".join(labels)}"/>')
    return svg(W, H, "\n".join(parts))


def hexagrams() -> str:
    """
    乾 and 坤, the first two hexagrams — six unbroken lines and six broken
    ones, the whole of the Book of Changes folded into its first two figures.
    Named beneath in Zhuque Fangsong, the face the site's literary voice is
    set in (D17).
    """
    W, H = 240, 300
    bar_w, bar_h, gap, split = 84, 10, 14, 14
    top = 34
    parts = [f'<g fill="{BONE}">']
    for column, broken in ((36, False), (120, True)):
        for i in range(6):
            y = top + i * (bar_h + gap)
            if broken:
                half = (bar_w - split) / 2
                parts.append(f'  <rect x="{column}" y="{y}" width="{half}" height="{bar_h}"/>')
                parts.append(f'  <rect x="{column + half + split}" y="{y}" width="{half}" height="{bar_h}"/>')
            else:
                parts.append(f'  <rect x="{column}" y="{y}" width="{bar_w}" height="{bar_h}"/>')
    parts.append("</g>")

    fangsong = Type(TTFont(ROOT / "ZhuqueFangsong-Regular.ttf"), 40)
    names = fangsong.path("乾", 36 + bar_w / 2, 240) + " " + fangsong.path("坤", 120 + bar_w / 2, 240)
    parts.append(f'<path fill="{BONE}" d="{names}"/>')
    return svg(W, H, "\n".join(parts))


def luoshu() -> str:
    """
    The Luo Shu: 4 9 2 / 3 5 7 / 8 1 6, every row, column and diagonal
    summing to fifteen — a magic square from before the first millennium,
    drawn the way it has always been drawn, as dots: hollow for the odd
    (yang) numbers, filled for the even (yin) ones, each number's dots
    threaded on a line.
    """
    W, H = 360, 360
    cell = 120
    r = 6.5
    step = 12.5
    parts = [f'<g stroke="{BONE}" stroke-width="1.5">']

    def dots(n: int, cx: float, cy: float, along: str):
        span = (n - 1) * step
        out = []
        coords = []
        for i in range(n):
            if along == "h":
                coords.append((cx - span / 2 + i * step, cy))
            else:
                coords.append((cx, cy - span / 2 + i * step))
        if n > 1:
            (x0, y0), (x1, y1) = coords[0], coords[-1]
            out.append(f'  <path d="M {x0} {y0} L {x1} {y1}" fill="none"/>')
        # Yang (odd) dots are light: bone. Yin (even) dots are dark: a black
        # fill under a bone rim, which the field's opacity turns into a dot of
        # deeper pigment — hollow, to the eye. Both hide the thread behind them.
        fill = BONE if n % 2 == 1 else "#000"
        for x, y in coords:
            out.append(f'  <circle cx="{x}" cy="{y}" r="{r}" fill="{fill}"/>')
        return out

    # cell centres: col 0..2, row 0..2
    def c(col: int, row: int):
        return cell * col + cell / 2, cell * row + cell / 2

    layout = [
        (4, 0, 0, "h"), (9, 1, 0, "h"), (2, 2, 0, "h"),
        (3, 0, 1, "v"), (5, 1, 1, "x"), (7, 2, 1, "v"),
        (8, 0, 2, "h"), (1, 1, 2, "h"), (6, 2, 2, "h"),
    ]
    for n, col, row, along in layout:
        cx, cy = c(col, row)
        if along == "x":
            # The centre five is a cross: one dot in the middle, four around it.
            parts += dots(1, cx, cy, "h")
            parts.append(f'  <path d="M {cx - 2 * step} {cy} L {cx + 2 * step} {cy} M {cx} {cy - 2 * step} L {cx} {cy + 2 * step}" fill="none"/>')
            for dx, dy in ((-2 * step, 0), (2 * step, 0), (0, -2 * step), (0, 2 * step)):
                parts.append(f'  <circle cx="{cx + dx}" cy="{cy + dy}" r="{r}" fill="{BONE}"/>')
        else:
            parts += dots(n, cx, cy, along)
    parts.append("</g>")
    return svg(W, H, "\n".join(parts))


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, draw in (("normal.svg", normal_curve), ("hexagrams.svg", hexagrams), ("luoshu.svg", luoshu)):
        text = draw()
        # LF explicitly: on Windows, write_text would otherwise translate to CRLF
        # and git would renormalise the file at the next touch.
        (OUT / name).write_text(text, encoding="utf-8", newline="\n")
        print(f"  {name:16} {len(text) / 1024:5.1f} KB")


if __name__ == "__main__":
    main()
