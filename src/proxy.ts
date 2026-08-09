import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALES, LOCALE_COOKIE, hasLocale, type Locale } from "@/lib/i18n";

/**
 * Sends a bare path to a locale-prefixed one.
 *
 * `middleware.ts` was renamed to `proxy.ts` in Next.js 16 — same behaviour,
 * different file and export name. Do not rename it back.
 *
 * Redirecting on `Accept-Language` alone is a well-known trap. It bounces
 * anyone who deliberately wants the other language, on every visit, and it
 * bounces crawlers too, so only one language ends up indexed. The rule here is
 * therefore: an explicit choice always wins, and it is only the *absence* of a
 * choice that consults the browser.
 */

/**
 * Picks the best supported locale from the header. Deliberately hand-rolled
 * rather than pulling in Negotiator and intl-localematcher: two locales and a
 * default do not justify two dependencies in the request path.
 *
 * `Accept-Language: zh-CN,zh;q=0.9,en;q=0.8` parses to zh before en. Quality
 * defaults to 1 when absent, which is what makes an unweighted first entry win.
 */
function preferredLocale(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      const quality = q ? Number.parseFloat(q.trim().slice(2)) : 1;
      return { tag: tag.trim().toLowerCase(), quality: Number.isNaN(quality) ? 0 : quality };
    })
    .filter((entry) => entry.tag && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of ranked) {
    // Match on the primary subtag: zh-CN, zh-Hans and zh-TW all mean zh here.
    // The site has one Chinese translation, and sending a zh-TW reader to
    // English because the region did not match would be worse than simplified.
    const primary = tag.split("-")[0];
    if (hasLocale(primary)) return primary;
  }

  return DEFAULT_LOCALE;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasPrefix = LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  // Already addressed to a locale. Record it as the visitor's choice so that a
  // shared link teaches the cookie rather than fighting it: following
  // /zh/scholarly from someone else should leave you in Chinese afterwards.
  if (hasPrefix) {
    const chosen = pathname.split("/")[1];
    if (hasLocale(chosen) && request.cookies.get(LOCALE_COOKIE)?.value !== chosen) {
      const response = NextResponse.next();
      response.cookies.set(LOCALE_COOKIE, chosen, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
      return response;
    }
    return NextResponse.next();
  }

  const remembered = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale =
    remembered && hasLocale(remembered)
      ? remembered
      : preferredLocale(request.headers.get("accept-language"));

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except Next internals and files that carry an extension —
  // favicon.ico, the images under public/, robots and sitemap. Prefixing a
  // static asset with a locale would 404 it.
  matcher: ["/((?!_next|.*\\.).*)"],
};
