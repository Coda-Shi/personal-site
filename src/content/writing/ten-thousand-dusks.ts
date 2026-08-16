import type { Piece } from "@/lib/writing";

/**
 * Given by the owner on 2026-08-10, previously inlined on /coda as POEM.
 *
 * Untitled, and it stays that way — `title` is omitted rather than filled in,
 * so the index identifies it by its opening line. Do not name it; that is the
 * author's to do.
 *
 * The slug is not a title either. It is a URL segment, and it has to be Latin
 * and stable, so it paraphrases the first line. Rename it freely before the
 * link is shared anywhere; not after.
 *
 * Chinese only, and that is not an omission awaiting a translation.
 */
export const tenThousandDusks: Piece = {
  slug: "ten-thousand-dusks",
  kind: "verse",
  text: {
    zh: {
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
