"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
// Imported rather than referenced by public/ path: Next puts a content hash in
// the emitted filename, so replacing the photograph can never leave the image
// optimiser serving the previous one off a cached URL.
import portrait from "@/assets/portrait.png";
import { SymbolField } from "@/components/symbol-field";
import { TrackMark } from "@/components/track-mark";
import { TRACKS, TRACK_CLASSES, type TrackId } from "@/lib/content";
import type { Dictionary, Locale } from "@/lib/i18n";

/**
 * Three overlapping circles rather than three sectors of one ring.
 *
 * The ring said the three are co-equal and separate. They are not separate —
 * the games are written by the psychologist, and the studio is run by the same
 * person who runs the research — and a Venn says so. It has four regions the
 * ring could not express: three pairwise, and one in the middle. The middle one
 * is him, which is why the portrait sits there now instead of in a hub of its
 * own.
 *
 * Centres sit on a circle of radius CENTRE_D, 120° apart, each circle of radius
 * R. The triangle they form has side CENTRE_D·√3 — 124.7 against a radius of
 * 118, near enough the proportion a Venn is normally drawn at.
 *
 * 🔴 **CENTRE_D is solved, not chosen: R − CENTRE_D = R_PORTRAIT.** A circle
 * whose centre is CENTRE_D from the middle comes within R − CENTRE_D of it, and
 * that innermost point is where the middle region's boundary runs. Setting it
 * equal to the portrait's radius makes all three arcs *tangent* to the portrait
 * — they gather along it instead of stopping short. At the previous 68 they
 * stopped 4 units out and the middle wore a slack black collar.
 *
 * So the three are locked together. Move the portrait and this has to move; if
 * a gap is ever wanted back, that is CENTRE_D < R − R_PORTRAIT, not a nudge.
 */
const CX = 200;
const CY = 200;
const R = 118;
const CENTRE_D = 72;

/** Where each circle sits, in degrees. SVG convention: 90° is the bottom. */
const VENN: Record<TrackId, number> = {
  scholarly: 90,
  creative: 210,
  professional: 330,
};

/**
 * How far out a label sits from the composition centre.
 *
 * Far enough to clear the other two circles, so each label lies in its own
 * circle's exclusive lune and belongs to one track unambiguously. Checked: a
 * label centre sits 53 units inside its own circle and 172.7 from either of the
 * others, which are 118 across.
 *
 * ⚠️ That 172.7 is to the label's *centre*, and a long word eats into it fast.
 * "PROFESSIONAL" set at 12px on a 480px disc is 114px wide, which is 47.5 units
 * of half-width, leaving 125 against a radius of 118 — seven units, and at
 * CENTRE_D 68 it was under two and the word was touching the neighbouring arc.
 * This is why the disc has its own shorter name for that track (see `mark` in
 * i18n.ts). Check the arithmetic before lengthening any label here.
 */
const R_LABEL = CENTRE_D + R * 0.45;

/**
 * The portrait's circle, at the triple intersection.
 *
 * That region is a curved triangle, not a circle: from the middle it reaches 46
 * units towards each of its three edges and 64.2 towards each corner. So 46 is
 * not merely the largest circle that fits — it is the *inscribed* one, touching
 * all three edges at their midpoints. See the note on CENTRE_D, which is solved
 * from this number.
 */
const R_PORTRAIT = 46;

/** How far a flood grows. Covers the furthest viewport corner with room over. */
const FLOOD_SCALE = 20;

/** How long the pigment takes to reach the edge of the screen. */
const FLOOD_RISE = 700;

/**
 * How long a tap holds the flood before the route changes. Touch only — a
 * pointer has already seen all of this on hover, and a delay there would just
 * read as lag.
 *
 * 🔴 **Derived from when the symbol field finishes arriving, not picked.** The
 * texture tier starts as late as 520ms and each item fades over 620ms, so the
 * last symbol lands at 1140ms. At the previous 1000ms the route changed
 * *before* that — which meant the one thing this pause exists to show had
 * never once been seen whole on a phone. This holds the finished field for
 * another 560ms, which is what the owner asked for when he asked to look at
 * the symbols a little longer.
 *
 * So it is bounded below by the field, not by taste: shortening it past 1140
 * does not make the wait shorter, it makes the wait pointless. If the tier
 * delays in symbol-field.tsx change, re-derive this.
 */
const BEAM_HOLD = 1700;

/**
 * How long the pigment takes to draw back into its circle once nothing is lit.
 *
 * Quicker than the rise on purpose. Opening is the interesting direction and
 * wants to be watched; closing is the visitor having moved on, and a slow
 * close reads as the page being slow to let go.
 */
const FLOOD_FALL = 540;

/** How the seven regions cross between their own colours and the lit one. */
const FILL_SHIFT = "fill 380ms ease-out";

/**
 * The line work, and all of it on one beat.
 *
 * The three arcs and the portrait's ring are drawn together rather than one
 * after another. They used to be staggered 220ms apart, from D11's "the disc
 * is plotted, sector after sector" — but that was written for a ring of three
 * separate sectors. These three do not take turns: each starts where it
 * crosses a neighbour and ends on the portrait, so they are three strokes of
 * one gesture converging on one point, and staggering them made it look like
 * three unrelated events.
 */
const PLOT = "plot-stroke 1000ms cubic-bezier(0.65, 0, 0.35, 1) 200ms both";

/**
 * The three lenses where two circles meet — and who each one belongs to.
 *
 * 🔴 **An overlap takes one parent's pigment whole. It is never a mixture.**
 *
 * Three attempts went into this and two of them failed the same way. Stacked
 * translucently, alpha compounds and every overlap comes out darker than both
 * parents. Mixed explicitly — screened, or averaged in any colour space — it
 * comes out muddy, and that is not a technical fault to be tuned away: these
 * three pigments are dark (L* 22 to 36) and their hues are far apart, so blue
 * with red gives dark purple, blue with gold gives olive, red with gold gives
 * brown. There is no mixing rule that rescues that. Painted flat black instead,
 * the lenses stopped being muddy and started reading as holes punched through
 * the disc.
 *
 * So: no new colour is ever introduced. Each lens simply continues one of its
 * two parents, and which one is decided by going **clockwise** — creative,
 * professional, scholarly, and round again. Each circle's colour carries
 * forward into the overlap ahead of it:
 *
 *     creative ∩ professional → creative     (upper middle, oxblood)
 *     professional ∩ scholarly → professional (lower right, gilt)
 *     scholarly ∩ creative → scholarly        (lower left, klein)
 *
 * It is the same over-and-under rule that makes the Borromean knot in the
 * Scholarly field Borromean: in every pair one is over, and the cycle has no
 * winner. The middle is where that shows: with no circle over all the others,
 * it cannot belong to one, so it turns instead — see MIDDLE.
 *
 * **The pointer follows the paint.** A lens carries its owner's hover and its
 * owner's link, so the region that looks like creative *is* creative. Anything
 * else would make the colour a lie about where you are.
 */
const CYCLE: ReadonlyArray<{ from: TrackId; to: TrackId }> = [
  { from: "creative", to: "professional" },
  { from: "professional", to: "scholarly" },
  { from: "scholarly", to: "creative" },
];

/**
 * Which circle passes *over* each one — the same cycle read backwards.
 *
 * Every circle is over exactly one and under exactly one, which is what makes
 * this a Borromean link and not three circles piled up. Cut any one and the
 * other two come apart, because they were never linked to each other.
 */
const OVER = Object.fromEntries(CYCLE.map(({ from, to }) => [to, from])) as Record<
  TrackId,
  TrackId
>;

/** And which one each passes over — the cycle read forwards. */
const UNDER = Object.fromEntries(CYCLE.map(({ from, to }) => [from, to])) as Record<
  TrackId,
  TrackId
>;

/**
 * How far past the over-circle's edge the under-circle's line stays broken.
 *
 * A knot diagram needs air around the crossing: ending the under-strand exactly
 * on the over-strand reads as two lines meeting, not as one passing beneath.
 * 3.5 units against a 1.1 stroke is about three line-widths of clearance, and
 * lands near 4px on a 480px disc.
 */
const BREAK = 3.5;

/**
 * The middle turns. It is a pinwheel, not a hole and not a colour.
 *
 * 🔴 **Nothing here is a matter of taste — the colouring is forced.** The middle
 * region is a curved triangle pinched to a point at three bearings (30°, 150°,
 * 270°), because those are exactly where each circle touches the portrait. So
 * it is already three separate slivers, one around each corner, and each sliver
 * has two edges. Cross one edge and you are in one overlap; cross the other and
 * you are in a different one. Give the sliver the colour of one of them and
 * that edge disappears — same colour on both sides — while the other edge
 * stays, as a real boundary between two colours.
 *
 * Do that for all three and the surviving edges are three half-arcs, each
 * running from a corner inward until it goes tangent to the portrait and stops
 * on its rim. Three of them, 120° apart, all turning the same way. That is the
 * vortex, and it is also, at last, the thing the owner kept describing: lines
 * that gradually become tangent and converge with the circle's edge.
 *
 * The assignment below is the one that produces it, and it is a rotation — each
 * sliver takes the pigment of the circle 120° behind it:
 *
 *     sliver around the corner towards scholarly   → professional's gilt
 *     sliver around the corner towards creative    → scholarly's klein
 *     sliver around the corner towards professional → creative's oxblood
 *
 * Swap any one of them and two edges vanish where one should have stayed: the
 * middle goes flat and the turn is gone.
 */
const MIDDLE: ReadonlyArray<{ from: number; to: number; track: TrackId }> = [
  { from: 30, to: 150, track: "professional" },
  { from: 150, to: 270, track: "scholarly" },
  { from: 270, to: 390, track: "creative" },
];

/**
 * A wedge from the centre, far larger than the middle region, for clipping.
 *
 * Snapped like every other computed coordinate — this ends up in path data, and
 * `cos`/`sin` are implementation-approximated. See D15.
 */
function wedge(from: number, to: number, r = 300) {
  const at = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return `${Math.round((CX + r * Math.cos(rad)) * 1e3) / 1e3} ${
      Math.round((CY + r * Math.sin(rad)) * 1e3) / 1e3
    }`;
  };
  return `M ${CX} ${CY} L ${at(from)} A ${r} ${r} 0 0 1 ${at(to)} Z`;
}

/** The centre is a fourth focus target, but it lights nothing and colours nothing. */
export type Focus = TrackId | "hub" | null;

function centreOf(track: TrackId) {
  const rad = (VENN[track] * Math.PI) / 180;
  return { x: CX + CENTRE_D * Math.cos(rad), y: CY + CENTRE_D * Math.sin(rad) };
}

/**
 * A circle's outline as one arc, drawn from the overlap to the portrait.
 *
 * 🔴 **This must not go back to being a `<circle>`.** What is left of each
 * outline after the masks — the Borromean break at one end, half the middle arc
 * at the other — is exactly one contiguous 270° arc, running from the outer
 * crossing with its neighbour, the long way round, to the point where it goes
 * tangent to the portrait. So it *can* be drawn in one stroke, and it should
 * be: everything in this composition converges on the portrait, and the
 * entrance is what says so.
 *
 * Drawn as a full circle it could not be. A `<circle>`'s dash always begins at
 * its own 0°, pointing right, and where that lands relative to the mask differs
 * per track because the masks are placed in composition space while the local
 * frames are all axis-aligned. Scholarly's visible span happens to start there
 * and drew cleanly; creative's runs 90°→30° across 0°, so the dash produced a
 * stub, a gap, then the rest; professional's broke the same way. That was the
 * owner's "断开然后短线条播放", and no amount of re-timing fixes it — the start
 * point has to move.
 *
 * The span is 270° for all three: `VENN[track] - 90` is the outer crossing and
 * +270 lands on the tangent point. The masks still trim the ends precisely,
 * including BREAK, so this only has to be right to within a degree or two.
 */
function outline(track: TrackId) {
  const c = centreOf(track);
  const at = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    const round = (n: number) => Math.round(n * 1e3) / 1e3;
    return `${round(c.x + R * Math.cos(rad))} ${round(c.y + R * Math.sin(rad))}`;
  };
  const start = VENN[track] - 90;
  return `M ${at(start)} A ${R} ${R} 0 1 1 ${at(start + 270)}`;
}

function labelOf(track: TrackId) {
  const rad = (VENN[track] * Math.PI) / 180;
  const x = CX + R_LABEL * Math.cos(rad);
  const y = CY + R_LABEL * Math.sin(rad);
  return { left: `${(x / 400) * 100}%`, top: `${(y / 400) * 100}%` };
}

export function TrinityDisc({
  lang,
  dict,
  focus,
  setFocus,
}: {
  lang: Locale;
  dict: Dictionary;
  focus: Focus;
  setFocus: (next: Focus) => void;
}) {
  const router = useRouter();
  const leaving = useRef(false);

  /**
   * The track whose pigment is currently drawing back in.
   *
   * 🔴 **The close is the open run backwards, and that is the point.** A
   * dissolve was tried here — the pigment thinning and drifting apart under a
   * noise mask — and it was rejected: a full-screen blur and a moving mask for
   * something the visitor sees every time they move the mouse away, and it
   * read as an effect rather than as the composition doing something.
   *
   * What it does instead is go home. The rise starts at scale 1, which is the
   * circle already sitting there in the disc, so what grows is *that circle*
   * rather than a dot appearing at its centre; the fall returns to scale 1 and
   * lands exactly back on it, so there is nothing to see at the end — the page
   * is simply the composition again. Two states, one property, no filters.
   *
   * So the lit track is remembered for exactly as long as that return runs.
   */
  const [closing, setClosing] = useState<{ id: TrackId; mode: "hold" | "fall" } | null>(
    null,
  );
  const lastLit = useRef<TrackId | null>(null);

  useEffect(() => {
    const lit = focus === null || focus === "hub" ? null : focus;
    const previous = lastLit.current;
    if (previous === lit) return;
    lastLit.current = lit;
    if (!previous) {
      setClosing(null);
      return;
    }
    /**
     * 🔴 **Sweeping from one circle to another must never look like a close.**
     *
     * It did: the outgoing pigment drew back to its circle while the incoming
     * one opened out, so two circles moved in opposite directions at once and
     * the direction you saw depended on which one your eye happened to be on.
     * The owner's words — sometimes a circle goes in, sometimes out.
     *
     * The rule now: pigment only ever draws back when you leave the
     * composition. Move between circles and the outgoing one simply *holds*
     * full-screen while the new one opens over the top of it, so every
     * track-to-track move is one opening and nothing else. The old pigment is
     * covered long before it is unmounted, so its removal is never visible.
     */
    const mode = lit ? "hold" : "fall";
    setClosing({ id: previous, mode });
    const timer = window.setTimeout(
      () => setClosing(null),
      mode === "fall" ? FLOOD_FALL : FLOOD_RISE,
    );
    return () => window.clearTimeout(timer);
  }, [focus]);

  const go = (id: TrackId) => {
    if (leaving.current) return; // a second tap must not queue a second push
    leaving.current = true;
    setFocus(id);
    window.setTimeout(() => router.push(`/${lang}/${id}`), BEAM_HOLD);
  };

  /**
   * Touch opens on pointerdown, not on click, and that is the whole fix for the
   * two-tap bug. On iOS an element with hover behaviour swallows the first tap:
   * that tap only applies the hover state — which is why the flood fired — and
   * `click` is not delivered until a second one.
   */
  const openOnTouch = (id: TrackId) => (event: React.PointerEvent) => {
    if (event.pointerType === "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    go(id);
  };

  /** Once a touch has started the transition, the trailing click must not
   *  navigate a second time or cut the flood short. */
  const swallowClick = (event: React.MouseEvent) => {
    if (leaving.current) event.preventDefault();
  };

  /** True whenever something is lit and it is not this track. */
  const dimmed = (id: TrackId) => focus !== null && focus !== id;

  /**
   * The pigment that has taken the whole composition, if any.
   *
   * 🔴 **A lit track floods every region, not just its own.** All three
   * circles, all three lenses and the middle go to one colour, and the bone
   * outlines are the only thing left standing on it. The owner asked for this
   * over dimming the other two, and he is right about why: dimming says "the
   * others matter less for a moment", which is a hedge, while one colour
   * taking everything says the thing the transition is actually about — this
   * page is becoming that page, and that page's ground is this colour (D10).
   * It also makes the disc and the flood behind it a single sheet of pigment
   * rather than a coloured screen with a patterned disc sitting on it.
   *
   * At rest the composition is intact: three pigments, black overlaps, black
   * middle. That is the state D9 speaks about, and it is untouched.
   */
  const litFill =
    focus !== null && focus !== "hub" ? TRACK_CLASSES[focus].cssVar : null;

  return (
    <>
      {/* The flood is one of these three circles, grown until it covers the
          screen. Not decoration: the destination page uses this pigment as its
          ground (D10), so the circle opening out is the transition.

          Positioned in CSS rather than drawn in the SVG because it has to sit
          behind the symbol field, and the field is a fixed layer. `--disc` is
          the rendered width of the disc, so the offsets are the circle's own
          centre expressed in viewport terms — and the two cannot drift, because
          the disc's own max-width reads the same variable.

          Nothing here is filtered or masked. The only property that animates
          is `scale`, on one element, which is the cheapest thing a browser can
          be asked to move — and this fires on every hover, so it has to be. */}
      {TRACKS.map((track) => {
        const c = centreOf(track.id);
        const lit = focus === track.id;
        const mode = !lit && closing?.id === track.id ? closing.mode : null;
        if (!lit && !mode) return null;
        return (
          <span
            // Keyed by phase so React swaps the element rather than mutating
            // it: a CSS animation only restarts on a fresh element, and a
            // return that does not restart is a return nobody sees.
            key={`${track.id}-${mode ?? "rise"}`}
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 block overflow-hidden"
            // The one that is opening always sits above the one it is
            // replacing. Without this the stack follows DOM order — which is
            // the fixed order of TRACKS — so sweeping left to right covered
            // the new pigment with the old one and sweeping the other way did
            // not. Both are still behind the symbol field at -10.
            style={{ zIndex: mode === "hold" ? -21 : -20 }}
          >
            {/* Two levels, each owning one thing. This one places the circle's
                centre; the inner one scales. Keeping them apart is what lets
                the keyframes animate `scale` alone and know none of the
                offsets. */}
            <span
              className="absolute top-1/2 left-1/2 block"
              style={{
                transform: `translate(calc(var(--disc) * ${(c.x - CX) / 400}), calc(var(--disc) * ${(c.y - CY) / 400}))`,
              }}
            >
              <span
                className="block rounded-full"
                style={
                  {
                    width: `calc(var(--disc) * ${(2 * R) / 400})`,
                    height: `calc(var(--disc) * ${(2 * R) / 400})`,
                    backgroundColor: TRACK_CLASSES[track.id].cssVar,
                    // CSS reads this inside the keyframe, so the number lives
                    // in one place rather than being written out twice. The
                    // centring translate lives in the keyframe too — an
                    // animated `transform` replaces the declared one outright,
                    // so a utility class for it would simply be discarded.
                    "--flood-scale": FLOOD_SCALE,
                    animation:
                      mode === "fall"
                        ? `flood-fall ${FLOOD_FALL}ms cubic-bezier(0.4, 0, 0.2, 1) both`
                        : mode === "hold"
                          ? // Covered by the incoming pigment; it only has to
                            // stay put until that has finished arriving.
                            `flood-hold ${FLOOD_RISE}ms linear both`
                          : `flood-rise ${FLOOD_RISE}ms ease-out both`,
                  } as React.CSSProperties
                }
              />
            </span>
          </span>
        );
      })}

      {TRACKS.map((track) => (
        <SymbolField key={track.id} track={track.id} active={focus === track.id} />
      ))}

      <div
        className="relative mx-auto aspect-square w-full max-w-[var(--disc)]"
        onMouseLeave={() => setFocus(null)}
      >
        <svg viewBox="0 0 400 400" className="size-full" aria-hidden="true">
          <defs>
            {TRACKS.map((track) => {
              const c = centreOf(track.id);
              return (
                <clipPath key={track.id} id={`venn-${track.id}`}>
                  <circle cx={c.x} cy={c.y} r={R} />
                </clipPath>
              );
            })}
            {/* Two circles' intersection, so the third can be clipped by it and
                give the triple region. Nested clip-path references are the only
                way to express an intersection of three shapes in SVG without
                solving for the arcs by hand. */}
            <clipPath id="venn-two">
              <circle
                cx={centreOf("creative").x}
                cy={centreOf("creative").y}
                r={R}
                clipPath="url(#venn-scholarly)"
              />
            </clipPath>
            {/* The middle region itself, for the pinwheel to be cut out of. */}
            <clipPath id="venn-mid">
              <circle
                cx={centreOf("professional").x}
                cy={centreOf("professional").y}
                r={R}
                clipPath="url(#venn-two)"
              />
            </clipPath>
            {/* Half-plane per circle, splitting its middle arc at the bearing
                where it goes tangent to the portrait. Only the half on the
                far side survives — see the note on MIDDLE for why exactly
                half of each arc is a boundary and the other half is not. */}
            {TRACKS.map((track) => (
              <clipPath key={track.id} id={`venn-half-${track.id}`}>
                <rect
                  x={CX - 600}
                  y={CY - 600}
                  width={600}
                  height={1200}
                  transform={`rotate(${VENN[track.id] - 90} ${CX} ${CY})`}
                />
              </clipPath>
            ))}
            {/* One mask per circle. White keeps, black cuts, and they are
                painted in that order, so each successive disc overrides the
                last.

                Black: everywhere this circle runs beneath the one that is over
                it. The cutting disc is BREAK wider than the real circle, so the
                break opens on both sides of a crossing rather than closing
                exactly on the other line.

                White again: the middle. That black cut takes the whole arc,
                and part of that arc is the middle region's own boundary — so
                cutting it left the middle with no outline at all, a black
                shape reading as a hole punched round the portrait. The arc
                bounding the middle is exactly the part that also lies inside
                the third circle, which is the one this circle passes over, so
                restoring that disc gives it back and nothing else.

                What this trades: the two inner crossings sit deep inside the
                third circle — 7.8 units from its centre, against a radius of
                118 — and so both fall in the restored area, and the middle
                closes into a whole curved
                triangle instead of carrying a break at its corners. The
                over-and-under still reads, at the outer crossings where the
                rings visibly interlock, and the pigment says it a second time:
                a lens wears the colour of whichever circle is over it. A black
                region with no edge at all said nothing at all. */}
            {TRACKS.map((track) => {
              const over = centreOf(OVER[track.id]);
              const under = centreOf(UNDER[track.id]);
              return (
                <mask
                  key={track.id}
                  id={`venn-under-${track.id}`}
                  maskUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="400"
                  height="400"
                >
                  <rect x="0" y="0" width="400" height="400" fill="#fff" />
                  <circle cx={over.x} cy={over.y} r={R + BREAK} fill="#000" />
                  {/* Restores only *half* the middle arc — the half that is a
                      real boundary between two colours. The other half has the
                      same pigment on both sides now, so a line there would be
                      drawing a border that is not there. What survives runs
                      from a corner inward and stops where it touches the
                      portrait, which is what makes the middle turn. */}
                  <circle
                    cx={under.x}
                    cy={under.y}
                    r={R}
                    clipPath={`url(#venn-half-${track.id})`}
                    fill="#fff"
                  />
                </mask>
              );
            })}
          </defs>

          {/* Every region is painted exactly once, back to front: the three
              circles, then the three lenses over them, then the middle over
              those. Nothing is layered translucently, so no region's colour is
              an accident of what happens to be underneath it. */}
          <g style={{ animation: "fade-in 700ms ease-out 1050ms both" }}>
            {TRACKS.map((track) => {
              const c = centreOf(track.id);
              return (
                <circle
                  key={track.id}
                  cx={c.x}
                  cy={c.y}
                  r={R}
                  className="cursor-pointer"
                  style={{
                    fill: litFill ?? TRACK_CLASSES[track.id].cssVar,
                    transition: FILL_SHIFT,
                  }}
                  onMouseEnter={() => setFocus(track.id)}
                  onPointerDown={openOnTouch(track.id)}
                  onClick={() => {
                    if (!leaving.current) router.push(`/${lang}/${track.id}`);
                  }}
                />
              );
            })}

            {/* Each lens continues the pigment of the circle behind it in the
                clockwise cycle, and carries that circle's pointer behaviour
                too — so the colour tells you truthfully which track you are
                about to open. */}
            {CYCLE.map(({ from, to }) => {
              const c = centreOf(to);
              return (
                <circle
                  key={`${from}-${to}`}
                  cx={c.x}
                  cy={c.y}
                  r={R}
                  clipPath={`url(#venn-${from})`}
                  className="cursor-pointer"
                  style={{
                    fill: litFill ?? TRACK_CLASSES[from].cssVar,
                    transition: FILL_SHIFT,
                  }}
                  onMouseEnter={() => setFocus(from)}
                  onPointerDown={openOnTouch(from)}
                  onClick={() => {
                    if (!leaving.current) router.push(`/${lang}/${from}`);
                  }}
                />
              );
            })}

            {/* The middle, painted last so it wins over all three lenses — in
                three pieces that turn. Not black: black read as a hole punched
                round the portrait, which is the complaint that started all of
                this. See the note on MIDDLE for why each piece takes the
                pigment it does; the choice is forced, not styled.

                Each piece carries the hover of the track whose colour it
                wears, on the same principle as the lenses: the pointer follows
                the paint, so a region can never lie about where a click goes. */}
            {MIDDLE.map(({ from, to, track }) => (
              <path
                key={track}
                d={wedge(from, to)}
                clipPath="url(#venn-mid)"
                className="cursor-pointer"
                style={{
                  fill: litFill ?? TRACK_CLASSES[track].cssVar,
                  transition: FILL_SHIFT,
                }}
                onMouseEnter={() => setFocus(track)}
                onPointerDown={openOnTouch(track)}
                onClick={() => {
                  if (!leaving.current) router.push(`/${lang}/${track}`);
                }}
              />
            ))}
          </g>

          {/* Outlines last, so they read over every region boundary. Each is
              drawn on rather than faded in, one after another — and each is
              broken where it passes under its neighbour, which is what turns
              three overlapping circles into a knot.

              The break is also what lets the colour carry: a lens is painted
              in the over-circle's pigment, and its boundary with that circle's
              own region is precisely the arc being cut here. Without the cut
              there is a bone line running through one continuous field of
              colour; with it, the two are simply the same shape.

              All three are drawn on the same beat, each in a single unbroken
              stroke that starts where it crosses its neighbour and finishes on
              the portrait. See `outline` for why this is an arc and not a
              circle — as a circle two of the three came out as a stub, a gap
              and then the rest. */}
          {TRACKS.map((track) => {
            return (
              <path
                key={track.id}
                d={outline(track.id)}
                fill="none"
                stroke="rgb(242, 239, 233)"
                strokeWidth={1.1}
                pathLength={1}
                strokeDasharray={1}
                mask={`url(#venn-under-${track.id})`}
                className="pointer-events-none"
                // Held at full weight even when another track is lit. Once one
                // pigment has taken every region these three lines are the
                // only thing keeping the composition legible, and fading two
                // of them would leave a plain coloured screen with one circle
                // drawn on it.
                strokeOpacity={0.75}
                style={{ animation: PLOT }}
              />
            );
          })}

          {/* 🔴 The ring round the portrait, and it is drawn *here* rather than
              as a CSS border on the photograph, because it has to be plotted
              with the other three.

              Everything in the middle now converges on this ring: the three
              surviving half-arcs each run inward until they go tangent to it
              and stop. The photograph used to arrive at 1700ms, long after
              those arcs had been drawn — so for the whole entrance they
              spiralled into nothing and the middle had no boundary at all.
              Drawing the ring on the same beat as the first circle gives them
              something to land on from the start, and the photograph then
              simply fills a ring that is already there.

              It is also the only ring now. The Link no longer carries a border
              (two coincident rings read as one fat one) and no longer scales on
              focus (that slid the photograph out from under a fixed ring);
              focus brightens this instead. */}
          <circle
            cx={CX}
            cy={CY}
            r={R_PORTRAIT}
            fill="none"
            stroke="rgb(242, 239, 233)"
            strokeWidth={1.1}
            pathLength={1}
            strokeDasharray={1}
            className="pointer-events-none"
            style={{
              strokeOpacity: focus === "hub" ? 1 : 0.75,
              transition: "stroke-opacity 300ms ease-out",
              animation: PLOT,
            }}
          />
        </svg>

        {/* The labels are the real links: they carry the accessible name, they
            work without JavaScript, and focusing one lights the same flood a
            hover does. The circles above are a pointer-only enhancement. */}
        {TRACKS.map((track, i) => (
          <Link
            key={track.id}
            href={`/${lang}/${track.id}`}
            style={{
              ...labelOf(track.id),
              animation: `fade-in 500ms ease-out ${1250 + i * 150}ms both`,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            onPointerDown={openOnTouch(track.id)}
            onClick={swallowClick}
            onMouseEnter={() => setFocus(track.id)}
            onFocus={() => setFocus(track.id)}
            onBlur={() => setFocus(null)}
          >
            <span
              className="flex flex-col items-center gap-0.5 text-center transition-opacity duration-500 ease-out sm:gap-1"
              style={{ opacity: dimmed(track.id) ? 0.3 : 1 }}
            >
              <TrackMark
                track={track}
                className="font-display text-base leading-none sm:text-3xl md:text-4xl"
              />
              <span className="label" style={{ fontSize: "var(--disc-label-size, 10.5px)" }}>
                {dict.tracks[track.id].mark ?? dict.tracks[track.id].title}
              </span>
            </span>
          </Link>
        ))}

        {/* Him, at the triple intersection — the one region belonging to all
            three at once.

            In colour, and that is not an aesthetic call. A black-and-white
            portrait of a living person reads as a funeral portrait to Chinese
            viewers, and half this site is Chinese. Do not tone it to bone on D9
            grounds: what D9 asks for is the absence of the three pigments, and
            a photograph is not a flat field competing with them. */}
        <Link
          href={`/${lang}/coda`}
          aria-label={dict.hub.ariaLabel}
          style={{
            // Arrives with the first label, not 600ms after everything else.
            // The ring finishes drawing at 1100ms; leaving the photograph until
            // 1700 left the pinwheel's bare centre — three colours meeting at a
            // point — sitting inside a finished ring for half a second.
            animation: "fade-in 500ms ease-out 1250ms both",
            width: `${(R_PORTRAIT * 2 * 100) / 400}%`,
            height: `${(R_PORTRAIT * 2 * 100) / 400}%`,
            transform: "translate(-50%, -50%)",
          }}
          // 🔴 No border, and no scale on focus. The ring round the portrait is
          // drawn in the SVG now (see the note on it) so that it can be plotted
          // with the rest of the line work; a border here as well would put two
          // rings a pixel apart, and scaling this element would slide the
          // photograph out from under the fixed one. Focus is expressed by
          // brightening that ring instead.
          className="group absolute top-1/2 left-1/2 flex items-center justify-center overflow-hidden rounded-full bg-void"
          onMouseEnter={() => setFocus("hub")}
          onFocus={() => setFocus("hub")}
          onBlur={() => setFocus(null)}
        >
          <Image
            src={portrait}
            alt=""
            priority
            className="absolute inset-0 size-full object-cover transition-opacity duration-500 ease-out"
            style={{ opacity: focus === "hub" ? 0.28 : 0.95 }}
          />
          <span
            className="relative flex flex-col items-center transition-opacity duration-500 ease-out"
            style={{ opacity: focus === "hub" ? 1 : 0 }}
          >
            <span className="font-display text-lg leading-none italic md:text-2xl">
              {dict.hub.name}
            </span>
          </span>
        </Link>
      </div>
    </>
  );
}
