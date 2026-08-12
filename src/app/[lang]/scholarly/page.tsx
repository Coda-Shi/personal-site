import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecordList, TrackPage } from "@/components/track-page";
import { EDUCATION, TRACKS } from "@/lib/content";
import { getDictionary, hasLocale } from "@/lib/i18n";

const track = TRACKS.find((t) => t.id === "scholarly")!;

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/scholarly">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const copy = getDictionary(lang).tracks[track.id];
  return { title: copy.title, description: copy.lede };
}

export default async function Page({ params }: PageProps<"/[lang]/scholarly">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <TrackPage lang={lang} track={track}>
      <section className="mt-16">
        <h2 className="label text-bone/55">{dict.headings.education}</h2>
        <RecordList items={EDUCATION} overrides={dict.education} />
      </section>
    </TrackPage>
  );
}
