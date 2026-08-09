import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrackPage } from "@/components/track-page";
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
        <div className="mt-6 space-y-8">
          {EDUCATION.map((item) => (
            <article key={item.org} className="border-t border-bone/20 pt-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <h3 className="font-display text-2xl leading-tight tracking-tight">{item.org}</h3>
                <span className="label whitespace-nowrap text-bone/55">{item.period}</span>
              </div>
              <p className="mt-2 text-sm font-medium">
                {item.role}
                <span className="text-bone/55"> · {item.location}</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-bone/75">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>
    </TrackPage>
  );
}
