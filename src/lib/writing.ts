import { trueSelf } from "@/content/writing/true-self";
import { train } from "@/content/writing/train";
import { belonging } from "@/content/writing/belonging";
import { howToDecipher } from "@/content/writing/how-to-decipher";
import { resistance } from "@/content/writing/resistance";
import { wordlessRevelryI } from "@/content/writing/wordless-revelry-i";
import { wordlessRevelryII } from "@/content/writing/wordless-revelry-ii";
import { wordlessRevelryIII } from "@/content/writing/wordless-revelry-iii";
import { thoseWhoAsk } from "@/content/writing/those-who-ask";
import { response } from "@/content/writing/response";
import { lovePoemI } from "@/content/writing/love-poem-i";
import { lovePoemII } from "@/content/writing/love-poem-ii";
import { aMachine } from "@/content/writing/a-machine";
import { giveYourself } from "@/content/writing/give-yourself";
import { lala } from "@/content/writing/lala";
import { toBecomeACreator } from "@/content/writing/to-become-a-creator";
import { letterI } from "@/content/writing/letter-i";
import { letterII } from "@/content/writing/letter-ii";
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

export type PieceKind = "verse" | "prose" | "letter";

/** Kinds in the order the index presents them. */
export const KIND_ORDER: readonly PieceKind[] = ["verse", "prose", "letter"];

export type PieceText = {
  /** Absent when the work is untitled. See pieceLabel. */
  title?: string;
  /**
   * A second line under the title — the part number of a sequence, say. Kept
   * separate so the three parts of one sequence share a title and read as one
   * work in three pieces rather than as three unrelated ones.
   */
  subtitle?: string;
  /** A closing note: a dedication, a provenance. Set under the piece. */
  note?: string;
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

/**
 * Curatorial order, not chronological — almost none of these carry a date.
 * The index groups by kind and preserves this order inside each group, so
 * this list is the running order of the section.
 */
export const PIECES: readonly Piece[] = [
  trueSelf,
  train,
  belonging,
  resistance,
  howToDecipher,
  wordlessRevelryI,
  wordlessRevelryII,
  wordlessRevelryIII,
  thoseWhoAsk,
  response,
  lovePoemI,
  lovePoemII,
  aMachine,
  giveYourself,
  lala,
  toBecomeACreator,
  letterI,
  letterII,
];

/**
 * The handful shown on /coda. That page is an introduction, not a table of
 * contents — the full list lives at /writing.
 */
export const FEATURED: readonly string[] = [
  "those-who-ask",
  "wordless-revelry-i",
  "wordless-revelry-ii",
  "wordless-revelry-iii",
  "train",
  "resistance",
  "lala",
];

/** FEATURED resolved to pieces, in that order, skipping any that vanish. */
export function featuredPieces(): Piece[] {
  return FEATURED.map(findPiece).filter((piece): piece is Piece => Boolean(piece));
}

/**
 * What to call a piece in a list.
 *
 * Untitled work is identified by its opening line, which is the convention for
 * it. The alternative would be inventing a title, and that is authoring
 * someone else's work — see the note on poems in CLAUDE.md §4.
 */
export function pieceLabel(text: PieceText): string {
  if (text.title) return text.title;
  const opening = text.body.find((line) => line.trim() !== "") ?? "";
  // Some untitled pieces open with a whole paragraph, and one is a single
  // unbroken line repeated nine times. An index has to stay an index.
  return opening.length > 24 ? opening.slice(0, 24) + "…" : opening;
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
