"use client";

import Link from "next/link";
import { useState } from "react";
import { LanguageToggle } from "@/components/language-toggle";
import { TrinityDisc, type Focus } from "@/components/trinity-disc";
import { NAME } from "@/lib/content";
import type { Dictionary, Locale } from "@/lib/i18n";

/**
 * Owns which sector is lit, because two separate things react to it: the disc,
 * and the intro copy in the top-left corner.
 *
 * The copy has to get out of the way when a beam fires. Painting the beam over
 * it instead does not work — the Scholarly wedge points up, so its edge cuts
 * diagonally through the paragraph and would erase half of it while leaving
 * the rest, which reads as a rendering fault rather than as a design. Fading
 * it out clears the whole corner and hands that space to the symbol field.
 *
 * The name stays. It is one short line, it sits clear of every wedge, and
 * without it a lit page has nobody's name on it.
 */
export function HomeStage({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const [focus, setFocus] = useState<Focus>(null);

  // The hub lights no beam, so it should not clear the copy either.
  const lit = focus !== null && focus !== "hub";
  const recede = {
    opacity: lit ? 0 : 1,
    // Out of the way quickly, back slowly: the beam takes 700ms to arrive and
    // the copy should be gone before it lands, but returning in a hurry snaps.
    transition: `opacity ${lit ? 260 : 620}ms ease-out`,
  };

  return (
    // `home-stage` carries no layout. It is the scope for the classical
    // English treatment in globals.css, which must not reach the CV pages —
    // see D12.
    <main className="home-stage relative grid h-dvh w-full place-items-center overflow-hidden">
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
        {/* The entrance animation lives on a wrapper and the recede on the
            text. They cannot share an element: a finished animation with
            fill-mode `both` pins opacity to its end value and the transition
            never gets a say. */}
        <div style={{ animation: "rise-in 700ms ease-out 130ms both" }}>
          <p
            className="intro-copy hide-when-short mt-3 max-w-xs text-xs leading-relaxed text-bone/70 md:max-w-sm md:text-sm xl:max-w-md"
            style={recede}
          >
            {dict.profile}
          </p>
        </div>
        <div style={{ animation: "rise-in 700ms ease-out 260ms both" }}>
          <p className="label mt-3 w-fit text-bone/45" style={recede}>
            {dict.hint}
          </p>
          {/* The instruction proper. The line above says the disc responds;
              this one says what choosing actually means. */}
          <p className="label mt-1.5 w-fit text-bone/35" style={recede}>
            {dict.hintTwo}
          </p>
        </div>
      </header>

      <div className="w-full px-6">
        <TrinityDisc lang={lang} dict={dict} focus={focus} setFocus={setFocus} />
      </div>

      <footer
        className="absolute inset-x-6 bottom-6 z-10 flex flex-wrap items-center gap-x-8 gap-y-2 md:inset-x-10 md:bottom-8"
        style={{ animation: "rise-in 700ms ease-out 1850ms both" }}
      >
        <Link href={`/${lang}/cv`} className="label text-bone/55 transition-colors hover:text-bone">
          {dict.nav.cv}
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
        <LanguageToggle lang={lang} label={dict.switchTo} />
      </footer>
    </main>
  );
}
