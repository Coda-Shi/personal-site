import { SYMBOL_LAYERS, TRACK_ARCS, type TrackId } from "@/lib/content";

/**
 * The faint layer of notation that fills a sector's beam once it is lit.
 *
 * Laid out on a fixed 2000×2000 board rather than in viewport units. The board
 * scales as one piece, so the relative position of every item is identical at
 * every resolution — solve the crowding once and it stays solved. Positioning
 * each item independently in vmin, as the first version did, re-shuffled the
 * field on every viewport and produced a different pile-up each time.
 *
 * Placement is a hash of the index, never Math.random: this server-renders
 * first, and a mismatch would break hydration.
 */

const BOARD = 2000;
const C = BOARD / 2;
const R_MIN = 210;
const R_MAX = 960;
const PAD = 14; // clear space demanded around every box, in board units

function rand(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

type Kind = "formula" | "phrase" | "mark" | "shape";
type Item = { kind: Kind; text: string; shape?: number };
type Box = { x: number; y: number; w: number; h: number };
type Placed = Item & { cx: number; cy: number; size: number };

const SIZE: Record<Kind, number> = { phrase: 27, formula: 21, mark: 25, shape: 34 };
// Mean advance width as a fraction of the em, measured per family. Used only
// to reserve space, so a rough figure is enough — it just has to not
// under-estimate, or boxes will touch.
const ADVANCE: Record<Kind, number> = { phrase: 0.46, formula: 0.62, mark: 0.66, shape: 1 };

function buildItems(track: TrackId): Item[] {
  const layer = SYMBOL_LAYERS[track];
  const items: Item[] = [
    ...layer.phrases.map((text) => ({ kind: "phrase" as const, text })),
    ...layer.formulas.map((text) => ({ kind: "formula" as const, text })),
  ];

  if (layer.marks.length > 0) {
    for (let i = 0; i < 34; i += 1) {
      items.push({ kind: "mark", text: layer.marks[i % layer.marks.length] });
    }
  }

  // Professional was asked for as pure texture: drawn flowchart primitives,
  // no readable words at all.
  if (track === "professional") {
    for (let i = 0; i < 46; i += 1) {
      items.push({ kind: "shape", text: "", shape: i % 6 });
    }
  }

  return items;
}

function overlaps(a: Box, b: Box) {
  return (
    a.x - PAD < b.x + b.w &&
    a.x + a.w + PAD > b.x &&
    a.y - PAD < b.y + b.h &&
    a.y + a.h + PAD > b.y
  );
}

/** Every corner of the box must sit inside the wedge, or the mask slices text. */
function insideWedge(box: Box, start: number, end: number) {
  const corners = [
    [box.x, box.y],
    [box.x + box.w, box.y],
    [box.x, box.y + box.h],
    [box.x + box.w, box.y + box.h],
  ];
  return corners.every(([x, y]) => {
    const dx = x - C;
    const dy = y - C;
    const r = Math.hypot(dx, dy);
    if (r < R_MIN * 0.9 || r > R_MAX * 1.04) return false;
    let a = (Math.atan2(dy, dx) * 180) / Math.PI;
    while (a < start) a += 360;
    while (a >= start + 360) a -= 360;
    return a <= end;
  });
}

/**
 * The Creative sector carries the DEAR SUSPECT key art, keyed down to its brush
 * strokes. It is reserved before any text is placed so the notation flows
 * around the figure rather than across her.
 */
const FIGURE: Box = { x: C - 620, y: C + 120, w: 470, h: 570 };

function layout(track: TrackId): Placed[] {
  const arc = TRACK_ARCS[track];
  const span = arc.end - arc.start;
  const taken: Box[] = track === "creative" ? [FIGURE] : [];
  const placed: Placed[] = [];
  let seed = track.length * 97 + 5;

  for (const item of buildItems(track)) {
    const size = SIZE[item.kind];
    const w = item.kind === "shape" ? size : Math.max(size, item.text.length * size * ADVANCE[item.kind]);
    const h = size * 1.15;

    for (let attempt = 0; attempt < 60; attempt += 1) {
      seed += 1;
      const angle = arc.start + 3 + rand(seed * 2) * (span - 6);
      const radius = R_MIN + rand(seed * 2 + 1) * (R_MAX - R_MIN);
      const cx = C + Math.cos((angle * Math.PI) / 180) * radius;
      const cy = C + Math.sin((angle * Math.PI) / 180) * radius;
      const box: Box = { x: cx - w / 2, y: cy - h / 2, w, h };

      if (!insideWedge(box, arc.start, arc.end)) continue;
      if (taken.some((t) => overlaps(t, box))) continue;

      taken.push(box);
      placed.push({ ...item, cx, cy, size });
      break;
    }
    // An item that cannot find clear space is dropped. A gap reads as
    // composition; an overlap reads as a bug.
  }

  return placed;
}

const LAYOUTS: Record<TrackId, Placed[]> = {
  scholarly: layout("scholarly"),
  creative: layout("creative"),
  professional: layout("professional"),
};

function FlowShape({ variant, cx, cy, size }: { variant: number; cx: number; cy: number; size: number }) {
  const s = size / 24;
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.4 / s };
  return (
    <g transform={`translate(${cx - size / 2} ${cy - size / 2}) scale(${s})`}>
      {variant === 0 ? <path d="M12 3 L21 12 L12 21 L3 12 Z" {...common} /> : null}
      {variant === 1 ? <rect x="2" y="8" width="20" height="9" {...common} /> : null}
      {variant === 2 ? <rect x="2" y="8" width="20" height="9" rx="4.5" {...common} /> : null}
      {variant === 3 ? <path d="M7 8 L23 8 L17 17 L1 17 Z" {...common} /> : null}
      {variant === 4 ? <path d="M2 12 H19 M14.5 7.5 L19.5 12 L14.5 16.5" {...common} /> : null}
      {variant === 5 ? <path d="M4 3 V21 M20 3 V21 M4 12 H20" {...common} /> : null}
    </g>
  );
}

export function SymbolField({ track, active }: { track: TrackId; active: boolean }) {
  const arc = TRACK_ARCS[track];
  const span = arc.end - arc.start;
  const from = arc.start + 90; // conic starts at 12 o'clock, arcs at 3 o'clock
  const mask = `conic-gradient(from ${from}deg at 50% 50%, #000 0deg, #000 ${span}deg, transparent ${span}deg)`;

  return (
    <svg
      viewBox={`0 0 ${BOARD} ${BOARD}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 size-full text-bone transition-opacity duration-700 ease-out"
      style={{ opacity: active ? 1 : 0, maskImage: mask, WebkitMaskImage: mask }}
    >
      {track === "creative" ? (
        <image
          href="/creative/dear-suspect-figure.png"
          x={FIGURE.x}
          y={FIGURE.y}
          width={FIGURE.w}
          height={FIGURE.h}
          preserveAspectRatio="xMidYMid meet"
          opacity={0.22}
        />
      ) : null}

      {LAYOUTS[track].map((item, i) => {
        const fade = rand(i * 5 + 17);
        const opacity = 0.09 + fade * 0.15;

        if (item.kind === "shape") {
          return (
            <g key={`s-${i}`} opacity={opacity}>
              <FlowShape variant={item.shape ?? 0} cx={item.cx} cy={item.cy} size={item.size} />
            </g>
          );
        }

        const isPhrase = item.kind === "phrase";
        return (
          <text
            key={`${item.kind}-${i}-${item.text}`}
            x={item.cx}
            y={item.cy}
            textAnchor="middle"
            dominantBaseline="central"
            fill="currentColor"
            opacity={opacity}
            fontSize={item.size}
            fontFamily={isPhrase ? "var(--font-display)" : "var(--font-mono)"}
            fontStyle={isPhrase ? "italic" : undefined}
            letterSpacing={isPhrase ? 0 : 1.2}
          >
            {item.text}
          </text>
        );
      })}
    </svg>
  );
}
