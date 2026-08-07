import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { EntryList } from "@/components/track-page";
import {
  ADVOCACY,
  CONTACT_EMAIL,
  EDUCATION,
  NAME,
  PROFILE,
  SKILLS,
  TRACKS,
  TRACK_CLASSES,
} from "@/lib/content";

export const metadata: Metadata = {
  title: "Curriculum vitae",
  description: PROFILE,
};

export default function Page() {
  return (
    <SiteShell>
      <header className="max-w-2xl">
        <h1 className="font-display text-5xl leading-none font-light tracking-tight md:text-6xl">
          {NAME}
        </h1>
        <p className="mt-6 text-base leading-relaxed text-graphite">{PROFILE}</p>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="label mt-6 inline-block text-graphite underline underline-offset-4 hover:text-ink"
        >
          {CONTACT_EMAIL}
        </a>
      </header>

      <section className="mt-16">
        <h2 className="label text-ash">Education</h2>
        <div className="mt-6 space-y-8">
          {EDUCATION.map((item) => (
            <article key={item.org} className="border-t border-rule pt-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <h3 className="font-display text-2xl leading-tight tracking-tight">{item.org}</h3>
                <span className="label whitespace-nowrap text-ash">{item.period}</span>
              </div>
              <p className="mt-2 text-sm font-medium">
                {item.role}
                <span className="text-ash"> · {item.location}</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-graphite">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      {TRACKS.map((track) => (
        <section key={track.id} className="mt-16">
          <h2 className={`label ${TRACK_CLASSES[track.id].text}`}>
            <span aria-hidden="true">{track.glyph} </span>
            {track.title}
          </h2>
          <EntryList entries={track.entries} />
        </section>
      ))}

      <section className="mt-16">
        <h2 className="label text-ash">Advocacy</h2>
        <div className="mt-6 space-y-8">
          {ADVOCACY.map((item) => (
            <article key={item.org} className="border-t border-rule pt-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <h3 className="font-display text-2xl leading-tight tracking-tight">{item.org}</h3>
                <span className="label whitespace-nowrap text-ash">{item.period}</span>
              </div>
              <p className="mt-2 text-sm font-medium">
                {item.role}
                <span className="text-ash"> · {item.location}</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-graphite">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="label text-ash">Additional</h2>
        <dl className="mt-6 space-y-6">
          {SKILLS.map((group) => (
            <div key={group.heading} className="border-t border-rule pt-5">
              <dt className="text-sm font-medium">{group.heading}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-graphite">{group.items}</dd>
            </div>
          ))}
        </dl>
      </section>
    </SiteShell>
  );
}
