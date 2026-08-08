import Link from "next/link";
import { TrinityDisc } from "@/components/trinity-disc";
import { HINT, NAME, PROFILE } from "@/lib/content";

// The disc must land dead centre of the viewport on open, so the header and
// footer are taken out of flow rather than allowed to push it down. The page
// is exactly one viewport tall and does not scroll.
export default function Home() {
  return (
    <main className="relative grid h-dvh w-full place-items-center overflow-hidden">
      <header className="absolute inset-x-6 top-6 z-10 md:inset-x-10 md:top-9">
        {/* Every line is w-fit or width-capped. A full-width block box at
            top-left reaches under the centred disc even when its text does
            not, which makes overlap impossible to reason about — cap the boxes
            and the geometry becomes checkable. */}
        <h1
          className="oldstyle w-fit font-display text-2xl leading-none font-light tracking-tight md:text-3xl"
          style={{ animation: "rise-in 700ms ease-out both" }}
        >
          {NAME}
        </h1>
        <p
          className="hide-when-short mt-3 max-w-xs text-xs leading-relaxed text-bone/70 md:max-w-sm md:text-sm xl:max-w-md"
          style={{ animation: "rise-in 700ms ease-out 130ms both" }}
        >
          {PROFILE}
        </p>
        <p
          className="label mt-3 w-fit text-bone/45"
          style={{ animation: "rise-in 700ms ease-out 260ms both" }}
        >
          {HINT}
        </p>
      </header>

      <div className="w-full px-6">
        <TrinityDisc />
      </div>

      <footer
        className="absolute inset-x-6 bottom-6 z-10 flex flex-wrap items-center gap-x-8 gap-y-2 md:inset-x-10 md:bottom-8"
        style={{ animation: "rise-in 700ms ease-out 1850ms both" }}
      >
        <Link href="/cv" className="label text-bone/55 transition-colors hover:text-bone">
          Curriculum vitae
        </Link>
        <a
          href="https://elegists.studio"
          className="label text-bone/55 transition-colors hover:text-bone"
          rel="noreferrer"
        >
          Elegists Studio
        </a>
        <a
          href="https://github.com/Coda-Shi"
          className="label text-bone/55 transition-colors hover:text-bone"
          rel="noreferrer"
        >
          GitHub
        </a>
      </footer>
    </main>
  );
}
