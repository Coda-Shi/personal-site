"""
Draw the Scholarly field's three vector plates.

    npm run build && python scripts/figures.py

Writes, as SVG, in bone on nothing:
    public/scholarly/normal.svg      the normal curve, with the 68–95–99.7 bands
    public/scholarly/hexagrams.svg   乾 and 坤, the first two hexagrams
    public/scholarly/luoshu.svg      the Luo Shu, the 3×3 magic square as dots

The last two are drawn from the owner's own references; read their docstrings
before changing a number in either.

The four scanned plates (R.S.I., graph of desire, Jung, the semiotic square)
are photographs of settled diagrams and go through scripts/figure-lineart.py.
These three are pure geometry with a few labels, so they are drawn rather
than scanned — and drawn as SVG rather than PNG, because a curve and nine
dots have no reason to be pixels. Same treatment: bone strokes, transparent
ground, opacity applied by the field.

Only the curve carries labels, and every one of them is a glyph outline, not
text: an SVG loaded through <image> gets no web fonts, so text would fall back
to whatever the OS has. The outlines are Cormorant, instanced from the
variable font next/font emitted into .next — which is why this runs after a
build. The hexagrams and the Luo Shu carry no type at all; the owner asked for
the names off, so nothing here needs Zhuque Fangsong any more.
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
    乾 and 坤, the first two hexagrams: six unbroken lines, six broken ones.

    Bars only — the owner asked for the names off (这两个图都不要带字), and he
    is right: a caption on a plate that sits at a third of an opacity behind a
    page of type is one more thing asking to be read, and these two figures
    are known by their shape to anyone who knows them at all.

    They also stand apart now. The columns were 84 units apart and 84 wide, so
    they touched: 乾's solid bar ran straight into 坤's left half and the pair
    read as one block of broken lines rather than as two hexagrams. The gap is
    half a bar wide, which is what the owner's reference shows.
    """
    bar_w, bar_h, row_gap, split, col_gap, margin = 100, 10, 18, 18, 50, 10
    block_h = 6 * bar_h + 5 * row_gap
    W = margin * 2 + bar_w * 2 + col_gap
    H = margin * 2 + block_h

    parts = [f'<g fill="{BONE}">']
    for column, broken in ((margin, False), (margin + bar_w + col_gap, True)):
        for i in range(6):
            y = margin + i * (bar_h + row_gap)
            if broken:
                half = (bar_w - split) / 2
                parts.append(f'  <rect x="{column}" y="{y}" width="{half}" height="{bar_h}"/>')
                parts.append(
                    f'  <rect x="{column + half + split}" y="{y}" width="{half}" height="{bar_h}"/>'
                )
            else:
                parts.append(f'  <rect x="{column}" y="{y}" width="{bar_w}" height="{bar_h}"/>')
    parts.append("</g>")
    return svg(W, H, "\n".join(parts))


def luoshu() -> str:
    """
    The Luo Shu: 4 9 2 / 3 5 7 / 8 1 6, every row, column and diagonal summing
    to fifteen — a magic square from before the first millennium, drawn as dots.

    Two things were wrong before, and both are the owner's corrections.

    **Parity.** Yang (odd) dots are hollow and yin (even) dots are solid, not
    the other way round. On paper the yang dots are white and the yin ones
    black; here the ink is bone and the ground is pigment, so a yang dot is a
    ring with the pigment showing through it and a yin dot is a disc of bone.

    **The corners.** The even numbers are not straight rows. Each sits at a
    corner as two short rows tilted onto the diagonal that points at that
    corner — 4 up-left, 2 up-right, 8 down-left, 6 down-right — so the figure
    turns under a half rotation exactly as the square does, where opposite
    cells sum to ten. 2 is the one exception: a single pair along its
    diagonal, because two rows of one dot would lie across it instead.

    The threads stop at the edge of every dot rather than running under it, so
    a line never shows through a hollow one.
    """
    # Dots that touch read as one blob at the size this plate renders, and the
    # owner's reference has clear air between them: spacing is just under three
    # radii, and the cell is wide enough that the nine holds its own row
    # without crowding the four and the two beside it.
    W = H = 390
    cell = 130
    r = 7.0
    step = 20.0
    sep = 20.0
    arm = 28.0
    diag = 1 / math.sqrt(2)

    def centre(col: int, row: int):
        return cell * col + cell / 2, cell * row + cell / 2

    def straight(n: int, cx: float, cy: float, axis: str):
        span = (n - 1) * step
        return [
            (cx - span / 2 + i * step, cy) if axis == "h" else (cx, cy - span / 2 + i * step)
            for i in range(n)
        ]

    def tilted(n: int, cx: float, cy: float, u: tuple):
        """n dots as two rows of n/2 along u, the diagonal pointing at the corner."""
        ux, uy = u
        vx, vy = -uy, ux
        if n == 2:
            return [(cx - ux * sep / 2, cy - uy * sep / 2), (cx + ux * sep / 2, cy + uy * sep / 2)]
        m = n // 2
        span = (m - 1) * step
        pts = []
        for side in (-1, 1):
            for i in range(m):
                d = -span / 2 + i * step
                pts.append((cx + ux * d + vx * side * sep / 2, cy + uy * d + vy * side * sep / 2))
        return pts

    layout = [
        (4, 0, 0, "tilt", (-diag, -diag)),
        (9, 1, 0, "line", "h"),
        (2, 2, 0, "tilt", (diag, -diag)),
        (3, 0, 1, "line", "v"),
        (5, 1, 1, "cross", None),
        (7, 2, 1, "line", "v"),
        (8, 0, 2, "tilt", (-diag, diag)),
        (1, 1, 2, "line", "h"),
        (6, 2, 2, "tilt", (diag, diag)),
    ]

    threads: list[str] = []
    dots: list[str] = []

    def link(a, b):
        """A segment from the edge of one dot to the edge of the next."""
        (x0, y0), (x1, y1) = a, b
        dx, dy = x1 - x0, y1 - y0
        length = math.hypot(dx, dy)
        if length <= 2 * (r + 1):
            return
        ux, uy = dx / length, dy / length
        inset = r + 1
        threads.append(
            f'  <path d="M {x0 + ux * inset:.2f} {y0 + uy * inset:.2f}'
            f' L {x1 - ux * inset:.2f} {y1 - uy * inset:.2f}"/>'
        )

    for n, col, row, kind, spec in layout:
        cx, cy = centre(col, row)
        if kind == "line":
            pts = straight(n, cx, cy, spec)
            for a, b in zip(pts, pts[1:]):
                link(a, b)
        elif kind == "cross":
            pts = [(cx, cy)] + [(cx - arm, cy), (cx + arm, cy), (cx, cy - arm), (cx, cy + arm)]
            for q in pts[1:]:
                link(pts[0], q)
        else:
            pts = tilted(n, cx, cy, spec)
            if n == 2:
                link(*pts)
            else:
                m = n // 2
                # Round the parallelogram: down one row, back along the other.
                loop = pts[:m] + pts[m:][::-1]
                for a, b in zip(loop, loop[1:] + loop[:1]):
                    link(a, b)
        fill = "none" if n % 2 else BONE
        for x, y in pts:
            dots.append(f'  <circle cx="{x:.2f}" cy="{y:.2f}" r="{r}" fill="{fill}"/>')

    body = "\n".join(
        [f'<g fill="none" stroke="{BONE}" stroke-width="1.6" stroke-linecap="round">']
        + threads
        + ["</g>", f'<g stroke="{BONE}" stroke-width="1.8">']
        + dots
        + ["</g>"]
    )
    return svg(W, H, body)


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
