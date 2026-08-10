"""
Cut a web-sized Fangsong out of the full Zhuque family.

    python scripts/subset-fangsong.py path/to/ZhuqueFangsong-Regular.ttf

Re-run it whenever Chinese copy is added — the subset only carries characters
that were in the source when it was built, and a character that is not in the
file falls back to whatever the operating system happens to have, which is the
exact lottery this is here to end.

Why subset at all: the upstream face is 8.4 MB. A CJK font is unshippable
whole, and the usual escape hatch — unicode-range splitting into dozens of
chunks — is aimed at sites whose text is not known ahead of time. Every Chinese
character this site can render lives in src/lib/i18n.ts, so the exact set is
known at build time and the answer is a single small file.

Latin is deliberately excluded. The :lang(zh) rule in globals.css lists
Cormorant ahead of Fangsong, so Latin resolves to Cormorant and only the
characters Cormorant lacks fall through to here. Adding Latin would be dead
weight the browser downloads and never draws.

The upstream .ttf is not committed. It is a 5.5 MB build input under OFL 1.1,
and the licence travels with the subset instead — see public/fonts/OFL.txt.
"""

import re
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "app" / "fonts" / "zhuque-fangsong-subset.woff2"

# Anything Cormorant cannot draw. Ideographs plus the punctuation that sits
# between them — Cormorant has no 。、《》 either, so those must come from here.
CJK = re.compile(
    r"[　-〿㐀-䶿一-鿿豈-﫿︰-﹏＀-￯]"
)

# Punctuation that has not appeared in the copy yet but certainly will. Twenty
# glyphs is nothing, and it buys a margin against shipping a subset that breaks
# the moment someone adds a quotation mark.
LIKELY = "。，、；：？！“”‘’（）〈〉《》【】—…·　～％"


def used_characters() -> set[str]:
    found: set[str] = set(LIKELY)
    for path in sorted((ROOT / "src").rglob("*.ts*")):
        found.update(CJK.findall(path.read_text(encoding="utf-8")))
    return found


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(f"usage: python {Path(__file__).name} <ZhuqueFangsong-Regular.ttf>")

    source = Path(sys.argv[1])
    if not source.is_file():
        sys.exit(f"not found: {source}")

    chars = used_characters()
    text = "".join(sorted(chars))
    OUT.parent.mkdir(parents=True, exist_ok=True)

    subset.main(
        [
            str(source),
            f"--text={text}",
            "--flavor=woff2",
            f"--output-file={OUT}",
            # Keep the name table so the licence and family survive in the file
            # itself, not only in the repo.
            "--name-IDs=*",
            "--layout-features=*",
            "--drop-tables+=DSIG",
        ]
    )

    # A subset that silently omits a requested character is the failure this
    # script exists to prevent, so prove every one made it.
    produced = set(TTFont(OUT).getBestCmap())
    missing = sorted(c for c in chars if ord(c) not in produced)

    print(f"characters requested : {len(chars)}")
    print(f"characters in output : {len(produced)}")
    print(f"output               : {OUT.relative_to(ROOT)}  {OUT.stat().st_size / 1024:.1f} KB")
    print(f"source               : {source.stat().st_size / 1024 / 1024:.2f} MB")
    if missing:
        sys.exit(f"MISSING from the upstream face: {''.join(missing)}")
    print("every requested character is present")


if __name__ == "__main__":
    main()
