"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
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
 * own. D9 is still satisfied: the centre carries no pigment of its own, it is
 * only where the three happen to meet.
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
 *
 * The ring needed a solver for this (D19) because a 100-unit band could not
 * hold "PROFESSIONAL" at any radius. A lune is not a band; there is room here,
 * and once the constraint is gone a constant is the honest answer.
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

/**
 * How long a tap holds the flood before the route changes. The flood's own
 * transition is 900ms, so the pigment reaches the edge of the screen and then
 * sits there for another 600ms before the destination — which uses that same
 * pigment as its ground — arrives.
 */
const BEAM_HOLD = 1500;

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

  return (
    <>
      {/* The flood is one of these three circles, grown until it covers the
          screen. Not decoration: the destination page uses this pigment as its
          ground (D10), so the circle opening out is the transition.

          Positioned in CSS rather than drawn in the SVG because it has to sit
          behind the symbol field, and the field is a fixed layer. `--disc` is
          the rendered width of the disc, so the offsets are the circle's own
          centre expressed in viewport terms — and the two cannot drift, because
          the disc's own max-width reads the same variable. */}
      {TRACKS.map((track) => {
        const c = centreOf(track.id);
        return (
          <span
            key={track.id}
            aria-hidden="true"
            className="pointer-events-none fixed top-1/2 left-1/2 -z-20 block rounded-full transition-transform duration-[900ms] ease-out"
            style={{
              width: `calc(var(--disc) * ${(2 * R) / 400})`,
              height: `calc(var(--disc) * ${(2 * R) / 400})`,
              backgroundColor: TRACK_CLASSES[track.id].cssVar,
              transform: [
                "translate(-50%, -50%)",
                `translate(calc(var(--disc) * ${(c.x - CX) / 400}), calc(var(--disc) * ${(c.y - CY) / 400}))`,
                `scale(${focus === track.id ? FLOOD_SCALE : 0})`,
              ].join(" "),
            }}
          />
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
          {/* Outlines, with only a breath of pigment in them. Filling the three
              solid does not work on this ground: all three are dark by
              construction — D7 balanced their luminance downward so none of
              them dominates — so two of them over near-black go to mud and the
              overlaps, which are the whole point of a Venn, stop reading. Line
              work is also what the Borromean knot this borrows from is. */}
          {TRACKS.map((track, i) => {
            const c = centreOf(track.id);
            const lit = focus === track.id;
            const draw = 200 + i * 220;
            return (
              <g key={track.id}>
                {/* Fill and stroke are two elements on purpose. The entrance
                    animations carry `fill-mode: both`, which pins whatever
                    property they touch at its end value — so an entrance that
                    animated fill-opacity would nail the fill to solid and the
                    resting 0.2 below would never apply. Each entrance lives on
                    a wrapper and animates plain `opacity`; the state lives on
                    the shape and animates fill-opacity and stroke-opacity.
                    Two elements, two properties, multiplied. */}
                <g style={{ animation: `fade-in 700ms ease-out ${draw + 700}ms both` }}>
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={R}
                    fill={TRACK_CLASSES[track.id].cssVar}
                    className="cursor-pointer"
                    style={{
                      fillOpacity: lit ? 0.55 : dimmed(track.id) ? 0.07 : 0.2,
                      transition: "fill-opacity 500ms ease-out",
                    }}
                    onMouseEnter={() => setFocus(track.id)}
                    onPointerDown={openOnTouch(track.id)}
                    onClick={() => {
                      if (!leaving.current) router.push(`/${lang}/${track.id}`);
                    }}
                  />
                </g>
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={R}
                  fill="none"
                  stroke="rgb(242, 239, 233)"
                  strokeWidth={1.1}
                  pathLength={1}
                  strokeDasharray={1}
                  className="pointer-events-none"
                  style={{
                    strokeOpacity: lit ? 0 : dimmed(track.id) ? 0.3 : 0.6,
                    transition: "stroke-opacity 260ms ease-out",
                    animation: `plot-stroke 900ms cubic-bezier(0.65, 0, 0.35, 1) ${draw}ms both`,
                  }}
                />
              </g>
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
            three at once. It still carries no pigment of its own, which is what
            D9 asks of the centre; it is only where the three meet.

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
