import { trueSelf } from "@/content/writing/true-self";
import type { Locale } from "@/lib/i18n";

/**
 * Verse & Prose — the owner's own writing.
 *
 * Deliberately not modelled the way the CV is. Everywhere else on this site
 * English is canonical and Chinese is a set of overrides merged on top, with
 * anything missing falling back to English (see D16). That is right for a CV
 * entry: one fact, two languages.
 *
 * It is wrong here. These are original works. The poem in this folder was
 * written in Chinese and is a translation of nothing; an English version of a
 * poem is a *different work*, not a missing field. Under the CV model a
 * Chinese-only poem would surface on /en as though its translation had merely
 * been forgotten — or worse, would render blank.
 *
 * So a piece declares which languages it exists in, and the index lists only
 * what genuinely exists in the one being read. A piece that exists only in the
 * other language is still named and linked rather than hidden, because
 * silently dropping it would misstate the size of the body of work.
 */

export type PieceKind = "verse" | "prose";

/** Kinds in the order the index presents them. */
export const KIND_ORDER: readonly PieceKind[] = ["verse", "prose"];

export type PieceText = {
  /** Absent when the work is untitled. See pieceLabel. */
  title?: string;
  /**
   * Lines for verse, paragraphs for prose. An empty string is a stanza or
   * section break.
   *
   * Not Markdown, and not MDX. Where a poem breaks its lines is the work —
   * handing that to a parser gives away the one thing that must not be
   * guessed at, and it would add a build dependency and a fresh way to break
   * hydration (D15) to buy nothing.
   */
  body: string[];
  /** Dateline. Absolute, and omitted rather than invented. */
  date?: string;
};

export type Piece = {
  /** URL segment. Stable — changing it breaks any link already shared. */
  slug: string;
  kind: PieceKind;
  text: Partial<Record<Locale, PieceText>>;
};

/** Curatorial order, newest first. Not sorted by date: most pieces have none. */
export const PIECES: readonly Piece[] = [trueSelf];

/**
 * What to call a piece in a list.
 *
 * Untitled work is identified by its opening line, which is the convention for
 * it. The alternative would be inventing a title, and that is authoring
 * someone else's work — see the note on poems in CLAUDE.md §4.
 */
export function pieceLabel(text: PieceText): string {
  return text.title ?? text.body.find((line) => line.trim() !== "") ?? "";
}

export function findPiece(slug: string): Piece | undefined {
  return PIECES.find((piece) => piece.slug === slug);
}

/** The pieces that exist in `lang`, in curatorial order. */
export function piecesIn(lang: Locale): Piece[] {
  return PIECES.filter((piece) => piece.text[lang]);
}

/**
 * Where a piece lives when it does not live in `lang` — null if it does.
 * Callers use this to name and link it rather than pretend it is not there.
 */
export function otherLocaleOf(piece: Piece, lang: Locale): Locale | null {
  if (piece.text[lang]) return null;
  const present = (Object.keys(piece.text) as Locale[]).filter((l) => piece.text[l]);
  return present[0] ?? null;
}
