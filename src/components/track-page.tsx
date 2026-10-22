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

function Bullets({ lines, className }: { lines: string[]; className: string }) {
  return (
    <ul className={`space-y-2 ${className}`}>
      {lines.map((line) => (
        <li key={line} className="text-sm leading-relaxed text-bone/75">
          {line}
        </li>
      ))}
    </ul>
  );
}

/**
 * An entry with several posts opens into one block per post, each with its
 * title and dates on one line, the unit under it, and its own record — set
 * off by a hairline at the left so the two records do not read as one list.
 */
function EntryDetail({ entry }: { entry: Entry }) {
  if (!entry.posts) return <Bullets lines={entry.detail} className="mt-4" />;
  return (
    <div className="mt-5 space-y-6">
      {entry.posts.map((post) => (
        <section key={post.title} className="border-l border-bone/25 pl-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h3 className="text-sm font-medium">{post.title}</h3>
            <span className="label whitespace-nowrap text-bone/55">{post.period}</span>
          </div>
          {post.unit || post.location ? (
            <p className="mt-0.5 text-sm text-bone/55">
              {[post.unit, post.location].filter(Boolean).join(" · ")}
            </p>
          ) : null}
          <Bullets lines={post.detail} className="mt-3" />
        </section>
      ))}
    </div>
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
  const dict = getDictionary(lang);
  const shown = entries.filter((e) => !e.secondary);
  const folded = entries.filter((e) => e.secondary);

  const render = (original: Entry) => {
    // Keyed on the stable id, not on the rendered text — org and period are
    // themselves translated.
    const entry = localise(original, dict.entries);

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
  };

  const spacing = collapsible ? "" : "space-y-10";
  return (
    <div className={`mt-12 ${spacing}`}>
      {shown.map(render)}
      {folded.length ? (
        <More label={dict.headings.moreExperience} count={folded.length} bodyClassName={spacing}>
          {folded.map(render)}
        </More>
      ) : null}
    </div>
  );
}

/**
 * The level under a section's main record: entries kept in full but not shown
 * by default, folded together behind one line at the end of the section.
 * Opened, each entry inside behaves exactly as the ones above it — folded on a
 * track page, flat on /cv. The owner's hierarchy, 2026-10-22 (D50).
 *
 * <details>, for the reasons the entries are (D25) — above all that the
 * browser's find-in-page opens it to reveal a match, so nothing in it is
 * hidden from someone looking for it.
 */
function More({
  label,
  count,
  bodyClassName,
  children,
}: {
  label: string;
  count: number;
  bodyClassName: string;
  children: React.ReactNode;
}) {
  return (
    <details className="more border-t border-bone/20">
      <summary className="label cursor-pointer list-none py-5 pr-9 text-bone/55 transition-colors hover:text-bone/85">
        {label}
        <span className="text-bone/35"> · {count}</span>
      </summary>
      <div className={bodyClassName}>{children}</div>
    </details>
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
  lang,
}: {
  items: CvRecord[];
  overrides: Record<string, Partial<CvRecord>>;
  lang: Locale;
}) {
  const shown = items.filter((i) => !i.secondary);
  const folded = items.filter((i) => i.secondary);

  const render = (original: CvRecord) => {
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
        {/* Done under this record, not beside it — set off by the same
            hairline as an entry's posts. */}
        {item.attached?.map((sub) => (
          <section key={sub.org} className="mt-5 border-l border-bone/25 pl-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <h4 className="text-sm font-medium">{sub.org}</h4>
              <span className="label whitespace-nowrap text-bone/55">{sub.period}</span>
            </div>
            <p className="mt-0.5 text-sm text-bone/55">
              {sub.role} · {sub.location}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-bone/75">{sub.detail}</p>
          </section>
        ))}
      </article>
    );
  };

  return (
    <div className="mt-6 space-y-8">
      {shown.map(render)}
      {folded.length ? (
        <More
          label={getDictionary(lang).headings.moreExperience}
          count={folded.length}
          bodyClassName="space-y-8"
        >
          {folded.map(render)}
        </More>
      ) : null}
    </div>
  );
}

/** The page's entrance, one beat at a time: mark, title, rule, lede, body. */
const rise = (delay: number) => ({ animation: `rise-in 700ms ease-out ${delay}ms both` });

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
    <SiteShell lang={lang} ground={TRACK_CLASSES[track.id].cssVar} field={track.id} ownEntrance>
      <header>
        {/* The mark is the one thing here that also exists on the page you
            came from. Named, it travels: click a circle and its mark leaves
            the disc and settles at the top of this column, the same object in
            two places rather than two objects that happen to match. Reached
            cold, with nothing to travel from, it draws itself instead
            (`enter`). Never both — see NavigationFlag. */}
        <p className="font-display text-6xl leading-none md:text-7xl">
          <TrackMark track={track} enter name="track-mark" />
        </p>
        <h1
          className="mt-4 font-display text-5xl leading-none font-light tracking-tight md:text-6xl"
          style={rise(80)}
        >
          {copy.title}
        </h1>
        {/* Drawn from the left, like the line work on the disc, not faded. */}
        <span
          aria-hidden="true"
          className="mt-6 block h-px w-24 origin-left bg-bone/50"
          style={{ animation: "rule-in 600ms cubic-bezier(0.65, 0, 0.35, 1) 260ms both" }}
        />
        {/* Italic marks the lede as a different voice from the entries below.
            Cormorant has a real italic; Chinese has none, so the :lang(zh)
            rule in globals.css swaps this to fangsong upright instead of
            letting the browser shear the glyphs.

            One block per sentence, so the break between them holds at every
            measure — the owner asked for it on the phone and on the desktop
            both. Each sentence still wraps inside itself; what it cannot do
            is share a line with the other one.

            break-keep: Chinese may only wrap at its punctuation, so a line too
            long for the phone breaks at its comma instead of pushing its last
            character and full stop onto a line of their own. text-pretty does
            the same for the English, which would otherwise leave "systems."
            or "work." alone on the phone. */}
        <p
          className="mt-6 max-w-xl font-display text-xl leading-relaxed italic text-bone/80 break-keep text-pretty md:text-2xl"
          style={rise(220)}
        >
          {copy.lede.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>
      </header>

      {/* The body rises as one block, after the header has landed. Per-entry
          staggering was considered and dropped: a page with eight entries
          would still be arriving half a second after the reader had started. */}
      <div style={rise(340)}>
        {ownEntries ? null : <EntryList entries={track.entries} lang={lang} collapsible />}
        {children}
      </div>
    </SiteShell>
  );
}
