import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  JetBrains_Mono,
  Noto_Sans_SC,
  Noto_Serif_SC,
  Space_Grotesk,
} from "next/font/google";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { HTML_LANG, LOCALES, getDictionary, hasLocale } from "@/lib/i18n";
import { INDEXABLE, OG_LOCALE, SITE_URL } from "@/lib/site";
import "../globals.css";

// The typographic collision the whole design rests on: a Garamond-lineage serif
// (classical) set against a geometric grotesque (modern), with a mono face
// carrying anything that is data — dates, counts, sample sizes, labels.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const grotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

/**
 * None of the three faces above contains a single Chinese glyph, so without
 * these every Chinese character would fall through to whatever the OS supplies
 * — Microsoft YaHei on Windows, PingFang on macOS, anyone's guess on Linux —
 * and D8's three-way collision would silently collapse into one generic UI
 * sans. The two Source Han faces restore the pairing: the serif carries the
 * classical half opposite Cormorant, the sans the geometric half opposite
 * Space Grotesk. Mono stays Latin-only; Chinese has no monospace tradition and
 * faking one reads worse than not trying.
 *
 * `preload: false` is not optional. Google slices CJK into on the order of a
 * hundred unicode-range subsets, and the default `preload: true` would inject a
 * <link rel="preload"> for every one of them into every page. The browser
 * fetches only the slices a page actually needs; preloading defeats exactly
 * that mechanism.
 */
const notoSerifSC = Noto_Serif_SC({
  variable: "--font-noto-serif-sc",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  preload: false,
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  preload: false,
});

/**
 * Chinese has no italic, so D17 marks the change of voice with a change of
 * face: where English sets a lede in Cormorant italic, Chinese sets it upright
 * in Fangsong. That only works if the reader actually has a Fangsong — Windows
 * and macOS ship one, most Linux does not, and a missing one drops the lede
 * back into the same face as everything around it and erases the distinction.
 *
 * So the face is vendored rather than named. `scripts/subset-fangsong.py` cuts
 * it from the 8.4 MB upstream release down to the characters this site can
 * actually render — 37 KB — which is what makes shipping a CJK face viable at
 * all. Re-run that script after adding Chinese copy.
 *
 * Zhuque Fangsong, OFL 1.1. Licence and copyright travel with it in
 * src/app/fonts/OFL.txt.
 *
 * The variable must not be called `fangsong`. next/font derives the family
 * name from it, and `fangsong` is a generic family keyword in CSS Fonts 4,
 * alongside serif and monospace. Unquoted in a font-family list it parses as
 * the generic and the @font-face is never consulted — the face loads, the
 * stack looks right, and the browser quietly draws the system font instead.
 */
const zhuqueFangsong = localFont({
  src: "../fonts/zhuque-fangsong-subset.woff2",
  variable: "--font-zhuque-fangsong",
  weight: "400",
  style: "normal",
  display: "swap",
  // Latin is absent from the subset on purpose, so the browser must not be
  // told to expect it. The :lang(zh) stack puts Cormorant first and only what
  // Cormorant lacks reaches this face.
  adjustFontFallback: false,
});

const FONT_VARS = [
  cormorant.variable,
  grotesk.variable,
  jetbrains.variable,
  notoSerifSC.variable,
  notoSansSC.variable,
  zhuqueFangsong.variable,
].join(" ");

// Both locales are known at build time, so every page stays static and the
// proxy only ever issues a redirect — it never renders.
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

const NAME = 'Yixuan "Coda" Shi';

/**
 * Named by hand rather than left to the app/opengraph-image.png convention,
 * and it has to be this way round.
 *
 * `openGraph` is replaced between route segments, not merged, so the block
 * below overrides whatever the root segment contributed — a root-level
 * opengraph-image.png produces og:title and og:description but silently no
 * og:image. Moving the file into [lang]/ fixes the merge but breaks the URL
 * instead: an image route under a dynamic segment has no generateStaticParams
 * of its own, so Next fills the parameter with a placeholder and emits
 * `/-/opengraph-image.png`, which resolves to nothing.
 *
 * The file therefore stays at the root, where it is served unparameterised at
 * /opengraph-image.png, and is pointed at from here. Relative is fine: it
 * resolves against metadataBase. Regenerate with scripts/brand-images.py.
 */
const OG_IMAGE = {
  url: "/opengraph-image.png",
  width: 1200,
  height: 630,
  alt: `The trinity disc — Scholarly, Professional and Creative around a portrait of ${NAME}`,
};

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = getDictionary(lang);

  return {
    // Everything relative below — canonicals, hreflang, and the og:image Next
    // derives from app/opengraph-image.png — is resolved against this. Omit it
    // and Next warns at build and emits localhost URLs into production.
    metadataBase: SITE_URL,
    title: {
      default: NAME,
      template: `%s — ${NAME}`,
    },
    description: dict.profile,
    authors: [{ name: NAME }],
    creator: NAME,
    // No `alternates` here. Metadata is inherited, so a canonical set on the
    // layout would tell crawlers that /en/cv is a duplicate of /en. Each page
    // declares its own via localeAlternates().
    openGraph: {
      type: "website",
      siteName: NAME,
      title: NAME,
      description: dict.profile,
      locale: OG_LOCALE[lang],
      alternateLocale: LOCALES.filter((l) => l !== lang).map((l) => OG_LOCALE[l]),
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: NAME,
      description: dict.profile,
      images: [OG_IMAGE],
    },
    // Belt and braces with robots.txt: preview URLs get crawled if anyone links
    // one, and a per-page noindex survives being linked directly.
    ...(INDEXABLE ? {} : { robots: { index: false, follow: false } }),
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return (
    <html lang={HTML_LANG[lang]} className={`${FONT_VARS} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
