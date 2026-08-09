import { HINT, PROFILE, TRACKS, type TrackId } from "@/lib/content";

/**
 * Two locales, English canonical.
 *
 * Translation is landing incrementally, so the Chinese dictionary is allowed to
 * be a subset: anything it omits falls through to English rather than rendering
 * an empty slot. That is what makes it safe to ship a half-translated site — a
 * missing key degrades to the English string, never to a blank.
 *
 * Only Server Components should import this module. Both dictionaries are
 * statically imported, so pulling it into a Client Component would ship every
 * translation to the browser. Client components take the strings they need as
 * props instead.
 */
export const LOCALES = ["en", "zh"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/**
 * Set the moment the visitor picks a language by hand, and honoured forever
 * after. Automatic `Accept-Language` redirection is a well-known trap: without
 * a memory of an explicit choice it bounces anyone who deliberately wants the
 * other language, every single visit. See `src/proxy.ts`.
 */
export const LOCALE_COOKIE = "locale";

export function hasLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** BCP 47 tags for `<html lang>` and `hreflang`. */
export const HTML_LANG: Record<Locale, string> = {
  en: "en",
  zh: "zh-Hans",
};

type TrackCopy = { title: string; lede: string };

export type Dictionary = {
  profile: string;
  hint: string;
  tracks: Record<TrackId, TrackCopy>;
  hub: {
    /** The two halves of the disc's centre label. */
    name: string;
    qualifier: string;
    ariaLabel: string;
    heading: string;
    subheading: string;
  };
  nav: { cv: string; coda: string };
  headings: { education: string; poems: string; advocacy: string; contact: string };
  /** Shown on the control that switches to the *other* language. */
  switchTo: string;
};

const en: Dictionary = {
  profile: PROFILE,
  hint: HINT,
  // Derived rather than restated, so the English disc labels cannot drift from
  // the track pages they lead to.
  tracks: Object.fromEntries(
    TRACKS.map((t) => [t.id, { title: t.title, lede: t.lede }]),
  ) as Record<TrackId, TrackCopy>,
  hub: {
    name: "Coda",
    qualifier: "himself",
    ariaLabel: "Coda himself — writer and advocate",
    heading: "Coda himself",
    subheading: "as a writer and an advocate",
  },
  nav: { cv: "Curriculum vitae", coda: "Coda himself" },
  headings: {
    education: "Education",
    poems: "Poems",
    advocacy: "Advocacy",
    contact: "Contact",
  },
  switchTo: "中文",
};

/**
 * Signed off by the owner 2026-08-09. The three track names are two characters
 * each so they balance on the ring — §4 requires the three lines to read as
 * equals, and unequal label widths would quietly rank them.
 *
 * 学术 / 实务 is a standing opposition in Chinese (theory against practice),
 * which does the same work the English adjectives do not: it binds the first
 * two and leaves 创作 standing apart.
 *
 * The name stays Latin. `Yixuan "Coda" Shi` is how he signs work in both
 * languages.
 */
const zh: Partial<Dictionary> = {
  profile:
    "跨学科研究者。创意总监。青年从业者。工作横跨心理学与心理测量学、AI 原生游戏制作与组织领导。",
  hint: "悬停或轻触，探索更多",
  tracks: {
    scholarly: {
      title: "学术",
      lede: "哲学、心理学、公共事务。对人类那集体心灵的智识执迷。",
    },
    professional: {
      title: "实务",
      lede: "运营、合规、工业与政策研究。调查与系统设计，作为达成远大目标的方法。",
    },
    creative: {
      title: "创作",
      lede: "游戏工作室、音乐团体、文学作品。已挣脱心智囚笼的愿景。",
    },
  },
  hub: {
    name: "Coda",
    qualifier: "其人",
    ariaLabel: "Coda 其人 — 书写与行路之人",
    heading: "Coda 其人",
    subheading: "书写与行路之人",
  },
  nav: { cv: "简历", coda: "Coda 其人" },
  headings: {
    education: "教育",
    poems: "诗",
    advocacy: "行路",
    contact: "联系",
  },
  switchTo: "English",
};

const DICTIONARIES: Record<Locale, Partial<Dictionary>> = { en, zh };

/**
 * English is the base; the requested locale is layered over it one key deep.
 * A shallow merge is deliberate — every value below the top level is a complete
 * unit (all three tracks, or the whole hub), so half-translating one would be a
 * mistake rather than a feature.
 */
export function getDictionary(locale: Locale): Dictionary {
  return { ...en, ...DICTIONARIES[locale] };
}

/** The other locale, for the toggle. Binary today; a lookup if that changes. */
export function otherLocale(locale: Locale): Locale {
  return locale === "en" ? "zh" : "en";
}
