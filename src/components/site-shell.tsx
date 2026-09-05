import Link from "next/link";
import { ViewTransition } from "react";
import { LanguageToggle } from "@/components/language-toggle";
import { SymbolField } from "@/components/symbol-field";
import { NAME, type TrackId } from "@/lib/content";
import { getDictionary, type Locale } from "@/lib/i18n";

/**
 * The frame every inner page sits in.
 *
 * `ground` paints the whole viewport in a track's pigment. It is a fixed layer
 * rather than a background on <main> so that short pages do not leave the void
 * showing below the fold.
 *
 * `field` puts that track's symbol field behind the column, at rest. On the
 * home page the field appears when the circle is lit and is the whole
 * texture of the flood; arriving at the track page used to throw it away at
 * the door, and the page you had just been shown a preview of turned out to be
 * a plain column on a plain colour. It now stays — fainter, not breathing, and
 * masked out from under the column on wide screens so it lives in the margins
 * like marginalia. Same component, same board, same positions, so the dissolve
 * from the lit home page lands every symbol exactly where it already was.
 *
 * The whole thing is one `<ViewTransition>` with an exit and no enter: a page
 * you leave dissolves out over the page you are arriving at, which is already
 * live underneath. That is the same as a cross-fade for opaque pages, and it
 * is *better* than one where pigment is concerned — two half-transparent
 * layers of the same colour over black dip to 75% brightness at the midpoint,
 * where one layer fading over an opaque copy of itself never moves.
 */
export function SiteShell({
  lang,
  children,
  ground,
  field,
  ownEntrance = false,
}: {
  lang: Locale;
  children: React.ReactNode;
  ground?: string;
  field?: TrackId;
  /** The page staggers its own header; the shell then leaves the body alone. */
  ownEntrance?: boolean;
}) {
  const dict = getDictionary(lang);

  return (
    <ViewTransition exit="page" default="none">
      {/* One plain block for the transition to capture as a single image. Not
          `display: contents` — that has no box and cannot be snapshotted — and
          nothing transformed, because a transform on an ancestor would become
          the containing block for the fixed layers inside. */}
      <div className="flex min-h-full flex-1 flex-col">
        {ground ? (
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 -z-20"
            style={{ backgroundColor: ground }}
          />
        ) : null}
        {field ? <SymbolField track={field} ground /> : null}
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10 md:px-10 md:py-14">
          <Link
            href={`/${lang}`}
            className="link-line label w-fit text-bone/60 transition-colors hover:text-bone"
            style={{ animation: "rise-in 600ms ease-out both" }}
          >
            ← {NAME}
          </Link>
          <div
            className="mt-10 flex-1 md:mt-14"
            style={ownEntrance ? undefined : { animation: "rise-in 700ms ease-out 120ms both" }}
          >
            {children}
          </div>
          <footer
            className="mt-20 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-bone/20 pt-6"
            style={{ animation: "rise-in 700ms ease-out 480ms both" }}
          >
            <Link
              href={`/${lang}/cv`}
              className="link-line label text-bone/60 transition-colors hover:text-bone"
            >
              {dict.nav.cv}
            </Link>
            <Link
              href={`/${lang}/coda`}
              className="link-line label text-bone/60 transition-colors hover:text-bone"
            >
              {dict.nav.coda}
            </Link>
            <LanguageToggle lang={lang} label={dict.switchTo} />
          </footer>
        </main>
      </div>
    </ViewTransition>
  );
}
