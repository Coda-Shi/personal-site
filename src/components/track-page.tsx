import { SiteShell } from "@/components/site-shell";
import { TrackMark } from "@/components/track-mark";
import { TRACK_CLASSES, type Entry, type Track } from "@/lib/content";
import { getDictionary, type Locale } from "@/lib/i18n";

// Every surface below sits on a ground that changes per route, so nothing here
// hardcodes a colour — text and rules are bone at varying opacity, which
// composites correctly over black or over any of the three pigments.
export function EntryList({ entries }: { entries: Entry[] }) {
  return (
    <div className="mt-12 space-y-10">
      {entries.map((entry) => (
        <article key={`${entry.org}-${entry.period}`} className="border-t border-bone/20 pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2 className="font-display text-2xl leading-tight tracking-tight">{entry.org}</h2>
            <span className="label whitespace-nowrap text-bone/55">{entry.period}</span>
          </div>
          {entry.unit ? <p className="mt-1 text-sm text-bone/55">{entry.unit}</p> : null}
          <p className="mt-2 text-sm font-medium">
            {entry.role}
            <span className="text-bone/55"> · {entry.location}</span>
          </p>
          <ul className="mt-4 space-y-2">
            {entry.detail.map((line) => (
              <li key={line} className="text-sm leading-relaxed text-bone/75">
                {line}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

export function TrackPage({
  lang,
  track,
  children,
}: {
  lang: Locale;
  track: Track;
  children?: React.ReactNode;
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

      <EntryList entries={track.entries} />
      {children}
    </SiteShell>
  );
}
