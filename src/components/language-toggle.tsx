"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALE_COOKIE, otherLocale, type Locale } from "@/lib/i18n";

/**
 * Switches to the other language, staying on the same page.
 *
 * A real `<Link>`, not a button: it has an href, so it works without
 * JavaScript, opens in a new tab on middle-click, and is announced as a link.
 * The `hrefLang` tells assistive tech and crawlers what is on the other side.
 *
 * Writing the cookie here is what makes the choice stick. The proxy only
 * consults `Accept-Language` when no cookie is set, so without this every
 * visit would re-run detection and drag the visitor back to the browser's
 * language — the exact behaviour that makes automatic redirection hostile.
 * The proxy also sets the cookie on any locale-prefixed request, so the
 * navigation below would record the choice on its own; doing it here too means
 * the click is remembered even if the response comes from a cache the proxy
 * never touched.
 */
export function LanguageToggle({ lang, label }: { lang: Locale; label: string }) {
  const pathname = usePathname();
  const target = otherLocale(lang);

  // pathname is always /<lang>/... under this layout, so swapping the first
  // segment preserves the page. Falls back to the locale root if it is not.
  const segments = pathname.split("/");
  segments[1] = target;
  const href = segments.join("/") || `/${target}`;

  return (
    <Link
      href={href}
      hrefLang={target}
      lang={target}
      prefetch={false}
      className="label text-bone/55 transition-colors hover:text-bone"
      onClick={() => {
        document.cookie = `${LOCALE_COOKIE}=${target};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
      }}
    >
      {label}
    </Link>
  );
}
