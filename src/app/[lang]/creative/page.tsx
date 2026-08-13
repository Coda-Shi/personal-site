import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrackPage } from "@/components/track-page";
import { TRACKS } from "@/lib/content";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { localeAlternates } from "@/lib/site";

const track = TRACKS.find((t) => t.id === "creative")!;

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/creative">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const copy = getDictionary(lang).tracks[track.id];
  return {
    title: copy.title,
    description: copy.lede,
    alternates: localeAlternates(lang, "/creative"),
  };
}

export default async function Page({ params }: PageProps<"/[lang]/creative">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return (
    <TrackPage lang={lang} track={track}>
      <p className="mt-12 text-sm leading-relaxed text-bone/75">
        Elegists Studio keeps its own home at{" "}
        <a
          href="https://elegists.studio"
          className="underline decoration-bone/50 decoration-2 underline-offset-4 transition-colors hover:decoration-bone"
          rel="noreferrer"
        >
          elegists.studio
        </a>
        .
      </p>
    </TrackPage>
  );
}
