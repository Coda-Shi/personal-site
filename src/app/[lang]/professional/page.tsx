import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrackPage } from "@/components/track-page";
import { TRACKS } from "@/lib/content";
import { getDictionary, hasLocale } from "@/lib/i18n";

const track = TRACKS.find((t) => t.id === "professional")!;

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/professional">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const copy = getDictionary(lang).tracks[track.id];
  return { title: copy.title, description: copy.lede };
}

export default async function Page({ params }: PageProps<"/[lang]/professional">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return <TrackPage lang={lang} track={track} />;
}
