import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  JetBrains_Mono,
  Noto_Sans_SC,
  Noto_Serif_SC,
  Space_Grotesk,
} from "next/font/google";
import { notFound } from "next/navigation";
import { HTML_LANG, LOCALES, getDictionary, hasLocale } from "@/lib/i18n";
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

const FONT_VARS = [
  cormorant.variable,
  grotesk.variable,
  jetbrains.variable,
  notoSerifSC.variable,
  notoSansSC.variable,
].join(" ");

// Both locales are known at build time, so every page stays static and the
// proxy only ever issues a redirect — it never renders.
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = getDictionary(lang);

  return {
    title: {
      default: 'Yixuan "Coda" Shi',
      template: '%s — Yixuan "Coda" Shi',
    },
    description: dict.profile,
    // Tells crawlers the two versions are one document in two languages, so
    // both get indexed instead of the redirect collapsing them into one.
    alternates: {
      languages: {
        en: "/en",
        "zh-Hans": "/zh",
      },
    },
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
