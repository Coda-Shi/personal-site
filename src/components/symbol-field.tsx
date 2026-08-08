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
 * first, and a mismatch would break hydration.
 */

const BOARD = 2000;
const C = BOARD / 2;
const PAD = 16; // clear space demanded around every box, in board units

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
  anchor: { width: 220, min: 24, max: 32, r0: 300, r1: 560, o0: 0.34, o1: 0.26, d0: 0, d1: 160 },
  support: { width: 175, min: 15, max: 24, r0: 320, r1: 780, o0: 0.24, o1: 0.13, d0: 130, d1: 330 },
  texture: { width: 90, min: 12, max: 19, r0: 280, r1: 950, o0: 0.17, o1: 0.07, d0: 280, d1: 520 },
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

function rand(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
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
    const dx = x - C;
    const dy = y - C;
    const r = Math.hypot(dx, dy);
    if (r < 250 || r > 990) return false;
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
    box: { x: 263, y: 782, w: 200, h: 282 },
    opacity: 0.3,
    delay: 40,
  },
  {
    key: "figure",
    href: "/creative/dear-suspect-figure.png",
    box: { x: 290, y: 1085, w: 460, h: 557 },
    opacity: 0.22,
    delay: 190,
  },
];

function layout(track: TrackId): Placed[] {
  const arc = TRACK_ARCS[track];
  const span = arc.end - arc.start;
  const taken: Box[] = track === "creative" ? PLATES.map((p) => p.box) : [];
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
        const cx = C + Math.cos((angle * Math.PI) / 180) * radius;
        const cy = C + Math.sin((angle * Math.PI) / 180) * radius;
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
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 size-full text-bone"
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
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
