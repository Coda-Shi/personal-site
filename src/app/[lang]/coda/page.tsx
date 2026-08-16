import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PieceBody } from "@/components/piece-body";
import { SiteShell } from "@/components/site-shell";
import { RecordList } from "@/components/track-page";
import { ADVOCACY } from "@/lib/content";
import { getDictionary, hasLocale, type Locale } from "@/lib/i18n";
import { localeAlternates } from "@/lib/site";
import { PIECES, otherLocaleOf } from "@/lib/writing";

/** The most recent piece, in the reader's language when it exists there. */
function latestPiece(lang: Locale) {
  const piece = PIECES[0];
  if (!piece) return null;
  const locale = otherLocaleOf(piece, lang) ?? lang;
  const text = piece.text[locale];
  return text ? { piece, text, locale } : null;
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
  const latest = latestPiece(lang);

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

      {/* The writing has its own section now. What stays here is the most
          recent piece in full and a door — this page is where the writing
          belongs, so it should still open with one, but the whole body of it
          no longer lives inline. */}
      {latest ? (
        <section className="mt-16 max-w-xl">
          <h2 className="label text-bone/55">{dict.writing.more}</h2>
          <Link href={`/${lang}/writing/${latest.piece.slug}`} className="group block">
            <PieceBody
              text={latest.text}
              kind={latest.piece.kind}
              locale={latest.locale}
              className="mt-8 text-bone/85 transition-colors group-hover:text-bone"
            />
          </Link>
          <Link
            href={`/${lang}/writing`}
            className="label mt-10 inline-block text-bone/50 transition-colors hover:text-bone"
          >
            {dict.writing.all} →
          </Link>
        </section>
      ) : null}

      <section className="mt-16">
        <h2 className="label text-bone/55">{dict.headings.advocacy}</h2>
        <RecordList items={ADVOCACY} overrides={dict.advocacy} />
      </section>
    </SiteShell>
  );
}
