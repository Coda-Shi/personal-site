import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PieceBody } from "@/components/piece-body";
import { SiteShell } from "@/components/site-shell";
import { LOCALES, getDictionary, hasLocale } from "@/lib/i18n";
import { localeAlternates } from "@/lib/site";
import { PIECES, findPiece, otherLocaleOf, pieceLabel } from "@/lib/writing";

// Every piece in both languages, so all of them prerender and the route never
// falls back to rendering on request.
export function generateStaticParams() {
  return LOCALES.flatMap((lang) => PIECES.map((piece) => ({ lang, slug: piece.slug })));
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/writing/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) return {};
  const piece = findPiece(slug);
  if (!piece) return {};

  const elsewhere = otherLocaleOf(piece, lang);
  const shown = piece.text[lang] ?? (elsewhere ? piece.text[elsewhere] : undefined);
  if (!shown) return {};

  return {
    title: pieceLabel(shown),
    // The opening lines rather than a summary. Describing a poem in a meta tag
    // means writing about it, and that is not this file's job.
    description: shown.body
      .filter((line) => line.trim() !== "")
      .slice(0, 2)
      .join(" / "),
    alternates: localeAlternates(lang, `/writing/${piece.slug}`),
  };
}

export default async function Page({ params }: PageProps<"/[lang]/writing/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();

  const piece = findPiece(slug);
  if (!piece) notFound();

  const dict = getDictionary(lang);
  // A piece written only in the other language is served as it was written,
  // with a line saying so — not translated, not hidden, not blank.
  const elsewhere = otherLocaleOf(piece, lang);
  const written = elsewhere ?? lang;
  const text = piece.text[written];
  if (!text) notFound();

  return (
    <SiteShell lang={lang}>
      <article>
        <Link href={`/${lang}/writing`} className="label text-bone/50 transition-colors hover:text-bone">
          {dict.writing.all}
        </Link>

        {/* No heading for untitled work. Printing its first line as a title
            and then again as the first line reads as a mistake, and inventing
            one is not ours to do. */}
        {text.title ? (
          <h1 className="mt-8 font-display text-2xl leading-tight font-light tracking-tight md:text-3xl">
            {text.title}
          </h1>
        ) : null}
        {text.subtitle ? <p className="label mt-2 text-bone/45">{text.subtitle}</p> : null}

        <PieceBody
          text={text}
          kind={piece.kind}
          locale={written}
          className={`text-bone/85 ${text.title ? "mt-10" : "mt-12"}`}
        />

        {text.note ? (
          <p className="mt-12 font-display text-base italic text-bone/55">{text.note}</p>
        ) : null}

        {(text.date || elsewhere) && (
          <p className={`label text-bone/40 ${text.note ? "mt-3" : "mt-12"}`}>
            {[elsewhere ? dict.writing.onlyIn : null, text.date].filter(Boolean).join(" · ")}
          </p>
        )}
      </article>
    </SiteShell>
  );
}
