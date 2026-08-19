/**
 * The three diagrams that sit in the Scholarly field alongside the Borromean
 * knot: Jung's map of the psyche, Lacan's completed graph of desire, and the
 * Greimas square.
 *
 * All drawn, none traced, for the reasons in borromean-knot.tsx — at the size
 * these render a raster would be mush, and the labels have to be real type
 * because a beam changes colour underneath them.
 *
 * All monochrome. The sources are variously black-on-white and colour-coded;
 * here everything is `currentColor`, which the field resolves to bone. Colour
 * in this layer would collide with the three track pigments, and the pigments
 * are the site's only colour code (D7).
 *
 * 🔴 **Notation is drawn, not typed, wherever a glyph is in doubt.** Cormorant
 * has no Ⱥ, no barred S and no lozenge — asked for them it falls back to some
 * other face, or to nothing, exactly as D9 records for the logic symbols. So
 * the bar through a letter is a `<line>` and the poinçon is a `<path>`, and
 * both scale with the type they belong to instead of being at the mercy of
 * whatever the visitor has installed.
 */

const SERIF = "var(--font-display)";

/** A letter struck through — Lacan's barred subject, barred Other. */
function Barred({
  ch,
  x,
  y,
  size,
}: {
  ch: string;
  x: number;
  y: number;
  size: number;
}) {
  return (
    <g>
      <text
        x={x}
        y={y}
        fontSize={size}
        textAnchor="middle"
        dominantBaseline="central"
        fill="currentColor"
        fontFamily={SERIF}
        fontStyle="italic"
      >
        {ch}
      </text>
      <line
        x1={x - size * 0.32}
        y1={y + size * 0.44}
        x2={x + size * 0.32}
        y2={y - size * 0.44}
        stroke="currentColor"
        strokeWidth={Math.max(0.7, size * 0.07)}
      />
    </g>
  );
}

/** The poinçon, ◊ — the relation between subject and object in a matheme. */
function Poincon({ x, y, size }: { x: number; y: number; size: number }) {
  const r = size * 0.34;
  return (
    <path
      d={`M ${x} ${y - r} L ${x + r * 0.72} ${y} L ${x} ${y + r} L ${x - r * 0.72} ${y} Z`}
      fill="none"
      stroke="currentColor"
      strokeWidth={Math.max(0.7, size * 0.07)}
    />
  );
}

function Word({
  children,
  x,
  y,
  size,
  italic,
  track = 0,
  rotate,
  dim,
}: {
  children: string;
  x: number;
  y: number;
  size: number;
  italic?: boolean;
  track?: number;
  rotate?: number;
  dim?: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      textAnchor="middle"
      dominantBaseline="central"
      fill="currentColor"
      fontFamily={SERIF}
      fontStyle={italic ? "italic" : undefined}
      letterSpacing={track || undefined}
      opacity={dim ? 0.62 : 1}
      transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}
    >
      {children}
    </text>
  );
}

/** A small solid arrowhead at (x, y), pointing along `deg`. */
function Head({ x, y, deg, size = 7 }: { x: number; y: number; deg: number; size?: number }) {
  return (
    <path
      d={`M ${x} ${y} L ${x - size} ${y - size * 0.42} L ${x - size} ${y + size * 0.42} Z`}
      fill="currentColor"
      transform={`rotate(${deg} ${x} ${y})`}
    />
  );
}

/* ── Jung ──────────────────────────────────────────────────────────────── */

export const JUNG_VIEWBOX = { w: 440, h: 520 };

/**
 * The psyche as concentric containment: outer world, persona, ego, then down
 * through the personal unconscious to the collective, with the Self as the
 * whole circle and the ego–Self axis running through it.
 *
 * It belongs in this field for the same reason the knot does. The site's own
 * composition is a centre that the three public identities surround, and this
 * is the diagram that argues the centre is not the ego (D9's "中心不编码").
 */
export function JungPsyche() {
  const complexes = [58, 102, 146, 190, 250, 294, 338, 382];
  const archetypes = [
    [44, 146],
    [88, 190],
    [352, 294],
    [396, 338],
  ];
  return (
    <g>
      <Word x={220} y={13} size={15} track={1.6}>
        OUTER WORLD
      </Word>
      <Word x={220} y={507} size={15} track={1.6}>
        INNER WORLD
      </Word>

      <ellipse
        cx={220}
        cy={258}
        rx={211}
        ry={232}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
      />
      <ellipse
        cx={220}
        cy={258}
        rx={196}
        ry={216}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.3}
        opacity={0.7}
      />

      {/* Persona, and the ego inside it. */}
      <ellipse
        cx={220}
        cy={92}
        rx={79}
        ry={54}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <Word x={220} y={80} size={20} track={2.2}>
        PERSONA
      </Word>
      <circle cx={220} cy={128} r={26} fill="none" stroke="currentColor" strokeWidth={1.5} />
      <Word x={220} y={128} size={13} track={1.2}>
        EGO
      </Word>

      {/* The two thresholds. Dotted, because Jung's are permeable. */}
      <line
        x1={26}
        y1={161}
        x2={414}
        y2={161}
        stroke="currentColor"
        strokeWidth={1.1}
        strokeDasharray="3 4"
      />
      <line
        x1={26}
        y1={215}
        x2={414}
        y2={215}
        stroke="currentColor"
        strokeWidth={1.1}
        strokeDasharray="3 4"
      />
      <Word x={96} y={148} size={11} track={1.8} italic>
        CONSCIOUS
      </Word>
      <Word x={344} y={148} size={11} track={1.8} italic>
        CONSCIOUS
      </Word>
      <Word x={220} y={178} size={11} track={1.8} italic>
        PERSONAL UNCONSCIOUS
      </Word>
      <Word x={84} y={302} size={11} track={1.8} italic>
        COLLECTIVE
      </Word>
      <Word x={356} y={302} size={11} track={1.8} italic>
        UNCONSCIOUS
      </Word>

      {/* Complexes on the threshold, each rooted in an archetype below it. */}
      {complexes.map((x) => (
        <g key={x}>
          <circle cx={x} cy={192} r={11} fill="none" stroke="currentColor" strokeWidth={1.2} />
          <Word x={x} y={192} size={10}>
            C
          </Word>
        </g>
      ))}
      {archetypes.map(([x, from]) => (
        <g key={x}>
          <line
            x1={from}
            y1={202}
            x2={x}
            y2={232}
            stroke="currentColor"
            strokeWidth={0.8}
            opacity={0.65}
          />
          <circle cx={x} cy={243} r={11} fill="none" stroke="currentColor" strokeWidth={1.2} />
          <Word x={x} y={243} size={10}>
            A
          </Word>
        </g>
      ))}

      {/* Mana personality, soul image, shadow — outermost to innermost, so the
          shadow reads as the nearest of the three rather than the deepest. */}
      <ellipse
        cx={220}
        cy={348}
        rx={113}
        ry={106}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
      />
      <ellipse
        cx={220}
        cy={296}
        rx={84}
        ry={64}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
      />
      <circle cx={220} cy={242} r={43} fill="none" stroke="currentColor" strokeWidth={1.5} />
      <Word x={220} y={240} size={13} track={1.2}>
        SHADOW
      </Word>
      <Word x={220} y={303} size={13} track={1.6}>
        SOUL IMAGE
      </Word>
      <Word x={220} y={382} size={13} track={1.6}>
        MANA PERSONALITY
      </Word>
      <Word x={220} y={455} size={17} track={5}>
        SELF
      </Word>

      {/* The ego–Self axis: the one line in the figure that is a relation
          rather than a boundary. */}
      <line
        x1={220}
        y1={154}
        x2={220}
        y2={440}
        stroke="currentColor"
        strokeWidth={0.9}
        strokeDasharray="2 5"
        opacity={0.75}
      />
      <g opacity={0.72}>
        <rect
          x={16}
          y={400}
          width={104}
          height={26}
          fill="none"
          stroke="currentColor"
          strokeWidth={1}
        />
        <Word x={68} y={413} size={10}>
          Ego-Self axis
        </Word>
        <line x1={120} y1={413} x2={210} y2={402} stroke="currentColor" strokeWidth={0.8} />
        <Head x={214} y={401} deg={-7} size={6} />
      </g>

      <g opacity={0.72}>
        <rect
          x={16}
          y={462}
          width={108}
          height={24}
          fill="none"
          stroke="currentColor"
          strokeWidth={1}
        />
        <Word x={70} y={474} size={10}>
          A = Archetype
        </Word>
        <rect
          x={316}
          y={462}
          width={108}
          height={24}
          fill="none"
          stroke="currentColor"
          strokeWidth={1}
        />
        <Word x={370} y={474} size={10}>
          C = Complex
        </Word>
      </g>
    </g>
  );
}

/* ── The graph of desire ───────────────────────────────────────────────── */

export const DESIRE_VIEWBOX = { w: 440, h: 540 };

/**
 * Lacan's completed graph. The lower storey is the subject meeting the
 * signifier; the upper one is what the signifier cannot deliver, which is why
 * the whole thing is a graph of *desire* rather than of meaning.
 *
 * Two crossings on each storey, both traversed in the same direction — the
 * retroaction that makes a sentence mean something only once it has ended.
 */
export function GraphOfDesire() {
  const node = (x: number, y: number, r: number) => (
    <circle cx={x} cy={y} r={r} fill="none" stroke="currentColor" strokeWidth={1.6} />
  );
  return (
    <g>
      {/* Upper storey: the outer return and the inner vector. */}
      <path
        d="M 112 128 C 116 34 324 34 328 128"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
      />
      <Head x={196} y={44} deg={186} />
      <path
        d="M 150 130 C 186 74 278 74 316 132"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
      />
      <Head x={268} y={82} deg={26} />

      {node(128, 152, 27)}
      {node(312, 152, 27)}

      {/* The bar that carries the drive and demand across the upper storey. */}
      <path
        d="M 128 179 C 128 222 170 230 220 230 C 270 230 312 222 312 179"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
      />
      <Head x={196} y={230} deg={182} />

      {/* Lower storey. */}
      <path
        d="M 152 328 C 180 282 274 282 300 330"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
      />
      <Head x={266} y={292} deg={28} />
      {node(152, 352, 25)}
      {node(300, 352, 23)}
      <path
        d="M 152 377 C 152 424 192 432 224 432 C 258 432 300 424 300 375"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
      />
      <Head x={198} y={432} deg={182} />

      {/* The two vectors that leave the graph: the subject entering it, and the
          ego ideal it deposits. */}
      <path
        d="M 336 508 C 322 452 308 404 302 376"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
      />
      <path
        d="M 150 378 C 150 430 150 470 150 502"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
      />
      <Head x={150} y={508} deg={90} />
      <path
        d="M 128 180 C 132 250 140 300 150 328"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
      />
      <Head x={150} y={330} deg={72} />

      {/* Nodes. Each is a matheme, so each is drawn rather than typed. */}
      <g>
        <Word x={116} y={152} size={16} italic>
          S(
        </Word>
        <Barred ch="A" x={134} y={152} size={16} />
        <Word x={150} y={152} size={16} italic>
          )
        </Word>
      </g>
      <g>
        <Word x={294} y={152} size={15} italic>
          (
        </Word>
        <Barred ch="S" x={303} y={152} size={15} />
        <Poincon x={315} y={152} size={15} />
        <Word x={327} y={152} size={15} italic>
          D)
        </Word>
      </g>
      <g>
        <Word x={143} y={352} size={15} italic>
          s(
        </Word>
        <Word x={159} y={352} size={15} italic>
          A)
        </Word>
      </g>
      <Word x={300} y={352} size={16} italic>
        A
      </Word>

      {/* What hangs off each node. */}
      <Word x={56} y={200} size={12} dim>
        Jouissance
      </Word>
      <Word x={386} y={200} size={12} dim>
        Castration
      </Word>
      <Word x={64} y={402} size={12} dim>
        Signifiant
      </Word>
      <Word x={352} y={402} size={12} dim>
        Voix
      </Word>
      <g>
        <Word x={98} y={250} size={12} italic>
          (
        </Word>
        <Barred ch="S" x={107} y={250} size={12} />
        <Poincon x={117} y={250} size={12} />
        <Word x={128} y={250} size={12} italic>
          a)
        </Word>
      </g>
      <Word x={336} y={250} size={13} italic>
        d
      </Word>
      <Word x={124} y={452} size={13} italic>
        m
      </Word>
      <Word x={322} y={452} size={13} italic>
        i(a)
      </Word>
      <Word x={150} y={524} size={14} italic>
        I(A)
      </Word>
      <Barred ch="S" x={336} y={522} size={15} />
    </g>
  );
}

/* ── The semiotic square ───────────────────────────────────────────────── */

export const SQUARE_VIEWBOX = { w: 460, h: 420 };

/**
 * Greimas's square: the claim that a term's meaning is fixed by three others —
 * its contrary, its contradictory, and the contradictory of its contrary.
 *
 * Dashed along the top and bottom for contrariety, solid across the diagonals
 * for contradiction, solid down the sides for complementarity, exactly as the
 * source distinguishes them. The source uses colour for the same job; here the
 * line style has to carry it alone, which is why the dashes matter.
 */
export function SemioticSquare() {
  const bar = (x: number, y: number, w: number) => (
    <line
      x1={x - w / 2}
      y1={y}
      x2={x + w / 2}
      y2={y}
      stroke="currentColor"
      strokeWidth={1.1}
    />
  );
  return (
    <g>
      <Word x={112} y={42} size={14}>
        assertion
      </Word>
      <Word x={352} y={42} size={14}>
        negation
      </Word>
      <Word x={112} y={386} size={14}>
        non-assertion
      </Word>
      <Word x={352} y={386} size={14}>
        non-negation
      </Word>

      <Word x={108} y={94} size={16} italic>
        S1
      </Word>
      <Word x={356} y={94} size={16} italic>
        S2
      </Word>
      <g>
        <Word x={108} y={334} size={16} italic>
          S2
        </Word>
        {bar(108, 320, 22)}
      </g>
      <g>
        <Word x={356} y={334} size={16} italic>
          S1
        </Word>
        {bar(356, 320, 22)}
      </g>

      {/* Contrariety: dashed, and the only relation the square treats as soft. */}
      <line
        x1={140}
        y1={94}
        x2={324}
        y2={94}
        stroke="currentColor"
        strokeWidth={1.3}
        strokeDasharray="7 5"
      />
      <Head x={330} y={94} deg={0} />
      <Head x={134} y={94} deg={180} />
      <line
        x1={140}
        y1={334}
        x2={324}
        y2={334}
        stroke="currentColor"
        strokeWidth={1.3}
        strokeDasharray="7 5"
      />
      <Head x={330} y={334} deg={0} />
      <Head x={134} y={334} deg={180} />

      {/* Complementarity down the sides. */}
      <line x1={72} y1={116} x2={72} y2={312} stroke="currentColor" strokeWidth={1.3} />
      <Head x={72} y={318} deg={90} />
      <Head x={72} y={110} deg={-90} />
      <line x1={392} y1={116} x2={392} y2={312} stroke="currentColor" strokeWidth={1.3} />
      <Head x={392} y={318} deg={90} />
      <Head x={392} y={110} deg={-90} />

      {/* Contradiction across the diagonals — the strong relation, so solid and
          uninterrupted. */}
      <line x1={136} y1={116} x2={326} y2={310} stroke="currentColor" strokeWidth={1.3} />
      <Head x={332} y={316} deg={45} />
      <Head x={130} y={110} deg={225} />
      <line x1={326} y1={116} x2={136} y2={310} stroke="currentColor" strokeWidth={1.3} />
      <Head x={130} y={316} deg={135} />
      <Head x={332} y={110} deg={-45} />

      <Word x={232} y={132} size={12} dim>
        contrariety
      </Word>
      <Word x={232} y={298} size={12} dim>
        contrariety
      </Word>
      <Word x={232} y={214} size={13}>
        contradictory
      </Word>
      <Word x={44} y={214} size={12} rotate={-90} dim>
        complementarity
      </Word>
      <Word x={420} y={214} size={12} rotate={90} dim>
        complementarity
      </Word>
    </g>
  );
}
