import Link from "next/link";
import { TrinityDisc } from "@/components/trinity-disc";
import { NAME, PROFILE } from "@/lib/content";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-8 md:px-10 md:py-10">
      <header className="max-w-xl">
        <h1 className="font-display text-4xl leading-[0.95] font-light tracking-tight md:text-6xl">
          {NAME}
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-bone/70">{PROFILE}</p>
      </header>

      <div className="flex flex-1 items-center justify-center py-4">
        <TrinityDisc />
      </div>

      <footer className="flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-bone/20 pt-5">
        <Link href="/cv" className="label text-bone/60 transition-colors hover:text-bone">
          Curriculum vitae
        </Link>
        <a
          href="https://elegists.studio"
          className="label text-bone/60 transition-colors hover:text-bone"
          rel="noreferrer"
        >
          Elegists Studio
        </a>
        <a
          href="https://github.com/Coda-Shi"
          className="label text-bone/60 transition-colors hover:text-bone"
          rel="noreferrer"
        >
          GitHub
        </a>
      </footer>
    </main>
  );
}
