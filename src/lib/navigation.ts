/**
 * Where the visitor was a moment ago.
 *
 * Client-side module state, nothing more: NavigationFlag writes the pathname
 * here after every route commits, so while the *next* page is rendering the
 * value is still the page it is arriving from. The home page reads it during
 * its first render to decide how to arrive — drawn from nothing on a cold
 * load, or already there, closing the flood it left open, when the visitor is
 * coming back from a track page.
 *
 * Safe to read during render because it is only ever written on the client,
 * in a layout effect: on the server and on the first client render of a fresh
 * document it is `null` on both sides, so hydration cannot disagree. A page
 * reached by client navigation is not hydrated at all.
 */
export const nav = { from: null as string | null };
