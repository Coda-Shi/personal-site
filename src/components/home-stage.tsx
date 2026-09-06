"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LanguageSwitch } from "@/components/language-switch";
import { ENTRANCE, TrinityDisc, type Focus } from "@/components/trinity-disc";
import { EMAILS, INSTAGRAM, NAME, type TrackId } from "@/lib/content";
import type { Dictionary, Locale } from "@/lib/i18n";
import { nav } from "@/lib/navigation";

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
 *
 * On a phone the footer goes too. There the footer is not a quiet row at the
 * bottom of a big screen but a stack — two addresses and a wrapped nav —
 * sitting right under the disc, and the owner wants the bloom to have the
 * whole screen: 颜色绽放的时候就隐去下面的那些联系方式诗文什么的. Desktop is
 * untouched. Done in CSS off a `data-lit` attribute (see globals.css), on an
 * inner wrapper rather than the footer itself, because the footer carries
 * the entrance animation and a finished animation pins opacity — D10.
 */
/**
 * How the page arrives, decided once, on the first render.
 *
 * Cold — by URL, with no history in this document — it draws itself: the
 * entrance. Reached from elsewhere on the site it is *already there*: the
 * disc drawn, nothing animating, touchable at once. The page you are leaving
 * dissolves over it. And if the page you are leaving is one of the three
 * track pages, its pigment is still across the whole screen and its symbols
 * are still in their places, so the home page arrives in that state and then
 * closes it — the flood draws back into its circle, the symbols fade. The
 * owner's words for what he wanted instead of the entrance replaying: 符号复归
 * 原位，然后颜色消失.
 *
 * `nav.from` is the previous page's path, and it is `null` on the server and
 * on the first render of a fresh document alike, so a cold load reads the
 * same on both sides. See lib/navigation.ts.
 */
function arrival(): { settled: boolean; returning: TrackId | null } {
  const from = nav.from;
  if (from === null) return { settled: false, returning: null };
  const track = /^\/(?:en|zh)\/(scholarly|professional|creative)\/?$/.exec(from)?.[1];
  return { settled: true, returning: (track as TrackId | undefined) ?? null };
}

export function HomeStage({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const [focus, setFocus] = useState<Focus>(null);

  /**
   * 🔴 Nothing is clickable or hoverable until the entrance has played out.
   *
   * Every circle answers a hover by flooding the screen with its pigment, and
   * a pointer that happens to be resting over the disc — or that arrives two
   * hundred milliseconds in — fired that flood on top of a composition still
   * drawing itself. Two animations with contradictory ideas about what the
   * page looks like, and the entrance loses.
   *
   * `false` on the server and on the first client render, so this cannot
   * mismatch during hydration; it is only ever turned on afterwards. Under
   * `prefers-reduced-motion` the entrance collapses to nothing, so the gate
   * has to collapse with it — otherwise the page would sit inert for two and a
   * half seconds with nothing visibly happening, which is worse than the
   * problem being solved.
   */
  const [{ settled, returning }] = useState(arrival);
  const [ready, setReady] = useState(settled);
  useEffect(() => {
    if (ready) return;
    // One timer either way, rather than an early `setReady(true)` — setting
    // state synchronously inside an effect is a lint error and, more to the
    // point, a re-render the browser has not asked for yet.
    const instant = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setReady(true), instant ? 0 : ENTRANCE.done);
    return () => window.clearTimeout(timer);
  }, [ready]);

  /** The entrance's rise, or nothing at all on a page that is already here. */
  const enter = (delay: number) =>
    settled ? undefined : { animation: `rise-in 700ms ease-out ${delay}ms both` };

  // The hub lights no beam, so it should not clear the copy either.
  const lit = focus !== null && focus !== "hub";
  const recede = {
    opacity: lit ? 0 : 1,
    // Out of the way quickly, back slowly: the beam takes 900ms to arrive and
    // the copy should be gone before it lands, but returning in a hurry snaps.
    transition: `opacity ${lit ? 260 : 620}ms ease-out`,
  };

  const emails = EMAILS.map((address) => (
    <a
      key={address}
      href={`mailto:${address}`}
      className="link-line label email-link text-bone/55 transition-colors hover:text-bone"
    >
      {address}
    </a>
  ));

  return (
    // `home-stage` carries no layout. It is the scope for the classical
    // English treatment in globals.css, which must not reach the CV pages —
    // see D12.
    <main
      className={`home-stage relative grid h-dvh w-full place-items-center overflow-hidden ${
        ready ? "" : "pointer-events-none"
      }`}
      data-lit={lit ? "" : undefined}
    >
      {/* From md up: top-right, opposite the name, outside the header so it
          does not recede with the intro copy when a beam fires.

          On a phone it moves above the footer nav instead. Top-right does not
          work there — at 375 the block runs back across the profile paragraph
          and sits on top of the symbol field, which now fills the screen. */}
      <div className="absolute top-6 right-6 z-10 hidden flex-col items-end gap-0.5 md:flex md:top-9 md:right-10">
        {emails}
      </div>

      <header className="absolute inset-x-6 top-6 z-10 md:inset-x-10 md:top-9">
        {/* Every line is w-fit or width-capped. A full-width block box at
            top-left reaches under the centred disc even when its text does
            not, which makes overlap impossible to reason about — cap the boxes
            and the geometry becomes checkable. */}
        <h1
          className="home-name oldstyle w-fit font-display text-2xl leading-none font-light tracking-tight md:text-3xl"
          style={enter(0)}
        >
          {NAME}
        </h1>
        {/* The entrance animation lives on a wrapper and the recede on the
            text. They cannot share an element: a finished animation with
            fill-mode `both` pins opacity to its end value and the transition
            never gets a say. */}
        <div style={enter(130)}>
          {/* Two lines: the three faces, then what they span. The roles line
              is brighter and stays on one line where it can — it is the
              caption to the disc below it. */}
          <p className="intro-copy mt-3 max-w-xs text-bone/85 md:max-w-sm xl:max-w-md" style={recede}>
            {dict.roles}
          </p>
          <p
            className="intro-copy hide-when-short hide-when-narrow mt-1.5 max-w-xs text-xs leading-relaxed text-bone/60 md:max-w-sm md:text-sm xl:max-w-md"
            style={recede}
          >
            {dict.profile}
          </p>
        </div>
        <div style={enter(260)}>
          {/* Capped to the same column as the two lines above it, not `w-fit`.
              It is a full sentence, and tracked-out capitals set it 515px wide
              — wider than the paragraph it sits under, so the block bulged at
              the bottom, and on a landscape phone it ran most of the way
              across the screen. It is also what the symbol field's reserved
              corner has to be sized around, and a line that never wraps makes
              that corner grow with every narrower window. */}
          {/* Dropped on a short window, with the paragraph. At 812×375 the
              header otherwise runs to half the screen's height, and the symbol
              board fits by height there, so guarding it would cost every
              desktop half its field to protect one line on an orientation
              nobody holds a phone in. A landscape phone taps; it does not need
              telling to. */}
          <p
            className="label hide-when-short mt-3 max-w-xs text-bone/45 md:max-w-sm xl:max-w-md"
            style={recede}
          >
            {/* One block per sentence: what to do, then what it is for. The
                break is the owner's and holds at every measure — see HINT. */}
            {dict.hint.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
        </div>
      </header>

      <div className="w-full px-6">
        <TrinityDisc
          lang={lang}
          dict={dict}
          focus={focus}
          setFocus={setFocus}
          settled={settled}
          returning={returning}
        />
      </div>

      <footer
        className="absolute inset-x-6 bottom-6 z-10 md:inset-x-10 md:bottom-8"
        style={enter(ENTRANCE.footer)}
      >
        {/* One wrapper for everything in the footer, so that on a phone it can
            step aside for the flood as a block (see the note at the top). */}
        <div className="footer-body">
        {/* Phones only — the same two links live top-right from md up, and
            the consultation shares their line rather than taking one of its
            own. A phone footer is already three rows deep; the addresses are
            the shortest thing in it and the only row with space to the right
            of it, which is where the owner asked for this to go.

            Two lines inside the box, not one: "CONSULT ME · IN PREPARATION"
            set in tracked capitals is 275px, and there are about 170 to play
            with. Stacked it is 126 and it stands as tall as the two addresses
            beside it. The desktop copy of it is in the row below, where there
            is room for one line. */}
        <div className="mb-3 flex items-center justify-between gap-3 md:hidden">
          <span className="flex flex-col gap-0.5">{emails}</span>
          <span className="label consult consult-phone flex shrink-0 flex-col items-end gap-px border px-2.5 py-1 leading-tight text-bone/60">
            {dict.consult.label}
            <span className="text-bone/35">{dict.consult.status}</span>
          </span>
        </div>

        {/* Tighter gaps under md, so that the language switch, the writing,
            the CV and the marks all sit on one line — the owner asked for
            that row not to wrap. Measured at 375: 294 of 327. It still wraps
            below about 330, and gap-y-2 is what catches it when it does. */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 md:gap-x-8">
        {/* First in the row, at the owner's request: which language you are
            reading is the first thing to settle, before where to go. */}
        <LanguageSwitch
          lang={lang}
          label={dict.switchTo}
          className="border-r border-bone/25 pr-3 md:pr-8"
        />
        {/* Set apart from the utility links, and in the display face rather
            than in .label, because it is a place and they are tools.

            It goes in the footer and not on the disc on purpose. The ring
            encodes the three public identities; D9 requires the private self
            to stay unencoded, and the writing is the deepest part of that — a
            fourth sector or a fourth mark would contradict the one thing the
            composition is saying. On a desktop the footer is also the half of
            the screen that does not recede when a beam fires, so the door
            stays open while the visitor is exploring; on a phone it steps
            aside with everything else (see the note at the top). */}
        <Link
          href={`/${lang}/writing`}
          className="link-line border-r border-bone/25 pr-3 font-display text-lg italic text-bone/70 transition-colors hover:text-bone md:pr-8"
        >
          {dict.nav.writing}
        </Link>
        <Link href={`/${lang}/cv`} className="link-line label text-bone/55 transition-colors hover:text-bone">
          {dict.nav.cv}
        </Link>
        {/* Icons, not words: the footer had four text links competing for one
            line on a phone, and these are the only items on it that are
            elsewhere rather than here. Instagram's mark is drawn — see the
            note in content.ts on why it is not the real logo. Each keeps an
            accessible name, since an icon on its own has none.

            GitHub was here and the owner had it removed outright: 全面删除
            github 入口. It was the only link in the footer pointing at work
            nobody comes to this site for, and dropping it is most of what
            makes the phone row fit on one line. */}
        <span className="flex items-center gap-3 md:gap-4">
          {/* The studio, as its lyre and quill rather than as its name, at
              the owner's word. Taller than the two beside it and the same
              width, so the row keeps its rhythm while the mark keeps its
              proportion; it is a real logo and cannot be restroked, so the
              hover is carried on opacity where theirs is carried on colour.
              The name survives as the link's accessible name. */}
          <a
            href="https://elegists.studio"
            aria-label={dict.nav.studio}
            rel="noreferrer"
            className="opacity-55 transition-opacity hover:opacity-100"
          >
            {/* 🔴 Eager. It is 24px tall and always inside the first
                viewport — there is nothing to defer — and lazily it was
                measured on production sitting at naturalWidth 0 twelve
                seconds in, leaving a hole between the CV and Instagram. The
                footer sits at the bottom of an `h-dvh` page that never
                scrolls, which is exactly the case the lazy heuristic is
                worst at. */}
            <Image
              src="/creative/elegists-mark.png"
              alt=""
              width={17}
              height={24}
              loading="eager"
              className="h-6 w-auto"
            />
          </a>
          <a
            href={INSTAGRAM}
            aria-label="Instagram"
            rel="noreferrer"
            className="text-bone/55 transition-colors hover:text-bone"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="size-[1.1rem]"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.3" cy="6.7" r="0.9" fill="currentColor" stroke="none" />
            </svg>
          </a>
        </span>
        {/* Bottom right, which on a desktop is the far end of this row and on
            a phone is the end of the last line it wraps to. `ml-auto` rather
            than a second absolutely-positioned block, so it inherits the
            footer's entrance and — on a phone — steps aside with it when a
            sector lights.

            A hairline rectangle, not a pill: everything else on this site is
            either a straight rule or a circle, and a rounded button would be
            the only soft-cornered object on the page. Quieter than the links
            beside it on purpose. There is nowhere for it to go yet, so it is
            a span and says why. */}
        <span className="label consult ml-auto hidden items-center gap-2.5 border px-3.5 py-1.5 text-bone/60 md:flex">
          {dict.consult.label}
          <span aria-hidden="true" className="text-bone/30">
            ·
          </span>
          <span className="text-bone/35">{dict.consult.status}</span>
        </span>
        </div>
        </div>
      </footer>
    </main>
  );
}
