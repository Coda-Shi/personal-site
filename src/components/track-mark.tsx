import type { Track } from "@/lib/content";

/**
 * Renders a track's mark.
 *
 * Two of the three are drawn rather than set. Cormorant Garamond carries no
 * logic or mathematical notation — every one of ⊨ ∀ ◇ ∴ Λ χ falls through to
 * the generic serif, which means the mark would be Times New Roman on Windows,
 * something else on macOS, and possibly tofu elsewhere. The musical coda sign
 * is absent from essentially every text font. Drawing them makes the marks
 * part of the geometry instead of borrowed characters, and lets their weight
 * be tuned against the disc.
 *
 * § stays as a character: it is a real typographic mark, Cormorant has it, and
 * a printer's mark should be set rather than traced.
 *
 * The SVGs size themselves in `em`, so one text-size class drives every form.
 */

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
} as const;

export function TrackMark({ track, className }: { track: Track; className?: string }) {
  const box = `inline-block align-[-0.16em] ${className ?? ""}`;

  if (track.mark === "turnstile") {
    return (
      <svg
        {...svgProps}
        role="img"
        aria-label={track.glyphName}
        style={{ width: "1.05em", height: "1.05em" }}
        className={box}
      >
        {/* Thick stem, thin arms. A serif face modulates its strokes; drawn
            flat, this would read as a different typographic system from the
            § sitting on the next sector. */}
        <line x1="6.2" y1="2.8" x2="6.2" y2="21.2" strokeWidth={2.4} />
        <line x1="6.2" y1="9.5" x2="19.6" y2="9.5" strokeWidth={1.35} />
        <line x1="6.2" y1="14.5" x2="19.6" y2="14.5" strokeWidth={1.35} />
      </svg>
    );
  }

  if (track.mark === "coda") {
    return (
      <svg
        {...svgProps}
        role="img"
        aria-label={track.glyphName}
        style={{ width: "1.15em", height: "1.15em" }}
        className={box}
      >
        {/* The ring is modulated like a serif capital O — heavy on the
            flanks, thin across the top and bottom — so it is built from two
            ellipses with evenodd rather than stroked, which can only give a
            uniform weight. Flanks run 2.8 units, crown and foot 1.5.
            Butt caps on the bars: the reference has flat ends. */}
        <path
          fill="currentColor"
          stroke="none"
          fillRule="evenodd"
          d="M 4.6 12 A 7.4 8.5 0 1 0 19.4 12 A 7.4 8.5 0 1 0 4.6 12 Z
             M 6.9 12 A 5.1 7.4 0 1 1 17.1 12 A 5.1 7.4 0 1 1 6.9 12 Z"
        />
        <line x1="12" y1="0.9" x2="12" y2="23.1" strokeWidth={1.25} strokeLinecap="butt" />
        <line x1="0.7" y1="12" x2="23.3" y2="12" strokeWidth={1.25} strokeLinecap="butt" />
      </svg>
    );
  }

  return (
    <span aria-hidden="true" className={className}>
      {track.glyph}
    </span>
  );
}
