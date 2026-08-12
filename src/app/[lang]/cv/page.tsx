import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { EntryList, RecordList } from "@/components/track-page";
import {
  ADVOCACY,
  CONTACT_EMAIL,
  EDUCATION,
  NAME,
  SKILLS,
  TRACKS,
  TRACK_CLASSES,
} from "@/lib/content";
import { getDictionary, hasLocale, localise } from "@/lib/i18n";
import { localeAlternates } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[lang]/cv">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: dict.nav.cv,
    description: dict.profile,
    alternates: localeAlternates(lang, "/cv"),
  };
}

// The entries themselves are still English — translation is landing section by
// section, and the dictionary falls back rather than blanking. Only the
// headings and the profile are localised so far.
export default async function Page({ params }: PageProps<"/[lang]/cv">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <SiteShell lang={lang}>
      <header className="max-w-2xl">
        <h1 className="font-display text-5xl leading-none font-light tracking-tight md:text-6xl">
          {NAME}
        </h1>
        <p className="mt-6 text-base leading-relaxed text-bone/80">{dict.profile}</p>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="label mt-6 inline-block text-bone/70 underline underline-offset-4 transition-colors hover:text-bone"
        >
          {CONTACT_EMAIL}
        </a>
      </header>

      <section className="mt-16">
        <h2 className="label text-bone/55">{dict.headings.education}</h2>
        <RecordList items={EDUCATION} overrides={dict.education} />
      </section>

      {TRACKS.map((track) => (
        <section key={track.id} className="mt-16">
          {/* The pigment appears as a swatch rather than as type — at label size
              on black, none of the three would clear a readable contrast ratio. */}
          <h2 className="label flex items-center gap-2 text-bone/55">
            <span
              aria-hidden="true"
              className="inline-block size-2"
              style={{ backgroundColor: TRACK_CLASSES[track.id].cssVar }}
            />
            {dict.tracks[track.id].title}
          </h2>
          <EntryList entries={track.entries} lang={lang} />
        </section>
      ))}

      <section className="mt-16">
        <h2 className="label text-bone/55">{dict.headings.advocacy}</h2>
        <RecordList items={ADVOCACY} overrides={dict.advocacy} />
      </section>

      <section className="mt-16">
        <h2 className="label text-bone/55">{dict.headings.additional}</h2>
        <dl className="mt-6 space-y-6">
          {SKILLS.map((original) => {
            const group = localise(original, dict.skills);
            return (
              <div key={original.id} className="border-t border-bone/20 pt-5">
                <dt className="text-sm font-medium">{group.heading}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-bone/75">{group.items}</dd>
              </div>
            );
          })}
        </dl>
      </section>
    </SiteShell>
  );
}
