"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TrackMark } from "@/components/track-mark";
import { TRACKS, TRACK_ARCS, TRACK_CLASSES, type TrackId } from "@/lib/content";

const CX = 200;
const CY = 200;
const R_OUTER = 172;
const R_INNER = 72;
const R_LABEL = (R_OUTER + R_INNER) / 2;

// The bezel. Ticks sit outside the ring the way they do on an astrolabe or a
// vernier scale — classical instrument language, drawn with absolute geometry.
const R_TICK_OUT = 196;
const R_TICK_MINOR = 189;
const R_TICK_MAJOR = 181;

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

export function TrinityDisc() {
  const router = useRouter();
  const [active, setActive] = useState<TrackId | null>(null);

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
              transform: `translate(-50%, -50%) scale(${active === track.id ? 1 : 0})`,
            }}
          />
        );
      })}

      <div
        className="relative mx-auto aspect-square w-full max-w-[min(56vh,30rem)]"
        onMouseLeave={() => setActive(null)}
      >
        <svg viewBox="0 0 400 400" className="size-full" aria-hidden="true">
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
            const isActive = active === track.id;
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
                  opacity: active !== null && !isActive ? 0.4 : 1,
                  animation: `plot-stroke 700ms cubic-bezier(0.65, 0, 0.35, 1) ${drawDelay}ms both, ink-in 500ms ease-out ${drawDelay + 700}ms both`,
                }}
                onMouseEnter={() => setActive(track.id)}
                onClick={() => router.push(`/${track.id}`)}
              />
            );
          })}
        </svg>

        {/* The labels are the real links: they carry the accessible name, they
            work without JavaScript, and focusing one triggers the same beam a
            hover does. The paths above are a pointer-only enhancement. */}
        {TRACKS.map((track, i) => (
          <Link
            key={track.id}
            href={`/${track.id}`}
            style={{
              ...labelPosition(TRACK_ARCS[track.id].mid),
              animation: `fade-in 500ms ease-out ${1250 + i * 150}ms both`,
            }}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 text-center"
            onMouseEnter={() => setActive(track.id)}
            onFocus={() => setActive(track.id)}
            onBlur={() => setActive(null)}
          >
            <TrackMark
              track={track}
              className="font-display text-3xl leading-none md:text-4xl"
            />
            <span className="label">{track.title}</span>
          </Link>
        ))}

        {/* The hub carries no pigment and no glyph — see D9. */}
        <Link
          href="/coda"
          aria-label="Coda himself — writer and advocate"
          style={{ animation: "fade-in 500ms ease-out 1700ms both" }}
          className="group absolute top-1/2 left-1/2 flex size-[30%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-full border border-bone/35 bg-void transition-colors duration-300 hover:border-bone"
        >
          <span className="font-display text-2xl italic md:text-3xl">Coda</span>
          <span className="label text-bone/55 transition-colors duration-300 group-hover:text-bone">
            himself
          </span>
        </Link>
      </div>
    </>
  );
}
