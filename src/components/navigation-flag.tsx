"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import { nav } from "@/lib/navigation";

/**
 * Marks the document once the visitor has navigated within the site.
 *
 * A page reached by a client-side navigation arrives by transition — the old
 * page dissolves over it, and a track's mark travels from the disc to the top
 * of its column. A page reached cold, by URL, arrives by drawing itself. Those
 * two entrances must not both play: a mark that has just flown into place and
 * then re-draws itself from nothing reads as a stutter, not as an entrance.
 *
 * So the mark's plot animation is switched off by CSS whenever this attribute
 * is present. It is set in a layout effect rather than a passive one so that
 * it lands in the same frame as the new page, before any of its animations
 * have started; the plot has a 150ms delay, so even a late passive effect
 * would arrive in time, but there is no reason to rely on that.
 *
 * Never set on the first render: a fresh document has no history to speak of.
 *
 * It also records each committed pathname in `nav.from`, so that the next page
 * can tell, while it renders, where the visitor came from — the home page
 * reads it to decide whether to draw itself or to close the flood it left.
 */
export function NavigationFlag() {
  const pathname = usePathname();
  const first = useRef(pathname);
  useLayoutEffect(() => {
    if (pathname !== first.current) document.documentElement.dataset.navigated = "";
    nav.from = pathname;
  }, [pathname]);
  return null;
}
