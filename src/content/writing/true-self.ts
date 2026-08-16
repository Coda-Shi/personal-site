import type { Piece } from "@/lib/writing";

/**
 * Given by the owner on 2026-08-10, previously inlined on /coda as POEM.
 * Titled 真我 by the owner on 2026-08-16 — it was carried untitled until then.
 *
 * The slug is not the title, it is a URL segment, so it has to be Latin and
 * stable: `true-self` renders 真我 rather than inventing anything, and the
 * closing line asks the reader to become their true self. It was renamed from
 * `ten-thousand-dusks` (taken from the opening line, back when the piece had
 * no title) the same day it shipped — safe then, not safe once a link is out.
 *
 * Chinese only, and that is not an omission awaiting a translation.
 */
export const trueSelf: Piece = {
  slug: "true-self",
  kind: "verse",
  text: {
    zh: {
      title: "真我",
      body: [
        "你的身上已藏着一万个黄昏",
        "可当晨曦照亮你泪痕闪烁的脸庞",
        "你还是忍不住问",
        "生命的意义究竟是什么？",
        "在那顷刻间，强风骤起",
        "卷起花瓣柳絮，幻化成你挚爱的一切",
        "你听见他们轻吟着你遗忘已久的名字——",
        "他们说，去成为真正的你自己",
      ],
    },
  },
};
