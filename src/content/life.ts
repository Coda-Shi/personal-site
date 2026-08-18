import type { Locale } from "@/lib/i18n";

/**
 * Coda's own account of himself. Revised by him 2026-08-18.
 *
 * Both languages are written, neither is a translation of the other — so this
 * is keyed by locale outright rather than going through the CV's
 * English-canonical-plus-overrides model, for the same reason the writing does
 * not (see lib/writing.ts).
 *
 * Paragraphs, in order. Do not edit them, reorder them, or tidy the short ones
 * into the long ones — the one-line paragraphs are doing the pacing, and /coda
 * previews the first three, which is where he turns from the name to the rain.
 */
export const LIFE: Record<Locale, string[]> = {
  zh: [
    "嗨，我是 Coda。",
    "Coda 是我给自己的名字。音乐里的 coda，是一首曲子主体结束之后的最后一段。它承接此前发生过的一切，又独自把整首曲子带向终点。我很喜欢这个名字。",
    "我喜欢雨。",
    "雨会让我想起家乡宁波九龙湖边氤氲的竹林，想起静谧而复杂的水系里珠颈斑鸠空灵的叫声，也想起桂花的暗香随着湿润的空气渗进房间时，那种莫名安宁的感觉。",
    "它也让我想起许多个和朋友一起度过的雨夜。那时候我们隔着屏幕，在游戏里并肩作战，或者毫不留情地互相背刺。后来大家长大了，却又在那样的雨夜里聚到一起，挑着灯，为同一桩现实世界里的事业忙到很晚。",
    "生活里的我没有这么诗意。",
    "我会因为迷路和不会骑自行车，被朋友领着到处乱走。更多时候，我只是熬夜掉进维基百科的兔子洞，忘记回消息；因为记不住别人的名字，干脆一律叫“老师”或者“兄弟”；在 Steam 上买一些根本不会打开的游戏，买来的书大多只看到一半，间歇性运动，并且永远在减肥。对了，亲密的朋友会发现，我的语言天赋其实有一部分用在了讽刺和骂人上。没办法，或许那就是我表达亲密的方式。",
    "有朋友说我是个非常复杂而多面的人。其实那些都是我，唯一的区别是我很坦然地承认了而已。不论心境如何变迁，我想我还是会通过做料理和冥想，再次回到当下。",
    "对了，这个网站上好像还没写过我喜欢兵击。简单来说，就是两个人穿着护具、拿着钢剑对抡。多少有点危险，但真的很过瘾。",
    "好在我还有一点不合时宜的幽默感，也还算知道什么东西好吃、什么酒好喝、什么作品值得安利给朋友。我对人的好奇心难以满足，所以暂时还有人愿意和我出门。不然我大概就是个山顶洞人。",
  ],
  en: [
    "Hey there, I'm Coda",
    "Coda is a name I gave myself. In music, a coda is the final passage that comes after the main body of a piece. It carries everything that came before it, yet stands on its own as it brings the music to an end. I've always liked that idea.",
    "I like rain.",
    "Rain reminds me of the misty bamboo groves by Jiulong Lake in my hometown, Ningbo; of the ethereal calls of spotted doves drifting over its quiet, intricate waterways; and of the faint scent of osmanthus slowly seeping into the room through the damp air, bringing with it a strange sense of calm.",
    "It also reminds me of countless rainy nights spent with friends. Back then, we sat on opposite sides of our screens, fighting side by side in games—or betraying each other without the slightest hesitation. Years later, after we had all grown up, we somehow found ourselves together again on nights much like those, staying up late and working toward the same thing, only this time in the real world.",
    "My actual life is not quite so poetic.",
    "I get lost easily and never learned how to ride a bicycle, so my friends often have to lead me around. Most of the time, I'm staying up too late falling down Wikipedia rabbit holes, forgetting to reply to messages, calling people “professor” or “bro” because I can't remember their names, buying games on Steam that I will probably never open, leaving most books half-finished, exercising in sporadic bursts, and perpetually trying to lose weight. And close friends will have noticed that a fair share of my facility with language goes into sarcasm and swearing. It can't be helped — perhaps that is simply how I show affection.",
    "Some friends tell me I'm an unusually complicated and multifaceted person. All of those sides really are me; the only difference is that I've become comfortable admitting it. However my state of mind shifts, I think cooking and meditation will always bring me back to the present.",
    "Oh, and apparently I never mentioned anywhere on this website that I'm into historical fencing. Put simply, it involves two people wearing protective gear and hitting each other with steel swords. It's somewhat dangerous, but extremely satisfying.",
    "Fortunately, I have a slightly inappropriate sense of humor, and I'm reasonably good at knowing what food is worth trying, what drinks are worth having, and what books, films, music, and other works are worth recommending to friends. My curiosity about people is difficult to satisfy, so for now people are still willing to go out with me. Otherwise, I'd probably be a caveman.",
  ],
};
