import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { VideoEmbed } from "@/components/video-embed";
import { BILIBILI, COVER, MUSIC, STUDIO_URL, TRACKS } from "@/lib/content";
import { EntryList, TrackPage } from "@/components/track-page";
import { getDictionary, hasLocale, localise } from "@/lib/i18n";
import { localeAlternates } from "@/lib/site";

const track = TRACKS.find((t) => t.id === "creative")!;

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/creative">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const copy = getDictionary(lang).tracks[track.id];
  return {
    title: copy.title,
    description: copy.lede,
    alternates: localeAlternates(lang, "/creative"),
  };
}

export default async function Page({ params }: PageProps<"/[lang]/creative">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  const entry = (id: string) => track.entries.filter((e) => e.id === id);

  return (
    <TrackPage lang={lang} track={track} ownEntries>
      {/* The work leads, then the studio that makes it, then the post held
          there — the reader meets the thing before the arrangements around it. */}
      <section className="mt-16">
        <h2 className="label text-bone/75">{dict.headings.selected}</h2>
        <p className="mt-6 font-display text-4xl leading-none font-light tracking-tight md:text-5xl">
          {dict.creative.workTitle}
        </p>
        <p className="mt-5 max-w-lg font-display text-xl leading-relaxed italic text-bone/85">
          {dict.creative.workNote}
        </p>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-bone/55">
          {dict.creative.workSub}
        </p>

        {/* Still the figure plate, not the full key art: the key art source is
            not in the repo yet. Drop it in _incoming/ and run
            scripts/keyart-lineart.py, then this becomes a one-line swap to
            /creative/dear-suspect-key-art.png with width 1200 height 660.
            Never reference a key art file raw — every plate on this site is
            keyed to bone first (D14). */}
        <Image
          src="/creative/dear-suspect-figure.png"
          alt=""
          width={380}
          height={460}
          className="mt-8 h-auto w-full max-w-[17rem] opacity-75"
        />

        <a
          href={STUDIO_URL}
          rel="noreferrer"
          className="group mt-8 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border border-bone/25 px-5 py-4 transition-colors hover:border-bone/60"
        >
          <span>
            <span className="font-display text-xl leading-snug text-bone/85 transition-colors group-hover:text-bone">
              ELEGISTS STUDIO
            </span>
            <span className="label mt-1 block text-bone/45">{dict.creative.studioCard}</span>
          </span>
          <span className="label whitespace-nowrap text-bone/55">elegists.studio &rarr;</span>
        </a>

      </section>

      <section className="mt-16">
        <h2 className="label text-bone/75">{dict.headings.game}</h2>
        <EntryList entries={entry("elegists")} lang={lang} collapsible />
      </section>

      {/* The music half mirrors the game half: one selected thing, then the
          record behind it. */}
      <section className="mt-16">
        <h2 className="label text-bone/75">{dict.headings.selected}</h2>

        <VideoEmbed
          bvid={COVER.bvid}
          title={COVER.title}
          caption={dict.creative.coverCaption}
          playLabel={dict.creative.play}
        />
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-bone/55">
          {dict.creative.coverNote}
        </p>

        <a
          href={BILIBILI}
          rel="noreferrer"
          className="label mt-6 inline-flex items-center gap-2.5 border border-bone/40 px-5 py-2.5 text-bone/90 transition-colors hover:border-bone hover:bg-bone hover:text-void"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="size-[1.15em]"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7.5 2.6 10 5.4" />
            <path d="M16.5 2.6 14 5.4" />
            <rect x="2.6" y="5.4" width="18.8" height="16" rx="3.2" />
            <path d="M7.4 10.4v2.2" />
            <path d="M16.6 10.4v2.2" />
            <path d="M8.6 16.4c1.9 1.5 4.9 1.5 6.8 0" />
          </svg>
          {dict.covers}
        </a>
      </section>

      <section className="mt-16">
        <h2 className="label text-bone/75">{dict.headings.music}</h2>

        {/* The club sits here rather than with the jobs: it is where the
            performances below it came from. */}
        <EntryList entries={entry("hot-sound")} lang={lang} collapsible />

        <ul className="mt-2">
          {MUSIC.map((original) => {
            const show = localise(original, dict.music);
            return (
              <li
                key={original.id}
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-bone/20 py-4"
              >
                <span>
                  <span className="font-display text-xl leading-snug tracking-tight">
                    {show.event}
                  </span>
                  <span className="mt-1 block text-sm text-bone/70">
                    {show.hosts}
                    <span className="text-bone/50"> &middot; {show.role}</span>
                  </span>
                </span>
                {show.date ? (
                  <span className="label whitespace-nowrap text-bone/55">{show.date}</span>
                ) : null}
              </li>
            );
          })}
        </ul>

      </section>
    </TrackPage>
  );
}
