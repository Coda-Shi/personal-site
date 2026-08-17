import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { RecordList } from "@/components/track-page";
import { ADVOCACY } from "@/lib/content";
import { getDictionary, hasLocale, type Locale } from "@/lib/i18n";
import { localeAlternates } from "@/lib/site";
import { featuredPieces, otherLocaleOf, pieceLabel } from "@/lib/writing";

/** The featured pieces, each resolved to the language it exists in. */
function featuredFor(lang: Locale) {
  return featuredPieces()
    .map((piece) => {
      const locale = otherLocaleOf(piece, lang) ?? lang;
      const text = piece.text[locale];
      return text ? { piece, text, locale } : null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
}

export async function generateMetadata({ params }: PageProps<"/[lang]/coda">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: dict.hub.heading,
    description: dict.hub.subheading,
    alternates: localeAlternates(lang, "/coda"),
  };
}

// No ground colour, no glyph, a narrower measure, more serif. The three public
// identities are encoded; this one is not. See D9 in CLAUDE.md.
export default async function Page({ params }: PageProps<"/[lang]/coda">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const featured = featuredFor(lang);

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

      {/* Coda's own account of himself. He writes it; until then the section
          exists and says so, because a named empty shelf reads as a promise
          and a missing one reads as nothing at all. */}
      <section className="mt-16 max-w-xl">
        <h2 className="label text-bone/55">{dict.headings.life}</h2>
        <p className="mt-6 font-display text-lg italic text-bone/35">{dict.writing.soon}</p>
      </section>

      {/* A few pieces, not the whole shelf — the full list is at /writing. The
          poem that used to sit here in full is gone: this page introduces the
          writing, it is not where the writing lives. */}
      <section className="mt-16 max-w-xl">
        <h2 className="label text-bone/55">{dict.writing.more}</h2>
        <ul className="mt-6">
          {featured.map(({ piece, text }) => (
            <li key={piece.slug} className="border-t border-bone/15">
              <Link
                href={`/${lang}/writing/${piece.slug}`}
                className="group flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4"
              >
                <span className="font-display text-lg leading-snug text-bone/85 transition-colors group-hover:text-bone">
                  {pieceLabel(text)}
                  {text.subtitle ? <span className="text-bone/45"> · {text.subtitle}</span> : null}
                </span>
                <span className="label whitespace-nowrap text-bone/40">{text.date}</span>
              </Link>
            </li>
          ))}
        </ul>
        {/* Brighter and boxed rather than another quiet label: it is the way
            into the section, and the owner asked for it to carry more weight. */}
        <Link
          href={`/${lang}/writing`}
          className="label mt-8 inline-block border border-bone/40 px-5 py-2.5 text-bone/90 transition-colors hover:border-bone hover:bg-bone hover:text-void"
        >
          {dict.writing.all} →
        </Link>
      </section>

      <section className="mt-16">
        <h2 className="label text-bone/55">{dict.headings.advocacy}</h2>
        <RecordList items={ADVOCACY} overrides={dict.advocacy} />
      </section>
    </SiteShell>
  );
}
