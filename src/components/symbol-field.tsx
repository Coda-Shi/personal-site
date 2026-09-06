"use client";

import { useEffect, useState } from "react";
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
type BoardKey = "wide" | "tall" | "ultra";

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
  wide: { key: "wide", w: 3200, h: 2000, rMin: 560, reach: 1, reachOuter: 1.35 },
  /**
   * 1:2, near enough a phone. At 375×812 this scales to 0.375 and renders
   * 375×750 — 92% of the height against the square board's 46% — and the type
   * comes out at 9–23px, which is a shade larger than the desktop 8.6–22px
   * rather than the 4.5px the square board gave.
   *
   * rMin 315 lands 118px out against the disc's 111px arc. It was 300, which
   * had 12 units of margin until the Venn's circles were drawn in to sit
   * tangent to the portrait — that pushed the composition's outer extent from
   * 186 board units to 190 and left under 2. Re-derived: the phone arm needs
   * 294.5 and the shorter-portrait arm 285, so 315 restores 20.
   */
  /**
   * `reachOuter` is well above `reach` here for the same reason it is on the
   * wide board: the band has to reach the ends of a 2000-unit board, and 0.62
   * stopped it at 843. It was safe to leave low while every candidate past the
   * board edge was simply thrown away; now that the band is clipped to the
   * rectangle per bearing, a short outer radius just means the top and bottom
   * of the phone go unused — which cost eleven of Scholarly's symbols.
   */
  tall: { key: "tall", w: 1000, h: 2000, rMin: 315, reach: 0.62, reachOuter: 0.92 },
  /**
   * 2:1, for the screens most desktops actually are.
   *
   * The 8:5 board was matched to a laptop's *screen*; a browser on that
   * screen is shorter than the screen by its own chrome, and a 16:9 monitor
   * with a tab strip and address bar gives a viewport around 1.9–2.1 to 1.
   * Fitted with `meet`, the 8:5 board on those is height-limited and leaves
   * a bare band down each side — 147px of nothing either side at 1600×816,
   * which is what the owner was looking at. This board covers them.
   *
   * Same height as the wide board, so wherever a board is height-limited
   * the scale — and with it every tier's rendered size — is identical; only
   * the width grew. This board can also be *width*-limited (viewports
   * between 1.8:1 and 2:1), and there the disc is capped at 28vw — which is
   * 1120 board units, exactly what the 56vh arm gives when the board is
   * height-limited — so the disc's outer extent is 532 units either way and
   * rMin 560 clears it by the same 28 the wide board has. The wide board's
   * 34vw would have put the extent at 632; see the `--disc` rule in
   * globals.css.
   *
   * `reachOuter` 1.65: the corners are 2236 units out and the texture band's
   * outer radius is 1360; the band is clipped to the rectangle per bearing,
   * so this only has to be large enough.
   */
  ultra: { key: "ultra", w: 4000, h: 2000, rMin: 560, reach: 1, reachOuter: 1.65 },
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
 * R_MIN has to clear the disc, and the two are fitted on different axes, so
 * the ratio between them drifts with the window. That is why the disc is
 * capped against the *same* axis the board is fitted on (see the note on
 * `--disc` in globals.css): with that in place, the disc's outer extent is a
 * constant number of board units whatever the viewport.
 *
 * Worked out from the composition's outer extent, 190 of its own 400 units:
 * the wide board needs at most 532 (the 0.56vh arm) against its rMin of 560,
 * the 2:1 board the same 532 against the same 560, and the phone board at
 * most 294.5 (the 0.62vw arm) against its 315. Twenty-eight units of clear
 * space — about 11px on a laptop — is as close as the owner wanted the
 * symbols brought in: 让显示出来的符号距离中心三环更接近一点. It was 48–68.
 *
 * 🔴 Re-derive all three whenever CENTRE_D, R or a `--disc` cap changes.
 * Nothing fails loudly if these drift — the symbols simply start drawing
 * under the disc.
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
 * the field is stratified instead: a foreground that can be read and a
 * background that recedes, by size and by dimness together.
 *
 * There was a third cue, a depth-of-field blur that grew with radius, and the
 * owner had it taken out: 呼吸效果足够纵深感了 — the breathing carries the
 * depth on its own. It also cost a compositor filter region per item on two
 * thirds of the field, which is the part of the removal nobody has to see.
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
    r0: 600,
    r1: 900,
    o0: 0.54,
    o1: 0.44,
    d0: 0,
    d1: 160,
    maxLine: 9999,
  },
  support: {
    width: 330,
    min: 34,
    max: 46,
    r0: 570,
    r1: 1120,
    o0: 0.4,
    o1: 0.26,
    d0: 130,
    d1: 330,
    maxLine: 370,
  },
  texture: {
    width: 190,
    min: 24,
    max: 31,
    r0: 570,
    r1: 1360,
    o0: 0.28,
    o1: 0.13,
    d0: 280,
    d1: 520,
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
 * Without this the depth cues disagree: dimness keys off radius while size
 * keys off tier, so a large support item far out came through bigger *and*
 * fainter than a small texture item near in — reading as a fault rather than
 * as distance. Size, dimness and delay now all track the same k.
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
const ADVANCE = { mono: 0.62, serif: 0.46, han: 1 } as const;
// A Han glyph is exactly one em wide, so the two tables agree; the margin is
// for the letter-spacing the render adds.
const BOX_ADVANCE = { mono: 0.78, serif: 0.52, han: 1.05 } as const;

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
 * Squared gap between two boxes — zero when they touch or overlap.
 *
 * Squared, and never rooted: this only ever *ranks* candidates, and a
 * product of two snapped differences is exactly specified by IEEE 754 where
 * `Math.hypot` is not (D15). A ranking that could differ by an ulp between
 * Node and Chrome would be a layout that differs between them.
 */
function gap2(a: Box, b: Box) {
  const dx = Math.max(0, b.x - (a.x + a.w), a.x - (b.x + b.w));
  const dy = Math.max(0, b.y - (a.y + a.h), a.y - (b.y + b.h));
  return dx * dx + dy * dy;
}

/**
 * How much room a candidate has, squared: its gap to the nearest *text*
 * already placed, or twice its distance to the board's edge, whichever is
 * smaller.
 *
 * Texts only, not the plates. A plate is content, not a neighbour to keep
 * away from — the corridor between the disc and Jung's diagram is exactly
 * the kind of strip that should carry a small word, and measured against the
 * plate every spot in it scored badly and it stayed bare. The plates still
 * take part in the overlap test; they just do not push text away.
 *
 * The edge term is there because "farthest from everything" is, at the edge
 * of the board, the edge itself: without it the small words queued up along
 * the right-hand margin like a column of type. Doubled, so it only bites
 * when a candidate is actually hugging the edge — an item 60 units in scores
 * as if it had 120 units of clear space, which is ordinary.
 */
function room(box: Box, texts: Box[], board: Board) {
  let nearest = Infinity;
  for (const b of texts) {
    const g = gap2(box, b);
    if (g < nearest) nearest = g;
  }
  const edge = Math.min(
    box.x - EDGE,
    board.w - EDGE - (box.x + box.w),
    box.y - EDGE,
    board.h - EDGE - (box.y + box.h),
  );
  const margin = 2 * edge;
  return Math.min(nearest, margin * margin);
}

/**
 * How many valid positions are weighed before one is chosen.
 *
 * 🔴 **Placement is best-of-several, not first-fit.** First-fit — take the
 * first candidate that clears everything — is what random-with-rejection
 * had always done, and it is why the field had holes: a candidate is
 * accepted wherever it happens to fall, so two items land side by side
 * while the band next to the disc, or the strip under a plate, stays bare.
 * The owner: 学术底页里面有一些空处看着不舒服.
 *
 * Now every item draws up to this many valid candidates and takes the one
 * farthest from everything placed so far (Mitchell's best-candidate
 * sampling). Each item goes to the emptiest room left, so the holes fill in
 * order of size, and the result is blue-noise rather than white: even
 * without being regular. The sizes, tiers and bands are untouched, so the
 * 错落有致 the owner likes — large and small, near and far — is exactly as it
 * was; only the gaps between neighbours evened out. Twelve is enough to close
 * the holes and few enough that the field still reads as scattered rather
 * than as laid on a grid.
 */
const CANDIDATES = 12;

/**
 * How many positions are drawn for an item before it is given up on.
 *
 * Raised from 140 when placement became best-of-several: the earlier items
 * now take the roomiest spots, which leaves the later ones a more broken-up
 * board to fit into, and the phone board — 1000 units across with the disc
 * taking 600 of them — was dropping two more of Scholarly's items than it
 * had. More draws find the slots that are still there. Cheap: this runs once
 * per board per track, at module load.
 */
const ATTEMPTS = 240;

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
 *
 * 🔴 **Only the name is guarded, not the whole masthead.** The field is
 * invisible until a track lights, and lighting a track fades the roles line,
 * the profile paragraph and the hint out (D10) — so the field and that copy
 * are never on screen together, and reserving space for copy that has left is
 * reserving space for nothing. Guarding the whole block is what emptied the
 * top-left corner; the owner spotted it before I did. What stays is what does
 * not recede: his name, the two addresses, and the footer.
 */
const RESERVED: Record<
  BoardKey,
  ReadonlyArray<{ x0: number; y0: number; x1: number; y1: number }>
> = {
  wide: [
    /**
     * His name, in two rectangles rather than one — for the same reason the
     * phone board's header is two, and it matters more here than it looks.
     *
     * The name is never both wide and deep at once. At 1024×768 the board's
     * top edge sits below it, so it needs 0.23 of width and almost no depth;
     * at 812×375 the board fits by height instead and it needs 0.14 of width
     * and 0.15 of depth. A single rectangle covering both reserved a corner
     * that is 0.28 by 0.18 and is *never* occupied by anything at either
     * extreme — and that empty corner was what pinned the R.S.I. plate to the
     * far left, because the only room up and to the right was inside it.
     *
     * Measured against the real name rect at 812×375, 900×700, 1024×768,
     * 1366×620, 1512×944 and 1920×1080; every one falls inside one of the two.
     */
    { x0: 0, y0: 0, x1: 0.26, y1: 0.06 },
    { x0: 0, y0: 0, x1: 0.17, y1: 0.19 },
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
     * 🔴 **The phone board reserves its two edges and nothing else.** It used
     * to hold back 0.12 at the top and 0.15 at the bottom for the name and
     * the footer, and the owner asked for both: 手机版给符号底页更多的版面.
     *
     * They were guarding against nothing. On the home page this layer is
     * invisible until a sector lights, and the moment one does the header
     * recedes and the footer steps aside (D34) — so at the only moment the
     * field is on a phone, neither is there. On a track page the field is
     * ground at 0.45 and under 64rem it carries no mask, so body text already
     * sits over symbols the length of the page; the header is not a special
     * case of that.
     *
     * What is left is the edge itself: 0.05 at the top and 0.04 at the
     * bottom, enough that an ascender or a descender is not clipped by the
     * viewport. The desktop boards keep their real guards — there the chrome
     * stays put while the visitor explores.
     */
    { x0: 0, y0: 0, x1: 1, y1: 0.05 },
    { x0: 0, y0: 0.96, x1: 1, y1: 1 },
  ],
  /**
   * Measured at 1080×600, 1366×700, 1600×816, 1920×940 and 2560×1200 — the
   * board only serves viewports at least 600 tall, so nothing here has to
   * make room for a landscape phone, and every guard is shallower than the
   * wide board's. The addresses need 0.11 of the height, not 0.22, which is
   * what opens up the top-right corner the owner pointed at; the footer only
   * runs across the left 0.62 of the width and needs 0.07 of the height.
   */
  ultra: [
    // The name: widest at 1080×600 (0.222), deepest at 1366×700 (0.096).
    { x0: 0, y0: 0, x1: 0.23, y1: 0.1 },
    // The two addresses, top right: from 0.752 at 1080×600, to 0.102 deep.
    { x0: 0.75, y0: 0, x1: 1, y1: 0.11 },
    // The footer row: from 0.936 down at 1366×700, and 0.70 of the width at
    // 1080×600 now that the language switch sits at its left end. The right
    // of the bottom band is free.
    { x0: 0, y0: 0.93, x1: 0.72, y1: 1 },
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
  /**
   * One either side of the disc, and much larger than they were.
   *
   * Creative's field is these two plates and nothing else — its `SYMBOL_LAYERS`
   * entry is deliberately empty (D13) — so stacking them both down the left
   * left the whole right half of the screen bare. Flanking the disc is the only
   * arrangement that uses the board, and at 620 and 440 units they are finally
   * scaled like the anchors of a sector rather than like footnotes.
   *
   * Aspect ratios are preserved to three figures: 620×750 against the figure's
   * 380×460, 440×620 against the mark's 190×268. Corners land at radius
   * 863–1451, well outside rMin, and both clear the name and address guards.
   */
  wide: [
    { x: 2480, y: 660, w: 440, h: 620 },
    { x: 200, y: 620, w: 620, h: 750 },
  ],
  // The phone cannot flank anything — the board is 1000 units across and the
  // disc takes 600 of them — so these stay stacked, the mark above and right
  // of the disc, the figure below and left. Enlarged as far as rMin allows:
  // nearest corners at 326 and 309 against 300.
  tall: [
    { x: 660, y: 420, w: 210, h: 296 },
    { x: 40, y: 1280, w: 330, h: 399 },
  ],
  // The wide pair, each moved 160 units outward on the wider board — still
  // flanking the disc rather than pushed to the corners.
  ultra: [
    { x: 3000, y: 660, w: 440, h: 620 },
    { x: 360, y: 620, w: 620, h: 750 },
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
/**
 * The Scholarly field's seven plates.
 *
 * 🔴 **Four are treated scans, and are not to be redrawn.** All four were
 * hand-built in SVG first, which is the right call for a figure with ten
 * labels and the wrong one for these. The R.S.I. diagram alone carries four
 * rings, nine named regions and nine annotations on leader lines, and
 * approximating that many tangencies by eye put the fourth ring straight
 * through Imaginaire and Réel instead of grazing them: the figure stopped
 * reading as three interlocked rings at all. The owner's word for the result
 * was 奇怪的圆圈 and it was exactly right. These have settled geometry that is
 * not ours to interpret; a scan transcribes perfectly, and
 * `scripts/figure-lineart.py` keys the paper out and lands the strokes in bone.
 *
 * Three are drawn, as SVG, by `scripts/figures.py`: the normal curve, the
 * hexagrams 乾 and 坤, and the Luo Shu. Those are pure geometry with a few
 * figures on them — there is nothing in a bell curve to misinterpret — and a
 * curve or nine dots has no business being pixels. Their labels are glyph
 * outlines from the site's own faces, because an SVG loaded through <image>
 * gets no web fonts.
 *
 * 🔴 **Placement is a composition, weighed by hand per board.** Reserved
 * before any glyph is placed, and not through `insideField` — re-check the
 * corners by hand against rMin and the guards whenever a guard, a board or a
 * box changes; that has caught me out three times.
 *
 * 🔴 **No column takes three large plates.** Between the address guard and
 * the footer there are about 1260 units, and three plates plus the gaps that
 * keep them apart do not fit in it — this is the arithmetic behind the
 * owner's complaint that Jung and the semiotic square sat too close, and it
 * is what every rearrangement since has run into. A column takes two, or one
 * large and two small at different depths.
 *
 * Eight plates now, in a ring: R.S.I. above and the graph of desire below on
 * the left, with the Luo Shu out at the far left between them and the
 * hexagrams in against the ring beneath; the brain and Jung side by side on
 * the upper right with the semiotic square below them; the curve on top.
 * Large and small alternate around the ring. The brain takes the inner
 * position of that pair and Jung the outer, which is where the owner wanted
 * Jung — smaller and further out — and where the brain belongs, since it is
 * what the work is now.
 *
 * A board without a box for a plate does not show it. The phone board is
 * 1000 units across with the disc taking 600 of them, and eight plates would
 * be eight thumbnails. It carries four, one to a corner — the knot top right,
 * the curve top left, the hexagrams bottom left, the brain bottom right —
 * with the ring of the disc left clear between them for the words. It was
 * five, and the owner had the Luo Shu taken off: 不然太拥挤. Jung's diagram,
 * the graph of desire and the semiotic square are not on it either, all three
 * being dense with small labels that turn to fur under 120px. The desktop
 * boards carry all eight.
 */
const FIGURES: ReadonlyArray<{
  key: string;
  href: string;
  opacity: number;
  delay: number;
  boxes: Partial<Record<BoardKey, Box>>;
}> = [
  {
    key: "rsi",
    href: "/scholarly/rsi.png",
    opacity: 0.34,
    delay: 90,
    boxes: {
      wide: { x: 560, y: 130, w: 560, h: 480 },
      // Top right on the phone, at the owner's word. It was bottom left, and
      // the knot is the plate this field is known by — on a phone the top of
      // the board is what you see before you scroll anything.
      tall: { x: 600, y: 260, w: 380, h: 326 },
      ultra: { x: 700, y: 220, w: 560, h: 480 },
    },
  },
  {
    key: "jung",
    href: "/scholarly/jung.png",
    opacity: 0.28,
    delay: 200,
    boxes: {
      // 400×473, down from 520×615 — the owner asked for it smaller (把荣格
      // 变小一点), and the room it gives up is what the brain stands in. Out
      // at the far right, with the brain inside it.
      wide: { x: 2760, y: 480, w: 400, h: 473 },
      ultra: { x: 3180, y: 480, w: 400, h: 473 },
    },
  },
  {
    key: "desire",
    href: "/scholarly/graph-of-desire.png",
    opacity: 0.28,
    delay: 310,
    boxes: {
      wide: { x: 250, y: 1040, w: 430, h: 551 },
      ultra: { x: 300, y: 1050, w: 430, h: 551 },
    },
  },
  {
    key: "square",
    href: "/scholarly/semiotic-square.png",
    opacity: 0.28,
    delay: 420,
    boxes: {
      // Lower right, pulled in against the disc rather than out to the
      // corner. Its near corner clears rMin by a few units; the footer guard
      // bounds it below. Off the phone now — see the brain's boxes.
      wide: { x: 2120, y: 1226, w: 520, h: 464 },
      ultra: { x: 2620, y: 1280, w: 520, h: 464 },
    },
  },
  {
    key: "brain",
    href: "/scholarly/brain.png",
    opacity: 0.3,
    delay: 230,
    // Upper right, in against the ring, where Jung used to be the outer half
    // of a pair with the square. Its near corner sits 621 from the centre.
    //
    // This was a drawn plate for one afternoon — the owner's reference was a
    // textbook engraving and I would not copy it, so `brain()` in
    // scripts/figures.py built one from the anatomy. Then he said he had
    // cleared the image for distribution, which settles it: a scan
    // transcribes an engraving perfectly and my hand does not, and the same
    // argument already governs the other four scanned plates. The drawing is
    // gone; the treatment is figure-lineart.py, like theirs.
    boxes: {
      wide: { x: 2200, y: 500, w: 420, h: 338 },
      // The phone carries it instead of the semiotic square. Both are about
      // the same size there and only one of them survives it: the square is
      // eight words of labelling on a 116px plate, and the brain is a
      // silhouette.
      tall: { x: 660, y: 1300, w: 320, h: 257 },
      ultra: { x: 2600, y: 500, w: 420, h: 338 },
    },
  },
  {
    key: "normal",
    href: "/scholarly/normal.svg",
    opacity: 0.3,
    delay: 150,
    // Wide and shallow, so it takes the strip above the disc that nothing
    // else fits.
    boxes: {
      wide: { x: 1340, y: 120, w: 520, h: 300 },
      tall: { x: 40, y: 290, w: 330, h: 190 },
      ultra: { x: 1740, y: 110, w: 520, h: 300 },
    },
  },
  {
    key: "hexagrams",
    href: "/scholarly/hexagrams.svg",
    opacity: 0.34,
    delay: 260,
    // Wide and shallow since the names came off and the two hexagrams were
    // pulled apart: 270×170, and the boxes carry that ratio so `meet` has
    // nothing to letterbox.
    boxes: {
      // Lower left of the disc, answering the Luo Shu at its upper right:
      // the two small plates sit on opposite corners of the ring.
      wide: { x: 860, y: 1400, w: 300, h: 189 },
      // Bottom left, into the corner R.S.I. vacated: four plates, one to a
      // corner, and the ring of the disc left clear between them.
      tall: { x: 60, y: 1400, w: 300, h: 189 },
      ultra: { x: 1170, y: 1400, w: 300, h: 189 },
    },
  },
  {
    key: "luoshu",
    href: "/scholarly/luoshu.svg",
    opacity: 0.32,
    delay: 370,
    boxes: {
      // Far left, between R.S.I. above and the graph of desire below — it
      // interleaves with them rather than stacking, being out at the margin
      // where neither reaches. It gave up the upper-right slot to the brain.
      wide: { x: 100, y: 600, w: 300, h: 300 },
      ultra: { x: 200, y: 600, w: 300, h: 300 },
    },
  },
];

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
        ? FIGURES.flatMap((f) => {
            const box = f.boxes[board.key];
            return box ? [box] : [];
          })
        : [];
  const placed: Placed[] = [];
  /** The text boxes alone, for `room` — the plates are in `taken`, not here. */
  const texts: Box[] = [];
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

      /** The best position found at this size, if any — see CANDIDATES. */
      let best: {
        box: Box;
        cx: number;
        cy: number;
        k: number;
        size: number;
        lines: string[];
        seed: number;
        room: number;
      } | null = null;
      let valid = 0;

      // Size, wrapping and box all depend on where the item lands, so they are
      // solved per candidate rather than once up front.
      for (let attempt = 0; attempt < ATTEMPTS && valid < CANDIDATES; attempt += 1) {
        seed += 1;
        // Any bearing: the field is no longer masked to a wedge, so the
        // candidate can land anywhere the rejection test below allows.
        const angle = rand(seed * 2) * 360;
        const r0raw = t.r0 * board.reach;
        const r1raw = t.r1 * board.reachOuter;
        /**
         * How far the board extends on this bearing, so the band can be cut to
         * fit it.
         *
         * Without this a great many candidates are drawn at radii the board
         * simply does not have in that direction — the texture band runs to
         * 1836 while the 8:5 board is only 1000 units tall — and each one costs
         * an attempt and yields nothing. Twelve of Scholarly's forty-five
         * items were being dropped for want of attempts rather than for want
         * of room. Clipping the band to the rectangle spends every draw inside
         * the board, and has the side effect of spreading items along the long
         * axis, which is where the space actually is.
         *
         * Snapped for the usual reason: this is built from cos and sin, and it
         * reaches the DOM through both position and opacity. See D15.
         */
        const cosA = Math.cos((angle * Math.PI) / 180);
        const sinA = Math.sin((angle * Math.PI) / 180);
        const rEdge = snap(
          Math.min(
            Math.abs((board.w / 2 - EDGE) / (Math.abs(cosA) < 1e-6 ? 1e-6 : cosA)),
            Math.abs((board.h / 2 - EDGE) / (Math.abs(sinA) < 1e-6 ? 1e-6 : sinA)),
          ),
          1e3,
        );
        const r1 = Math.min(r1raw, rEdge);
        const r0 = Math.min(r0raw, r1 * 0.9);
        /**
         * Sampled uniformly by *area*, not by radius.
         *
         * A ring at radius r holds area proportional to r, so drawing r
         * uniformly puts the same number of items in the thin band next to the
         * disc as in the vast one at the edge — the field crowds the middle
         * and thins towards the corners, which is exactly what the owner saw
         * ("左上角太空了"). Taking the root of a uniform draw between r0² and
         * r1² spreads them evenly over the plane instead.
         *
         * Snapped like every other rendered figure: `Math.sqrt` is
         * implementation-approximated in ECMA-262 the same way sin and cos
         * are, and radius reaches the DOM through both the position and the
         * opacity. See D15 before removing this.
         */
        const radius = snap(
          Math.sqrt(r0 * r0 + rand(seed * 2 + 1) * (r1 * r1 - r0 * r0)),
          1e3,
        );
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
        const cx = snap(c.x + cosA * radius, 1e3);
        const cy = snap(c.y + sinA * radius, 1e3);
        const box: Box = { x: cx - w / 2, y: cy - h / 2, w, h };

        if (!insideField(box, board)) continue;
        if (taken.some((b) => overlaps(b, box))) continue;

        valid += 1;
        const score = room(box, texts, board);
        // Strictly greater, so an equal score keeps the earlier candidate.
        if (best === null || score > best.room) {
          best = { box, cx, cy, k, size, lines, seed, room: score };
        }
      }

      if (best === null) continue;
      const { box, cx, cy, k, size, lines, seed: chosen } = best;
      taken.push(box);
      texts.push(box);
      // Everything that signals depth keys off the same k: further out means
      // smaller, dimmer, and later to arrive.
      // 2.25–4.25s, halved from 4.5–8.5 at the owner's request, and the
      // swing in `@keyframes drift` deepened from 0.68→1 to 0.46→1 to go
      // with it. The first pass ran 9–17s and read as nothing happening at
      // all; this is the third setting and the first one you can see.
      const period = Math.round(2250 + rand(chosen * 5 + 11) * 2000);
      placed.push({
        key: `${tier}-${item.text}`,
        lines,
        face: item.face,
        cx,
        cy,
        size,
        opacity: t.o0 + (t.o1 - t.o0) * k,
        delay: Math.round(t.d0 + rand(chosen * 3 + 7) * (t.d1 - t.d0)),
        period,
        phase: Math.round(rand(chosen * 7 + 13) * period),
      });
      settled = true;
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
  ultra: {
    scholarly: layout("scholarly", BOARDS.ultra),
    creative: layout("creative", BOARDS.ultra),
    professional: layout("professional", BOARDS.ultra),
  },
};

export function SymbolField({
  track,
  active,
  ground = false,
  held,
}: {
  track: TrackId;
  active: boolean;
  /**
   * Mounted already visible, and released after this many milliseconds.
   *
   * For the home page arriving from this track's page: the symbols are on the
   * screen when the visitor gets here and have to still be there — in their
   * places, at full strength — while the old page dissolves, and only then
   * fade. Without this the field would mount at zero and there would be
   * nothing under the dissolve but pigment.
   */
  held?: number;
  /**
   * At rest behind a track page's column, rather than lit behind the disc.
   *
   * Everything is there at once — no staggered arrival, because the page it
   * sits on is what is arriving, and a field that assembled itself over a
   * second under a column of text would be a second thing happening. Not
   * breathing, because it is a background to read against now, and
   * globals.css sets it back and masks it out from under the column on wide
   * screens. Same board, same layout: when the lit home page dissolves into
   * this one, every symbol is already where it was.
   */
  ground?: boolean;
}) {
  /**
   * The plates are held back until the browser has nothing better to do.
   *
   * There are six of them across the two fields that have any — 436KB of PNG,
   * which is around 8MB of bitmap once decoded — and they sit inside SVGs that
   * are in the render tree from the first paint, so the browser decodes every
   * one of them while it is also laying out 145 text nodes and swapping in four
   * webfonts. That is the hitch on opening the page.
   *
   * It cannot be decided during render: the server has to emit the same markup
   * the client hydrates, so this starts false in both and is turned on
   * afterwards, when the browser goes idle. Lighting the sector shows them
   * immediately whether or not that has happened yet — that part is derived
   * below rather than stored, so a hover never has to wait for a state update
   * to land. In practice idle wins by a second or more and the plates are
   * decoded and waiting before anyone reaches the disc.
   */
  const [holding, setHolding] = useState(held !== undefined);
  useEffect(() => {
    if (held === undefined) return;
    const timer = window.setTimeout(() => setHolding(false), held);
    return () => window.clearTimeout(timer);
  }, [held]);
  const visible = active || holding;

  /**
   * ...and only for the board that is actually on screen.
   *
   * Both boards are in the DOM and CSS shows one, so warming them both fetched
   * and decoded six plates — around 220KB, several megabytes once decoded —
   * for a board nobody will ever see. Which board that is, is a question about
   * the viewport, and D15 forbids the *markup* depending on that. This does
   * not: it stays null through render and hydration, so server and client emit
   * the same plateless markup, and it is only answered afterwards, off the
   * hydration path entirely.
   *
   * The media query is the exact complement of the CSS rule that picks the
   * board — portrait gets `tall`, everything else `wide`. Keep the two in step;
   * if they drift, the visible board is the one that never loads its plates.
   */
  const [liveBoard, setLiveBoard] = useState<BoardKey | null>(null);
  useEffect(() => {
    // 🔴 These two must stay the exact complement of the rules that pick a
    // board in globals.css: portrait → tall, wide-and-tall-enough → ultra,
    // everything else → wide. If they drift, the visible board is the one
    // that never loads its plates.
    const mq = window.matchMedia("(orientation: portrait)");
    const ultra = window.matchMedia(
      "(orientation: landscape) and (min-aspect-ratio: 9/5) and (min-height: 600px)",
    );
    const pick = () => setLiveBoard(mq.matches ? "tall" : ultra.matches ? "ultra" : "wide");
    // Rotating a phone, or resizing a window across the 1.8:1 line, changes
    // which board CSS shows, so the others have to be able to warm up late.
    mq.addEventListener("change", pick);
    ultra.addEventListener("change", pick);
    // `requestIdleCallback` is typed as always present but Safari shipped it
    // late, so the guard is a runtime one. Written as an `if` rather than a
    // ternary because TypeScript reads `idle ? …` on a function type as a
    // missing call and errors (TS2774).
    const idle = window.requestIdleCallback;
    if (!idle) {
      const timer = window.setTimeout(pick, 1800);
      return () => {
        mq.removeEventListener("change", pick);
        ultra.removeEventListener("change", pick);
        window.clearTimeout(timer);
      };
    }
    const handle = idle(pick, { timeout: 3000 });
    return () => {
      mq.removeEventListener("change", pick);
      ultra.removeEventListener("change", pick);
      window.cancelIdleCallback(handle);
    };
  }, []);

  if (
    LAYOUTS.wide[track].length === 0 &&
    (track === "creative" ? PLATE_ART.length : 0) === 0
  )
    return null;

  /**
   * Before the board is known, a hover still has to show plates at once, so it
   * falls back to warming both — that is the old behaviour and it is only ever
   * in play for the first second or two. Once the board *is* known it decides
   * alone, so the off-screen board never loads a thing.
   */
  const warmFor = (key: BoardKey) => (liveBoard === null ? visible : liveBoard === key);

  // Each element carries its own delay so the field assembles unevenly rather
  // than switching on as a block. On the way out the delay drops to zero, so
  // closing a sector is immediate — a staggered exit reads as lag.
  const reveal = (target: number, delay: number) =>
    ground
      ? { opacity: target }
      : {
          opacity: visible ? target : 0,
          transition: "opacity 620ms ease-out",
          transitionDelay: active ? `${delay}ms` : "0ms",
        };

  // Both boards are rendered and CSS shows one. Choosing at runtime would make
  // the markup depend on the viewport, which the server cannot know — the exact
  // shape of hydration mismatch D15 exists to prevent.
  return (
    <>
      {(Object.keys(BOARDS) as BoardKey[]).map((key) => {
        const board = BOARDS[key];
        const items = LAYOUTS[key][track];
        // Both lists stay empty until this board's plates are warm, which for
        // the board CSS is hiding means forever. See `warmFor` above.
        const warm = warmFor(key);
        const figures = warm && track === "scholarly" ? FIGURES : [];
        const plateList = warm && track === "creative" ? plates(board) : [];
        return (
          <svg
            key={key}
            viewBox={`0 0 ${board.w} ${board.h}`}
            preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      // `w-screen`, not `inset-0`: 100vw includes a classic scrollbar's
      // width, the containing block does not. The track pages scroll and the
      // home page does not, so with `inset-0` the layer was 17px narrower on
      // one than on the other and the board re-fitted between them — the
      // texture stepped sideways during the dissolve. This keeps the box the
      // same size on both, the last few pixels sitting under the scrollbar.
      //
      // 🔴 And `h-full`, explicitly. An absolutely positioned *replaced*
      // element with a width and `height: auto` takes its height from its
      // intrinsic ratio — this SVG's viewBox — and `bottom: 0` is simply
      // ignored. So `inset-y-0` alone made the layer 100vw / 1.6 tall: on a
      // 2:1 screen that is 18% taller than the viewport, the board fitted by
      // width instead of height, and the bottom row of the field was cut off.
      // It went unnoticed because the 1512×944 test viewport happens to have
      // the board's own aspect, where the two heights coincide.
      className={`symbol-field field-${board.key} ${
        ground ? "field-ground " : ""
      }pointer-events-none fixed top-0 left-0 -z-10 h-full w-screen text-bone`}
    >
      {figures.map((figure) => {
        const box = figure.boxes[key];
        if (!box) return null;
        return (
          <image
            key={figure.key}
            href={figure.href}
            x={box.x}
            y={box.y}
            width={box.w}
            height={box.h}
            preserveAspectRatio="xMidYMid meet"
            style={reveal(figure.opacity, figure.delay)}
          />
        );
      })}

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
              /**
               * Paused while the sector is dark, and it has to be set here
               * rather than in a stylesheet.
               *
               * Three fields are in the DOM at all times and only one is ever
               * visible, so otherwise around 145 infinite opacity animations
               * run from first paint for the whole session behind elements at
               * opacity 0 — most of the home screen's cost, spent on nothing.
               *
               * 🔴 A `.symbol-field:not(.is-live) .drift` rule does not work,
               * and looks like it should. The `animation` shorthand above
               * resets `animation-play-state` to `running` as one of its
               * longhands, and an inline declaration beats a stylesheet rule —
               * so the shorthand quietly overrides the rule every time. The
               * longhand has to follow the shorthand in the same block.
               *
               * Paused rather than removed, so a field keeps its phase and
               * picks up where it left off instead of every symbol snapping to
               * the start of its cycle the moment the sector lights.
               */
              animationPlayState: visible && !ground ? "running" : "paused",
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
                  : item.face === "han"
                    ? "var(--font-noto-serif-sc)"
                    : "var(--font-mono)"
              }
              // Han has no italic (D17); it is set upright, in Song.
              fontStyle={item.face === "serif" ? "italic" : undefined}
              letterSpacing={item.face === "serif" ? 0 : item.face === "han" ? 1.6 : 1.1}
              style={reveal(item.opacity, item.delay)}
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
