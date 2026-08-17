import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { LIFE } from "@/content/life";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { localeAlternates } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[lang]/life">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: dict.headings.life,
    // His opening lines rather than a summary — the page is short enough that
    // describing it would be longer than quoting it.
    description: LIFE[lang].slice(1, 2).join(" "),
    alternates: localeAlternates(lang, "/life"),
  };
}

// No ground colour and no mark, like /coda: this is the same private register,
// just given its own room. See D9.
export default async function Page({ params }: PageProps<"/[lang]/life">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <SiteShell lang={lang}>
      <article className="max-w-xl">
        <Link href={`/${lang}/coda`} className="label text-bone/50 transition-colors hover:text-bone">
          {dict.nav.coda}
        </Link>

        <h1 className="mt-8 font-display text-4xl leading-none font-light tracking-tight md:text-5xl">
          {dict.headings.life}
        </h1>

        {/* Set plainly, as on /coda: no italics, no display face at size. This
            is the one page not making a case, and it should read the way it was
            written. The one-line paragraphs keep the long ones' spacing because
            they are what carries the pacing. */}
        <div className="mt-10 space-y-5 leading-[1.9] text-bone/80">
          {LIFE[lang].map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>
    </SiteShell>
  );
}
