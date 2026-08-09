/**
 * Lacan's Borromean knot: R.S.I. with the jouissances and objet a in place.
 *
 * Drawn rather than traced from the reference image — at this scale a raster
 * trace turns to mush, and the labels have to be set as type to stay legible
 * against a beam that changes colour.
 *
 * The over-and-under matters and is not decoration. Three rings are Borromean
 * only if **the same ring is on top at both of a pair's crossings**: cut any
 * one and the remaining two fall apart, because they were never linked to each
 * other. Alternate the crossings within a pair instead and you get Hopf links,
 * which is a different object and a different argument. Imaginaire passes over
 * Symbolique, Symbolique over Réel, Réel over Imaginaire — so each ring is
 * broken only where the ring two steps along in that cycle crosses it.
 *
 * It earns its place beyond the Lacan content: the knot is the same topology
 * as the site — three things that hold together only as three.
 */

const R = 92;
const D = 53;
const CX = 150;
const CY = 150;
/** Half-width of each break, in radians. */
const GAP = 0.17;

// Imaginaire upper left, Symbolique upper right, Réel below, matching the
// orientation of the diagram this is taken from.
const CENTERS = [210, 330, 90].map((deg) => {
  const a = (deg * Math.PI) / 180;
  return { x: CX + Math.cos(a) * D, y: CY + Math.sin(a) * D };
});

function arc(c: { x: number; y: number }, from: number, to: number) {
  const x1 = c.x + Math.cos(from) * R;
  const y1 = c.y + Math.sin(from) * R;
  const x2 = c.x + Math.cos(to) * R;
  const y2 = c.y + Math.sin(to) * R;
  const large = to - from > Math.PI ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

const RINGS = CENTERS.map((self, i) => {
  const over = CENTERS[(i + 2) % 3];
  const dx = over.x - self.x;
  const dy = over.y - self.y;
  const dist = Math.hypot(dx, dy);
  const half = Math.sqrt(Math.max(0, R * R - (dist / 2) ** 2));
  const mx = self.x + dx / 2;
  const my = self.y + dy / 2;
  const ux = -dy / dist;
  const uy = dx / dist;
  const [g1, g2] = [1, -1]
    .map((s) => Math.atan2(my + s * uy * half - self.y, mx + s * ux * half - self.x))
    .map((a) => (a < 0 ? a + Math.PI * 2 : a))
    .sort((a, b) => a - b);
  return [arc(self, g1 + GAP, g2 - GAP), arc(self, g2 + GAP, g1 - GAP + Math.PI * 2)].join(" ");
});

// Every position is checked against the three circles: ring names sit outside
// all of them, Corps / Mort / Vie inside exactly one, Sens / JA / JΦ inside
// exactly two, and a inside all three.
const LABELS: { text: string; x: number; y: number; size: number; italic?: boolean }[] = [
  { text: "Imaginaire", x: 52, y: 22, size: 11 },
  { text: "Symbolique", x: 248, y: 22, size: 11 },
  { text: "Réel", x: 150, y: 300, size: 11 },
  { text: "Corps", x: 66, y: 108, size: 10 },
  { text: "Mort", x: 234, y: 108, size: 10 },
  { text: "Vie", x: 150, y: 246, size: 10 },
  { text: "Sens", x: 150, y: 82, size: 10 },
  { text: "JA", x: 102, y: 186, size: 10 },
  { text: "JΦ", x: 198, y: 186, size: 10 },
  { text: "a", x: 150, y: 150, size: 15, italic: true },
];

export const KNOT_VIEWBOX = { w: 300, h: 312 };

export function BorromeanKnot() {
  return (
    <g>
      {RINGS.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth={1.6} />
      ))}
      {LABELS.map((l) => (
        <text
          key={l.text}
          x={l.x}
          y={l.y}
          fontSize={l.size}
          textAnchor="middle"
          dominantBaseline="central"
          fill="currentColor"
          fontFamily="var(--font-display)"
          fontStyle={l.italic ? "italic" : undefined}
        >
          {l.text}
        </text>
      ))}
    </g>
  );
}
