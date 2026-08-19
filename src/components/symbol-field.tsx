import { BorromeanKnot, KNOT_VIEWBOX } from "@/components/borromean-knot";
import {
  SYMBOL_LAYERS,
  type SymbolItem,
  type TrackId,
} from "@/lib/content";

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

/**
 * The field is laid out on a fixed board, and there are two of them.
 *
 * A square board fitted with `meet` scales to the viewport's *short* side. On
 * a landscape window that is the height and everything works. On a portrait
 * phone it is the width, and the board lands as a square in the middle of a
 * tall screen: at 375×812 it covered 46% of the height, and R_MIN — derived
 * when the disc was capped by 56vh and took 56% of the board — fell inside the
 * disc, which on a phone is capped by width and takes 87%. Symbols rendered
 * underneath it.
 *
 * Neither `slice` nor a tweak fixes that. `slice` scales to the long side and
 * clips the rest, which is forbidden for good reason (see the note above).
 * Enlarging the type breaks the packing, which assumes its own gutters.
 *
 * So portrait gets a board of its own, shaped like a phone. Both layouts are
 * solved at module load and both are rendered; CSS shows one. They cannot be
 * chosen at runtime from the viewport — that would make the markup depend on
 * something the server cannot know, which is the hydration failure D15 exists
 * to prevent.
 */
type BoardKey = "wide" | "tall";

type Board = {
  key: BoardKey;
  w: number;
  h: number;
  /** Radius the field must stay outside of, so it clears the disc. */
  rMin: number;
  /** Multiplier on the tier's inner radius — where the field starts. */
  reach: number;
  /**
   * Multiplier on the tier's outer radius — how far it runs.
   *
   * Separate from `reach` because the wide board needs the two pulled apart:
   * the field must still begin at the disc's edge, but it now has to reach a
   * corner 1887 units out instead of 1414. Scaling both would open a bare ring
   * around the disc.
   */
  reachOuter: number;
};

const BOARDS: Record<BoardKey, Board> = {
  /**
   * 8:5, because the board is what the texture covers and a square cannot
   * cover a landscape screen.
   *
   * `meet` fits the board inside the viewport, so a square board is inscribed:
   * at 1512×944 it rendered 944 wide and left 284px bare down each side —
   * 40% of the screen with no texture on it. Matching the board's aspect to a
   * common desktop's fixes that geometrically rather than by cropping.
   *
   * 3200 rather than 2000 across so the *scale* is unchanged: at 1512×944 this
   * fits at 0.472, exactly what the square board fitted at, so every tier size
   * D13 tuned renders at the same pixel size it always did. Only the area grew.
   *
   * Measured fit: 1512×944 → 1510×944 (a 2px sliver bare); 1280×800 → exact;
   * 1920×1080 → 1728×1080; 1024×768 → 1024×640.
   */
  wide: { key: "wide", w: 3200, h: 2000, rMin: 580, reach: 1, reachOuter: 1.35 },
  /**
   * 1:2, near enough a phone. At 375×812 this scales to 0.375 and renders
   * 375×750 — 92% of the height against the square board's 46% — and the type
   * comes out at 9–23px, which is a shade larger than the desktop 8.6–22px
   * rather than the 4.5px the square board gave. rMin 300 lands 112px out,
   * clearing the disc's 100px arc.
   */
  tall: { key: "tall", w: 1000, h: 2000, rMin: 300, reach: 0.62, reachOuter: 0.62 },
};

const centre = (b: Board) => ({ x: b.w / 2, y: b.h / 2 });
// Clear space demanded around every box, in board units. 12 is about 4px of
// gutter at the scale this renders — generous next to 8px type, and the 4 units
// reclaimed from 16 buy back most of an item's worth of area across the field.
const PAD = 12;

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
const EDGE = 20;

type Tier = "anchor" | "support" | "texture";

/**
 * Board units, not pixels — and the two are far apart. `meet` fits the 2000-unit
 * board into min(vw, vh), so at 1280×720 the scale is 0.36 and a size of 12
 * lands at 4.3px on screen. The tier sizes below were originally tuned under
 * `slice`, where the scale was 1.0; switching to `meet` to stop the field
 * rendering off screen shrank every glyph by 64% and the numbers were never
 * re-cut. These are: roughly 18–22px, 12–17px and 8–11px at that scale.
 *
 * There is no setting at which all forty-seven items are legible. The wedge
 * offers about 1.5M square units and legible type would want double that, so
 * the field is stratified instead: a foreground that can be read, and a
 * background that is out of focus on purpose. `blur` is what makes the
 * difference read as distance rather than as a rendering fault.
 */
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
    /** Depth-of-field, in board units, reached at the far edge of the field. */
    blur: number;
    /**
     * Longest line before wrapping. Per tier, not global: a single threshold
     * broke the anchors, which are short and set large — "Amplectere omnia" at
     * 62 units is sixteen characters against a fifteen-character budget, so it
     * split in two. Anchors are given a cap they cannot reach.
     */
    maxLine: number;
  }
> = {
  anchor: {
    width: 470,
    min: 50,
    max: 62,
    r0: 620,
    r1: 900,
    o0: 0.54,
    o1: 0.44,
    d0: 0,
    d1: 160,
    blur: 0,
    maxLine: 9999,
  },
  support: {
    width: 330,
    min: 34,
    max: 46,
    r0: 600,
    r1: 1120,
    o0: 0.4,
    o1: 0.26,
    d0: 130,
    d1: 330,
    blur: 0.9,
    maxLine: 370,
  },
  texture: {
    width: 190,
    min: 24,
    max: 31,
    r0: 600,
    r1: 1360,
    o0: 0.28,
    o1: 0.13,
    d0: 280,
    d1: 520,
    blur: 2.6,
    // Tighter than it looks like it should be. A wide flat box is the hardest
    // shape to seat in an annular wedge, and the items that kept getting
    // dropped were always the longest phrases. Wrapping them to a near-square
    // block placed every one of them.
    maxLine: 205,
  },
};

/**
 * Placement is random-with-rejection, and it stays that way.
 *
 * A polar ring flow was tried, twice — items flowed around concentric rings,
 * wrapping outward when the arc ran out. On paper it packs far better. In this
 * geometry it does not: the wedge leaves the square board along its bisector
 * past radius ~980, the reserved knot occupies the middle of the best rings,
 * and a ring that cannot seat an item pushes the frontier outward for every
 * item behind it. Two attempts at bounding that produced 20 and then 4 items
 * placed out of 39, against 37 for the scatter it replaced. The scatter packs
 * worse in theory and much better here.
 */

/**
 * How much an item shrinks at the far edge of its band.
 *
 * Without this the depth cues disagree: blur keys off radius while size keys
 * off tier, so a large support item far out came through bigger *and* softer
 * than a small texture item near in — reading as a focus fault rather than as
 * distance. Size, dimness and blur now all track the same k.
 */
const FAR_SHRINK = 0.22;

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
 * Greedy word wrap. A single long word is left to overrun.
 *
 * Wrapping rather than shrinking is the trick that makes a dense field legible.
 * Solving size from width alone drove a sixty-character sentence down to the
 * minimum and stretched it to 938 units — illegible *and* sprawling. The same
 * sentence set three lines deep at full size occupies 430×128: smaller
 * footprint, larger type. Shrinking trades legibility for space; wrapping
 * trades height for it, and height is the cheaper currency here.
 */
function wrap(
  text: string,
  size: number,
  face: SymbolItem["face"],
  maxLine: number,
): string[] {
  const maxChars = Math.max(6, Math.floor(maxLine / (size * ADVANCE[face])));
  if (text.length <= maxChars) return [text];

  const lines: string[] = [];
  let current = "";
  for (const word of text.split(" ")) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

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
  lines: string[];
  face: SymbolItem["face"];
  cx: number;
  cy: number;
  size: number;
  opacity: number;
  delay: number;
  /** Board units. Grows with distance, so the far field falls out of focus. */
  blur: number;
  /** Breathing period and phase, both ms. Phase is applied as a negative delay. */
  period: number;
  phase: number;
};

function overlaps(a: Box, b: Box) {
  return (
    a.x - PAD < b.x + b.w &&
    a.x + a.w + PAD > b.x &&
    a.y - PAD < b.y + b.h &&
    a.y + a.h + PAD > b.y
  );
}

/**
 * Reserved rectangles, as fractions of the board, that no glyph may enter.
 *
 * The field used to be masked to its own 120° wedge, so the copy was safe by
 * construction — a wedge never reached the corner the profile sits in. Now that
 * a lit circle floods the whole screen the field does too, and the two blocks
 * of type on the page have to be kept clear deliberately.
 *
 * Fractions of the board rather than of the viewport, and generous, because
 * they cannot be exact: the board is fitted with `meet`, so it is centred and
 * usually a little smaller than the window, and board coordinates simply do
 * not know where the viewport's corners are. Reserving too much costs a little
 * placement area; reserving too little puts glyphs under his name.
 *
 * Per board, because the two are different shapes carrying different layouts.
 * The wide board's copy sits in one corner and the addresses in the opposite
 * one; the phone stacks everything full-width, so its guards are bands rather
 * than corners. Each was derived by mapping the real elements' viewport rects
 * back through the fit at the tightest viewport that board serves.
 */
const RESERVED: Record<
  BoardKey,
  ReadonlyArray<{ x0: number; y0: number; x1: number; y1: number }>
> = {
  wide: [
    /**
     * Name, roles, profile, hint.
     *
     * Sized for the *small* end of the range, which is what makes it look
     * over-generous on a laptop. The block is a fixed number of pixels — the
     * hint line alone is 515px of tracked-out capitals — while the board's
     * scale falls with the window, so the same block covers 0.37 of the board
     * at 1512×944 and 0.54 at 1024×768. A guard that fits the laptop puts
     * glyphs through the hint on anything smaller.
     */
    { x0: 0, y0: 0, x1: 0.56, y1: 0.42 },
    // The two addresses, top right from md. Deepest at 812×375, where the
    // board fits by height and 78px of viewport is 0.21 of it.
    { x0: 0.7, y0: 0, x1: 1, y1: 0.22 },
    /**
     * The footer. Measured need: 0.936 at 1512×944, 0.944 at 1920×1080, 0.925
     * at 1280×800, and nothing at all at 1024×768, where the footer falls
     * below the fitted board entirely.
     *
     * A landscape phone wants 0.85: its footer is a single nav row, but the
     * board fits by height there and 24px of inset is a much larger share of
     * 375px than of 944px. That is the binding case, and it costs the laptop
     * only 29px of extra clearance, so it is simply taken.
     */
    { x0: 0, y0: 0.85, x1: 1, y1: 1 },
  ],
  tall: [
    /**
     * The header takes two rectangles because the two portrait devices wear it
     * differently. A phone's copy is capped at 20rem against a 375px screen,
     * so it runs nearly edge to edge but only 0.15 deep. A tablet's is capped
     * at 24rem against 768px and keeps the profile paragraph that `md` hides
     * on a phone, so it is half as wide and twice as deep. One rectangle
     * covering both would be the whole upper third of the board.
     *
     * The shallow full-width band also picks up the tablet's two addresses,
     * which sit top right from md.
     */
    { x0: 0, y0: 0, x1: 1, y1: 0.2 },
    { x0: 0, y0: 0, x1: 0.6, y1: 0.32 },
    // The footer. Deepest on a phone (0.873), where the addresses join it and
    // the nav row wraps; a tablet keeps its addresses up top and needs 0.949.
    { x0: 0, y0: 0.85, x1: 1, y1: 1 },
  ],
};

/** Every corner must clear the disc, the board edge and the reserved blocks. */
function insideField(box: Box, board: Board) {
  return (
    [
      [box.x, box.y],
      [box.x + box.w, box.y],
      [box.x, box.y + box.h],
      [box.x + box.w, box.y + box.h],
    ] as const
  ).every(([x, y]) => {
    if (x < EDGE || x > board.w - EDGE || y < EDGE || y > board.h - EDGE) return false;
    const c = centre(board);
    if (Math.hypot(x - c.x, y - c.y) < board.rMin) return false;
    return !RESERVED[board.key].some(
      (r) =>
        x > r.x0 * board.w && x < r.x1 * board.w && y > r.y0 * board.h && y < r.y1 * board.h,
    );
  });
}

/**
 * The Creative sector's two line plates, reserved before any glyph is placed.
 * Positions are hand-set, not solved: with the music notation removed these
 * two carry the whole wedge, so where they sit is a composition decision.
 * Both derived by scripts/keyart-lineart.py.
 */
const PLATE_ART = [
  { key: "mark", href: "/creative/elegists-mark.png", opacity: 0.3, delay: 40 },
  { key: "figure", href: "/creative/dear-suspect-figure.png", opacity: 0.22, delay: 190 },
] as const;

/**
 * Where those two sit, per board. Hand-set, not solved — with the music
 * notation removed they carry the whole Creative wedge, so their placement is
 * a composition decision.
 *
 * The tall board's pair is not the wide one rescaled: the boards differ in
 * aspect, so a uniform scale would squash them. Both sets were checked against
 * the wedge and the board rectangle by the same rules the solver uses.
 */
const PLATE_BOXES: Record<BoardKey, Box[]> = {
  // Kept left of centre, below the profile block and above the footer band.
  // Corners land at radius 1116–1348 on the 8:5 board, well outside rMin.
  wide: [
    { x: 300, y: 850, w: 190, h: 268 },
    { x: 260, y: 1150, w: 380, h: 460 },
  ],
  // The phone stacks its guards as full-width bands, so these moved out of
  // both: the mark up and right of the disc, the figure down and left of it.
  // Nearest corners land at radius 367 and 331 against rMin 300.
  tall: [
    { x: 700, y: 480, w: 150, h: 212 },
    { x: 60, y: 1300, w: 300, h: 363 },
  ],
};

const plates = (board: Board) =>
  PLATE_ART.map((art, i) => ({ ...art, box: PLATE_BOXES[board.key][i] }));


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
const KNOT_BOXES: Record<BoardKey, Box> = {
  /**
   * Left of the disc and below the profile block, not along the top edge.
   *
   * The 8:5 board's top edge is spoken for: the name and profile guard reaches
   * x=1792 and the addresses' guard starts at x=2240, leaving a 448-unit slot
   * for a 400-unit knot — it fits, with 24 units either side, which is not a
   * placement so much as a wedge. Here it has room on every side, its corners
   * land at radius 906–1338, and it counterweights the disc instead of
   * crowding the masthead.
   */
  wide: { x: 300, y: 900, w: 400, h: 416 }, // 300×312 local, ×1.333
  /**
   * The tall board is half as wide, so the knot comes down to 300. It sits
   * *below* the disc rather than above it, which is forced: the phone's header
   * band reaches y=400 and a box above the disc has to end by y=700 to clear
   * rMin, and 300 units of clearance will not hold a 312-unit knot. Below,
   * the same arithmetic gives it everything from 1300 down. Corners land at
   * radius 335–630.
   */
  tall: { x: 350, y: 1300, w: 300, h: 312 },
};
const KNOT_DELAY = 90;

/**
 * Lays a tier out as concentric rings rather than scattering it.
 *
 * Random placement with rejection was the first approach and it packs badly:
 * at legible sizes it left a quarter of the field on the floor no matter how
 * many candidates it tried, and no amount of parameter tuning fixed that,
 * because the failure is in the method. Items are flowed around each ring
 * instead, wrapping to the next ring out when the arc runs out — polar text
 * flow. It packs close to optimally, it always terminates, and the faint
 * concentric structure it leaves behind belongs to the same instrument
 * vocabulary as the tick bezel.
 *
 * Jitter keeps it from reading as a table. Small, and bounded by the row
 * height, so it disturbs the rhythm without breaking the packing.
 */
function layout(track: TrackId, board: Board): Placed[] {
  const taken: Box[] =
    track === "creative"
      ? plates(board).map((p) => p.box)
      : track === "scholarly"
        ? [KNOT_BOXES[board.key]]
        : [];
  const placed: Placed[] = [];
  let seed = track.length * 97 + 5;

  const queue: [Tier, SymbolItem][] = [
    ...SYMBOL_LAYERS[track].anchors.map(
      (i) => ["anchor", i] as [Tier, SymbolItem],
    ),
    ...SYMBOL_LAYERS[track].support.map(
      (i) => ["support", i] as [Tier, SymbolItem],
    ),
    ...SYMBOL_LAYERS[track].texture.map(
      (i) => ["texture", i] as [Tier, SymbolItem],
    ),
  ];


  // Anchors go down first and nearest the arc, so the largest things claim the
  // calmest space and everything else arranges itself around them.
  for (const [tier, item] of queue) {
    const t = TIERS[tier];
    const raw = t.width / Math.max(1, item.text.length * ADVANCE[item.face]);
    const base = Math.min(t.max, Math.max(t.min, raw));

    /**
     * Two passes at decreasing size. One modest step down recovers most of what
     * a single pass leaves on the floor, and an item that ends up smaller reads
     * as further away, which the depth cues already say.
     *
     * A third, harsher step was tried and removed: it did raise the count, but
     * by pushing the smallest type to 5.4px, which is the exact complaint this
     * pass exists to fix. Coverage is not worth buying with legibility — the
     * content list was cut instead.
     */
    let settled = false;
    for (const step of [1, 0.88]) {
      if (settled) break;

      // Size, wrapping and box all depend on where the item lands, so they are
      // solved per candidate rather than once up front.
      for (let attempt = 0; attempt < 140 && !settled; attempt += 1) {
        seed += 1;
        // Any bearing: the field is no longer masked to a wedge, so the
        // candidate can land anywhere the rejection test below allows.
        const angle = rand(seed * 2) * 360;
        const r0 = t.r0 * board.reach;
        const r1 = t.r1 * board.reachOuter;
        const radius = r0 + rand(seed * 2 + 1) * (r1 - r0);
        const k = (radius - r0) / (r1 - r0);
        const size = snap(base * step * (1 - FAR_SHRINK * k), 1e3);
        const lines = wrap(item.text, size, item.face, t.maxLine);
        const longest = Math.max(...lines.map((l) => l.length));
        const w = longest * size * BOX_ADVANCE[item.face];
        const h = lines.length * size * 1.25;
        // Snapped before the box is built, so collision detection and the
        // rendered attribute are the same number — otherwise two engines could
        // accept different candidates and produce genuinely different layouts,
        // not merely different digits.
        const c = centre(board);
        const cx = snap(c.x + Math.cos((angle * Math.PI) / 180) * radius, 1e3);
        const cy = snap(c.y + Math.sin((angle * Math.PI) / 180) * radius, 1e3);
        const box: Box = { x: cx - w / 2, y: cy - h / 2, w, h };

        if (!insideField(box, board)) continue;
        if (taken.some((b) => overlaps(b, box))) continue;

        taken.push(box);
        // Everything that signals depth keys off the same k: further out means
        // smaller, dimmer, softer, and later to arrive.
        // 4.5–8.5s. The first pass ran 9–17s, which was slow enough that the
        // breathing read as nothing happening at all.
        const period = Math.round(4500 + rand(seed * 5 + 11) * 4000);
        placed.push({
          key: `${tier}-${item.text}`,
          lines,
          face: item.face,
          cx,
          cy,
          size,
          opacity: t.o0 + (t.o1 - t.o0) * k,
          delay: Math.round(t.d0 + rand(seed * 3 + 7) * (t.d1 - t.d0)),
          blur: snap(t.blur * k, 1e2),
          period,
          phase: Math.round(rand(seed * 7 + 13) * period),
        });
        settled = true;
      }
    }
    // Still nowhere: dropped. A gap reads as composition; an overlap reads as
    // a bug.
  }

  return placed;
}

const LAYOUTS: Record<BoardKey, Record<TrackId, Placed[]>> = {
  wide: {
    scholarly: layout("scholarly", BOARDS.wide),
    creative: layout("creative", BOARDS.wide),
    professional: layout("professional", BOARDS.wide),
  },
  tall: {
    scholarly: layout("scholarly", BOARDS.tall),
    creative: layout("creative", BOARDS.tall),
    professional: layout("professional", BOARDS.tall),
  },
};

export function SymbolField({
  track,
  active,
}: {
  track: TrackId;
  active: boolean;
}) {
  if (
    LAYOUTS.wide[track].length === 0 &&
    (track === "creative" ? PLATE_ART.length : 0) === 0
  )
    return null;


  // Each element carries its own delay so the field assembles unevenly rather
  // than switching on as a block. On the way out the delay drops to zero, so
  // closing a sector is immediate — a staggered exit reads as lag.
  const reveal = (target: number, delay: number) => ({
    opacity: active ? target : 0,
    transition: "opacity 620ms ease-out",
    transitionDelay: active ? `${delay}ms` : "0ms",
  });

  // Both boards are rendered and CSS shows one. Choosing at runtime would make
  // the markup depend on the viewport, which the server cannot know — the exact
  // shape of hydration mismatch D15 exists to prevent.
  return (
    <>
      {(Object.keys(BOARDS) as BoardKey[]).map((key) => {
        const board = BOARDS[key];
        const items = LAYOUTS[key][track];
        const knot = KNOT_BOXES[key];
        const plateList = track === "creative" ? plates(board) : [];
        return (
          <svg
            key={key}
            viewBox={`0 0 ${board.w} ${board.h}`}
            preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      className={`symbol-field field-${board.key} pointer-events-none fixed inset-0 -z-10 size-full text-bone`}
    >
      {track === "scholarly" ? (
        <g
          transform={`translate(${knot.x} ${knot.y}) scale(${knot.w / KNOT_VIEWBOX.w})`}
          style={reveal(0.3, KNOT_DELAY)}
        >
          <BorromeanKnot />
        </g>
      ) : null}

      {plateList.map((plate) => (
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

      {items.map((item) => {
        const leading = item.size * 1.25;
        return (
          // Breathing lives on the wrapper and the reveal on the text. They
          // cannot share an element: an animation and a transition on the same
          // property is a fight the animation always wins, and the reveal would
          // simply stop happening.
          <g
            key={item.key}
            className="drift"
            style={{
              animation: `drift ${item.period}ms ease-in-out ${-item.phase}ms infinite`,
            }}
          >
            <text
              x={item.cx}
              y={item.cy}
              textAnchor="middle"
              dominantBaseline="central"
              fill="currentColor"
              fontSize={item.size}
              fontFamily={
                item.face === "serif"
                  ? "var(--font-display)"
                  : "var(--font-mono)"
              }
              fontStyle={item.face === "serif" ? "italic" : undefined}
              letterSpacing={item.face === "serif" ? 0 : 1.1}
              style={{
                ...reveal(item.opacity, item.delay),
                filter: item.blur ? `blur(${item.blur}px)` : undefined,
              }}
            >
              {item.lines.map((line, i) => (
                <tspan
                  key={line}
                  x={item.cx}
                  // dominantBaseline centres a single line; for a stack the
                  // first tspan has to be lifted by half the block instead.
                  dy={
                    i === 0 ? -((item.lines.length - 1) * leading) / 2 : leading
                  }
                >
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
          </svg>
        );
      })}
    </>
  );
}
