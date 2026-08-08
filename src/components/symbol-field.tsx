import { SYMBOL_LAYERS, TRACK_ARCS, type TrackId } from "@/lib/content";

/**
 * The faint layer of notation that fills a sector's beam once it is lit.
 *
 * It lives in the beam rather than inside the ring because "a lot of them"
 * needs the whole page; the ring has room for about six. The same
 * conic-gradient that shapes the beam is reused as a mask, so an item can be
 * placed anywhere and is guaranteed to be clipped to its own 120°.
 *
 * Placement is deterministic — a hash of the index, never Math.random — because
 * this renders on the server first and a mismatch would blow up hydration.
 */

const SPREAD = 88; // vmin, so the field reaches most of the way to the corners

function rand(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

type Item = {
  kind: "formula" | "phrase" | "mark" | "shape";
  text: string;
  shape?: number;
};

// Longer strings sit nearer the middle where there is room to read them;
// single marks are thrown to the edges as texture.
const BAND: Record<Item["kind"], [number, number]> = {
  phrase: [0.22, 0.56],
  formula: [0.26, 0.74],
  mark: [0.3, 1],
  shape: [0.24, 1],
};

function buildItems(track: TrackId): Item[] {
  const layer = SYMBOL_LAYERS[track];
  const items: Item[] = [
    ...layer.phrases.map((text) => ({ kind: "phrase" as const, text })),
    ...layer.formulas.map((text) => ({ kind: "formula" as const, text })),
  ];

  // Marks repeat until the field feels populated rather than sprinkled.
  if (layer.marks.length > 0) {
    for (let i = 0; i < 30; i += 1) {
      items.push({ kind: "mark", text: layer.marks[i % layer.marks.length] });
    }
  }

  // Professional was asked for as pure texture: drawn flowchart primitives,
  // no readable words at all.
  if (track === "professional") {
    for (let i = 0; i < 44; i += 1) {
      items.push({ kind: "shape", text: "", shape: i % 6 });
    }
  }

  return items;
}

function FlowShape({ variant }: { variant: number }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.2,
    vectorEffect: "non-scaling-stroke" as const,
  };
  return (
    <svg viewBox="0 0 24 24" style={{ width: "1.6em", height: "1.6em" }} aria-hidden="true">
      {variant === 0 ? <path d="M12 3 L21 12 L12 21 L3 12 Z" {...common} /> : null}
      {variant === 1 ? <rect x="2" y="8" width="20" height="9" {...common} /> : null}
      {variant === 2 ? <rect x="2" y="8" width="20" height="9" rx="4.5" {...common} /> : null}
      {variant === 3 ? <path d="M7 8 L23 8 L17 17 L1 17 Z" {...common} /> : null}
      {variant === 4 ? <path d="M2 12 H19 M14.5 7.5 L19.5 12 L14.5 16.5" {...common} /> : null}
      {variant === 5 ? <path d="M4 3 V21 M20 3 V21 M4 12 H20" {...common} /> : null}
    </svg>
  );
}

export function SymbolField({ track, active }: { track: TrackId; active: boolean }) {
  const arc = TRACK_ARCS[track];
  const span = arc.end - arc.start;
  const from = arc.start + 90; // conic starts at 12 o'clock, arcs at 3 o'clock
  const mask = `conic-gradient(from ${from}deg at 50% 50%, #000 0deg, #000 ${span}deg, transparent ${span}deg)`;
  const items = buildItems(track);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden text-bone transition-opacity duration-700 ease-out"
      style={{
        opacity: active ? 1 : 0,
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    >
      {items.map((item, i) => {
        const [lo, hi] = BAND[item.kind];
        const t = rand(i * 3 + 1);
        const radius = lo + rand(i * 3 + 2) * (hi - lo);
        // Keep a couple of degrees clear of the sector edges so nothing is
        // sliced in half by the mask.
        const angle = ((arc.start + 2 + t * (span - 4)) * Math.PI) / 180;
        const x = Math.cos(angle) * radius * SPREAD;
        const y = Math.sin(angle) * radius * SPREAD;
        const fade = rand(i * 3 + 3);

        const isPhrase = item.kind === "phrase";
        const scale = 0.72 + fade * 0.5;

        return (
          <span
            key={`${item.kind}-${i}-${item.text}`}
            className={
              isPhrase
                ? "absolute font-display italic whitespace-nowrap"
                : "absolute font-mono whitespace-nowrap"
            }
            style={{
              left: `calc(50% + ${x.toFixed(2)}vmin)`,
              top: `calc(50% + ${y.toFixed(2)}vmin)`,
              transform: "translate(-50%, -50%)",
              // Nothing here should compete with the marks on the ring.
              opacity: 0.07 + fade * 0.15,
              fontSize: isPhrase ? `${(1.05 * scale).toFixed(2)}rem` : `${(0.8 * scale).toFixed(2)}rem`,
              letterSpacing: isPhrase ? "0" : "0.06em",
            }}
          >
            {item.kind === "shape" ? <FlowShape variant={item.shape ?? 0} /> : item.text}
          </span>
        );
      })}
    </div>
  );
}
