import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { RecordList } from "@/components/track-page";
import { ADVOCACY } from "@/lib/content";
import { getDictionary, hasLocale } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/coda">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = getDictionary(lang);
  return { title: dict.hub.heading, description: dict.hub.subheading };
}

// No ground colour, no glyph, a narrower measure, more serif. The three public
// identities are encoded; this one is not. See D9 in CLAUDE.md.
export default async function Page({ params }: PageProps<"/[lang]/coda">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <SiteShell lang={lang}>
      <header className="max-w-xl">
        <h1 className="font-display text-5xl leading-none font-light tracking-tight md:text-6xl">
          {dict.hub.heading}
        </h1>
        <p className="mt-6 font-display text-2xl leading-snug italic text-bone/70">
          {dict.hub.subheading}
        </p>
      </header>

      <section className="mt-16 max-w-xl">
        <h2 className="label text-bone/55">{dict.headings.poems}</h2>
        <p className="mt-6 font-display text-2xl leading-relaxed italic text-bone/45">
          Not yet published here.
        </p>
      </section>

      <section className="mt-16">
        <h2 className="label text-bone/55">{dict.headings.advocacy}</h2>
        <RecordList items={ADVOCACY} overrides={dict.advocacy} />
      </section>
    </SiteShell>
  );
}
