import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import portrait from "@/assets/portrait.png";
import { SiteShell } from "@/components/site-shell";
import { RecordList } from "@/components/track-page";
import { LIFE } from "@/content/life";
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

const rise = (delay: number) => ({ animation: `rise-in 700ms ease-out ${delay}ms both` });

// No ground colour, no glyph, a narrower measure, more serif. The three public
// identities are encoded; this one is not. See D9 in CLAUDE.md.
export default async function Page({ params }: PageProps<"/[lang]/coda">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const featured = featuredFor(lang);

  return (
    <SiteShell lang={lang} ownEntrance>
      <header className="max-w-xl">
        {/* The face. You reach this page by clicking it, and it used to be the
            one page on the site without it. D9 keeps pigment and marks off
            this page; it says nothing against the photograph, which is the
            opposite of an encoding.

            Named (inline, like the marks — see trinity-disc.tsx), so that
            clicking the portrait on the disc grows it into this one — the
            same object arriving, not a page appearing with a picture on it. The ring is drawn separately and draws itself on
            around the face as it lands, with the disc's own timing, so the
            line work on this page is laid down the way it is everywhere
            else. In colour, as on the disc: see the note there. */}
        <div className="relative mb-9 size-28 md:size-36">
          <div
            className="absolute inset-0 overflow-hidden rounded-full bg-void"
            style={{
              animation: "fade-in 500ms ease-out 150ms both",
              viewTransitionName: "portrait",
            }}
          >
            <Image
              src={portrait}
              alt=""
              priority
              className="absolute inset-0 size-full object-cover opacity-95"
            />
          </div>
          <svg
            viewBox="0 0 100 100"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 size-full text-bone"
          >
            <circle
              cx="50"
              cy="50"
              r="49.4"
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.75}
              strokeWidth={0.9}
              pathLength={1}
              strokeDasharray={1}
              style={{ animation: "plot-stroke 1000ms cubic-bezier(0.65, 0, 0.35, 1) 200ms both" }}
            />
          </svg>
        </div>
        <h1
          className="font-display text-5xl leading-none font-light tracking-tight md:text-6xl"
          style={rise(120)}
        >
          {dict.hub.heading}
        </h1>
        <p className="mt-6 font-display text-2xl leading-snug italic text-bone/70" style={rise(240)}>
          {dict.hub.subheading}
        </p>
      </header>

      <div style={rise(360)}>
      {/* Coda's own account of himself, in his words. */}
      <section className="mt-16 max-w-xl">
        <h2 className="label text-bone/55">{dict.headings.life}</h2>
        {/* His own prose, set plainly. No italics, no display face at size:
            this is the one page that is not making a case, and the writing
            should read the way it was written. The one-line paragraphs carry
            the pacing, so they keep the same spacing as the long ones. */}
        {/* The opening only — the whole thing has its own room at /life. Cut
            after the third paragraph because that is where he turns from the
            name to the rain, so the preview ends on an opening rather than
            mid-thought. */}
        <div className="mt-8 space-y-5 leading-[1.9] text-bone/80">
          {LIFE[lang].slice(0, 3).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <Link
          href={`/${lang}/life`}
          className="label mt-8 inline-block border border-bone/40 px-5 py-2.5 text-bone/90 transition-colors hover:border-bone hover:bg-bone hover:text-void"
        >
          {dict.readOn} &rarr;
        </Link>
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
      </div>
    </SiteShell>
  );
}
