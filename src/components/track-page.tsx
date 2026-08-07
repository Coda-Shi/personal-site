import { SiteShell } from "@/components/site-shell";
import { TRACK_CLASSES, type Entry, type Track } from "@/lib/content";

export function EntryList({ entries }: { entries: Entry[] }) {
  return (
    <div className="mt-12 space-y-10">
      {entries.map((entry) => (
        <article key={`${entry.org}-${entry.period}`} className="border-t border-rule pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2 className="font-display text-2xl leading-tight tracking-tight">{entry.org}</h2>
            <span className="label whitespace-nowrap text-ash">{entry.period}</span>
          </div>
          {entry.unit ? <p className="mt-1 text-sm text-ash">{entry.unit}</p> : null}
          <p className="mt-2 text-sm font-medium">
            {entry.role}
            <span className="text-ash"> · {entry.location}</span>
          </p>
          <ul className="mt-4 space-y-2">
            {entry.detail.map((line) => (
              <li key={line} className="text-sm leading-relaxed text-graphite">
                {line}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

export function TrackPage({ track, children }: { track: Track; children?: React.ReactNode }) {
  const c = TRACK_CLASSES[track.id];

  return (
    <SiteShell>
      <header>
        <p aria-hidden="true" className={`font-display text-6xl leading-none ${c.text}`}>
          {track.glyph}
        </p>
        <h1 className="mt-4 font-display text-5xl leading-none font-light tracking-tight md:text-6xl">
          {track.title}
        </h1>
        <span aria-hidden="true" className={`mt-6 block h-px w-24 ${c.bg}`} />
        <p className="mt-6 max-w-xl text-base leading-relaxed text-graphite">{track.lede}</p>
      </header>

      <EntryList entries={track.entries} />
      {children}
    </SiteShell>
  );
}
