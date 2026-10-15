"""
Key the outlets' marks to bone for the "As seen on" row on the Creative page.

    python scripts/press-marks.py

Requires pillow and numpy. Sources live in `_incoming/press/`, which is
gitignored like the rest of `_incoming/` — they are other people's logos,
fetched once, and the repo carries only what this script makes of them.

Where each came from, so they can be fetched again:

    indienova.png  assets.indienova.com/assets/images/logos/indienova_new@2x.png
                   (the CDN refuses requests without an indienova.com referer)
    yystv.png      alioss.yystv.cn/static/pages/nav/logo@2x.png
    sohu.png       zh.wikipedia.org, File:Sohu_logo.png
    tencent.png    commons.wikimedia.org, File:Tencent_logo_2017.svg — which is
                   itself a raster wrapped in SVG, so it was rendered once in
                   headless Chrome at 300px tall on a transparent ground
    netease.png    zh.wikipedia.org, File:NetEase_logo.svg, rendered the same way

Three different treatments, because the five marks are built three ways:

- `silhouette` for a mark drawn in colours on transparency (indienova, Tencent,
  NetEase): every drawn pixel is the mark, so alpha alone is the answer.
- `bright` for a mark that uses dark strokes *inside* light shapes (游研社's
  gamepad on its yellow tile): alpha times brightness, so the strokes become
  holes and the gamepad survives instead of filling in to a block.
- `off_ground` for a mark printed on an opaque colour (Sohu, black type on a
  yellow block): ink is distance from that ground colour, which keeps the red
  O as well as the black — a plain darkness test drops it.

Output is bone on transparent, trimmed, 96px tall. The row sets each one to an
optical size (equal area rather than equal height — see PRESS in content.ts),
and none of them is ever shown above 28px, so 96 is generous.
"""

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "_incoming" / "press"
OUT = ROOT / "public" / "creative" / "press"
BONE = (242, 239, 233)
HEIGHT = 96


def rgba(name: str) -> np.ndarray:
    return np.asarray(Image.open(SRC / name).convert("RGBA")).astype(np.float32) / 255.0


def silhouette(name: str) -> np.ndarray:
    return rgba(name)[..., 3]


def bright(name: str) -> np.ndarray:
    a = rgba(name)
    lum = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
    return a[..., 3] * np.clip((lum - 0.35) / 0.40, 0, 1)


def off_ground(name: str, ground: tuple[int, int, int]) -> np.ndarray:
    # Upscaled first: the Sohu file is 151px wide and its type is a few pixels
    # tall, so keying at native size stair-steps every stroke.
    img = Image.open(SRC / name).convert("RGB")
    img = img.resize((img.width * 3, img.height * 3), Image.LANCZOS)
    a = np.asarray(img).astype(np.float32)
    dist = np.sqrt(((a - np.array(ground, dtype=np.float32)) ** 2).sum(axis=2))
    return np.clip((dist - 40) / 120, 0, 1)


def emit(alpha: np.ndarray, out: Path) -> tuple[int, int]:
    ys, xs = np.where(alpha > 0.04)
    pad = 4
    a = alpha[max(0, ys.min() - pad) : ys.max() + pad + 1, max(0, xs.min() - pad) : xs.max() + pad + 1]
    h, w = a.shape
    width = round(w * HEIGHT / h)
    mask = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8), "L").resize((width, HEIGHT), Image.LANCZOS)
    img = Image.new("RGB", (width, HEIGHT), BONE).convert("RGBA")
    img.putalpha(mask)
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, optimize=True)
    return width, HEIGHT


MARKS = {
    "indienova": lambda: silhouette("indienova.png"),
    "yystv": lambda: bright("yystv.png"),
    "tencent": lambda: silhouette("tencent.png"),
    "sohu": lambda: off_ground("sohu.png", (253, 208, 0)),
    "netease": lambda: silhouette("netease.png"),
}


def main() -> None:
    for name, key in MARKS.items():
        w, h = emit(key(), OUT / f"{name}.png")
        size = (OUT / f"{name}.png").stat().st_size
        print(f"  {name:10} {w}x{h}  aspect {w / h:.3f}  {size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
