"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TRACKS, TRACK_ARCS, TRACK_CLASSES, type TrackId } from "@/lib/content";

const CX = 200;
const CY = 200;
const R_OUTER = 190;
const R_INNER = 78;
const R_LABEL = (R_OUTER + R_INNER) / 2;

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
          reads as an emitter rather than a swatch. A conic-gradient with hard
          stops gives an exact angular slice; clip-path would need the arc
          approximated by hand. The half-degree ramps at each edge exist only
          to stop the boundary aliasing.

          It still previews the destination: each track page uses this colour
          as its ground, so the beam widening into a full page is the
          transition, not decoration. */}
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
          {TRACKS.map((track) => {
            const arc = TRACK_ARCS[track.id];
            const isActive = active === track.id;
            return (
              <path
                key={track.id}
                d={annularSector(arc.start, arc.end)}
                fill={TRACK_CLASSES[track.id].cssVar}
                stroke="rgba(242, 239, 233, 0.3)"
                strokeWidth={1}
                className="cursor-pointer transition-opacity duration-500 ease-out"
                style={{ opacity: active !== null && !isActive ? 0.4 : 1 }}
                onMouseEnter={() => setActive(track.id)}
                onClick={() => router.push(`/${track.id}`)}
              />
            );
          })}
        </svg>

        {/* The labels are the real links: they carry the accessible name, they
            work without JavaScript, and focusing one triggers the same flood a
            hover does. The paths above are a pointer-only enhancement. */}
        {TRACKS.map((track) => (
          <Link
            key={track.id}
            href={`/${track.id}`}
            style={labelPosition(TRACK_ARCS[track.id].mid)}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 text-center"
            onMouseEnter={() => setActive(track.id)}
            onFocus={() => setActive(track.id)}
            onBlur={() => setActive(null)}
          >
            <span aria-hidden="true" className="font-display text-3xl leading-none md:text-4xl">
              {track.glyph}
            </span>
            <span className="label">{track.title}</span>
          </Link>
        ))}

        {/* The hub carries no pigment and no glyph — see D9. */}
        <Link
          href="/coda"
          aria-label="Coda himself — writer and advocate"
          className="group absolute top-1/2 left-1/2 flex size-[32%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-full border border-bone/35 bg-void transition-colors duration-300 hover:border-bone"
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
