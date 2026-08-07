import Link from "next/link";
import { NAME } from "@/lib/content";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10 md:px-10 md:py-14">
      <Link href="/" className="label text-ash transition-colors hover:text-ink">
        ← {NAME}
      </Link>
      <div className="mt-10 flex-1 md:mt-14">{children}</div>
      <footer className="mt-20 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-rule pt-6">
        <Link href="/cv" className="label text-graphite hover:text-ink">
          Curriculum vitae
        </Link>
        <Link href="/coda" className="label text-graphite hover:text-ink">
          Coda himself
        </Link>
      </footer>
    </main>
  );
}
