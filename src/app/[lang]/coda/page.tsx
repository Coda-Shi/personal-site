import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { RecordList } from "@/components/track-page";
import { ADVOCACY, POEM } from "@/lib/content";
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
        {/* `lang` is set on the poem itself, not inherited from the page. It is
            Chinese on both locales, and the attribute is what routes it to
            Zhuque Fangsong through the :lang(zh) rule instead of letting the
            English page hand it to a fallback face. It also happens to be
            true, which is the better reason. */}
        {/* Fangsong explicitly. The :lang(zh) rule only rewrites italics, so
            without this the poem inherits --font-display and comes out in Noto
            Serif SC — a Song face. Fangsong is what Chinese sets literary text
            in, and it is the face D17 already vendored. */}
        <div
          lang="zh-Hans"
          className="mt-8 text-xl leading-[2.1] text-bone/85 md:text-2xl"
          style={{ fontFamily: "var(--font-fangsong)" }}
        >
          {POEM.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="label text-bone/55">{dict.headings.advocacy}</h2>
        <RecordList items={ADVOCACY} overrides={dict.advocacy} />
      </section>
    </SiteShell>
  );
}
