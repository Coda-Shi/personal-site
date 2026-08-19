/**
 * Lacan's R.S.I. — the Borromean knot with its regions named, drawn after the
 * figure the owner supplied.
 *
 * Drawn rather than traced. At the size this renders a raster trace turns to
 * mush, and the labels have to be real type: they sit over a beam that changes
 * colour under them, and they are the only part of the figure anyone can
 * actually read.
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

/** The composition centre — where all three meet, and where objet a sits. */
const CX = 215;
const CY = 170;
const R = 108;
const D = 62;
/** Half-width of each break, in radians. */
const GAP = 0.16;

// Imaginaire upper left, Symbolique upper right, Réel below, matching the
// orientation of the figure this is taken from.
const CENTERS = [210, 330, 90].map((deg) => {
  const a = (deg * Math.PI) / 180;
  return { x: CX + Math.cos(a) * D, y: CY + Math.sin(a) * D };
});

function arc(c: { x: number; y: number }, from: number, to: number, r = R) {
  const x1 = c.x + Math.cos(from) * r;
  const y1 = c.y + Math.sin(from) * r;
  const x2 = c.x + Math.cos(to) * r;
  const y2 = c.y + Math.sin(to) * r;
  const large = to - from > Math.PI ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
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

/**
 * The two rings that are not part of the knot.
 *
 * Φ is a fourth circle at the lower right, and the arc sweeping off to the left
 * is the one that opens the *vrai trou*. Both run past the edge of the frame in
 * the source figure and both do here — a ring drawn whole would read as a fifth
 * term of the knot, which is precisely what they are not.
 */
const PHI = { x: 330, y: 288, r: 116 };
const VRAI = { x: 8, y: 118, r: 132 };

/**
 * Every position is checked against the three circles: ring names sit outside
 * all of them, Corps / Mort / Vie inside exactly one, Sens / JA / JΦ inside
 * exactly two, and a inside all three.
 *
 * Two registers. The named regions are the diagram; the annotations — angoisse,
 * inhibition, symptôme and the rest — are Lacan's marginalia on it, and are set
 * smaller and dimmer with a leader line where one is needed, exactly as in the
 * source. Keeping them at one weight would flatten a figure whose whole point
 * is that some of its terms are places and others are what happens there.
 */
type Label = {
  text: string;
  x: number;
  y: number;
  size: number;
  italic?: boolean;
  rotate?: number;
  dim?: boolean;
};

const LABELS: Label[] = [
  // The three rings, outside every circle.
  { text: "Imaginaire", x: 74, y: 16, size: 15 },
  { text: "(consistance)", x: 74, y: 33, size: 12, dim: true },
  { text: "Symbolique", x: 400, y: 176, size: 15 },
  { text: "(trou)", x: 400, y: 193, size: 12, dim: true },
  { text: "Réel", x: 215, y: 372, size: 15 },
  { text: "(ek-sistence)", x: 215, y: 389, size: 12, dim: true },

  // Inside exactly one.
  { text: "Corps", x: 113, y: 111, size: 13 },
  { text: "Mort", x: 316, y: 111, size: 13 },
  { text: "Vie", x: 215, y: 287, size: 13 },

  // Inside exactly two.
  { text: "Sens", x: 215, y: 101, size: 13 },
  { text: "JA", x: 159, y: 203, size: 13 },
  { text: "JΦ", x: 271, y: 203, size: 13 },

  // Inside all three.
  { text: "a", x: 215, y: 170, size: 19, italic: true },

  // The fourth circle.
  { text: "Φ", x: 352, y: 322, size: 17, italic: true },

  // Marginalia.
  { text: "Angoisse", x: 116, y: 143, size: 10, dim: true },
  { text: "Inconscient", x: 274, y: 62, size: 10, rotate: -52, dim: true },
  { text: "Faux trou", x: 392, y: 92, size: 10, dim: true },
  { text: "Inhibition", x: 299, y: 128, size: 10, rotate: 74, dim: true },
  { text: "Représentation", x: 72, y: 168, size: 10, rotate: -38, dim: true },
  { text: "Vrai trou", x: 44, y: 219, size: 10, dim: true },
  { text: "Préconscient", x: 126, y: 199, size: 10, dim: true },
  { text: "Sens de la vie", x: 191, y: 186, size: 7, rotate: -74, dim: true },
  { text: "Symptôme", x: 259, y: 258, size: 10, rotate: -50, dim: true },
];

/** Hairlines from an annotation to the place on the figure it names. */
const LEADERS: [number, number, number, number][] = [
  [150, 143, 186, 160], // Angoisse → the a / JA boundary
  [286, 70, 244, 96], // Inconscient → the top of Sens
  [368, 95, 316, 104], // Faux trou → the Sens / Mort boundary
  [110, 176, 148, 190], // Représentation → the outer edge of JA
  [72, 214, 116, 200], // Vrai trou → below Préconscient
  [246, 251, 232, 233], // Symptôme → JΦ
];

export const KNOT_VIEWBOX = { w: 460, h: 420 };

export function BorromeanKnot() {
  return (
    <g>
      {/* Behind the knot, and fainter, so they read as the frame the knot is
          drawn inside rather than as more of the knot. */}
      <circle
        cx={PHI.x}
        cy={PHI.y}
        r={PHI.r}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.3}
        opacity={0.55}
      />
      <circle
        cx={VRAI.x}
        cy={VRAI.y}
        r={VRAI.r}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.3}
        opacity={0.55}
      />

      {RINGS.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth={1.6} />
      ))}

      {LEADERS.map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="currentColor"
          strokeWidth={0.6}
          opacity={0.5}
        />
      ))}

      {/* Préconscient's arrow, pointing down into Vie — the one mark in the
          source figure that is neither a ring nor a name. */}
      <path
        d="M 168 206 L 168 224 M 164 219 L 168 225 L 172 219"
        fill="none"
        stroke="currentColor"
        strokeWidth={0.9}
        opacity={0.6}
      />

      {LABELS.map((l) => (
        <text
          key={`${l.text}-${l.x}-${l.y}`}
          x={l.x}
          y={l.y}
          fontSize={l.size}
          textAnchor="middle"
          dominantBaseline="central"
          fill="currentColor"
          fontFamily="var(--font-display)"
          fontStyle={l.italic ? "italic" : undefined}
          opacity={l.dim ? 0.62 : 1}
          transform={l.rotate ? `rotate(${l.rotate} ${l.x} ${l.y})` : undefined}
        >
          {l.text}
        </text>
      ))}
    </g>
  );
}
