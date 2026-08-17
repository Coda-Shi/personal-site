import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { getDictionary, hasLocale, type Locale } from "@/lib/i18n";
import { localeAlternates } from "@/lib/site";
import { KIND_ORDER, PIECES, otherLocaleOf, pieceLabel, type Piece } from "@/lib/writing";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/writing">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const copy = getDictionary(lang).writing;
  return {
    title: copy.title,
    description: copy.lede,
    alternates: localeAlternates(lang, "/writing"),
  };
}

/**
 * One line of the index.
 *
 * A piece that exists only in the other language is still listed, still
 * linked, and marked. Hiding it would be the easy thing and would misstate how
 * much there is; showing it untranslated would be a lie about what it is.
 */
function Row({ piece, lang }: { piece: Piece; lang: Locale }) {
  const dict = getDictionary(lang);
  const elsewhere = otherLocaleOf(piece, lang);
  const shown = piece.text[lang] ?? (elsewhere ? piece.text[elsewhere] : undefined);
  if (!shown) return null;

  return (
    <li className="border-t border-bone/15">
      <Link
        href={`/${lang}/writing/${piece.slug}`}
        className="group flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-5 transition-colors"
      >
        <span className="font-display text-lg leading-snug tracking-tight text-bone/85 transition-colors group-hover:text-bone md:text-xl">
          {pieceLabel(shown)}
          {/* The part number rides with the title rather than replacing it, so
              the three parts of a sequence read as one work in three pieces. */}
          {shown.subtitle ? (
            <span className="text-bone/45"> · {shown.subtitle}</span>
          ) : null}
        </span>
        <span className="label whitespace-nowrap text-bone/40">
          {elsewhere ? dict.writing.onlyIn : shown.date}
        </span>
      </Link>
    </li>
  );
}

export default async function Page({ params }: PageProps<"/[lang]/writing">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <SiteShell lang={lang}>
      <header>
        <h1 className="font-display text-4xl leading-none font-light tracking-tight md:text-5xl">
          {dict.writing.title}
        </h1>
        <span aria-hidden="true" className="mt-6 block h-px w-24 bg-bone/50" />
        <p className="mt-6 max-w-xl font-display text-xl leading-relaxed italic text-bone/80 md:text-2xl">
          {dict.writing.lede}
        </p>
      </header>

      {/* Grouped rather than split across /writing/verse and /writing/prose.
          With this little written down those would be two near-empty pages,
          and an empty page reads as neglect rather than as restraint. Worth
          splitting once a kind passes roughly ten pieces. A kind with nothing
          in it prints no heading at all. */}
      {KIND_ORDER.map((kind) => {
        const pieces = PIECES.filter((piece) => piece.kind === kind);
        if (!pieces.length) return null;
        return (
          <section key={kind} className="mt-16">
            <h2 className="label text-bone/55">{dict.writing.kinds[kind]}</h2>
            <ul className="mt-6">
              {pieces.map((piece) => (
                <Row key={piece.slug} piece={piece} lang={lang} />
              ))}
            </ul>
          </section>
        );
      })}
    </SiteShell>
  );
}
