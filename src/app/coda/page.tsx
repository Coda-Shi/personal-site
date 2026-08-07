import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { ADVOCACY } from "@/lib/content";

export const metadata: Metadata = {
  title: "Coda himself",
  description: "Writer and advocate.",
};

// No ground colour, no glyph, a narrower measure, more serif. The three public
// identities are encoded; this one is not. See D9 in CLAUDE.md.
export default function Page() {
  return (
    <SiteShell>
      <header className="max-w-xl">
        <h1 className="font-display text-5xl leading-none font-light tracking-tight md:text-6xl">
          Coda himself
        </h1>
        <p className="mt-6 font-display text-2xl leading-snug italic text-bone/70">
          as a writer and an advocate
        </p>
      </header>

      <section className="mt-16 max-w-xl">
        <h2 className="label text-bone/55">Poems</h2>
        <p className="mt-6 font-display text-2xl leading-relaxed italic text-bone/45">
          Not yet published here.
        </p>
      </section>

      <section className="mt-16">
        <h2 className="label text-bone/55">Advocacy</h2>
        <div className="mt-6 space-y-8">
          {ADVOCACY.map((item) => (
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
    </SiteShell>
  );
}
