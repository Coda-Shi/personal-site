import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntryList, RecordList, TrackPage } from "@/components/track-page";
import { EDUCATION, QUESTIONS, TRACKS } from "@/lib/content";
import { getDictionary, hasLocale, localise } from "@/lib/i18n";
import { localeAlternates } from "@/lib/site";

const track = TRACKS.find((t) => t.id === "scholarly")!;

const NUMERALS = ["I", "II", "III", "IV"];

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/scholarly">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const copy = getDictionary(lang).tracks[track.id];
  return {
    title: copy.title,
    description: copy.lede.join(" "),
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
        {/* Four cells divided by hairlines, titles only. Opening one gives it
            the room — the lines slide, the other three fall back to strips
            with their numeral — as a circle on the home page takes the screen
            and the other two recede. The box keeps its height, so reading a
            note never pushes the record further down. Native <details> with a
            shared name: one open at a time, no script, keyboard and find-in-
            page for free. The geometry is in globals.css (.questions). */}
        <div className="questions mt-8">
          {QUESTIONS.map((original, i) => {
            const q = localise(original, dict.questionCopy);
            return (
              <details key={original.id} name="questions" className="q">
                <summary>
                  <span className="q-numeral label">{NUMERALS[i]}</span>
                  <span className="q-lead font-display text-base leading-snug md:text-xl">
                    {q.lead}
                  </span>
                </summary>
                <p className="q-note text-sm leading-relaxed text-bone/70">{q.note}</p>
              </details>
            );
          })}
        </div>
      </section>

      {/* The posts held come after the questions, and under a heading of
          their own — the same shape Creative uses for its music. */}
      <section className="mt-16">
        <h2 className="label text-bone/75">{dict.headings.record}</h2>
        <EntryList entries={track.entries} lang={lang} collapsible />
      </section>

      <section className="mt-16">
        <h2 className="label text-bone/55">{dict.headings.education}</h2>
        <RecordList items={EDUCATION} overrides={dict.education} lang={lang} />
      </section>
    </TrackPage>
  );
}
