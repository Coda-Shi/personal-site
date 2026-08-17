"use client";

import { useState } from "react";

/**
 * A Bilibili video that loads only once you ask for it.
 *
 * The player is a third-party iframe: it sets cookies and reports the visit
 * whether or not anyone presses play. This site goes out of its way to avoid
 * that — the fonts are self-hosted precisely so a reader's browser makes no
 * request to Google (D8) — and dropping an autoloading embed here would give
 * that away for one video.
 *
 * So what renders is a facade: a still card, no network. Clicking it swaps in
 * the real player, and only then does anything leave the page. The card is
 * also a link, so it keeps working with JavaScript off and middle-click still
 * opens the video where it lives.
 */
export function VideoEmbed({
  bvid,
  title,
  caption,
  playLabel,
}: {
  bvid: string;
  title: string;
  caption: string;
  playLabel: string;
}) {
  const [playing, setPlaying] = useState(false);
  const watch = `https://www.bilibili.com/video/${bvid}/`;

  if (playing) {
    return (
      <div className="mt-6 aspect-video w-full overflow-hidden border border-bone/25">
        <iframe
          // `autoplay=1` because the visitor has already pressed play once —
          // asking twice for the same thing is the worst of both designs.
          src={`https://player.bilibili.com/player.html?bvid=${bvid}&autoplay=1&high_quality=1`}
          title={title}
          allow="autoplay; fullscreen; encrypted-media"
          allowFullScreen
          className="size-full border-0"
        />
      </div>
    );
  }

  return (
    <a
      href={watch}
      rel="noreferrer"
      onClick={(event) => {
        // Let modified clicks and middle-click do the ordinary thing.
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        setPlaying(true);
      }}
      className="group mt-6 flex aspect-video w-full flex-col items-center justify-center gap-4 border border-bone/25 transition-colors hover:border-bone/60"
    >
      <span className="flex size-14 items-center justify-center rounded-full border border-bone/50 transition-colors group-hover:border-bone group-hover:bg-bone">
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="ml-1 size-5 fill-bone transition-colors group-hover:fill-void"
        >
          <path d="M6 3.5 20 12 6 20.5Z" />
        </svg>
      </span>
      <span className="text-center">
        <span className="block font-display text-xl leading-snug text-bone/85 transition-colors group-hover:text-bone">
          {title}
        </span>
        <span className="label mt-1.5 block text-bone/45">{caption}</span>
      </span>
      <span className="sr-only">{playLabel}</span>
    </a>
  );
}
