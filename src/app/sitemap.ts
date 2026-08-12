import type { MetadataRoute } from "next";
import { DEFAULT_LOCALE, HTML_LANG, LOCALES } from "@/lib/i18n";
import { ROUTES, SITE_URL } from "@/lib/site";

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
export default function sitemap(): MetadataRoute.Sitemap {
  return LOCALES.flatMap((lang) =>
    ROUTES.map((path) => ({
      url: absolute(`/${lang}${path}`),
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.8,
      alternates: {
        languages: {
          ...Object.fromEntries(
            LOCALES.map((locale) => [HTML_LANG[locale], absolute(`/${locale}${path}`)]),
          ),
          "x-default": absolute(`/${DEFAULT_LOCALE}${path}`),
        },
      },
    })),
  );
}
