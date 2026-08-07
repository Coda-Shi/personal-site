import Link from "next/link";
import { NAME, PROFILE, TRACKS, TRACK_CLASSES, type Track } from "@/lib/content";

function TrackLink({ track, align }: { track: Track; align: "start" | "center" | "end" }) {
  const c = TRACK_CLASSES[track.id];
  const alignment =
    align === "end"
      ? "md:items-end md:text-right"
      : align === "center"
        ? "md:items-center md:text-center"
        : "md:items-start md:text-left";

  return (
    <Link
      href={`/${track.id}`}
      className={`group flex max-w-xs flex-col gap-2 ${alignment}`}
    >
      <span
        aria-hidden="true"
        className={`font-display text-4xl leading-none ${c.text}`}
      >
        {track.glyph}
      </span>
      <span className="font-display text-3xl leading-tight tracking-tight">
        {track.title}
      </span>
      <span
        aria-hidden="true"
        className={`h-px w-10 origin-left transition-transform duration-300 group-hover:scale-x-[2.4] ${c.bg} ${
          align === "end" ? "md:origin-right" : ""
        }`}
      />
      <span className="text-sm leading-relaxed text-graphite">{track.lede}</span>
    </Link>
  );
}

// The portrait is the axis of the composition and the only way inward. It carries
// no track colour and no glyph — see the design brief in CLAUDE.md.
function Portrait() {
  return (
    <Link
      href="/coda"
      className="group flex flex-col items-center gap-3"
      aria-label="Coda himself — writer and advocate"
    >
      <span className="flex size-40 items-center justify-center rounded-full border border-ink bg-paper transition-colors duration-300 group-hover:bg-ink md:size-48">
        <span className="font-display text-3xl italic transition-colors duration-300 group-hover:text-paper">
          Coda
        </span>
      </span>
      <span className="label text-ash transition-colors duration-300 group-hover:text-ink">
        himself
      </span>
    </Link>
  );
}

export default function Home() {
  const [scholarly, professional, creative] = TRACKS;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-between gap-16 px-6 py-12 md:px-10 md:py-16">
      <header className="max-w-2xl">
        <h1 className="font-display text-5xl leading-[0.95] font-light tracking-tight md:text-7xl">
          {NAME}
        </h1>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-graphite md:text-base">
          {PROFILE}
        </p>
      </header>

      <nav
        aria-label="Sections"
        className="flex flex-col items-center gap-12 md:grid md:grid-cols-[1fr_auto_1fr] md:grid-rows-[auto_auto] md:items-center md:gap-x-12 md:gap-y-16"
      >
        <div className="md:col-start-2 md:row-start-2">
          <Portrait />
        </div>
        <div className="md:col-start-2 md:row-start-1 md:flex md:justify-center">
          <TrackLink track={scholarly} align="center" />
        </div>
        <div className="md:col-start-1 md:row-start-2 md:flex md:justify-end">
          <TrackLink track={creative} align="end" />
        </div>
        <div className="md:col-start-3 md:row-start-2">
          <TrackLink track={professional} align="start" />
        </div>
      </nav>

      <footer className="flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-rule pt-6">
        <Link href="/cv" className="label text-graphite hover:text-ink">
          Curriculum vitae
        </Link>
        <a
          href="https://elegists.studio"
          className="label text-graphite hover:text-ink"
          rel="noreferrer"
        >
          Elegists Studio
        </a>
        <a
          href="https://github.com/Coda-Shi"
          className="label text-graphite hover:text-ink"
          rel="noreferrer"
        >
          GitHub
        </a>
      </footer>
    </main>
  );
}
