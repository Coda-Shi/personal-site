"""
Export DEAR SUSPECT's indiePlay laurel as standalone files, for use off the site.

    npm run build && python scripts/laurel-svg.py <out-dir>

The laurel on the Creative page (src/components/laurel.tsx) is inline SVG with
live text in the site's web fonts. Off the site — a post, a slide, a print —
there are no web fonts, so here every glyph is an outline and the file stands
alone. Requires fontTools; Chrome for the PNGs.

The branches are read out of the prerendered Creative page, so the drawing has
one source and this script only sets the type. The words are INDIEPLAY's in
src/lib/content.ts: change both together (after 11-22, the status line).

Three versions, each in bone (for dark grounds) and black (for light):

    bilingual   the site's: 2026 indiePlay / 最佳AI游戏作品 / BEST AI GAMES / 入围 · FINALIST
    zh          2026 indiePlay / 最佳AI游戏作品 / 入围
    en          2026 indiePlay / BEST AI GAMES / FINALIST

Solid, unlike the page: there the laurel sits under the key art at reduced
opacity; as a file it is the mark itself, and whoever places it sets its
strength. Each SVG also gets a transparent PNG 2400px wide, because most places
that take an image do not take SVG.
"""

import re
import subprocess
import sys
import tempfile
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.svgLib.path import parse_path
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
PAGE = ROOT / ".next" / "server" / "app" / "en" / "creative.html"
FANGSONG = ROOT / "ZhuqueFangsong-Regular.ttf"
CHROME = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")
COLOURS = {"bone": "#f2efe9", "black": "#050505"}
W = 480
PNG_WIDTH = 2400
MARGIN = 4


def num(v: float) -> str:
    return ("%.2f" % v).rstrip("0").rstrip(".") if abs(v) >= 0.005 else "0"


class Face:
    def __init__(self, font: TTFont):
        self.glyphs = font.getGlyphSet()
        self.cmap = font.getBestCmap()
        self.upm = font["head"].unitsPerEm


def cormorant(text: str) -> TTFont:
    """The Cormorant file next/font emitted that covers `text` (variable, upright)."""
    wanted = {ord(c) for c in text}
    for path in sorted((ROOT / ".next" / "static" / "media").glob("*.woff2")):
        font = TTFont(path)
        family = " ".join(str(r) for r in font["name"].names if r.nameID == 1 and r.platformID == 3)
        if "cormorant" not in family.lower() or font["OS/2"].fsSelection & 1:
            continue
        if wanted <= set(font.getBestCmap()):
            return font
    raise SystemExit(f"no Cormorant file in .next covers {text!r} — run npm run build first")


LATIN = cormorant("2026 indiePlay BEST AI GAMES FINALIST ·")
L400 = Face(instancer.instantiateVariableFont(LATIN, {"wght": 400}))
L600 = Face(instancer.instantiateVariableFont(LATIN, {"wght": 600}))
HAN = Face(TTFont(FANGSONG))


def line(y: float, size: float, runs) -> str:
    """
    One centred line as path data. `runs` are (text, face, tracking in em, gap
    before in units). Centred on the ink: the tracking after the last letter
    is not counted, so a spaced line sits where the eye puts its middle.
    """
    placed = []
    x = 0.0
    for text, face, tracking, gap in runs:
        x += gap
        scale = size / face.upm
        for c in text:
            name = face.cmap[ord(c)]
            placed.append((face, name, x, scale))
            x += face.glyphs[name].width * scale + tracking * size
    width = x - runs[-1][2] * size
    left = W / 2 - width / 2
    parts = []
    for face, name, gx, scale in placed:
        pen = SVGPathPen(face.glyphs, ntos=num)
        face.glyphs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, left + gx, y)))
        if d := pen.getCommands():
            parts.append(d)
    return " ".join(parts)


EDITION = ("2026 indiePlay", L400, 0.04, 0)
TITLE_ZH = [("最佳", HAN, 0, 0), ("AI", L400, 0, 0), ("游戏作品", HAN, 0, 0)]

VERSIONS = {
    # The site's layout, number for number (laurel.tsx).
    "bilingual": [
        (48, 17, [EDITION]),
        (91, 30, TITLE_ZH),
        (119, 14, [("BEST AI GAMES", L600, 0.24, 0)]),
        (148, 14, [("入围", HAN, 0, 0), ("·", L400, 0, 8), ("FINALIST", L600, 0.24, 8)]),
    ],
    "zh": [
        (58, 17, [EDITION]),
        (101, 30, TITLE_ZH),
        (134, 15, [("入围", HAN, 0.6, 0)]),
    ],
    "en": [
        (58, 17, [EDITION]),
        (96, 23, [("BEST AI GAMES", L600, 0.14, 0)]),
        (128, 14, [("FINALIST", L600, 0.24, 0)]),
    ],
}

TITLES = {
    "bilingual": "2026 indiePlay 最佳AI游戏作品 入围 · Finalist, Best AI Games",
    "zh": "2026 indiePlay 最佳AI游戏作品 入围",
    "en": "2026 indiePlay Best AI Games Finalist",
}


def branches() -> tuple[str, str]:
    """The stem and leaves, as the Creative page renders them."""
    if not PAGE.exists():
        raise SystemExit(f"{PAGE} missing — run npm run build first")
    html = PAGE.read_text(encoding="utf-8")
    m = re.search(r'<svg[^>]*aria-label="Finalist, Best AI Games[^"]*"[^>]*>(.*?)</svg>', html, re.S)
    if not m:
        raise SystemExit("no laurel on the prerendered Creative page")
    stem, branch = re.findall(r'<path d="([^"]+)"', m.group(1))[:2]
    return stem, branch


def bounds(*paths: str) -> tuple[float, float, float, float]:
    """The exact bounds of the left branch, and of its mirror on the right."""
    pen = BoundsPen(None)
    for d in paths:
        parse_path(d, pen)
    x0, y0, x1, y1 = pen.bounds
    return min(x0, W - x1), y0, max(x1, W - x0), y1


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    stem, branch = branches()
    # Cropped to the branches, which enclose the type, with a little room for
    # the stem's stroke and round caps.
    x0, y0, x1, y1 = bounds(stem, branch)
    x0, y0, x1, y1 = x0 - MARGIN, y0 - MARGIN, x1 + MARGIN, y1 + MARGIN
    vw, vh = x1 - x0, y1 - y0
    for version, lines in VERSIONS.items():
        type_d = " ".join(line(y, size, runs) for y, size, runs in lines)
        for colour, hex_ in COLOURS.items():
            sprig = (
                f'<path d="{stem}" fill="none" stroke="{hex_}" stroke-width="1.4" stroke-linecap="round"/>'
                f'<path d="{branch}"/>'
            )
            doc = (
                f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{num(x0)} {num(y0)} {num(vw)} {num(vh)}" '
                f'width="{num(vw)}" height="{num(vh)}">\n'
                f"<title>{TITLES[version]}</title>\n"
                f'<g fill="{hex_}">\n'
                f"<g>{sprig}</g>\n"
                f'<g transform="translate({W} 0) scale(-1 1)">{sprig}</g>\n'
                f'<path d="{type_d}"/>\n'
                f"</g>\n</svg>\n"
            )
            name = f"indieplay-laurel-{version}-{colour}"
            (out / f"{name}.svg").write_text(doc, encoding="utf-8", newline="\n")
            png(out / f"{name}.svg", out / f"{name}.png", vw, vh)
            print(f"  {name}.svg / .png")


def png(svg: Path, target: Path, vw: float, vh: float) -> None:
    """Rasterise through headless Chrome, on a transparent ground."""
    height = round(PNG_WIDTH * vh / vw)
    with tempfile.TemporaryDirectory() as tmp:
        page = Path(tmp) / "laurel.html"
        page.write_text(
            '<!doctype html><html><body style="margin:0;background:transparent">'
            f'<img src="{svg.resolve().as_uri()}" style="display:block;width:{PNG_WIDTH}px;height:{height}px">'
            "</body></html>",
            encoding="utf-8",
        )
        subprocess.run(
            [
                str(CHROME), "--headless=new", "--disable-gpu", "--hide-scrollbars",
                "--default-background-color=00000000", f"--window-size={PNG_WIDTH},{height}",
                f"--user-data-dir={Path(tmp) / 'profile'}",
                f"--screenshot={target.resolve()}", page.resolve().as_uri(),
            ],
            check=True, capture_output=True,
        )


if __name__ == "__main__":
    main()
