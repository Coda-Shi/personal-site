import { HTML_LANG, type Locale } from "@/lib/i18n";
import type { PieceKind, PieceText } from "@/lib/writing";

/**
 * Sets one piece of writing.
 *
 * The face is chosen by the language of *the piece*, never of the page: a
 * Chinese poem read on /en is still Chinese and must still be Fangsong. That
 * is also why `lang` is set here rather than inherited — it is what routes the
 * text to Zhuque Fangsong, and it happens to be true, which is the better
 * reason.
 *
 * Fangsong has to be named explicitly. The :lang(zh) rule in globals.css only
 * rewrites italics, so without this a Chinese piece inherits --font-display
 * and comes out in Noto Serif SC, a Song face. Fangsong is what Chinese sets
 * literary text in, and D17 already vendored it.
 */
export function PieceBody({
  text,
  kind,
  locale,
  className = "",
}: {
  text: PieceText;
  kind: PieceKind;
  /** The language the text is written in. */
  locale: Locale;
  className?: string;
}) {
  const verse = kind === "verse";
  const chinese = locale === "zh";

  return (
    <div
      lang={HTML_LANG[locale]}
      // Verse is set larger and much looser: the line is the unit, and the
      // measure is set by the longest line rather than by a column width.
      // Prose gets a reading measure and ordinary leading.
      className={`${verse ? "text-xl leading-[2.1] md:text-2xl" : "max-w-[34em] text-lg leading-[1.9]"} ${className}`}
      style={chinese ? { fontFamily: "var(--font-fangsong)" } : undefined}
    >
      {text.body.map((line, i) =>
        line.trim() === "" ? (
          // A stanza or section break — one blank line of the current leading,
          // which is what 1lh means. Indices as keys because a refrain can
          // repeat a line verbatim and nothing here ever reorders.
          <div key={i} aria-hidden="true" className={verse ? "h-[1lh]" : "h-[0.6lh]"} />
        ) : (
          <p key={i} className={verse ? undefined : "mt-[1.1em] first:mt-0"}>
            {line}
          </p>
        ),
      )}
    </div>
  );
}
