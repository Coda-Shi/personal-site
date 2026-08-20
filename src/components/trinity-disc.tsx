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
 * R. The triangle they form has side CENTRE_D·√3, so at these values the side
 * is about equal to the radius — the proportion a Venn is normally drawn at,
 * and the one that leaves a triple intersection big enough to hold a face.
 */
const CX = 200;
const CY = 200;
const R = 118;
const CENTRE_D = 68;

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
 * circle's exclusive lune and belongs to one track unambiguously. Checked: at
 * this distance a label centre is 53 units inside its own circle and 166 from
 * either of the others, which are 118 across — comfortably outside both.
 */
const R_LABEL = CENTRE_D + R * 0.45;

/**
 * The portrait's circle, at the triple intersection.
 *
 * That region is a curved triangle, not a circle: from the centre it reaches 50
 * units towards each gap and 68 towards each circle centre. 46 is the largest
 * circle that stays inside it on every bearing.
 */
const R_PORTRAIT = 46;

/** How far a flood grows. Covers the furthest viewport corner with room over. */
const FLOOD_SCALE = 20;

/** How long the pigment takes to reach the edge of the screen. */
const FLOOD_RISE = 700;

/**
 * How long a tap holds the flood before the route changes. The rise is 700ms,
 * so the pigment reaches the edge and then sits there for another 300ms before
 * the destination — which uses that same pigment as its ground — arrives.
 * The owner set this to a second; do not shorten it.
 */
const BEAM_HOLD = 1000;

/**
 * How long the pigment takes to draw back into its circle once nothing is lit.
 *
 * Quicker than the rise on purpose. Opening is the interesting direction and
 * wants to be watched; closing is the visitor having moved on, and a slow
 * close reads as the page being slow to let go.
 */
const FLOOD_FALL = 540;

/**
 * The ground of the composition — its overlaps at rest, and its middle.
 *
 * Written out rather than read from the theme because it is painted *over*
 * pigment as an opaque colour — `--color-void` is available here, but a literal
 * makes it obvious at the call site that this region is being blacked out
 * rather than left unpainted.
 */
const VOID = "#050505";

/** How the seven regions cross between their own colours and the lit one. */
const FILL_SHIFT = "fill 380ms ease-out";

/**
 * The three lenses where two circles meet.
 *
 * 🔴 **At rest every overlap is black — no pigment, no blend, no third
 * colour.** The owner's call, and it is the whole reason the regions are
 * painted explicitly rather than stacked translucently: three overlapping
 * circles with alpha compound, so an overlap is *necessarily* some muddled
 * mixture of its parents and there is no way to ask for nothing there.
 * Painting each region once means an overlap can be the ground.
 *
 * When a track lights, its two lenses take its pigment, so the circle you are
 * pointing at is briefly whole. That is the honest reading of what the flood
 * is doing — this circle is becoming the page — and a circle that opened out
 * while keeping two bites taken out of it would contradict it.
 *
 * The middle stays black throughout; see the note on the element itself.
 */
const PAIRS: ReadonlyArray<{ clip: TrackId; at: TrackId }> = [
  { clip: "scholarly", at: "creative" },
  { clip: "creative", at: "professional" },
  { clip: "professional", at: "scholarly" },
];

/** The centre is a fourth focus target, but it lights nothing and colours nothing. */
export type Focus = TrackId | "hub" | null;

function centreOf(track: TrackId) {
  const rad = (VENN[track] * Math.PI) / 180;
  return { x: CX + CENTRE_D * Math.cos(rad), y: CY + CENTRE_D * Math.sin(rad) };
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
          </defs>

          {/* Every region is painted exactly once, back to front: the three
              circles, then the three lenses over them, then the middle over
              those. Nothing is layered translucently, so no region's colour is
              an accident of what happens to be underneath it. */}
          <g style={{ animation: "fade-in 700ms ease-out 860ms both" }}>
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

            {/* The middle needs no element of its own, in either state. It
                lies inside all three of these lenses, so it is black when they
                are black and takes the pigment when they take it. */}
            {PAIRS.map(({ clip, at }) => {
              const c = centreOf(at);
              return (
                <circle
                  key={`${clip}-${at}`}
                  cx={c.x}
                  cy={c.y}
                  r={R}
                  clipPath={`url(#venn-${clip})`}
                  className="pointer-events-none"
                  style={{ fill: litFill ?? VOID, transition: FILL_SHIFT }}
                />
              );
            })}
          </g>

          {/* Outlines last, so they read over every region boundary. Each is
              drawn on rather than faded in, one after another. */}
          {TRACKS.map((track, i) => {
            const c = centreOf(track.id);
            return (
              <circle
                key={track.id}
                cx={c.x}
                cy={c.y}
                r={R}
                fill="none"
                stroke="rgb(242, 239, 233)"
                strokeWidth={1.1}
                pathLength={1}
                strokeDasharray={1}
                className="pointer-events-none"
                // Held at full weight even when another track is lit. Once one
                // pigment has taken every region these three lines are the
                // only thing keeping the composition legible, and fading two
                // of them would leave a plain coloured screen with one circle
                // drawn on it.
                strokeOpacity={0.75}
                style={{
                  animation: `plot-stroke 900ms cubic-bezier(0.65, 0, 0.35, 1) ${200 + i * 220}ms both`,
                }}
              />
            );
          })}
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
                {dict.tracks[track.id].title}
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
            animation: "fade-in 500ms ease-out 1700ms both",
            width: `${(R_PORTRAIT * 2 * 100) / 400}%`,
            height: `${(R_PORTRAIT * 2 * 100) / 400}%`,
            transform: `translate(-50%, -50%) scale(${focus === "hub" ? 1.07 : 1})`,
          }}
          className={`group absolute top-1/2 left-1/2 flex items-center justify-center overflow-hidden rounded-full border bg-void transition-[transform,border-color] duration-300 ease-out ${
            focus === "hub" ? "border-bone" : "border-bone/35"
          }`}
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
