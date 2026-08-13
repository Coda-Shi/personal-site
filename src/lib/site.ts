import { DEFAULT_LOCALE, HTML_LANG, LOCALES, type Locale } from "@/lib/i18n";

/**
 * Where the site lives, and who is allowed to index it.
 *
 * Server-only, like i18n — it imports the locale table, which drags both
 * dictionaries in behind it.
 */

/**
 * Absolute URLs have to be resolvable at build time, because that is when the
 * pages are rendered. Three sources, in falling order of authority:
 *
 *   NEXT_PUBLIC_SITE_URL         set this in Vercel once a real domain exists
 *   VERCEL_PROJECT_PRODUCTION_URL  the project's stable production hostname,
 *                                  present in every Vercel environment
 *   localhost                    building on a laptop
 *
 * Note the middle one is the *production* host even during a preview build.
 * That is deliberate: canonical links and the sitemap must name the real site,
 * or every preview deployment would nominate itself as the canonical copy.
 * VERCEL_URL, the per-deployment hostname, is therefore not consulted.
 */
function resolveOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return `https://${production}`;

  return "http://localhost:3000";
}

export const SITE_URL = new URL(resolveOrigin());

/**
 * Preview deployments must not be indexed — otherwise every branch competes
 * with the real site for the same queries, and Google picks the winner.
 * Anything else indexes, so that a local `next build` renders what production
 * will render rather than a special case that never gets checked.
 */
export const INDEXABLE = process.env.VERCEL_ENV !== "preview";

/**
 * Open Graph predates BCP 47 and wants language_TERRITORY, so HTML_LANG's "en"
 * and "zh-Hans" cannot be reused here.
 */
export const OG_LOCALE: Record<Locale, string> = { en: "en_US", zh: "zh_CN" };

/** Every route under [lang]. Keep in step with the app directory. */
export const ROUTES = ["", "/scholarly", "/professional", "/creative", "/coda", "/cv"] as const;

/**
 * Self-canonical plus hreflang for one page.
 *
 * This has to be per-page, not once in the layout. Metadata is inherited, so a
 * layout that declares `canonical: "/en"` hands that same canonical to
 * /en/scholarly and /en/cv — which tells crawlers those pages are duplicates of
 * the home page and should be dropped from the index. The same inheritance
 * makes a layout-level hreflang point /en/scholarly at /zh instead of
 * /zh/scholarly.
 *
 * x-default names the copy to serve a reader whose language matches neither.
 * It points at English rather than at `/`, because `/` is a redirect and
 * hreflang should resolve in one hop.
 */
export function localeAlternates(lang: Locale, path: (typeof ROUTES)[number] = "") {
  const languages: Record<string, string> = { "x-default": `/${DEFAULT_LOCALE}${path}` };
  for (const locale of LOCALES) {
    languages[HTML_LANG[locale]] = `/${locale}${path}`;
  }

  return { canonical: `/${lang}${path}`, languages };
}
