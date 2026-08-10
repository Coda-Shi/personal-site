import { HINT, PROFILE, TRACKS, type Entry, type TrackId } from "@/lib/content";

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

/**
 * CV overrides, keyed by the `id` on each record in content.ts.
 *
 * Every field is optional and merged over the English one field at a time, so a
 * half-translated entry shows Chinese where there is Chinese and English where
 * there is not. That is what lets the CV be translated a section at a time
 * without ever rendering a blank line where a job used to be.
 *
 * Institution names are only translated where the institution actually has a
 * Chinese name. Inventing one for a Texas company or a campus club would put a
 * name on his CV that does not exist.
 */
type EntryCopy = Partial<Pick<Entry, "org" | "unit" | "role" | "location" | "period" | "detail">>;
type RecordCopy = Partial<{
  org: string;
  role: string;
  location: string;
  period: string;
  detail: string;
}>;
type SkillCopy = Partial<{ heading: string; items: string }>;

/**
 * Merge a translation over a record from content.ts, field by field.
 *
 * `NoInfer` on the overrides is load-bearing. Without it TypeScript infers `T`
 * from both arguments and settles on their intersection — which for a
 * dictionary of partials is `{ id: string }` — so every other field vanishes
 * from the result type. The English record is the shape; the overrides only
 * have to fit it.
 */
export function localise<T extends { id: string }>(
  item: T,
  overrides: Record<string, Partial<NoInfer<T>>>,
): T {
  return { ...item, ...overrides[item.id] };
}

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
  headings: {
    education: string;
    poems: string;
    advocacy: string;
    contact: string;
    additional: string;
  };
  /** Shown on the control that switches to the *other* language. */
  switchTo: string;
  entries: Record<string, EntryCopy>;
  education: Record<string, RecordCopy>;
  advocacy: Record<string, RecordCopy>;
  skills: Record<string, SkillCopy>;
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
    additional: "Additional",
  },
  switchTo: "中文",
  // English is what content.ts already holds, so there is nothing to override.
  entries: {},
  education: {},
  advocacy: {},
  skills: {},
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
      lede: "哲学、心理学、公共事务。对人类集体心灵的智识执迷与福祉关怀。",
    },
    professional: {
      title: "实务",
      lede: "运营、合规、工业与政策研究。调查与系统设计，实现远大目标的努力。",
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
    additional: "其他",
  },
  switchTo: "English",

  // ── CV, first tranche: the academic half ────────────────────────────────
  //
  // Dates use the numeric form common on Chinese CVs rather than 年/月. They
  // sit in the mono label style, and 2026年8月 puts four full-width glyphs into
  // a face built for Latin digits; 2026.08 keeps the label monospaced and
  // leaves 至今 as the only Chinese in it.
  entries: {
    tsinghua: {
      org: "清华大学",
      period: "2026.08 — 至今",
      unit: "心理与认知科学系",
      role: "文化心理学研究中心 · 研究助理",
      location: "北京",
      detail: [
        "跨学科课题，涵盖文化心理学理论、文化根植的心理干预、抑郁的神经影像研究，以及人工智能在心理健康领域的应用。",
        "参与 MRI 扫描、TMS 干预、行为评估，以及问卷、生理与可穿戴设备数据的采集。",
        "课题负责人：严超赣教授。",
      ],
    },
    "smu-invariance": {
      org: "南卫理公会大学",
      period: "2026 春 — 至今",
      unit: "心理学系",
      role: "独立研究 · 主分析师",
      location: "美国 得克萨斯州达拉斯",
      detail: [
        "在上海某三级甲等医院精神科门诊样本（N = 10,080）中检验 PHQ-9 与 GAD-7 的测量不变性；既有中文不变性研究的样本量多在 1,000 以下。",
        "以 tidyverse、psych、lavaan、semTools、flextable 搭建可复现的 R 分析流程，报告标准遵循 Putnick & Bornstein (2016) 与 Fischer & Karl (2019)。",
        "稿件撰写中，拟于 2026 年秋季投稿临床方法学期刊。",
      ],
    },
    "smu-delta": {
      org: "南卫理公会大学",
      period: "2025.10 — 至今",
      unit: "Delta 成人依恋与人格发展实验室",
      role: "研究助理",
      location: "美国 得克萨斯州达拉斯",
      detail: [
        "协同执行两项 Sonar 研究，并为一项进行中的友谊研究编码 500 条记录。",
        "为一项意志性人格改变的追踪研究清洗 1,500 条原始问卷数据。",
      ],
    },
    watson: {
      org: "普罗维登斯市议会",
      period: "2025.01 — 2025.05",
      unit: "布朗大学沃森国际与公共事务研究所",
      role: "Policy in Action 项目研究员",
      location: "美国 罗德岛州普罗维登斯",
      detail: [
        "对东帕洛阿尔托、费尔法克斯县等美国案例作包容性区划的比较研究，并参与最终的双重差分分析。",
        "合著关于区划与可持续停车政策的政策简报，并向普罗维登斯市议会官员汇报研究发现。",
      ],
    },

    // Everglory keeps its Latin name: the owner confirms the company has no
    // Chinese one, and a translated CV is not a licence to invent one.
    "everglory-director": {
      period: "2025.10 — 2026.04",
      role: "运营与合规总监",
      location: "美国 得克萨斯州丹顿",
      detail: [
        "对一座产值 600 万美元的工厂握有人力、合规、设施与运营的全周期决策权，下辖五个部门、30 名员工、两条产线。",
        "设计并推行订单到交付的作业流程、安全与主管规程、SOP、预防性维护，以及能量隔离（lockout / tagout）程序。",
        "通过展会陌生拜访拿下一个大型零售客户，任内营收增长 15%。",
      ],
    },
    "everglory-analyst": {
      period: "2025.07 — 2025.10",
      role: "管理分析师",
      location: "美国 得克萨斯州丹顿",
      detail: [
        "在 400 万美元的工厂筹建与审计阶段支持跨部门团队。",
        "主导针对供应商与承包商涉嫌不当行为的内部调查，并落地交叉核查控制，估计减少 50 万美元敞口。",
      ],
    },
    nimte: {
      org: "宁波材料技术与工程研究所",
      unit: "中国科学院",
      period: "2023.07 — 2023.09",
      role: "战略分析实习生",
      location: "宁波",
      detail: [
        "撰写 17 页的新型高分子材料与国际监管比较报告；其中关于日本自下而上塑料监管的一节被收入研究所年报。",
        "组织十位中科院研究人员与宁波产业界企业家参与的会议，并通过后续访谈完善了一个材料应用产品项目。",
      ],
    },
    "china-securities": {
      org: "中信建投证券",
      period: "2023.05 — 2023.06",
      role: "研究实习生",
      location: "远程",
      detail: [
        "以 SQL 与 Tableau 从市场与公司两个层面分析半导体集成电路制造，并撰写每周行业报告。",
        "梳理全球集成电路原材料供应链，筛选细分赛道初创公司，形成四份标的简报。",
      ],
    },

    // ELEGISTS STUDIO stays Latin — it is the studio's own wordmark.
    elegists: {
      period: "2026.05 — 至今",
      role: "联合创始人兼创意总监",
      location: "远程",
      detail: [
        "联合创办一家远程独立游戏工作室，管理创意与制作两条线上的全部八名成员。",
        "构思 AI 原生推理游戏《DEAR SUSPECT》，主导其创意愿景、美学方向、叙事与玩法设计，以及设计系统建设。",
        "撰写约十万字游戏剧本，并统筹项目的制作、发行、融资与商务拓展。",
      ],
    },
    "hot-sound": {
      org: "热音社",
      period: "2022.03 — 2023.07",
      role: "联合创始人兼副社长",
      location: "美国 加利福尼亚州尔湾",
      detail: [
        "联合创办并带领一个百人规模的学生与艺术家文化社群，培养六支学生乐队及其运营团队。",
        "六个月内使其成为校内五大音乐类学生社团之一。",
        "制作三场演出，募集约 6,000 美元，累计观众逾 5,000 人次。",
      ],
    },
  },

  education: {
    brown: {
      org: "布朗大学",
      period: "2024.06 — 2025.06",
      role: "公共事务硕士",
      location: "美国 罗德岛州普罗维登斯",
      detail: "计量经济学、概率论、数据分析与可视化、公共政策、公司金融、公共行政。",
    },
    harvard: {
      org: "哈佛大学",
      period: "2024.08 — 2024.12",
      role: "国际商务 / 贸易 / 商学（非学位）",
      location: "美国 马萨诸塞州剑桥",
      detail: "布朗大学 MPA 就读期间跨校注册。",
    },
    uci: {
      org: "加州大学尔湾分校",
      period: "2020.09 — 2023.12",
      role: "哲学文学学士",
      location: "美国 加利福尼亚州尔湾",
      detail: "连续八个学季入选院长嘉许名单。心灵哲学、伦理学、符号逻辑、普通心理学、高级统计方法。",
    },
  },

  advocacy: {
    // Crisis Text Line keeps its Latin name — it is a US organisation and that
    // is what it is called.
    "crisis-text-line": {
      period: "2026.03 — 至今",
      role: "认证志愿危机咨询师",
      location: "远程",
      detail:
        "完成 30 小时以上循证危机咨询训练并取得认证，累计 50 小时以上文字危机支持，议题涵盖学业压力、关系困扰、抑郁与自伤风险。",
    },
    xunzheng: {
      org: "循证心理诊所",
      period: "2021.01 — 2021.06",
      role: "心理热线接线员",
      location: "宁波",
      detail:
        "接受反映性倾听训练后参与危机热线轮班，并负责一家十二名咨询师执业机构的前台运营。",
    },
    "adoption-day": {
      org: "宁波领养日",
      period: "2024.01 — 2024.05",
      role: "动物救助志愿者",
      location: "宁波",
      detail: "救助流浪猫，提供周末照护与动物急救，并与公益组织、独立救助者及收容所协作。",
    },
  },

  // Tool and library names stay Latin: they are how the field writes them, and
  // a Chinese rendering of "lavaan" would be less legible, not more.
  skills: {
    "skills-stats": { heading: "统计与编程" },
    "skills-methods": {
      heading: "研究方法",
      items:
        "有序与多组验证性因子分析 · 测量不变性检验 · Cramér's V 诊断 · 缺失值审计 · MNFA · 计量经济学 · 可复现研究流程",
    },
    "skills-leadership": {
      heading: "领导与运营",
      items:
        "创意指导 · 叙事与玩法设计 · 项目管理 · 业务流程与组织设计 · 谈判与冲突解决 · 人力与合规体系",
    },
    "skills-languages": {
      heading: "语言",
      items: "汉语普通话（母语） · 英语（双语水平，具丰富学术写作经验）",
    },
  },
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
