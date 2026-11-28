import type { INDIEPLAY, TENCENT } from "@/lib/content";

type Award = typeof INDIEPLAY | (typeof TENCENT)[number];

/**
 * DEAR SUSPECT's laurels, drawn in the site's own hand: indiePlay (won) and
 * the Tencent Game Awards (finalist). One drawing; the words are the award's.
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
 * every game in it and for the winner, so the badge has to say which of the
 * two this is. It read 入围 · FINALIST until DEAR SUSPECT won the category on
 * 2026-11-22, and reads 获奖 · WINNER since (INDIEPLAY.status). If the
 * organisers issue an official white laurel, it replaces this one. The two
 * Tencent wins of 2026-11-27 have the same four lines (TENCENT): the English
 * name of the event on top, a step smaller because it is twice as long.
 *
 * 🔴 **Every laurel is bone, the wins too** (owner, 2026-11-28: the site keeps
 * one bone-white, minimal register). From 11-23 a win was gold; that read as
 * the one gold thing on the page and the trinity's gilt next to it, and it is
 * gone with --color-gold. The studio's laurel files still come in gold for
 * Steam and the press kit; that is their register, not this site's.
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

/** Han and Latin runs of a Chinese line, each in its own face (最佳 · AI · 游戏作品). */
const runs = (zh: string) =>
  zh
    .split(/([A-Za-z0-9]+)/)
    .filter(Boolean)
    .map((text, i) => ({ text, latin: /^[A-Za-z0-9]/.test(text), key: i }));

export function Laurel({
  award,
  label,
  className,
}: {
  award: Award;
  label: string;
  className?: string;
}) {
  // Bone is stepped down so the laurel sits under the key art rather than on
  // it, the names brightest and the edition and status a step back.
  const a = (opacity: number) => opacity;
  // A long English category is fitted between the branches by closing up its
  // tracking, not by shrinking the type, which is already at the phone's floor.
  const long = award.category.en.length > 20;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={label}
      className={`text-bone ${className ?? ""}`}
    >
      <g fill="currentColor" stroke="none" opacity={a(0.78)}>
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
        {/* TENCENT GAME AWARDS 2026 is twice "2026 indiePlay"; a step smaller
            keeps it clear of the leaves where the branches close in. */}
        <text
          x={W / 2}
          y={48}
          fontSize={award.edition.length > 16 ? 15 : 17}
          opacity={a(0.72)}
          style={{ ...latin, letterSpacing: "0.04em" }}
        >
          {award.edition}
        </text>
        <text x={W / 2} y={91} fontSize={30} opacity={a(0.92)}>
          {runs(award.category.zh).map((run) => (
            <tspan key={run.key} style={run.latin ? latin : han}>
              {run.text}
            </tspan>
          ))}
        </text>
        <text
          x={W / 2}
          y={119}
          fontSize={14}
          fontWeight={600}
          opacity={a(0.72)}
          style={{ ...latin, letterSpacing: long ? "0.1em" : "0.24em" }}
        >
          {award.category.en}
        </text>
        <text x={W / 2} y={148} fontSize={14} opacity={a(0.6)}>
          <tspan style={han}>{award.status.zh}</tspan>
          <tspan dx={8} style={latin}>
            ·
          </tspan>
          <tspan dx={8} fontWeight={600} style={{ ...latin, letterSpacing: "0.24em" }}>
            {award.status.en}
          </tspan>
        </text>
      </g>
    </svg>
  );
}
