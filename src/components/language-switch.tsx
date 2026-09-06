"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { HTML_LANG, LOCALES, LOCALE_COOKIE, otherLocale, type Locale } from "@/lib/i18n";

/**
 * Both languages, side by side, the current one lit.
 *
 * It used to be one link naming the *other* language — "English" on the
 * Chinese site, "中文" on the English one — which is the usual pattern and
 * the owner did not want it: a single word does not read as a switch, and
 * it never shows which side you are on. Two names with one highlighted does
 * both at a glance, and it is the same object on every page.
 *
 * Each language names itself in its own script and its own length — EN,
 * not "English", because this sits in a footer row next to five other
 * things. The current language is text, not a link: there is nowhere for
 * it to go, and a link to the page you are on is a small lie.
 *
 * The other one is a real `<Link>`, not a button: it has an href, so it
 * works without JavaScript, opens in a new tab on middle-click, and is
 * announced as a link. `hrefLang` tells assistive tech and crawlers what is
 * on the other side.
 *
 * Writing the cookie here is what makes the choice stick. The proxy only
 * consults `Accept-Language` when no cookie is set, so without this every
 * visit would re-run detection and drag the visitor back to the browser's
 * language — the exact behaviour that makes automatic redirection hostile.
 * The proxy also sets the cookie on any locale-prefixed request, so the
 * navigation below would record the choice on its own; doing it here too
 * means the click is remembered even if the response comes from a cache the
 * proxy never touched.
 */
const SELF: Record<Locale, string> = { en: "EN", zh: "中文" };

export function LanguageSwitch({
  lang,
  label,
  className,
}: {
  lang: Locale;
  /** Accessible name for the link to the other language ("Switch to 中文"). */
  label: string;
  className?: string;
}) {
  const pathname = usePathname();
  const target = otherLocale(lang);

  // pathname is always /<lang>/... under this layout, so swapping the first
  // segment preserves the page. Falls back to the locale root if it is not.
  const segments = pathname.split("/");
  segments[1] = target;
  const href = segments.join("/") || `/${target}`;

  return (
    <span className={`label flex items-center gap-2.5 ${className ?? ""}`}>
      {LOCALES.map((locale, i) => (
        <Fragment key={locale}>
          {i > 0 ? (
            <span aria-hidden="true" className="text-bone/30">
              /
            </span>
          ) : null}
          {locale === lang ? (
            <span aria-current="true" lang={HTML_LANG[locale]} className="text-bone">
              {SELF[locale]}
            </span>
          ) : (
            <Link
              href={href}
              hrefLang={HTML_LANG[locale]}
              lang={HTML_LANG[locale]}
              prefetch={false}
              aria-label={label}
              className="link-line text-bone/45 transition-colors hover:text-bone"
              onClick={() => {
                document.cookie = `${LOCALE_COOKIE}=${target};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
              }}
            >
              {SELF[locale]}
            </Link>
          )}
        </Fragment>
      ))}
    </span>
  );
}
