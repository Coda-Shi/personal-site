import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrackPage } from "@/components/track-page";
import { BILIBILI, MUSIC, TRACKS } from "@/lib/content";
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
      {/* A section of its own, because a music history is not the same shape
          as a job: it is bands, instruments, arrangements and performances.
          Empty until the owner fills it — the heading is the placeholder. */}
      <section className="mt-16">
        <h2 className="label text-bone/75">{dict.headings.music}</h2>

        <ul className="mt-6">
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

        {/* The mark is drawn in the site's own line idiom rather than lifting
            Bilibili's brand artwork — the same reasoning as the track marks in
            D9, and it keeps someone else's trademark off the page. */}
        <a
          href={BILIBILI}
          rel="noreferrer"
          className="label mt-8 inline-flex items-center gap-2.5 border border-bone/40 px-5 py-2.5 text-bone/90 transition-colors hover:border-bone hover:bg-bone hover:text-void"
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

      <p className="mt-12 text-sm leading-relaxed text-bone/75">
        Elegists Studio keeps its own home at{" "}
        <a
          href="https://elegists.studio"
          className="underline decoration-bone/50 decoration-2 underline-offset-4 transition-colors hover:decoration-bone"
          rel="noreferrer"
        >
          elegists.studio
        </a>
        .
      </p>
    </TrackPage>
  );
}
