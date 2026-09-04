import type { Track } from "@/lib/content";

/**
 * Renders a track's mark.
 *
 * The three per-form scales below are not arbitrary and are not
 * interchangeable. A drawn SVG fills its em box; a character occupies maybe
 * 70% of one; and an outline ring lays down far less ink than a solid glyph at
 * the same height. Set them all to the same em and they come out at 38, 50 and
 * 56 units and read as three different sizes. These numbers are tuned so the
 * three marks measure about 50 and, more to the point, look equal.
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
 *
 * `enter` plots the mark on arrival the way the disc is plotted: the drawn
 * strokes are dashed to their own length and drawn on, the coda's ring inks in
 * behind its bars, and the § — a glyph, with no stroke to draw — fades. It is
 * for the top of a track page reached cold. A page reached by navigating from
 * the disc gets its mark by morph instead, and globals.css switches the plot
 * off whenever the document carries `data-navigated` (see NavigationFlag).
 *
 * `name` is a `view-transition-name`, written inline. The mark on the disc and
 * the mark at the top of the track page share one, and the browser pairs them
 * across the navigation: the same object travels from one place to the other.
 * Inline rather than through React's `<ViewTransition name>` — see the note
 * in trinity-disc.tsx on why that pairing never formed here.
 */

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
} as const;

/** Dashed to unit length, so `plot-stroke` draws it whatever its geometry. */
const plotted = { pathLength: 1, strokeDasharray: 1 } as const;

export function TrackMark({
  track,
  className,
  enter = false,
  name,
}: {
  track: Track;
  className?: string;
  enter?: boolean;
  name?: string;
}) {
  const box = `inline-block align-[-0.16em] ${enter ? "plot-mark " : ""}${className ?? ""}`;
  const dash = enter ? plotted : undefined;
  // React hyphenates this to `view-transition-name` on the server and sets it
  // through the CSSOM on the client; `undefined` leaves the property off.
  const travel = { viewTransitionName: name } as React.CSSProperties;

  if (track.mark === "turnstile") {
    return (
      <svg
        {...svgProps}
        role="img"
        aria-label={track.glyphName}
        style={{ width: "1.12em", height: "1.12em", ...travel }}
        className={box}
      >
        {/* Thick stem, thin arms. A serif face modulates its strokes; drawn
            flat, this would read as a different typographic system from the
            § sitting on the next sector. */}
        <line x1="6.2" y1="2.8" x2="6.2" y2="21.2" strokeWidth={1.9} {...dash} />
        <line x1="6.2" y1="9.5" x2="19.6" y2="9.5" strokeWidth={1.05} {...dash} />
        <line x1="6.2" y1="14.5" x2="19.6" y2="14.5" strokeWidth={1.05} {...dash} />
      </svg>
    );
  }

  if (track.mark === "coda") {
    return (
      <svg
        {...svgProps}
        role="img"
        aria-label={track.glyphName}
        style={{ width: "1.18em", height: "1.18em", ...travel }}
        className={box}
      >
        {/* The ring is modulated like a serif capital O — heavy on the
            flanks, thin across the top and bottom — so it is built from two
            ellipses with evenodd rather than stroked, which can only give a
            uniform weight. Butt caps on the bars: the reference has flat ends.

            An outline ring lays down far less ink than a solid glyph, so this
            once measured larger than its neighbours and still read smaller.
            Correcting that overshot the other way — heavy enough that the
            three marks read as blunt — and these are the settled values. */}
        <path
          fill="currentColor"
          stroke="none"
          fillRule="evenodd"
          d="M 4.4 12 A 7.6 8.7 0 1 0 19.6 12 A 7.6 8.7 0 1 0 4.4 12 Z
             M 7.2 12 A 4.8 7.4 0 1 1 16.8 12 A 4.8 7.4 0 1 1 7.2 12 Z"
        />
        <line x1="12" y1="0.7" x2="12" y2="23.3" strokeWidth={1.25} strokeLinecap="butt" {...dash} />
        <line x1="0.5" y1="12" x2="23.5" y2="12" strokeWidth={1.25} strokeLinecap="butt" {...dash} />
      </svg>
    );
  }

  // A character only fills part of its em box, so § came out 36 units tall
  // against the drawn marks' 50 and read as the runt of the three.
  //
  // The scale has to sit on a *nested* element. Put `1.3em` on the same span
  // that carries the size class and it resolves against the parent's font-size
  // instead — 16px from the body, not the 36px the class sets — and the mark
  // comes out smaller than it started.
  return (
    <span
      aria-hidden="true"
      className={`${enter ? "plot-mark plot-glyph " : ""}${className ?? ""}`}
      // An inline element cannot be captured; the browser needs a box.
      style={{ display: "inline-block", ...travel }}
    >
      <span style={{ fontSize: "1.02em" }}>{track.glyph}</span>
    </span>
  );
}
