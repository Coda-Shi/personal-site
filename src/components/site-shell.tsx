import Link from "next/link";
import { LanguageToggle } from "@/components/language-toggle";
import { NAME } from "@/lib/content";
import { getDictionary, type Locale } from "@/lib/i18n";

// `ground` paints the whole viewport in a track's pigment. It is passed as a
// fixed layer rather than a background on <main> so that short pages do not
// leave the void showing below the fold.
export function SiteShell({
  lang,
  children,
  ground,
}: {
  lang: Locale;
  children: React.ReactNode;
  ground?: string;
}) {
  const dict = getDictionary(lang);

  return (
    <>
      {ground ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10"
          style={{ backgroundColor: ground }}
        />
      ) : null}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10 md:px-10 md:py-14">
        <Link
          href={`/${lang}`}
          className="label text-bone/60 transition-colors hover:text-bone"
        >
          ← {NAME}
        </Link>
        <div className="mt-10 flex-1 md:mt-14">{children}</div>
        <footer className="mt-20 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-bone/20 pt-6">
          <Link
            href={`/${lang}/cv`}
            className="label text-bone/60 transition-colors hover:text-bone"
          >
            {dict.nav.cv}
          </Link>
          <Link
            href={`/${lang}/coda`}
            className="label text-bone/60 transition-colors hover:text-bone"
          >
            {dict.nav.coda}
          </Link>
          <LanguageToggle lang={lang} label={dict.switchTo} />
        </footer>
      </main>
    </>
  );
}
