import { HINT, HINT_TWO, PROFILE, TRACKS, type Entry, type TrackId } from "@/lib/content";

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
  hintTwo: string;
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
  hintTwo: HINT_TWO,
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
  hintTwo: "选择你从哪一面了解到他。",
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
      lede: "游戏工作室、音乐团体、文学作品。终于挣脱心智囚笼、抵达现实的愿景。",
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

  // ── CV ─────────────────────────────────────────────────────────────────
  //
  // Dates use the numeric form common on Chinese CVs rather than 年/月. They
  // sit in the mono label style, and 2026年8月 puts four full-width glyphs into
  // a face built for Latin digits; 2026.08 keeps the label monospaced and
  // leaves 至今 as the only Chinese in it.
  //
  // Personal names are only set in Chinese when the characters are confirmed
  // rather than reconstructed from pinyin — 严超赣 and 何全发 both are. Guessing
  // at the characters behind a romanisation would misname a real person.
  entries: {
    tsinghua: {
      org: "清华大学",
      period: "2026.08 — 至今",
      unit: "心理与认知科学系",
      role: "文化心理学研究中心 · 研究助理",
      location: "北京",
      detail: [
        "支持中心的日常科研运转：项目管理、文档整理、会议与学术活动统筹，以及对外联络。",
        "参与跨学科课题，涵盖文化心理学理论、文化根植的心理干预、抑郁的神经影像与多模态干预，以及人工智能在心理健康领域的应用。",
        "协助文献综述、研究设计文档、伦理材料、被试招募，以及问卷、行为、神经影像、生理与可穿戴设备数据的采集。",
        "完成必要训练后参与 MRI 扫描、TMS 干预、行为评估、数据质控与初步分析；在团队指导下参与图表与稿件材料的撰写。",
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
        "主持第一阶段全样本（N = 10,080）与第二阶段约 1,500 人子样本的性别 × 年龄不变性检验：在上海某三级甲等医院精神科门诊样本中检验 PHQ-9 与 GAD-7 的测量不变性，填补既有中文不变性研究样本量多在 1,000 以下的空白。",
        "以 tidyverse、psych、lavaan、semTools、flextable 搭建可复现的 R 分析流程，报告标准遵循 Putnick & Bornstein (2016) 与 Fischer & Karl (2019)；第二阶段加入 WLSMV 估计的有序多组 CFA 与 MNFA 扩展。",
        "完成端到端数据清洗、样本核算、Table 1 人口学统计，以及确认 PHQ-9 / GAD-7 条目数据完整的缺失值审计；产出带 Cramér's V 的两两交叉表，以及支撑主分析与敏感性分析的三级数据质量标记体系。",
        "与何全发博士合作的稿件撰写中，拟于 2026 年秋投递 APS / APA / SRP 海报及临床方法学期刊。",
      ],
    },
    "smu-delta": {
      org: "南卫理公会大学",
      period: "2025.10 — 至今",
      unit: "Delta 成人依恋与人格发展实验室",
      role: "研究助理",
      location: "美国 得克萨斯州达拉斯",
      detail: [
        "协同执行两项 Sonar 研究，为一项进行中的友谊研究编码 500 条记录，并以 SPSS 语法清洗一项意志性人格改变追踪研究的 1,500 条原始问卷数据。",
      ],
    },
    watson: {
      org: "普罗维登斯市议会",
      period: "2025.01 — 2025.05",
      unit: "布朗大学沃森国际与公共事务研究所",
      role: "Policy in Action 项目研究员",
      location: "美国 罗德岛州普罗维登斯",
      detail: [
        "对东帕洛阿尔托、费尔法克斯县等美国案例开展包容性区划的比较研究；使用 HUD 与地方住房数据制作分级统色图与点密度图，并参与最终的双重差分分析。",
        "合著关于区划与可持续停车政策、附可执行建议的政策简报，并向普罗维登斯市议会官员汇报研究发现。",
      ],
    },

    // Everglory keeps its Latin name: the owner confirms the company has no
    // Chinese one, and a translated CV is not a licence to invent one.
    "everglory-ops": {
      period: "2025.07 — 2026.04",
      role: "管理分析师，后任运营与合规总监",
      location: "美国 得克萨斯州丹顿",
      detail: [
        "对一座产值 600 万美元的办公与纸盘制造工厂握有人力、合规、设施与运营的全周期决策权，下辖五个部门、30 名员工、两条产线；主导产能匹配、Kaizen 与 6S 改善，以及 ERP / EDI 数据准确性。",
        "设计并推行公司制度、订单到交付流程、安全与主管规程、SOP、预防性维护与能量隔离（lockout / tagout）程序，以及生产报告与危机处理机制。",
        "通过展会陌生拜访开发并拿下一个大型零售客户，任内营收增长 15%。",
        "在 400 万美元的工厂筹建与审计阶段支持跨部门团队，对齐合规、设备、人力与运营文档，保障顺利投产。",
        "主导针对供应商与承包商涉嫌不当行为的内部调查，最终导致两名高级员工被解雇并进入法律程序；落地交叉核查控制，估计减少 50 万美元敞口。",
      ],
    },
    nimte: {
      org: "宁波材料技术与工程研究所",
      unit: "中国科学院",
      period: "2023.07 — 2023.09",
      role: "战略规划处 · 战略分析实习生",
      location: "宁波",
      detail: [
        "撰写 17 页的新型高分子材料与国际监管比较报告；其中关于日本自下而上塑料监管的一节被收入研究所年报。",
        "在 Excel 中处理 3,000 余条政策与市场数据，为宁波新材料产业搭建市场数据透视表，并产出支撑两场市场调研汇报的 Power BI 可视化。",
        "组织十位中科院研究人员与宁波产业界企业家参与的会议，起草访谈提纲，并通过后续访谈完善了一个材料应用产品项目。",
      ],
    },
    "china-securities": {
      org: "中信建投证券",
      period: "2023.05 — 2023.06",
      role: "研究实习生",
      location: "远程",
      detail: [
        "以 SQL 与公开数据集从市场与公司两个层面分析半导体集成电路制造，在 Tableau 中可视化增长趋势，并撰写每周五页的行业报告。",
        "评估半导体短缺背后的政策与供需动因，梳理全球集成电路原材料供应链，产出两份六页报告与两套演示材料。",
        "按融资轮次、领投方与业务画像筛选细分赛道初创公司，形成四份详细标的简报。",
      ],
    },
    "everglory-project": {
      period: "2022.07 — 2022.11",
      role: "项目助理",
      location: "美国 得克萨斯州欧文",
      detail: [
        "通过北美食品级纸制品行业的竞争研究，支持达拉斯地区的市场进入与厂址、办公选址；该子公司 2023 年销售额达 70 万美元，占集团营收 8%。",
        "为七个岗位定义画像与薪资区间，搭建 LinkedIn 与 Indeed 人才库，并招募到一位区域总经理，节省约 24,000 美元猎头费用。",
      ],
    },

    // ELEGISTS STUDIO stays Latin — it is the studio's own wordmark.
    elegists: {
      period: "2026.05 — 至今",
      role: "联合创始人兼创意总监",
      location: "远程",
      detail: [
        "联合创办一家远程独立游戏工作室，管理创意与制作两条线上的全部八名成员。",
        "构思 AI 原生推理游戏《DEAR SUSPECT》，主导其创意愿景、美学方向、叙事与玩法设计、企划，以及设计系统建设。",
        "撰写约十万字游戏剧本，并统筹项目的制作、发行、融资与商务拓展。",
      ],
    },
    "hot-sound": {
      org: "热音社",
      period: "2022.03 — 2023.07",
      role: "联合创始人兼副社长",
      location: "美国 加利福尼亚州尔湾",
      detail: [
        "联合创办并带领一个百人规模的学生与艺术家文化社群，培养六支学生乐队及其运营团队，六个月内使其成为校内五大音乐类学生社团之一，活动出席人数超出同类活动 100%。",
        "统筹两场大型校内演出与一场校外酒吧演出，亲自负责赞助获取、活动设计、宣传与场地统筹；募集约 6,000 美元，累计观众逾 5,000 人次。",
        "与六家企业谈成长期赞助，与两个学生社团合作举办两场活动，带来 5,000 次社交媒体曝光。",
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
        "2026 年 2 月完成 30 小时以上循证危机咨询训练并取得认证，累计 50 小时以上文字危机支持，议题涵盖学业压力、关系困扰、抑郁与自伤风险。",
    },
    xunzheng: {
      org: "循证心理诊所",
      period: "2021.01 — 2021.06",
      role: "心理热线接线员",
      location: "宁波",
      detail:
        "管理一家十二名咨询师执业机构的电子病历与前台运营，化解候诊区冲突，并获得六次患者主动致谢；接受反映性倾听训练后，以积极倾听与情绪降级参与危机热线轮班。",
    },
    "adoption-day": {
      org: "宁波领养日",
      period: "2024.01 — 2024.05",
      role: "动物救助志愿者",
      location: "宁波",
      detail: "救助流浪猫，提供周末照护与动物急救，跟进领养后回访，并与公益组织、独立救助者及收容所协作。",
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
