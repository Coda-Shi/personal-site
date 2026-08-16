import type { MetadataRoute } from "next";
import { DEFAULT_LOCALE, HTML_LANG, LOCALES, type Locale } from "@/lib/i18n";
import { ROUTES, SITE_URL } from "@/lib/site";
import { PIECES } from "@/lib/writing";

const absolute = (path: string) => new URL(path, SITE_URL).toString();

/**
 * Served at /sitemap.xml — every route in both languages, twelve entries.
 *
 * Each entry carries the full hreflang set, including its own language. That
 * repetition is what the protocol asks for: a translation group is only valid
 * if every member lists every member, itself included.
 *
 * No lastModified. The only date available at build time is the build itself,
 * which would mark all twelve pages as freshly changed on every deploy —
 * Google discounts a lastmod it can see is untrue, so an absent one is worth
 * more than a fabricated one.
 */
function entry(lang: Locale, path: string, priority: number) {
  return {
    url: absolute(`/${lang}${path}`),
    changeFrequency: "monthly" as const,
    priority,
    alternates: {
      languages: {
        ...Object.fromEntries(
          LOCALES.map((locale) => [HTML_LANG[locale], absolute(`/${locale}${path}`)]),
        ),
        "x-default": absolute(`/${DEFAULT_LOCALE}${path}`),
      },
    },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  return LOCALES.flatMap((lang) => [
    ...ROUTES.map((path) => entry(lang, path, path === "" ? 1 : 0.8)),
    // Every piece is prerendered in both languages — one written only in
    // Chinese still has an /en URL that serves it as written and says so —
    // so every piece belongs in the sitemap under both, and the hreflang
    // cluster is complete. Listing only the languages a piece was written in
    // would leave half a cluster, which Google discards whole.
    ...PIECES.map((piece) => entry(lang, `/writing/${piece.slug}`, 0.6)),
  ]);
}
