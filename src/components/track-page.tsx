import { SiteShell } from "@/components/site-shell";
import { TrackMark } from "@/components/track-mark";
import { TRACK_CLASSES, type CvRecord, type Entry, type Track } from "@/lib/content";
import { getDictionary, localise, type Locale } from "@/lib/i18n";

// Every surface below sits on a ground that changes per route, so nothing here
// hardcodes a colour — text and rules are bone at varying opacity, which
// composites correctly over black or over any of the three pigments.
/**
 * One entry's masthead: who, when, what, where. Identical whether or not the
 * detail below it is folded away, so the two modes stay the same document.
 */
function EntryHead({ entry }: { entry: Entry }) {
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 className="font-display text-2xl leading-tight tracking-tight">{entry.org}</h2>
        <span className="label whitespace-nowrap text-bone/55">{entry.period}</span>
      </div>
      {entry.unit ? <p className="mt-1 text-sm text-bone/55">{entry.unit}</p> : null}
      <p className="mt-2 text-sm font-medium">
        {entry.role}
        <span className="text-bone/55"> · {entry.location}</span>
      </p>
    </>
  );
}

function EntryDetail({ entry }: { entry: Entry }) {
  return (
    <ul className="mt-4 space-y-2">
      {entry.detail.map((line) => (
        <li key={line} className="text-sm leading-relaxed text-bone/75">
          {line}
        </li>
      ))}
    </ul>
  );
}

/**
 * The track pages fold each entry's detail away; /cv does not.
 *
 * A track page is for deciding whether to read further, and a wall of bullets
 * is the wrong shape for that — folded, the page becomes a list of where he has
 * been, at a glance. The CV is the opposite: it exists to be read straight
 * through, and something you have to click eighteen times is not a CV.
 *
 * Built on <details>, not on state. It opens without JavaScript, it is
 * keyboard-operable and announced correctly for free, and the browser's own
 * find-in-page opens a folded section to reveal a match — none of which a
 * hand-rolled toggle gets without work.
 */
export function EntryList({
  entries,
  lang,
  collapsible = false,
}: {
  entries: Entry[];
  lang: Locale;
  collapsible?: boolean;
}) {
  const overrides = getDictionary(lang).entries;

  return (
    <div className={collapsible ? "mt-12" : "mt-12 space-y-10"}>
      {entries.map((original) => {
        // Keyed on the stable id, not on the rendered text — org and period are
        // themselves translated.
        const entry = localise(original, overrides);

        if (!collapsible) {
          return (
            <article key={original.id} className="border-t border-bone/20 pt-6">
              <EntryHead entry={entry} />
              <EntryDetail entry={entry} />
            </article>
          );
        }

        return (
          <details key={original.id} className="entry group border-t border-bone/20">
            {/* The marker is drawn in CSS rather than left to the browser: the
                default triangle sits on the first line of a multi-line summary
                and cannot be positioned. */}
            <summary className="cursor-pointer list-none py-6 pr-9">
              <EntryHead entry={entry} />
            </summary>
            <div className="pb-6">
              <EntryDetail entry={entry} />
            </div>
          </details>
        );
      })}
    </div>
  );
}

/**
 * Education and advocacy render identically and appeared verbatim on three
 * pages. Once each of them also has to look up a translation, three copies is
 * three places to get it wrong.
 */
export function RecordList({
  items,
  overrides,
}: {
  items: CvRecord[];
  overrides: Record<string, Partial<CvRecord>>;
}) {
  return (
    <div className="mt-6 space-y-8">
      {items.map((original) => {
        const item = localise(original, overrides);
        return (
          <article key={original.id} className="border-t border-bone/20 pt-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <h3 className="font-display text-2xl leading-tight tracking-tight">{item.org}</h3>
              <span className="label whitespace-nowrap text-bone/55">{item.period}</span>
            </div>
            <p className="mt-2 text-sm font-medium">
              {item.role}
              <span className="text-bone/55"> · {item.location}</span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-bone/75">{item.detail}</p>
          </article>
        );
      })}
    </div>
  );
}

export function TrackPage({
  lang,
  track,
  children,
  /**
   * Creative places its two entries by hand — one under the studio card, one
   * inside the music section — so it opts out and renders them itself.
   */
  ownEntries = false,
}: {
  lang: Locale;
  track: Track;
  children?: React.ReactNode;
  ownEntries?: boolean;
}) {
  const copy = getDictionary(lang).tracks[track.id];

  return (
    <SiteShell lang={lang} ground={TRACK_CLASSES[track.id].cssVar}>
      <header>
        <p className="font-display text-6xl leading-none md:text-7xl">
          <TrackMark track={track} />
        </p>
        <h1 className="mt-4 font-display text-5xl leading-none font-light tracking-tight md:text-6xl">
          {copy.title}
        </h1>
        <span aria-hidden="true" className="mt-6 block h-px w-24 bg-bone/50" />
        {/* Italic marks the lede as a different voice from the entries below.
            Cormorant has a real italic; Chinese has none, so the :lang(zh)
            rule in globals.css swaps this to fangsong upright instead of
            letting the browser shear the glyphs. */}
        <p className="mt-6 max-w-xl font-display text-xl leading-relaxed italic text-bone/80 md:text-2xl">
          {copy.lede}
        </p>
      </header>

      {ownEntries ? null : <EntryList entries={track.entries} lang={lang} collapsible />}
      {children}
    </SiteShell>
  );
}
