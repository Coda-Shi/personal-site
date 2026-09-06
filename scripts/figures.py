"""
Draw the Scholarly field's three vector plates.

    npm run build && python scripts/figures.py

Writes, as SVG, in bone on nothing:
    public/scholarly/normal.svg      the normal curve, with the 68–95–99.7 bands
    public/scholarly/hexagrams.svg   乾 and 坤, the first two hexagrams
    public/scholarly/luoshu.svg      the Luo Shu, the 3×3 magic square as dots
    public/scholarly/brain.svg       the brain in mid-sagittal section

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


def brain() -> str:
    """
    The brain in mid-sagittal section, facing right.

    Drawn, not traced. The owner's reference is a textbook engraving and not
    ours to copy; the anatomy is nobody's — where the callosum arcs, where the
    pons bulges, how the arbor vitae branches — so this is drawn from those
    landmarks in the same hand as the other plates.

    What is in it is decided by what survives at 130px: the cortical margin
    with its gyri, the corpus callosum with the fornix under it, the thalamus,
    the brainstem through the pons to the medulla, the cerebellum with its
    tree, the chiasm and the pituitary on its stalk, and the three sulci that
    make a medial surface read as one — cingulate, parieto-occipital,
    calcarine. No labels, for the reason the hexagrams lost theirs.

    The gyri are a sine along the outline's own normals rather than hand-drawn
    bumps, with a sulcus struck inward at every crest. A smooth outline reads
    as a bean; this reads as a brain from across the room, which is the only
    distance this plate is ever seen from.
    """
    W, H = 520, 400

    def catmull(points, closed=True, samples=16):
        """A dense polyline through the anchors, Catmull-Rom."""
        pts = list(points)
        ext = ([pts[-1]] + pts + [pts[0], pts[1]]) if closed else ([pts[0]] + pts + [pts[-1]])
        out = []
        for i in range(len(ext) - 3):
            (x0, y0), (x1, y1), (x2, y2), (x3, y3) = ext[i : i + 4]
            for k in range(samples):
                t = k / samples
                t2, t3 = t * t, t * t * t
                out.append(
                    (
                        0.5 * (2 * x1 + (-x0 + x2) * t + (2 * x0 - 5 * x1 + 4 * x2 - x3) * t2 + (-x0 + 3 * x1 - 3 * x2 + x3) * t3),
                        0.5 * (2 * y1 + (-y0 + y2) * t + (2 * y0 - 5 * y1 + 4 * y2 - y3) * t2 + (-y0 + 3 * y1 - 3 * y2 + y3) * t3),
                    )
                )
        if not closed:
            out.append(pts[-1])
        return out

    def crimp(points, amp, cycles, window=None, phase=0.0, sulcus=0.0, lean=0.28):
        """
        Fold a closed outline along its own normals by a sine.

        Returns the folded outline and, where `sulcus` is given, a stroke
        driven inward from every crest of the fold. The fold alone gives a
        wavy edge and reads as decoration; it is the strokes cutting in behind
        it that make the waves read as gyri.

        `n` here points *into* the shape for an outline wound clockwise on
        screen, which is how every anchor list below is written — so a
        positive displacement is inward, and a crest of the sine is the
        deepest point of a fold. Getting this backwards grows whiskers.
        """
        n = len(points)
        seg = [math.dist(points[i], points[(i + 1) % n]) for i in range(n)]
        total = sum(seg)
        run, folded, wave, normals, weights = 0.0, [], [], [], []
        for i, (x, y) in enumerate(points):
            ax, ay = points[i - 1]
            bx, by = points[(i + 1) % n]
            tx, ty = bx - ax, by - ay
            length = math.hypot(tx, ty) or 1.0
            nx, ny = ty / length, -tx / length
            k = run / total
            w = 1.0 if window is None else window(k)
            d = amp * w * math.sin(2 * math.pi * (cycles * k + phase))
            folded.append((x + nx * d, y + ny * d))
            wave.append(d)
            normals.append((nx, ny))
            weights.append(w)
            run += seg[i]

        cuts = []
        if sulcus:
            for i in range(n):
                if not (wave[i] > wave[i - 1] and wave[i] >= wave[(i + 1) % n]):
                    continue
                if weights[i] < 0.5:
                    continue
                x, y = folded[i]
                nx, ny = normals[i]
                depth = sulcus * weights[i]
                # Struck off the normal, so the sulci lean the way they do.
                mx = x + nx * depth * 0.55 - ny * depth * lean
                my = y + ny * depth * 0.55 + nx * depth * lean
                cuts.append(
                    f'  <path d="M {x:.1f} {y:.1f} Q {mx:.1f} {my:.1f}'
                    f' {x + nx * depth:.1f} {y + ny * depth:.1f}"/>'
                )
        return folded, cuts

    def line(points, closed=False):
        d = "M " + " L ".join(f"{x:.1f} {y:.1f}" for x, y in points)
        return f'  <path d="{d}{" Z" if closed else ""}"/>'

    def inside(poly, point):
        """Ray casting. Used to keep other outlines out of the brainstem."""
        x, y = point
        hit = False
        for i in range(len(poly)):
            (x0, y0), (x1, y1) = poly[i - 1], poly[i]
            if (y0 > y) != (y1 > y) and x < x0 + (y - y0) / (y1 - y0) * (x1 - x0):
                hit = not hit
        return hit

    def outside(points, poly):
        """
        The runs of an outline that lie clear of `poly`, as open paths.

        The cerebrum's floor and the cerebellum's front both run into the
        brainstem, and in a mid-sagittal section there is no line there: the
        diencephalon is continuous with the midbrain, and the cerebellum is
        joined to the pons by its peduncles. Drawing the closed outlines and
        then dropping what falls inside the stem gives that, and keeps the
        anchor lists readable as the shapes they are.
        """
        keep = [not inside(poly, q) for q in points]
        if all(keep):
            return [points + [points[0]]]
        runs, current = [], []
        n = len(points)
        # Start at a point that is inside, so no run is split across the seam.
        start = keep.index(False)
        for i in range(n):
            j = (start + i) % n
            if keep[j]:
                current.append(points[j])
            elif current:
                runs.append(current)
                current = []
        if current:
            runs.append(current)
        return [r for r in runs if len(r) > 2]

    # ---- the cortex, clockwise from the frontal pole -----------------------
    # Anchors first, gyri second: the silhouette has to be right before it is
    # folded, and it is far easier to judge twenty points than four hundred.
    # The lower run from the tentorium forward is not cortex but the floor of
    # the section — tentorium, hypothalamus, orbital surface — so the fold is
    # windowed off there. Folded, it put gyri through the chiasm.
    cortex = [
        (498, 168), (488, 112), (456, 70), (410, 40), (350, 22), (284, 16),
        (218, 25), (158, 48), (108, 86), (70, 134), (48, 188), (58, 234),
        (100, 264), (170, 270), (230, 252), (264, 272), (302, 290), (346, 294),
        (398, 300), (448, 288), (480, 234),
    ]

    def cortex_window(k: float) -> float:
        if k < 0.02:
            return k / 0.02
        if k < 0.55:
            return 1.0
        if k < 0.61:
            return (0.61 - k) / 0.06
        return 0.0

    cortex_pts, cortex_cuts = crimp(
        catmull(cortex), amp=7.5, cycles=23, window=cortex_window, phase=0.1, sulcus=30
    )

    # ---- the cerebellum, hanging below the tentorium ------------------------
    # 🔴 Wound counter-clockwise on screen, like the cortex, so that `crimp`'s
    # normal points into the shape. Reversed, the folia grow outward and the
    # cerebellum comes out a gear. Check the sign of the shoelace area before
    # editing these anchors.
    cerebellum = [
        (206, 300), (192, 268), (156, 250), (112, 254), (76, 278), (62, 312),
        (74, 346), (108, 370), (152, 376), (192, 356), (208, 328),
    ]
    cbl_pts, cbl_cuts = crimp(catmull(cerebellum), amp=2.0, cycles=20, phase=0.3, sulcus=15, lean=0.0)

    # The arbor vitae, rooted where the peduncles enter.
    tree: list[str] = []

    def branch(x, y, angle, length, width, depth):
        x2, y2 = x + length * math.cos(angle), y + length * math.sin(angle)
        tree.append(f'  <path d="M {x:.1f} {y:.1f} L {x2:.1f} {y2:.1f}" stroke-width="{width:.1f}"/>')
        if depth:
            for turn in (-0.66, 0.66):
                branch(x2, y2, angle + turn, length * 0.66, max(0.7, width * 0.62), depth - 1)

    branch(198, 316, math.radians(192), 38, 4.0, 3)
    branch(196, 296, math.radians(214), 28, 3.0, 3)
    branch(196, 336, math.radians(168), 26, 2.8, 3)

    # ---- brainstem: midbrain, the pons bulging forward, medulla -------------
    # The pons is the whole reason a brainstem is recognisable in silhouette:
    # it bulges forward about twelve units past the midbrain above it and the
    # medulla below, and the medulla narrows as it leaves the frame.
    stem = [
        (296, 250), (294, 270), (312, 290), (317, 312), (302, 338), (278, 358),
        (262, 382), (256, 400), (208, 400), (214, 376), (222, 350), (228, 324),
        (232, 300), (240, 276), (252, 252),
    ]
    junctions = [
        [(242, 284), (296, 284)],   # midbrain into pons
        [(228, 338), (300, 336)],   # pons into medulla
    ]
    stem_pts = catmull(stem)

    # ---- the rest, each a plain curve --------------------------------------
    callosum = [
        (344, 208), (372, 182), (372, 152), (340, 133), (292, 126), (246, 137),
        (212, 162), (206, 187), (222, 193), (240, 173), (280, 162), (322, 167),
        (350, 187),
    ]
    fornix = [(224, 196), (262, 184), (302, 194), (324, 216), (322, 240)]
    # Carried round the genu and down to the subcallosal area, which is where
    # it goes and which fills the one empty stretch of the frontal lobe.
    cingulate = [
        (350, 234), (380, 204), (394, 168), (384, 130), (338, 94), (272, 82),
        (212, 98), (178, 132), (184, 170),
    ]
    parieto = [(126, 100), (148, 136), (170, 172)]
    calcarine = [(170, 172), (132, 190), (98, 198), (66, 200)]
    stalk = [(334, 250), (344, 264), (351, 273)]
    chiasm = [(366, 278), (382, 271), (394, 276)]

    parts = [
        f'<g fill="none" stroke="{BONE}" stroke-linecap="round" stroke-linejoin="round">',
        '<g stroke-width="2.6">',
        *[line(run) for run in outside(cortex_pts, stem_pts)],
        *[line(run) for run in outside(cbl_pts, stem_pts)],
        line(stem_pts, closed=True),
        "</g>",
        '<g stroke-width="1.9">',
        line(catmull(callosum), closed=True),
        line(catmull(fornix, closed=False)),
        line(catmull(stalk, closed=False)),
        line(catmull(chiasm, closed=False)),
        '  <ellipse cx="278" cy="220" rx="38" ry="25"/>',
        '  <ellipse cx="356" cy="281" rx="15" ry="11"/>',
        '  <circle cx="314" cy="252" r="7"/>',
        *[line(j) for j in junctions],
        "</g>",
        '<g stroke-width="1.5">',
        *cortex_cuts,
        "</g>",
        '<g stroke-width="1.4">',
        line(catmull(cingulate, closed=False)),
        line(catmull(parieto, closed=False)),
        line(catmull(calcarine, closed=False)),
        "</g>",
        '<g stroke-width="1.2">',
        *cbl_cuts,
        "</g>",
        "<g>",
        *tree,
        "</g>",
        "</g>",
    ]
    return svg(W, H, "\n".join(parts))


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, draw in (
        ("normal.svg", normal_curve),
        ("hexagrams.svg", hexagrams),
        ("luoshu.svg", luoshu),
        ("brain.svg", brain),
    ):
        text = draw()
        # LF explicitly: on Windows, write_text would otherwise translate to CRLF
        # and git would renormalise the file at the next touch.
        (OUT / name).write_text(text, encoding="utf-8", newline="\n")
        print(f"  {name:16} {len(text) / 1024:5.1f} KB")


if __name__ == "__main__":
    main()
