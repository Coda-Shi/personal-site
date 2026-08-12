import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomeStage } from "@/components/home-stage";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { localeAlternates } from "@/lib/site";

// Title and description are inherited from the layout. This exists only to give
// the home page a self-canonical and its hreflang pair, which the layout cannot
// supply without handing the same ones to every page beneath it.
export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { alternates: localeAlternates(lang) };
}

// The disc must land dead centre of the viewport on open, so the header and
// footer are taken out of flow rather than allowed to push it down. The page is
// exactly one viewport tall and does not scroll. Layout and state both live in
// HomeStage, which needs to be a client component — lighting a sector changes
// the intro copy as well as the disc. The dictionary is resolved here, on the
// server, and handed down as plain strings.
export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return <HomeStage lang={lang} dict={getDictionary(lang)} />;
}
