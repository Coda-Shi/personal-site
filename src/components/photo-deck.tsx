"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { LivePhoto } from "@/content/performances";

/**
 * A deck of photographs: the current one on top, the next one underneath,
 * tilted and set back, and two arrows.
 *
 * The owner's own design — two cards, one flat and one askew beneath it —
 * and it is a better shape for this than a strip of thumbnails would be. The
 * page is a column of type; a strip would be a second layout inside it. A
 * deck is one object, the size of a paragraph, that happens to have more in
 * it.
 *
 * Turning a card is the next photograph *rising* from the tilted position
 * into the flat one, in one keyframe pass. That is the whole animation, and it
 * is the same in both directions — a deck does not have a reverse, and trying
 * to give it one (the top card sliding back under) read as a mistake in
 * testing rather than as an undo. Keyed on a turn counter rather than on the
 * index so that going round the whole deck and back to the first card still
 * plays the lift.
 *
 * Bone hairline frames, the same weight as the rules on the page; the under
 * card at less than half strength so it reads as depth, not as a second
 * picture competing with the first. The photographs themselves are shown as
 * they are — D14 keys *drawings* to bone; a photograph of a living person
 * stays in colour, for the reason given on the portrait.
 *
 * Arrows are real buttons with names, so the deck works from the keyboard and
 * is announced correctly. A swipe on touch does the same thing; the threshold
 * is generous, since a tap that wanders a few pixels must not turn the deck.
 */
export function PhotoDeck({
  photos,
  labels,
}: {
  photos: LivePhoto[];
  labels: { previous: string; next: string };
}) {
  const [index, setIndex] = useState(0);
  const [turn, setTurn] = useState(0);
  const pointerStart = useRef<number | null>(null);

  const count = photos.length;
  if (count === 0) return null;

  const current = photos[index];
  const next = photos[(index + 1) % count];

  const go = (step: number) => {
    setIndex((i) => (i + step + count) % count);
    setTurn((t) => t + 1);
  };

  return (
    <figure className="mt-8 max-w-lg">
      <div
        className="relative aspect-[3/2] w-full touch-pan-y select-none"
        onPointerDown={(event) => {
          pointerStart.current = event.clientX;
        }}
        onPointerUp={(event) => {
          if (pointerStart.current === null || count < 2) return;
          const dx = event.clientX - pointerStart.current;
          pointerStart.current = null;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
        onPointerCancel={() => {
          pointerStart.current = null;
        }}
      >
        {count > 1 ? (
          <div
            key={`under-${index}`}
            aria-hidden="true"
            className="deck-under absolute inset-0 overflow-hidden border border-bone/20 bg-void"
          >
            <Image
              src={next.src}
              alt=""
              fill
              sizes="(min-width: 768px) 32rem, 100vw"
              className="object-cover opacity-45"
            />
          </div>
        ) : null}
        <div
          key={`top-${turn}`}
          className={`absolute inset-0 overflow-hidden border border-bone/40 bg-void ${
            turn > 0 ? "deck-lift" : ""
          }`}
        >
          <Image
            src={current.src}
            alt={current.alt}
            fill
            sizes="(min-width: 768px) 32rem, 100vw"
            priority={index === 0}
            className="object-cover opacity-95"
          />
        </div>
      </div>

      {/* Set below the tilted card's reach, not tight under the frame. */}
      <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3">
        {count > 1 ? (
          <>
            <button type="button" onClick={() => go(-1)} aria-label={labels.previous} className="deck-arrow">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 5.5 8 12l6.5 6.5" />
              </svg>
            </button>
            <span className="label text-bone/55">
              {index + 1} / {count}
            </span>
            <button type="button" onClick={() => go(1)} aria-label={labels.next} className="deck-arrow">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
                <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
              </svg>
            </button>
          </>
        ) : null}
        {current.caption ? (
          <figcaption className="font-display text-base italic text-bone/60">{current.caption}</figcaption>
        ) : null}
      </div>
    </figure>
  );
}
