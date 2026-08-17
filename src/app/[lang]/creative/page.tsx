import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrackPage } from "@/components/track-page";
import Image from "next/image";
import { VideoEmbed } from "@/components/video-embed";
import { BILIBILI, COVER, MUSIC, STUDIO_URL, TRACKS } from "@/lib/content";
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

  return (
    <TrackPage lang={lang} track={track}>
      {/* Leads the page. One piece, named, with the line art already in the
          repo — a track page that opens with a list of employers buries the
          work under the jobs. */}
      <section className="mt-16">
        <h2 className="label text-bone/75">{dict.headings.selected}</h2>
        <p className="mt-6 font-display text-4xl leading-none font-light tracking-tight md:text-5xl">
          DEAR SUSPECT
        </p>
        <p className="mt-4 max-w-lg font-display text-xl leading-relaxed italic text-bone/80">
          {dict.creative.workNote}
        </p>
        <Image
          src="/creative/dear-suspect-figure.png"
          alt=""
          width={380}
          height={460}
          className="mt-8 h-auto w-full max-w-[15rem] opacity-70"
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
          <span className="label whitespace-nowrap text-bone/55">elegists.studio →</span>
        </a>
      </section>

      {/* A section of its own, because a music history is not the same shape
          as a job: it is bands, instruments, arrangements and performances.
          Empty until the owner fills it — the heading is the placeholder. */}
      <section className="mt-16">
        <h2 className="label text-bone/75">{dict.headings.music}</h2>

        {/* The mark is drawn in the site's own line idiom rather than lifting
            Bilibili's brand artwork — the same reasoning as the track marks in
            D9, and it keeps someone else's trademark off the page. */}
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

        <VideoEmbed
          bvid={COVER.bvid}
          title={COVER.title}
          caption={dict.creative.coverCaption}
          playLabel={dict.creative.play}
        />

        <ul className="mt-10">
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
                    <span className="text-bone/50"> · {show.role}</span>
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
