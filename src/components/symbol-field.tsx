import { BorromeanKnot, KNOT_VIEWBOX } from "@/components/borromean-knot";
import { SYMBOL_LAYERS, TRACK_ARCS, type SymbolItem, type TrackId } from "@/lib/content";

/**
 * The faint layer of notation that fills a sector's beam once it is lit.
 *
 * Laid out on a fixed 2000×2000 board. The board scales as one piece, so every
 * relative position is identical at every resolution — crowding is solved once
 * and stays solved. Positioning items independently in viewport units, as the
 * first version did, re-shuffled the field on every viewport and produced a
 * different pile-up each time.
 *
 * Three sizes, not a ramp: font size stops working as an encoding past
 * large / medium / small.
 *
 * Size is solved from a target *rendered width*, not chosen per item. A single
 * font size hands the emphasis to whichever string is longest regardless of
 * what it means, which is most of why auto-generated word clouds look the way
 * they do.
 *
 * Placement is a hash of the index, never Math.random: this server-renders
 * first, and a mismatch would break hydration. Being pure is necessary but was
 * not sufficient — see `snap` and `rand` below for why, and do not remove the
 * grid snapping without reading it.
 */

const BOARD = 2000;
const C = BOARD / 2;
const PAD = 16; // clear space demanded around every box, in board units

/**
 * Radial band the field may occupy, in board units.
 *
 * The SVG uses `preserveAspectRatio="xMidYMid meet"`, never `slice`. Slice
 * scales the board to *cover* the viewport, so on a 2:1 screen only the middle
 * ±506 board units survive — and because Scholarly points upward, most of its
 * field, the knot included, was rendering above the top edge where nobody
 * could see it. `meet` fits the whole board, which is what makes R_MAX a
 * promise rather than a hope. The beam is a separate element and still runs to
 * the corners.
 *
 * R_MIN has to clear the disc, and the two scale differently: the board tracks
 * min(vw, vh) while the disc is min(56vh, 30rem). Worked through the viewport
 * range that puts the disc's outer tick at up to 549 board units — worst on
 * short screens, where the disc eats more than half the board radius — so the
 * floor sits at 580 with margin.
 *
 * There is deliberately no outer *radius* cap. The board is a fully visible
 * square, so the corners sit at radius 1414 and a circular ceiling would throw
 * away the roomiest part of every wedge. Items are bounded by the board
 * rectangle instead.
 */
const R_MIN = 580;
const EDGE = 20;

type Tier = "anchor" | "support" | "texture";

const TIERS: Record<
  Tier,
  {
    width: number;
    min: number;
    max: number;
    r0: number;
    r1: number;
    o0: number;
    o1: number;
    /** Reveal window: base delay plus jitter, so the field arrives unevenly. */
    d0: number;
    d1: number;
  }
> = {
  // The ceiling is deliberately low. Solved widths want to push the short
  // anchors past 40, which shouted over everything else; 32 keeps the top of
  // the hierarchy roughly a third larger than support rather than double.
  anchor: { width: 220, min: 24, max: 32, r0: 600, r1: 820, o0: 0.34, o1: 0.26, d0: 0, d1: 160 },
  support: { width: 175, min: 15, max: 24, r0: 590, r1: 1000, o0: 0.24, o1: 0.13, d0: 130, d1: 330 },
  texture: { width: 90, min: 12, max: 19, r0: 585, r1: 1180, o0: 0.17, o1: 0.07, d0: 280, d1: 520 },
};

/**
 * Two advance tables, because the two jobs want opposite errors.
 *
 * ADVANCE is the typical advance and drives the solved font size — too
 * pessimistic and every string comes out undersized.
 *
 * BOX is the worst case and drives the collision rectangle, which must never
 * under-estimate. Mono needs a lot of headroom: JetBrains Mono has no Greek or
 * logic notation, so Σ Λ Φ ⊨ come from a fallback face at roughly 0.72em
 * against the 0.62em of the mono grid. Sizing on 0.62 and colliding on 0.62
 * put the factor equation 6 units into its neighbour.
 */
const ADVANCE = { mono: 0.62, serif: 0.46 } as const;
const BOX_ADVANCE = { mono: 0.78, serif: 0.52 } as const;

/**
 * Round to a fixed grid. Multiply, round, divide are all exactly specified by
 * IEEE 754 and ECMA-262, so every engine returns the identical double.
 */
function snap(value: number, grid: number) {
  return Math.round(value * grid) / grid;
}

/**
 * Deterministic pseudo-random in [0, 1).
 *
 * `sin(seed) * 43758.5453` is the shader-golf idiom, and it is pure — but pure
 * is not the same as portable. ECMA-262 leaves `Math.sin` implementation
 * defined, so Node and V8-in-Chrome disagree in the last ulp; the 43758×
 * multiplier lifts that to ~1e-12 in the unit interval, and `angle` and
 * `radius` carry it to ~1e-8 in board units. Measured on this repo: summing
 * 5000 draws gives 2475.35446484680 in Node v24 and 2475.35446484678 in
 * Chrome. React saw two different `x` attributes, reported a hydration
 * mismatch, and abandoned hydration for the whole tree.
 *
 * Snapping to 1e-6 is six orders coarser than the disagreement and nine orders
 * finer than a visible position, so both engines agree and the arrangement is
 * the one already signed off in D13. A 1e-9 grid is *not* enough: the layout
 * takes on the order of a thousand draws, and at that grid the odds of some
 * draw straddling a rounding boundary stop being negligible.
 *
 * The alternative — an integer hash, bit-exact by construction — reshuffles
 * every position and changes which items get dropped. Rejected for that reason
 * alone, not on the merits.
 */
function rand(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return snap(x - Math.floor(x), 1e6);
}

type Box = { x: number; y: number; w: number; h: number };
type Placed = {
  key: string;
  text: string;
  face: SymbolItem["face"];
  cx: number;
  cy: number;
  size: number;
  opacity: number;
  delay: number;
};

function overlaps(a: Box, b: Box) {
  return (
    a.x - PAD < b.x + b.w &&
    a.x + a.w + PAD > b.x &&
    a.y - PAD < b.y + b.h &&
    a.y + a.h + PAD > b.y
  );
}

/** Every corner must sit inside the wedge, or the conic mask slices the text. */
function insideWedge(box: Box, start: number, end: number) {
  return (
    [
      [box.x, box.y],
      [box.x + box.w, box.y],
      [box.x, box.y + box.h],
      [box.x + box.w, box.y + box.h],
    ] as const
  ).every(([x, y]) => {
    if (x < EDGE || x > BOARD - EDGE || y < EDGE || y > BOARD - EDGE) return false;
    const dx = x - C;
    const dy = y - C;
    const r = Math.hypot(dx, dy);
    if (r < R_MIN) return false;
    let a = (Math.atan2(dy, dx) * 180) / Math.PI;
    while (a < start) a += 360;
    while (a >= start + 360) a -= 360;
    return a <= end;
  });
}

/**
 * The Creative sector's two line plates, reserved before any glyph is placed.
 * Positions are hand-set, not solved: with the music notation removed these
 * two carry the whole wedge, so where they sit is a composition decision.
 * Both derived by scripts/keyart-lineart.py.
 */
const PLATES = [
  {
    key: "mark",
    href: "/creative/elegists-mark.png",
    box: { x: 133, y: 758, w: 190, h: 268 },
    opacity: 0.3,
    delay: 40,
  },
  {
    key: "figure",
    href: "/creative/dear-suspect-figure.png",
    box: { x: 121, y: 1349, w: 380, h: 460 },
    opacity: 0.22,
    delay: 190,
  },
];

/**
 * Lacan's knot in the Scholarly wedge. Reserved like the Creative plates, and
 * hand-placed for the same reason: it is a composition, not a fill item. Sized
 * to take real space — it is the only Lacan content in the sector, standing in
 * for the whole vocabulary of mathemes.
 */
/**
 * Sized to the largest box that still fits the band. The wedge points straight
 * up, so the knot is squeezed between R_MIN at the bottom and the board edge at
 * the top: its lower corners land at radius 587, twenty units clear of the
 * floor, and its top edge at y=32 is twelve clear of the margin. Going bigger
 * means either crossing the disc or falling off the board.
 */
const KNOT_BOX: Box = { x: 800, y: 32, w: 400, h: 416 }; // 300×312 local, ×1.333
const KNOT_DELAY = 90;

function layout(track: TrackId): Placed[] {
  const arc = TRACK_ARCS[track];
  const span = arc.end - arc.start;
  const taken: Box[] =
    track === "creative"
      ? PLATES.map((p) => p.box)
      : track === "scholarly"
        ? [KNOT_BOX]
        : [];
  const placed: Placed[] = [];
  let seed = track.length * 97 + 5;

  const tiers: [Tier, SymbolItem[]][] = [
    ["anchor", SYMBOL_LAYERS[track].anchors],
    ["support", SYMBOL_LAYERS[track].support],
    ["texture", SYMBOL_LAYERS[track].texture],
  ];

  // Anchors go down first and nearest the arc, so the largest things claim the
  // calmest space and everything else arranges itself around them.
  for (const [tier, items] of tiers) {
    const t = TIERS[tier];
    for (const item of items) {
      const raw = t.width / Math.max(1, item.text.length * ADVANCE[item.face]);
      const size = Math.min(t.max, Math.max(t.min, raw));
      const w = item.text.length * size * BOX_ADVANCE[item.face];
      const h = size * 1.25;

      for (let attempt = 0; attempt < 80; attempt += 1) {
        seed += 1;
        const angle = arc.start + 3 + rand(seed * 2) * (span - 6);
        const radius = t.r0 + rand(seed * 2 + 1) * (t.r1 - t.r0);
        // Snapped before the box is built, so collision detection and the
        // rendered attribute are the same number — otherwise the two engines
        // could accept different candidates and produce genuinely different
        // layouts, not merely different digits. cos/sin are the last
        // implementation-defined step in the pipeline; 1e-3 board units is
        // 4e-4 of a pixel at the size this board renders, and ten orders of
        // magnitude coarser than the ulp they disagree by.
        const cx = snap(C + Math.cos((angle * Math.PI) / 180) * radius, 1e3);
        const cy = snap(C + Math.sin((angle * Math.PI) / 180) * radius, 1e3);
        const box: Box = { x: cx - w / 2, y: cy - h / 2, w, h };

        if (!insideWedge(box, arc.start, arc.end)) continue;
        if (taken.some((b) => overlaps(b, box))) continue;

        taken.push(box);
        const k = (radius - t.r0) / (t.r1 - t.r0);
        placed.push({
          key: `${tier}-${item.text}`,
          text: item.text,
          face: item.face,
          cx,
          cy,
          size,
          opacity: t.o0 + (t.o1 - t.o0) * k,
          delay: Math.round(t.d0 + rand(seed * 3 + 7) * (t.d1 - t.d0)),
        });
        break;
      }
      // An item that finds nowhere is dropped. A gap reads as composition;
      // an overlap reads as a bug.
    }
  }

  return placed;
}

const LAYOUTS: Record<TrackId, Placed[]> = {
  scholarly: layout("scholarly"),
  creative: layout("creative"),
  professional: layout("professional"),
};

export function SymbolField({ track, active }: { track: TrackId; active: boolean }) {
  const arc = TRACK_ARCS[track];
  const items = LAYOUTS[track];
  const plates = track === "creative" ? PLATES : [];
  if (items.length === 0 && plates.length === 0) return null;

  const span = arc.end - arc.start;
  const from = arc.start + 90; // conic starts at 12 o'clock, arcs at 3 o'clock
  const mask = `conic-gradient(from ${from}deg at 50% 50%, #000 0deg, #000 ${span}deg, transparent ${span}deg)`;

  // Each element carries its own delay so the field assembles unevenly rather
  // than switching on as a block. On the way out the delay drops to zero, so
  // closing a sector is immediate — a staggered exit reads as lag.
  const reveal = (target: number, delay: number) => ({
    opacity: active ? target : 0,
    transition: "opacity 620ms ease-out",
    transitionDelay: active ? `${delay}ms` : "0ms",
  });

  return (
    <svg
      viewBox={`0 0 ${BOARD} ${BOARD}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 size-full text-bone"
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
      {track === "scholarly" ? (
        <g
          transform={`translate(${KNOT_BOX.x} ${KNOT_BOX.y}) scale(${KNOT_BOX.w / KNOT_VIEWBOX.w})`}
          style={reveal(0.3, KNOT_DELAY)}
        >
          <BorromeanKnot />
        </g>
      ) : null}

      {plates.map((plate) => (
        <image
          key={plate.key}
          href={plate.href}
          x={plate.box.x}
          y={plate.box.y}
          width={plate.box.w}
          height={plate.box.h}
          preserveAspectRatio="xMidYMid meet"
          style={reveal(plate.opacity, plate.delay)}
        />
      ))}

      {items.map((item) => (
        <text
          key={item.key}
          x={item.cx}
          y={item.cy}
          textAnchor="middle"
          dominantBaseline="central"
          fill="currentColor"
          fontSize={item.size}
          fontFamily={item.face === "serif" ? "var(--font-display)" : "var(--font-mono)"}
          fontStyle={item.face === "serif" ? "italic" : undefined}
          letterSpacing={item.face === "serif" ? 0 : 1.1}
          style={reveal(item.opacity, item.delay)}
        >
          {item.text}
        </text>
      ))}
    </svg>
  );
}
