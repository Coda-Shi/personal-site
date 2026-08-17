import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntryList, RecordList, TrackPage } from "@/components/track-page";
import { EDUCATION, QUESTIONS, TRACKS } from "@/lib/content";
import { getDictionary, hasLocale, localise } from "@/lib/i18n";
import { localeAlternates } from "@/lib/site";

const track = TRACKS.find((t) => t.id === "scholarly")!;

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/scholarly">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const copy = getDictionary(lang).tracks[track.id];
  return {
    title: copy.title,
    description: copy.lede,
    alternates: localeAlternates(lang, "/scholarly"),
  };
}

export default async function Page({ params }: PageProps<"/[lang]/scholarly">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <TrackPage lang={lang} track={track} ownEntries>
      {/* Leads the track, ahead of the posts held. The lede says what the
          field is; this says what he is actually asking inside it, which is
          the part a reader can disagree with. */}
      <section className="mt-16">
        <h2 className="label text-bone/75">{dict.headings.questions}</h2>
        <ul className="mt-8 space-y-7">
          {QUESTIONS.map((original) => {
            const q = localise(original, dict.questionCopy);
            return (
              <li key={original.id} className="max-w-xl border-l border-bone/25 pl-5">
                <p className="font-display text-xl leading-snug text-bone/90">{q.lead}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-bone/65">{q.note}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* The posts held come after the questions, and under a heading of
          their own — the same shape Creative uses for its music. */}
      <section className="mt-16">
        <h2 className="label text-bone/75">{dict.headings.record}</h2>
        <EntryList entries={track.entries} lang={lang} collapsible />
      </section>

      <section className="mt-16">
        <h2 className="label text-bone/55">{dict.headings.education}</h2>
        <RecordList items={EDUCATION} overrides={dict.education} />
      </section>
    </TrackPage>
  );
}
