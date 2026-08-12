"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
// Imported rather than referenced by public/ path: Next puts a content hash in
// the emitted filename, so replacing the photograph can never leave the image
// optimiser serving the previous one off a cached URL. It also supplies the
// intrinsic dimensions.
import portrait from "@/assets/portrait.png";
import { SymbolField } from "@/components/symbol-field";
import { TrackMark } from "@/components/track-mark";
import { TRACKS, TRACK_ARCS, TRACK_CLASSES, type TrackId } from "@/lib/content";
import type { Dictionary, Locale } from "@/lib/i18n";

const CX = 200;
const CY = 200;
const R_OUTER = 172;
const R_INNER = 72;
/**
 * Not the mid-radius, which is where it started and where it did not fit.
 *
 * A label block is axis-aligned, so at Scholarly's 270° only its height eats
 * into the ring — but at Professional's 30° its *width* projects onto the
 * radius too, and "PROFESSIONAL" pushed the block's far corner 24px past the
 * outer arc. The ring is only 100 units thick, which is not enough for a wide
 * box set on a diagonal, so the blocks pull in instead.
 *
 * The trade is against type size, and it has been walked twice: 9px cleared
 * easily but read as too small, 10.5px is the size worth having, and at that
 * size "PROFESSIONAL" measures 126px of ink and needs the radius down here.
 */
const R_LABEL = 99;

// The bezel. Ticks sit outside the ring the way they do on an astrolabe or a
// vernier scale — classical instrument language, drawn with absolute geometry.
const R_TICK_OUT = 196;
const R_TICK_MINOR = 189;
const R_TICK_MAJOR = 181;

/** The hub is a fourth focus target, but it lights nothing and colours nothing. */
export type Focus = TrackId | "hub" | null;

function polar(radius: number, degrees: number) {
  const rad = (degrees * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

// One 120° slice of the ring, minus a small gap at each end so the three read
// as three rather than as one disc with lines drawn on it.
function annularSector(start: number, end: number) {
  const o1 = polar(R_OUTER, start);
  const o2 = polar(R_OUTER, end);
  const i2 = polar(R_INNER, end);
  const i1 = polar(R_INNER, start);
  const large = end - start > 180 ? 1 : 0;
  return [
    `M ${o1.x.toFixed(2)} ${o1.y.toFixed(2)}`,
    `A ${R_OUTER} ${R_OUTER} 0 ${large} 1 ${o2.x.toFixed(2)} ${o2.y.toFixed(2)}`,
    `L ${i2.x.toFixed(2)} ${i2.y.toFixed(2)}`,
    `A ${R_INNER} ${R_INNER} 0 ${large} 0 ${i1.x.toFixed(2)} ${i1.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

// 120 minor ticks and 24 major ones as a single path — 144 separate <line>
// elements would be 144 nodes for something that never needs to be addressed
// individually.
function tickRing() {
  const segments: string[] = [];
  for (let a = 0; a < 360; a += 3) {
    const inner = a % 15 === 0 ? R_TICK_MAJOR : R_TICK_MINOR;
    const p1 = polar(inner, a);
    const p2 = polar(R_TICK_OUT, a);
    segments.push(`M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} L ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`);
  }
  return segments.join(" ");
}

const TICKS = tickRing();

function labelPosition(mid: number) {
  const p = polar(R_LABEL, mid);
  return { left: `${(p.x / 400) * 100}%`, top: `${(p.y / 400) * 100}%` };
}

// Focus is owned by the page rather than by the disc: lighting a sector also
// has to clear the intro copy out of the beam's way, and that copy is a sibling.
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

  /** True whenever something is lit and it is not this track. */
  const dimmed = (id: TrackId) => focus !== null && focus !== id;

  return (
    <>
      {/* The pigment does not flood the whole page — it fires out of its own
          120° sector, aligned exactly with that wedge's edges, so the disc
          reads as an emitter rather than a swatch. A conic-gradient gives an
          exact angular slice; clip-path would need the arc approximated by
          hand. The half-degree ramps at each edge only stop the boundary
          aliasing.

          It also previews the destination: each track page uses this colour as
          its ground, so the beam widening into a full page is the transition,
          not decoration. */}
      {TRACKS.map((track) => {
        const arc = TRACK_ARCS[track.id];
        const span = arc.end - arc.start;
        // conic-gradient measures from 12 o'clock; the sector angles measure
        // from 3 o'clock. Hence the 90° offset.
        const from = arc.start + 90;
        const pigment = TRACK_CLASSES[track.id].cssVar;
        return (
          <span
            key={track.id}
            aria-hidden="true"
            className="pointer-events-none fixed top-1/2 left-1/2 -z-10 block aspect-square w-[240vmax] rounded-full transition-transform duration-700 ease-out"
            style={{
              background: `conic-gradient(from ${from - 0.5}deg at 50% 50%, transparent 0deg, ${pigment} 0.5deg, ${pigment} ${span + 0.5}deg, transparent ${span + 1}deg)`,
              transform: `translate(-50%, -50%) scale(${focus === track.id ? 1 : 0})`,
            }}
          />
        );
      })}

      {TRACKS.map((track) => (
        <SymbolField key={track.id} track={track.id} active={focus === track.id} />
      ))}

      <div
        className="relative mx-auto aspect-square w-full max-w-[min(56vh,30rem)]"
        onMouseLeave={() => setFocus(null)}
      >
        <svg viewBox="0 0 400 400" className="size-full" aria-hidden="true">
          {/* A conic wedge converges on the centre, so without this the beam
              squeezes out from behind the hub and its apex sits on the Coda
              circle. Filling the inner disc with the page ground hides that
              apex: the beam now appears to leave the sector's own inner arc.
              It also shapes the grow animation for free — the wedge stays
              completely hidden until it clears this radius. */}
          <circle cx={CX} cy={CY} r={R_INNER} fill="var(--color-void)" />

          {/* The bezel is plotted before anything is drawn onto it. */}
          <path
            d={TICKS}
            fill="none"
            stroke="rgba(242, 239, 233, 0.24)"
            strokeWidth={0.6}
            style={{ animation: "fade-in 600ms ease-out 150ms both" }}
          />

          {TRACKS.map((track, i) => {
            const arc = TRACK_ARCS[track.id];
            const drawDelay = 350 + i * 180;
            return (
              <path
                key={track.id}
                d={annularSector(arc.start, arc.end)}
                fill={TRACK_CLASSES[track.id].cssVar}
                stroke="rgba(242, 239, 233, 0.45)"
                strokeWidth={1.1}
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray={1}
                className="cursor-pointer transition-opacity duration-500 ease-out"
                style={{
                  // Safe to set inline: the entry animations touch
                  // stroke-dashoffset and fill-opacity, never opacity, so
                  // animation fill-mode does not override this.
                  opacity: dimmed(track.id) ? 0.28 : 1,
                  animation: `plot-stroke 700ms cubic-bezier(0.65, 0, 0.35, 1) ${drawDelay}ms both, ink-in 500ms ease-out ${drawDelay + 700}ms both`,
                }}
                onMouseEnter={() => setFocus(track.id)}
                onClick={() => router.push(`/${lang}/${track.id}`)}
              />
            );
          })}
        </svg>

        {/* The labels are the real links: they carry the accessible name, they
            work without JavaScript, and focusing one lights the same beam a
            hover does. The paths above are a pointer-only enhancement.

            The dim lives on an inner span, not on the Link. The Link's entry
            animation animates opacity with fill-mode `both`, and an animation
            fill wins over inline style — setting opacity on the Link itself
            would silently do nothing. */}
        {TRACKS.map((track, i) => (
          <Link
            key={track.id}
            href={`/${lang}/${track.id}`}
            style={{
              ...labelPosition(TRACK_ARCS[track.id].mid),
              animation: `fade-in 500ms ease-out ${1250 + i * 150}ms both`,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            onMouseEnter={() => setFocus(track.id)}
            onFocus={() => setFocus(track.id)}
            onBlur={() => setFocus(null)}
          >
            <span
              className="flex flex-col items-center gap-1 text-center transition-opacity duration-500 ease-out"
              style={{ opacity: dimmed(track.id) ? 0.3 : 1 }}
            >
              <TrackMark track={track} className="font-display text-3xl leading-none md:text-4xl" />
              {/* Inline rather than a utility: this has to beat `.label`'s own
                  font-size, and two utilities of equal specificity would be
                  decided by whichever Tailwind happened to emit last. */}
              <span className="label" style={{ fontSize: "10.5px", letterSpacing: "0.13em" }}>
                {dict.tracks[track.id].title}
              </span>
            </span>
          </Link>
        ))}

        {/* The hub carries no pigment and no glyph — see D9. Hovering it lights
            nothing and dims all three sectors: the private self is reached by
            turning the colour off, not by adding another one. */}
        <Link
          href={`/${lang}/coda`}
          aria-label={dict.hub.ariaLabel}
          style={{
            animation: "fade-in 500ms ease-out 1700ms both",
            transform: `translate(-50%, -50%) scale(${focus === "hub" ? 1.07 : 1})`,
          }}
          className={`group absolute top-1/2 left-1/2 flex size-[30%] items-center justify-center overflow-hidden rounded-full border bg-void transition-[transform,border-color] duration-300 ease-out ${
            focus === "hub" ? "border-bone" : "border-bone/35"
          }`}
          onMouseEnter={() => setFocus("hub")}
          onFocus={() => setFocus("hub")}
          onBlur={() => setFocus(null)}
        >
          {/* The face is the resting state and the words arrive on approach.
              At 120px there is not room for a portrait and two lines of type
              at once — overlaying them makes both worse — and the name is
              already in the footer nav and in this link's accessible name, so
              nothing is lost by letting the photograph speak first.

              In colour, and this is not an aesthetic call. A black-and-white
              portrait of a living person reads as a funeral portrait to
              Chinese viewers, and half this site is Chinese. Do not tone it to
              bone on D9 grounds: what D9 asks of the hub is the absence of the
              three pigments, and a photograph is not a flat field competing
              with them. See scripts/hub-portrait.py. */}
          <Image
            src={portrait}
            alt=""
            priority
            className="absolute inset-0 size-full object-cover transition-opacity duration-500 ease-out"
            style={{ opacity: focus === "hub" ? 0.28 : 0.95 }}
          />
          <span
            className="relative flex flex-col items-center gap-1 transition-opacity duration-500 ease-out"
            style={{ opacity: focus === "hub" ? 1 : 0 }}
          >
            <span className="font-display text-2xl italic md:text-3xl">{dict.hub.name}</span>
            <span className="label text-bone">{dict.hub.qualifier}</span>
          </span>
        </Link>
      </div>
    </>
  );
}
