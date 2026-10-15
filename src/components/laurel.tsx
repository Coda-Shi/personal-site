import { INDIEPLAY } from "@/lib/content";

/**
 * DEAR SUSPECT's indiePlay laurel, drawn in the site's own hand.
 *
 * 🔴 **Drawn, not keyed — and that was tried first.** The owner asked for the
 * official laurel processed to bone. The official one is a glossy, layered
 * graphic: a gradient fill under a dark stroke under a light glow, on every
 * leaf and every glyph. Keying it to one colour — by ink, by distance from the
 * white ground, binarised, with the strokes as negative space and without —
 * never produced a mark: the text came out as dark glyphs inside bone halos,
 * the leaves as grey metal. A single-colour version of a design like that has
 * to be redrawn, which is what festivals' own white laurels are.
 *
 * So the wording is the official graphic's, verbatim and in the same order
 * (2026 indiePlay / 最佳AI游戏作品 / BEST AI GAMES), set in the site's faces,
 * between two branches drawn as geometry. The fourth line is ours and it is
 * not optional: the official graphic is the category's header, the same for
 * every game in it and for the winner, so without 入围 · FINALIST the badge
 * would claim more than happened. If the finalist kit from the organisers
 * includes an official white laurel, it replaces this one.
 *
 * Inline SVG rather than a file in /public, so the text is real text in the
 * site's web fonts (an SVG loaded through <img> gets none) and follows
 * currentColor like everything else on the page.
 */
const W = 480;
const H = 168;

// Each branch is an arc of one circle, bulging outward like a parenthesis, from
// the bottom (T0) up through its outermost point at 180° to the top (T1).
const CX = 152;
const CY = 86;
const R = 96;
const T0 = 128;
const T1 = 232;

const LEAVES = 9;
const SPLAY = (40 * Math.PI) / 180;

/** Snapped like every computed coordinate that reaches an attribute (D15). */
const snap = (n: number) => Math.round(n * 100) / 100;

function point(t: number): [number, number] {
  const a = (t * Math.PI) / 180;
  return [CX + R * Math.cos(a), CY + R * Math.sin(a)];
}

/**
 * One leaf: a vesica from base to tip, two quadratic curves whose control
 * points sit either side of the midline. Leaves alternate between the outside
 * and the inside of the curve and shrink toward the tip, which is how a laurel
 * branch is drawn and what makes two of them read as a wreath and not a
 * pair of brackets.
 */
function leaf(t: number, side: 1 | -1, length: number, splay = SPLAY) {
  const a = (t * Math.PI) / 180;
  const [bx, by] = point(t);
  // Tangent in the direction the branch grows (bottom to top), and the outward
  // normal. Screen coordinates: y runs down, so increasing t runs clockwise.
  const tx = -Math.sin(a);
  const ty = Math.cos(a);
  const nx = Math.cos(a);
  const ny = Math.sin(a);
  let dx = tx * Math.cos(splay) + side * nx * Math.sin(splay);
  let dy = ty * Math.cos(splay) + side * ny * Math.sin(splay);
  const n = Math.hypot(dx, dy);
  dx /= n;
  dy /= n;
  const width = length * 0.36;
  const ex = bx + dx * length;
  const ey = by + dy * length;
  const mx = bx + (dx * length) / 2;
  const my = by + (dy * length) / 2;
  const px = -dy * width;
  const py = dx * width;
  return `M ${snap(bx)} ${snap(by)} Q ${snap(mx + px)} ${snap(my + py)} ${snap(ex)} ${snap(ey)} Q ${snap(mx - px)} ${snap(my - py)} ${snap(bx)} ${snap(by)} Z`;
}

const [x0, y0] = point(T0);
const [x1, y1] = point(T1);
const STEM = `M ${snap(x0)} ${snap(y0)} A ${R} ${R} 0 0 1 ${snap(x1)} ${snap(y1)}`;

const BRANCH = [
  ...Array.from({ length: LEAVES }, (_, i) => {
    const t = T0 + 8 + (i * (T1 - T0 - 14)) / (LEAVES - 1);
    const length = 27 - (i * 10) / (LEAVES - 1);
    return leaf(t, i % 2 === 0 ? 1 : -1, length);
  }),
  // The tip: one leaf straight along the stem, so the branch ends in a point
  // rather than a cut.
  leaf(T1, 1, 17, 0),
].join(" ");

const latin = { fontFamily: "var(--font-display)" } as const;
const han = { fontFamily: "var(--font-fangsong)" } as const;

export function Laurel({ label, className }: { label: string; className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={label}
      className={`text-bone ${className ?? ""}`}
    >
      <g fill="currentColor" stroke="none" opacity={0.78}>
        <g>
          <path d={STEM} fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
          <path d={BRANCH} />
        </g>
        <g transform={`translate(${W} 0) scale(-1 1)`}>
          <path d={STEM} fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
          <path d={BRANCH} />
        </g>
      </g>

      {/* The small lines are sized for the phone, where the laurel takes the
          column's full 327px — a scale of 0.68, so 14 units is 9.5px, just
          over the floor for spaced capitals in Cormorant (D24). */}
      <g fill="currentColor" textAnchor="middle">
        <text x={W / 2} y={48} fontSize={17} opacity={0.72} style={{ ...latin, letterSpacing: "0.04em" }}>
          {INDIEPLAY.edition}
        </text>
        <text x={W / 2} y={91} fontSize={30} opacity={0.92}>
          <tspan style={han}>{INDIEPLAY.category.zh.slice(0, 2)}</tspan>
          <tspan style={latin}>{INDIEPLAY.category.zh.slice(2, 4)}</tspan>
          <tspan style={han}>{INDIEPLAY.category.zh.slice(4)}</tspan>
        </text>
        <text
          x={W / 2}
          y={119}
          fontSize={14}
          fontWeight={600}
          opacity={0.72}
          style={{ ...latin, letterSpacing: "0.24em" }}
        >
          {INDIEPLAY.category.en}
        </text>
        <text x={W / 2} y={148} fontSize={14} opacity={0.6}>
          <tspan style={han}>{INDIEPLAY.status.zh}</tspan>
          <tspan dx={8} style={latin}>
            ·
          </tspan>
          <tspan dx={8} fontWeight={600} style={{ ...latin, letterSpacing: "0.24em" }}>
            {INDIEPLAY.status.en}
          </tspan>
        </text>
      </g>
    </svg>
  );
}
