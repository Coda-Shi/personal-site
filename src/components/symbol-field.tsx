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
 * Three sizes, not a ramp. Font size stops working as an encoding past
 * large / medium / small, so a continuous scale reads as noise rather than as
 * hierarchy.
 *
 * Size is set from target *rendered width*, not chosen per item. Font size
 * applied uniformly makes long strings dominate purely because they are long —
 * a sixty-character German sentence at the same size as ω swallows the sector.
 * Solving for width instead equalises visual mass, which is the whole reason
 * auto-generated word clouds look the way they do.
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
  { width: number; min: number; max: number; r0: number; r1: number; o0: number; o1: number }
> = {
  // r0/r1 bound the radial band; o0/o1 fade opacity across it, so the field
  // thins as it travels away from the arc it was fired from.
  anchor: { width: 330, min: 30, max: 58, r0: 300, r1: 560, o0: 0.34, o1: 0.26 },
  support: { width: 215, min: 17, max: 33, r0: 320, r1: 780, o0: 0.24, o1: 0.13 },
  texture: { width: 100, min: 14, max: 25, r0: 280, r1: 950, o0: 0.17, o1: 0.07 },
};

/** Mean advance as a fraction of the em. Only needs to not under-estimate. */
const ADVANCE = { mono: 0.62, serif: 0.46 } as const;

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
};
type Shape = { key: string; variant: number; cx: number; cy: number; size: number; opacity: number };

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
 * The Creative sector's two line plates, reserved before any glyph is placed so
 * the notation flows around them instead of across the figure's face.
 * Both derived by scripts/keyart-lineart.py.
 */
const PLATES: Record<string, { href: string; box: Box; opacity: number }> = {
  figure: {
    href: "/creative/dear-suspect-figure.png",
    box: { x: 328, y: 1186, w: 440, h: 533 },
    opacity: 0.2,
  },
  mark: {
    href: "/creative/elegists-mark.png",
    box: { x: 420, y: 876, w: 200, h: 282 },
    opacity: 0.26,
  },
};

function layout(track: TrackId): { text: Placed[]; shapes: Shape[] } {
  const arc = TRACK_ARCS[track];
  const span = arc.end - arc.start;
  const taken: Box[] = track === "creative" ? Object.values(PLATES).map((p) => p.box) : [];
  const text: Placed[] = [];
  const shapes: Shape[] = [];
  let seed = track.length * 97 + 5;

  const tiers: [Tier, SymbolItem[]][] = [
    ["anchor", SYMBOL_LAYERS[track].anchors],
    ["support", SYMBOL_LAYERS[track].support],
    ["texture", SYMBOL_LAYERS[track].texture],
  ];

  // Anchors are placed first and nearest the arc, so the largest things claim
  // the calmest space and everything else arranges itself around them.
  for (const [tier, items] of tiers) {
    const t = TIERS[tier];
    for (const item of items) {
      const raw = t.width / Math.max(1, item.text.length * ADVANCE[item.face]);
      const size = Math.min(t.max, Math.max(t.min, raw));
      const w = item.text.length * size * ADVANCE[item.face];
      const h = size * 1.2;

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
        text.push({
          key: `${tier}-${item.text}`,
          text: item.text,
          face: item.face,
          cx,
          cy,
          size,
          opacity: t.o0 + (t.o1 - t.o0) * k,
        });
        break;
      }
      // An item that finds nowhere is dropped. A gap reads as composition;
      // an overlap reads as a bug.
    }
  }

  if (track === "professional") {
    const sizes = [30, 44, 58];
    for (let i = 0; i < 18; i += 1) {
      const size = sizes[i % 3];
      for (let attempt = 0; attempt < 80; attempt += 1) {
        seed += 1;
        const angle = arc.start + 4 + rand(seed * 2) * (span - 8);
        const radius = 300 + rand(seed * 2 + 1) * 620;
        const cx = C + Math.cos((angle * Math.PI) / 180) * radius;
        const cy = C + Math.sin((angle * Math.PI) / 180) * radius;
        const box: Box = { x: cx - size / 2, y: cy - size / 2, w: size, h: size };
        if (!insideWedge(box, arc.start, arc.end)) continue;
        if (taken.some((b) => overlaps(b, box))) continue;
        taken.push(box);
        shapes.push({
          key: `shape-${i}`,
          variant: i % 6,
          cx,
          cy,
          size,
          opacity: 0.2 - (radius - 300) / 620 * 0.11,
        });
        break;
      }
    }
  }

  return { text, shapes };
}

const LAYOUTS: Record<TrackId, ReturnType<typeof layout>> = {
  scholarly: layout("scholarly"),
  creative: layout("creative"),
  professional: layout("professional"),
};

function FlowShape({ variant, cx, cy, size }: Omit<Shape, "key" | "opacity">) {
  const s = size / 24;
  const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.4 / s };
  return (
    <g transform={`translate(${cx - size / 2} ${cy - size / 2}) scale(${s})`}>
      {variant === 0 ? <path d="M12 3 L21 12 L12 21 L3 12 Z" {...stroke} /> : null}
      {variant === 1 ? <rect x="2" y="8" width="20" height="9" {...stroke} /> : null}
      {variant === 2 ? <rect x="2" y="8" width="20" height="9" rx="4.5" {...stroke} /> : null}
      {variant === 3 ? <path d="M7 8 L23 8 L17 17 L1 17 Z" {...stroke} /> : null}
      {variant === 4 ? <path d="M2 12 H19 M14.5 7.5 L19.5 12 L14.5 16.5" {...stroke} /> : null}
      {variant === 5 ? <path d="M4 3 V21 M20 3 V21 M4 12 H20" {...stroke} /> : null}
    </g>
  );
}

export function SymbolField({ track, active }: { track: TrackId; active: boolean }) {
  const arc = TRACK_ARCS[track];
  const span = arc.end - arc.start;
  const from = arc.start + 90; // conic starts at 12 o'clock, arcs at 3 o'clock
  const mask = `conic-gradient(from ${from}deg at 50% 50%, #000 0deg, #000 ${span}deg, transparent ${span}deg)`;
  const { text, shapes } = LAYOUTS[track];

  return (
    <svg
      viewBox={`0 0 ${BOARD} ${BOARD}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 size-full text-bone transition-opacity duration-700 ease-out"
      style={{ opacity: active ? 1 : 0, maskImage: mask, WebkitMaskImage: mask }}
    >
      {track === "creative"
        ? Object.entries(PLATES).map(([key, plate]) => (
            <image
              key={key}
              href={plate.href}
              x={plate.box.x}
              y={plate.box.y}
              width={plate.box.w}
              height={plate.box.h}
              preserveAspectRatio="xMidYMid meet"
              opacity={plate.opacity}
            />
          ))
        : null}

      {shapes.map((s) => (
        <g key={s.key} opacity={s.opacity}>
          <FlowShape variant={s.variant} cx={s.cx} cy={s.cy} size={s.size} />
        </g>
      ))}

      {text.map((item) => (
        <text
          key={item.key}
          x={item.cx}
          y={item.cy}
          textAnchor="middle"
          dominantBaseline="central"
          fill="currentColor"
          opacity={item.opacity}
          fontSize={item.size}
          fontFamily={item.face === "serif" ? "var(--font-display)" : "var(--font-mono)"}
          fontStyle={item.face === "serif" ? "italic" : undefined}
          letterSpacing={item.face === "serif" ? 0 : 1.1}
        >
          {item.text}
        </text>
      ))}
    </svg>
  );
}
