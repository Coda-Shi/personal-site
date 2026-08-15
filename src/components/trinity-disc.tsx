"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
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
 * Where the label blocks start. It is corrected on mount by
 * useBalancedLabelRadius, so this only has to be close enough that the first
 * layout is sane.
 */
const R_LABEL_START = 112;

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

function labelPosition(mid: number, radius: number) {
  const p = polar(radius, mid);
  return { left: `${(p.x / 400) * 100}%`, top: `${(p.y / 400) * 100}%` };
}

/** Corners of a block's ink, offset from that block's own centre. */
type Offsets = ReadonlyArray<readonly [number, number]>;

/** How far in and how far out one block's ink reaches, if placed at `radius`. */
function radialSpan(offsets: Offsets, mid: number, radius: number) {
  const rad = (mid * Math.PI) / 180;
  const bx = radius * Math.cos(rad);
  const by = radius * Math.sin(rad);
  let lo = Infinity;
  let hi = 0;
  for (const [dx, dy] of offsets) {
    const d = Math.hypot(bx + dx, by + dy);
    if (d < lo) lo = d;
    if (d > hi) hi = d;
  }
  return { lo, hi };
}

// useLayoutEffect on the server is a no-op React warns about, and this is a
// client component that Next still renders server-side.
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Finds the single radius at which all three label blocks sit centred in the
 * ring, and keeps it correct as things change.
 *
 * A hand-set constant cannot do this job, which is why the one that used to
 * live here was wrong. Three things move at once: the blocks are axis-aligned
 * while the constraint is radial, so how much ring a block consumes depends on
 * its angle; the labels are typeset, so their width depends on the language;
 * and the disc scales with the viewport while the type does not, so the ratio
 * between them changes with the window. Measured, the balancing radius wants
 * 108 for English in a short window and 120 for Chinese in a tall one — no
 * constant satisfies both.
 *
 * The old constant was also derived from the wrong shape. It used each block's
 * bounding box, whose corners are empty because the mark and the caption are
 * centred in it, and pulled the blocks inward until the boxes cleared the outer
 * arc. What actually cleared the arc was empty space, and the real type ended
 * up overlapping the hub: at 1280×600 the Creative block's ink reached 10 units
 * inside it. So this measures the two ink boxes, not their container.
 *
 * One radius for all three, not one each: at equal radius the set is
 * rotationally symmetric, which is what reads as balanced. Individually
 * optimal radii would leave the three sitting at visibly different depths.
 */
function useBalancedLabelRadius(
  stage: RefObject<HTMLElement | null>,
  blocks: RefObject<Map<TrackId, HTMLElement>>,
) {
  const [radius, setRadius] = useState(R_LABEL_START);

  useBrowserLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;

    const measure = () => {
      const board = el.getBoundingClientRect();
      if (!board.width) return;
      // The board is 400 viewBox units wide however many CSS pixels that is.
      const unit = 400 / board.width;

      const measured: { mid: number; offsets: Offsets }[] = [];
      for (const [id, block] of blocks.current) {
        const b = block.getBoundingClientRect();
        if (!b.width) continue;
        const bx = b.left + b.width / 2;
        const by = b.top + b.height / 2;
        // Relative to the block's own centre, so these do not depend on the
        // radius — which is what lets the radius be solved for rather than
        // converged on by nudging and re-measuring.
        const offsets: [number, number][] = [];
        for (const ink of Array.from(block.children)) {
          const r = ink.getBoundingClientRect();
          if (!r.width) continue;
          for (const x of [r.left, r.right]) {
            for (const y of [r.top, r.bottom]) {
              offsets.push([(x - bx) * unit, (y - by) * unit]);
            }
          }
        }
        if (offsets.length) measured.push({ mid: TRACK_ARCS[id].mid, offsets });
      }
      if (!measured.length) return;

      // Inner clearance minus outer clearance, taken across all three blocks.
      // Negative means the set is too far in. Strictly increasing in radius,
      // since moving out grows the inner clearance and shrinks the outer one.
      const balance = (r: number) => {
        let lo = Infinity;
        let hi = 0;
        for (const { mid, offsets } of measured) {
          const span = radialSpan(offsets, mid, r);
          lo = Math.min(lo, span.lo);
          hi = Math.max(hi, span.hi);
        }
        return lo - R_INNER - (R_OUTER - hi);
      };

      // Bisection rather than a closed form: `balance` runs through a hypot per
      // corner, so it has no clean inverse. Bracketing by the ring itself also
      // means a pathological measurement can only ever park the labels
      // somewhere inside the ring, never off the disc.
      let low = R_INNER;
      let high = R_OUTER;
      for (let i = 0; i < 24; i += 1) {
        const mid = (low + high) / 2;
        if (balance(mid) < 0) low = mid;
        else high = mid;
      }
      setRadius(Math.round((low + high) * 50) / 100);
    };

    measure();
    // Web fonts arrive after the first layout and Cormorant is appreciably
    // wider than the fallback serif, so a single measurement at mount would
    // size the ring to type the visitor never sees.
    void document.fonts?.ready.then(measure);

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [stage, blocks]);

  return radius;
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
  const stage = useRef<HTMLDivElement>(null);
  const labelBlocks = useRef(new Map<TrackId, HTMLElement>());
  const labelRadius = useBalancedLabelRadius(stage, labelBlocks);

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
        ref={stage}
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
              ...labelPosition(TRACK_ARCS[track.id].mid, labelRadius),
              animation: `fade-in 500ms ease-out ${1250 + i * 150}ms both`,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            onMouseEnter={() => setFocus(track.id)}
            onFocus={() => setFocus(track.id)}
            onBlur={() => setFocus(null)}
          >
            <span
              // The radius is solved from these two children's boxes, so this
              // span must hold nothing but them.
              ref={(node) => {
                if (node) labelBlocks.current.set(track.id, node);
                else labelBlocks.current.delete(track.id);
              }}
              className="flex flex-col items-center gap-1 text-center transition-opacity duration-500 ease-out"
              style={{ opacity: dimmed(track.id) ? 0.3 : 1 }}
            >
              <TrackMark track={track} className="font-display text-3xl leading-none md:text-4xl" />
              {/* Inline rather than a utility: this has to beat `.label`'s own
                  font-size, and two utilities of equal specificity would be
                  decided by whichever Tailwind happened to emit last. */}
              {/* The size is a variable so the English classical treatment can
                  raise it without the two rules racing on equal specificity —
                  Cormorant needs more than 10.5px to hold up. */}
              <span
                className="label"
                style={{ fontSize: "var(--disc-label-size, 10.5px)", letterSpacing: "0.13em" }}
              >
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
