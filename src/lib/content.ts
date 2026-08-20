export type TrackId = "scholarly" | "professional" | "creative";

export type Entry = {
  /**
   * Stable key for translation lookup. Deliberately not derived from org and
   * period: those are themselves translated, and a key that moves when the copy
   * moves fails by silently dropping back to English — the one failure mode a
   * CV cannot afford, because it looks like an oversight rather than a bug.
   */
  id: string;
  org: string;
  unit?: string;
  role: string;
  location: string;
  period: string;
  detail: string[];
};

/**
 * The flatter shape used by education and advocacy: one paragraph rather than
 * a list of bullets. Same `id` contract as Entry — see the note there.
 */
export type CvRecord = {
  id: string;
  org: string;
  role: string;
  location: string;
  period: string;
  detail: string;
};

export type Track = {
  id: TrackId;
  title: string;
  /** Character form. For `mark: "coda"` this is a fallback only — see below. */
  glyph: string;
  glyphName: string;
  /**
   * Anything other than "char" is drawn as SVG rather than set as type.
   *
   * Cormorant Garamond contains no logic or mathematical notation at all —
   * measured by advance width, ⊨ ∀ ◇ ∴ Λ χ every one of them falls through to
   * the generic serif, so they render as Times New Roman on Windows and as
   * something else on macOS, and may be missing outright elsewhere. U+1D10C,
   * the coda sign, is absent from essentially every text font.
   *
   * § is the exception and stays as a character: it is a genuine typographic
   * mark, Cormorant has a beautiful one, and it should be set, not traced.
   */
  mark: "char" | "coda" | "turnstile";
  lede: string;
  entries: Entry[];
};

export const NAME = 'Yixuan "Coda" Shi';

/** The three faces, named. Sits between the name and the sentence below it. */
/**
 * The questions the Scholarly track is actually organised around. Each carries
 * a second line, because a bare list of topics says what he reads and not what
 * he thinks — the angle is the content.
 */
export type Question = { id: string; lead: string; note: string };

export const QUESTIONS: Question[] = [
  {
    id: "measurement",
    lead: "The precision of psychological constructs, the reliability and validity of the instruments that measure them, and whether either holds across cultures.",
    note: "Invariance across sex, age and culture is the precondition for comparing a construct at all — and most screening instruments have never been tested on a sample large enough to settle it.",
  },
  {
    id: "death-suffering",
    lead: "The nature of death and of psychic suffering, and what separates them.",
    note: "Their phenomenological structure and their value are not the same, yet both may be filed under the same heading of bad experience. How different cultures give them meaning and find somewhere to put them; what they mean to the living; and, more concretely, how loss, mourning and trauma change a personality — and how personality in turn shapes what a person feels of those experiences, what they make of them, and what they can integrate.",
  },
  {
    id: "selfhood",
    lead: "Whether the need for a self-identity is itself a culturally specific one",
    note: "If the answer is yes, then the many theories of personality and development that set a stable, integrated self-identity as the goal of development all carry a cultural boundary they never declare. What I most want to examine is the part meaning plays in it: whether it can work as a mechanism for maintaining self-continuity, so that a person still experiences themselves as coherent across time even when identity, role or values have changed.",
  },
  {
    id: "intervention",
    lead: "How mindfulness-based, psychodynamic and existential interventions actually work.",
    note: "How the efficacy of mindfulness, existential and traditional-cultural therapies can be established, and the conditions under which each holds; and how, in practice, to relieve another person’s suffering and their fear of death.",
  },
];



export const ROLES = "Psychology scholar · Game producer · Organizational leader";

export const PROFILE =
  "Work spanning mental health practice and psychological research; independent music, literature and game creation; and building and leading organizations.";

/**
 * Shown top-right on the home screen. Both are published at the owner's
 * explicit instruction — the studio address and his personal one.
 *
 * A published address cannot be unpublished: scrapers keep it. This is his
 * decision, not a default. A forwarding address on the domain itself (the
 * Porkbun MX records were kept for exactly this, see D20) would still be the
 * better long-term answer for the personal one.
 */
/**
 * Performances. Four, all as lead vocals — a music history is not shaped like
 * a job, so it does not go through Entry: no location, no bullet list, and the
 * band matters more than the venue.
 *
 * 解忧杂货店 keeps its Chinese name in the English copy. It has no English one,
 * and CLAUDE.md §8 is explicit that translating a CV is not licence to invent
 * institution names — the same rule that keeps Everglory and Crisis Text Line
 * in Latin on the Chinese side.
 */
export type Performance = {
  id: string;
  /** Absent where the owner did not give one. */
  date?: string;
  event: string;
  hosts: string;
  role: string;
};

export const MUSIC: Performance[] = [
  {
    id: "summer-2022",
    date: "2022.07",
    event: "Summer Music Festival",
    hosts: "UCI Hot Sound Club × 解忧杂货店",
    role: "Lead vocals, Oneirism",
  },
  {
    id: "rechao-2023",
    date: "2023.01",
    event: "Rechao Music Festival",
    hosts: "UCI Hot Sound Club × LSUCI",
    role: "Lead vocals, Oneirism",
  },
  {
    id: "valentine-2023",
    date: "2023.02",
    event: "Valentine's Music Season",
    hosts: "UCI Hot Sound Club × CSU",
    role: "Lead vocals, Oneirism",
  },
  {
    id: "spring-gala",
    date: "2025.04",
    event: "Spring Festival Gala",
    hosts: "Princeton, Rutgers and Stevens CSSA",
    role: "Guest lead vocals, Hyperkinetic",
  },
];

/** Covers live here. */
export const BILIBILI = "https://space.bilibili.com/614759";

/** One cover, embedded on the Creative page. Just the id — see VideoEmbed. */
export const COVER = {
  bvid: "BV1by4y1N7uW",
  title: "LANDMVRKS — Lost in a Wave (short cover)",
};

/** The studio's own site, linked as a card from Selected work. */
export const STUDIO_URL = "https://elegists.studio";

/**
 * The two profiles the footer links out to, as icons.
 *
 * Both marks are drawn in the site's own line idiom rather than lifting either
 * company's brand artwork — the same reasoning as the track marks in D9 and the
 * Bilibili mark on Creative, and it keeps somebody else's trademark off the
 * page. GitHub gets a branch, which is the generic version-control glyph, not
 * the Octocat; Instagram gets the generic camera pictogram.
 *
 * The Instagram share link arrives with igsh and utm_source tracking
 * parameters. They are stripped: this is a link to a profile, not a campaign.
 */
export const GITHUB = "https://github.com/Coda-Shi";
export const INSTAGRAM = "https://www.instagram.com/coda_shi_77721";

export const STUDIO_EMAIL = "elegistsstudio@gmail.com";

export const HINT = "Hover and tap; Select which part you came to know him by.";

// Tailwind cannot see class names assembled at runtime, so every track's classes
// are written out in full here rather than interpolated from the track id.
// `cssVar` is for SVG fills and inline transforms, where a utility class won't do.
export const TRACK_CLASSES: Record<
  TrackId,
  { text: string; bg: string; border: string; cssVar: string }
> = {
  scholarly: {
    text: "text-klein",
    bg: "bg-klein",
    border: "border-klein",
    cssVar: "var(--color-klein)",
  },
  professional: {
    text: "text-gilt",
    bg: "bg-gilt",
    border: "border-gilt",
    cssVar: "var(--color-gilt)",
  },
  creative: {
    text: "text-oxblood",
    bg: "bg-oxblood",
    border: "border-oxblood",
    cssVar: "var(--color-oxblood)",
  },
};

// Where each track sits on the disc. Angles are SVG convention: 0deg points
// right, positive turns clockwise. Scholarly crowns the disc; creative and
// professional take the lower left and lower right.
export const TRACK_ARCS: Record<TrackId, { start: number; end: number; mid: number }> = {
  scholarly: { start: 212, end: 328, mid: 270 },
  creative: { start: 92, end: 208, mid: 150 },
  professional: { start: 332, end: 448, mid: 30 },
};

export const TRACKS: Track[] = [
  {
    id: "scholarly",
    title: "Scholarly",
    // Model-theoretic entailment: M ⊨ φ, "the structure M satisfies φ". Both
    // halves of this track in one mark — a factor model asking whether it
    // satisfies the data, and the formal semantics behind the Tractatus.
    glyph: "⊨",
    glyphName: "double turnstile — models, satisfies",
    mark: "turnstile",
    lede: "Philosophy, public affairs, psychological research and practice. An intellectual obsession with the collective psyche, a care for its well-being.",
    entries: [
      {
        id: "tsinghua",
        org: "Tsinghua University",
        unit: "Department of Psychology and Cognitive Science",
        role: "Research Assistant, Center for Cultural Psychology",
        location: "Beijing",
        period: "Aug 2026 — Present",
        detail: [
          "Supports the Center's daily research operations: project management, document organisation, meeting and academic-event coordination, and external communications.",
          "Contributes to interdisciplinary projects spanning cultural-psychology theory, culturally grounded psychological interventions, depression neuroimaging and multimodal intervention, and applications of artificial intelligence to mental health.",
          "Assists with literature review, study-design documentation, ethics materials, participant recruitment, and collection of questionnaire, behavioural, neuroimaging, physiological, and wearable-device data.",
          "Supports MRI scanning, TMS intervention, behavioural assessment, data quality control, and preliminary analysis after required training; contributes figures and manuscript material under team supervision.",
          "Principal investigator: Prof. Chao-Gan Yan.",
        ],
      },
      {
        id: "smu-invariance",
        org: "Southern Methodist University",
        unit: "Department of Psychology",
        role: "Independent Research — Lead Analyst",
        location: "Dallas, TX",
        period: "Spring 2026 — Present",
        detail: [
          "Leads Phase I on the full analytic sample (N = 10,080) and Phase II on a ~1,500 subsample testing Sex × Age invariance: measurement invariance of the PHQ-9 and GAD-7 in a Shanghai tertiary-hospital psychiatric outpatient sample, addressing a gap where Chinese invariance studies typically sit below N = 1,000.",
          "Built a reproducible R pipeline in tidyverse, psych, lavaan, semTools, and flextable, following Putnick & Bornstein (2016) and Fischer & Karl (2019) reporting standards; Phase II adds ordinal multi-group CFA with the WLSMV estimator and an MNFA extension.",
          "Completed end-to-end data cleaning, sample accounting, Table 1 demographics, and a missingness audit confirming complete PHQ-9/GAD-7 item data; produced pairwise cross-tabulations with Cramér's V and a three-tier data-quality flagging system supporting primary and sensitivity analyses.",
          "Manuscript in preparation with Dr. Quanfa He; targeting an APS / APA / SRP poster and a clinical-methodological journal, Fall 2026.",
        ],
      },
      {
        id: "smu-delta",
        org: "Southern Methodist University",
        unit: "Delta Adult Attachment & Personality Development Lab",
        role: "Research Assistant",
        location: "Dallas, TX",
        period: "Oct 2025 — Present",
        detail: [
          "Co-piloted two Sonar studies, coded 500 entries for an ongoing friendship research project, and cleaned 1,500 raw questionnaire entries for a longitudinal volitional personality-change study using SPSS syntax.",
        ],
      },
      {
        id: "watson",
        org: "Providence City Council",
        unit: "Brown University Watson Institute",
        role: "Policy in Action Project Researcher",
        location: "Providence, RI",
        period: "Jan 2025 — May 2025",
        detail: [
          "Conducted comparative inclusionary-zoning research across East Palo Alto, Fairfax County, and further U.S. cases; used HUD and local housing data to produce choropleth and dot-density maps, and contributed to the final difference-in-differences analysis.",
          "Co-authored a policy brief on zoning and sustainable parking policy with actionable recommendations, and presented findings to Providence City Council officials.",
        ],
      },
    ],
  },
  {
    id: "professional",
    title: "Professional",
    glyph: "§",
    glyphName: "section sign",
    mark: "char",
    lede: "Operations, compliance, industrial and policy research. Investigation and system design, in service of ambitious ends.",
    entries: [
      // The analyst post and the directorship are one continuous tenure at one
      // company, so they read as a promotion rather than as two jobs.
      {
        id: "everglory-ops",
        org: "Everglory Products Corporation",
        role: "Management Analyst, then Director of Operations & Compliance",
        location: "Denton, TX",
        period: "Jul 2025 — Apr 2026",
        detail: [
          "Held full-cycle HR, compliance, facility, and operating authority for a $6M office and paper-plate conversion plant spanning five departments, 30 employees, and two production lines; directed capacity alignment, Kaizen and 6S initiatives, and ERP/EDI data accuracy.",
          "Designed and enforced company policies, order-to-fulfilment workflows, safety and supervisor protocols, SOPs, preventive-maintenance and lockout/tagout procedures, and production reporting and crisis-handling systems.",
          "Acquired and developed one large retail account through tradeshow cold outreach, contributing to a 15% revenue increase during the tenure.",
          "Supported cross-department teams through a $4M factory setup and audit phase, aligning compliance, equipment, HR, and operational documentation for a smooth launch.",
          "Led internal investigations into alleged vendor and contractor misconduct, resulting in termination and legal escalation involving two senior employees; implemented cross-check controls reducing an estimated $500K exposure.",
        ],
      },
      {
        id: "nimte",
        org: "Ningbo Institute of Materials Technology & Engineering",
        unit: "Chinese Academy of Sciences",
        role: "Strategic Analyst Intern, Department of Strategic Planning",
        location: "Ningbo",
        period: "Jul 2023 — Sep 2023",
        detail: [
          "Authored a 17-page comparative report on novel polymer materials and international regulation; its section on Japan's bottom-up plastic regulation was incorporated into the institute's annual report.",
          "Processed 3,000+ policy and market data entries in Excel, built a market-data pivot table for Ningbo's new-materials sector, and produced Power BI visualisations supporting two market-research presentations.",
          "Organised a conference with ten CAS researchers and Ningbo industry entrepreneurs, drafted interview protocols, and conducted follow-up interviews that refined a materials-application product project.",
        ],
      },
      {
        id: "china-securities",
        org: "China Securities Co., Ltd.",
        role: "Research Intern",
        location: "Remote",
        period: "May 2023 — Jun 2023",
        detail: [
          "Used SQL and public datasets to analyse semiconductor IC manufacturing at market and company level, visualised growth trends in Tableau, and authored a weekly five-page industry report.",
          "Assessed policy and supply-demand drivers behind semiconductor shortages, mapped the global IC raw-material supply chain, and produced two six-page reports and two presentation decks.",
          "Screened niche-sector startups by financing round, lead investor, and business profile, producing four detailed target briefs.",
        ],
      },
      {
        id: "everglory-project",
        org: "Everglory Products Corporation",
        role: "Project Assistant",
        location: "Irving, TX",
        period: "Jul 2022 — Nov 2022",
        detail: [
          "Supported Dallas-area market entry and factory and office site selection through competitive research in the North American food-grade paper-products industry; the subsidiary later reached $700K in 2023 sales, 8% of group revenue.",
          "Defined profiles and salary bands for seven roles, built LinkedIn and Indeed talent pools, and recruited a Regional General Manager, avoiding approximately $24,000 in headhunter fees.",
        ],
      },
    ],
  },
  {
    id: "creative",
    title: "Creative",
    glyph: "𝄌",
    glyphName: "coda — the sign marking a work's final passage",
    mark: "coda",
    lede: "Game studio, music collective, literary pieces. Visions that defied the mind's confinement and came into being.",
    entries: [
      {
        id: "elegists",
        org: "ELEGISTS STUDIO",
        role: "Co-Founder & Creative Director",
        location: "Remote",
        period: "May 2026 — Present",
        detail: [
          "Co-founded a remote independent game studio and manages all eight team members across creative and production functions.",
          "Conceived DEAR SUSPECT, an AI-native deduction game, and leads its creative vision, aesthetic direction, narrative and gameplay design, planning, and design-system development.",
          "Wrote approximately 100,000 Chinese characters of game script and owns the project's production, publishing, financing, and business-development workstreams.",
        ],
      },
      {
        id: "hot-sound",
        org: "Hot Sound Club",
        role: "Vice President & Co-Founder",
        location: "Irvine, CA",
        period: "Mar 2022 — Jul 2023",
        detail: [
          "Co-founded and led a cultural collective of 100 students and artists, developed six student bands and their operating teams, and helped grow it into one of the five largest music-focused student associations on campus within six months, with event attendance exceeding comparable events by 100%.",
          "Orchestrated two large on-campus concerts and one off-campus bar concert, personally managing sponsorship acquisition, event design, promotion, and venue logistics; raised approximately $6,000 and attracted a combined audience of 5,000+.",
          "Negotiated long-term sponsorships with six companies, partnered with two student associations on two events, and generated 5,000 social-media views.",
        ],
      },
    ],
  },
];

export const EDUCATION: CvRecord[] = [
  {
    id: "brown",
    org: "Brown University",
    role: "Master of Public Affairs",
    location: "Providence, RI",
    period: "Jun 2024 — Jun 2025",
    detail: "Econometrics, probability, data analysis and visualisation, public policy, corporate finance, public administration.",
  },
  {
    id: "harvard",
    org: "Harvard University",
    role: "International Business / Trade / Commerce (non-degree)",
    location: "Cambridge, MA",
    period: "Aug 2024 — Dec 2024",
    detail: "Cross-registration during the Brown MPA.",
  },
  {
    id: "uci",
    org: "University of California, Irvine",
    role: "Bachelor of Arts in Philosophy",
    location: "Irvine, CA",
    period: "Sep 2020 — Dec 2023",
    detail: "Dean's List for all eight quarters. Philosophy of mind, ethics, symbolic logic, general psychology, advanced statistical methods.",
  },
];

/**
 * The faint layer that fills a sector's beam once it is lit.
 *
 * Copyright rule for this layer: full quotations only from public-domain
 * sources. Kant, Hegel and the Tractatus are clear. Heidegger, Bion, Klein,
 * Winnicott and Anna Freud are all still in copyright, so they appear as terms
 * and titles — neither of which is protectable — never as sentences. Song
 * lyrics are excluded outright; they are the most aggressively enforced text
 * there is, and no amount of faintness makes reproducing them fair use.
 */
export type SymbolItem = { text: string; face: "mono" | "serif" };

/**
 * Three tiers, and only three. Font size stops working as an encoding past
 * large/medium/small, so a continuous ramp just reads as noise. Which tier a
 * thing belongs to is an editorial decision about what this sector is arguing,
 * which is why it lives here rather than in the layout code.
 *
 * Nothing may appear twice — not across tiers, and not as both a standalone
 * mark and the sector's own glyph on the ring.
 */
export type SymbolLayer = {
  /** The two or three ideas the sector is actually about. */
  anchors: SymbolItem[];
  /** Named sources and working notation. */
  support: SymbolItem[];
  /** Terms and single marks, read as grain rather than as statements. */
  texture: SymbolItem[];
};

export const SYMBOL_LAYERS: Record<TrackId, SymbolLayer> = {
  scholarly: {
    // Σ = ΛΦΛ′ + Θ says everything observable decomposes into what is shared
    // and what is unique to each thing. Λ_g = Λ asks whether a construct means
    // the same thing across groups — the empirical form of the Tractatus line
    // sitting beside it. The layer is an argument, not a word cloud.
    // The two mottos are anchors because the owner says they are what he
    // actually lives by; the factor equation earns its place as the one thing
    // the research half is built on.
    anchors: [
      { text: "Memento mori", face: "serif" },
      { text: "Amplectere omnia", face: "serif" },
      { text: "Σ = ΛΦΛ′ + Θ", face: "mono" },
    ],
    support: [
      { text: "Die Grenzen meiner Sprache bedeuten die Grenzen meiner Welt.", face: "serif" },
      { text: "Der bestirnte Himmel über mir, und das moralische Gesetz in mir.", face: "serif" },
      { text: "Das Wahre ist das Ganze.", face: "serif" },
      { text: "Wovon man nicht sprechen kann, darüber muß man schweigen.", face: "serif" },
      { text: "Wo Es war, soll Ich werden.", face: "serif" },
      { text: "Sapere aude", face: "serif" },
      { text: "Sein zum Tode", face: "serif" },
      { text: "Λ_g = Λ", face: "mono" },
      { text: "M ⊨ φ", face: "mono" },
      { text: "∀x(Px → Qx)", face: "mono" },
      { text: "N = 10,080", face: "mono" },
      { text: "Δχ²(df)", face: "mono" },
    ],
    // Trimmed 2026-08-10. Legible type and forty-seven items do not both fit in
    // one 120° wedge — the arithmetic is about 1.5M square units against nearly
    // twice that. What went is what nobody asked for: the duplicate invariance
    // identities (Λ_g = Λ carries that idea in the tier above), a second fit
    // index, and half the bare logic marks. Everything the owner named by hand
    // stays.
    texture: [
      // Ordered by how much it would cost to lose the item, because that is
      // exactly what the order decides. Placement runs down the queue against a
      // board that fills as it goes, so whatever is last is what gets dropped.
      // Everything the owner named by hand is at the front; the bare logic
      // marks and the duplicate fit index are at the back, where nobody will
      // miss one.
      { text: "paranoid-schizoid position", face: "serif" },
      { text: "β → α", face: "mono" },
      { text: "L · H · K", face: "mono" },
      { text: "transitional object", face: "serif" },
      { text: "identification with the aggressor", face: "serif" },
      { text: "collective unconscious", face: "serif" },
      // The only cultural-psychology terms in the sector. Without them the
      // field reads as continental philosophy and gives no sign that the work
      // at Tsinghua is quantitative and cross-cultural.
      { text: "WEIRD samples", face: "serif" },
      { text: "tight vs loose cultures", face: "serif" },
      // The Delta Lab's own subject.
      { text: "volitional personality change", face: "serif" },
      { text: "Lichtung", face: "serif" },
      { text: "Nachträglichkeit", face: "serif" },
      { text: "complex PTSD", face: "serif" },
      { text: "dissociation", face: "serif" },
      { text: "window of tolerance", face: "serif" },
      { text: "posttraumatic growth", face: "serif" },
      { text: "disorganised attachment", face: "serif" },
      { text: "HEXACO", face: "mono" },
      { text: "WLSMV", face: "mono" },
      // The bare logic marks are gone as of 2026-08-10. Legible type and a
      // long list do not both fit: the wedge seats about 32 items at sizes
      // worth reading, so the list is 32. Single glyphs carried the least and
      // went first. ⊨ was never here anyway — it is this sector's mark on the
      // ring — and Φ lives in the knot as JΦ.
    ],
  },
  creative: {
    // Deliberately sparse. The two line plates carry this sector until the
    // owner's own poems and script lines arrive. Nothing borrowed goes in, and
    // an empty stretch beats filler.
    anchors: [],
    support: [],
    // Music notation removed: seven small glyphs scattered across a wedge this
    // large read as litter, not as texture. The two line plates hold the
    // sector on their own until real material arrives.
    texture: [],
  },
  professional: {
    // Real citations rather than abstract flowchart shapes. 29 CFR 1910.147 is
    // the federal lockout/tagout standard he actually wrote procedures
    // against, so anyone in the trade recognises it on sight and everyone else
    // reads texture. That is a better trade than invented diagram furniture.
    anchors: [{ text: "29 CFR 1910.147", face: "mono" }],
    support: [
      { text: "ISO 9001", face: "mono" },
      { text: "ISO 45001", face: "mono" },
      { text: "Kaizen", face: "serif" },
      { text: "takt time", face: "serif" },
      { text: "lockout / tagout", face: "serif" },
    ],
    texture: [
      { text: "6S", face: "mono" },
      { text: "OEE", face: "mono" },
      { text: "P&ID", face: "mono" },
      { text: "ERP / EDI", face: "mono" },
      { text: "SOP", face: "mono" },
      { text: "preventive maintenance", face: "serif" },
      { text: "order to fulfilment", face: "serif" },
      { text: "capacity alignment", face: "serif" },
      { text: "root cause", face: "serif" },
      // No § here — it is this sector's mark on the ring.
    ],
  },
};

export const SKILLS = [
  {
    id: "skills-stats",
    heading: "Statistical & programming",
    items:
      "R (tidyverse, psych, lavaan, semTools, flextable) · Python (NumPy, pandas) · SPSS · SQL · Tableau · Power BI · Quarto / R Markdown · Git",
  },
  {
    id: "skills-methods",
    heading: "Research methods",
    items:
      "Ordinal and multi-group CFA · measurement invariance testing · Cramér's V diagnostics · missingness audits · MNFA · econometrics · reproducible research workflows",
  },
  {
    id: "skills-leadership",
    heading: "Leadership & operations",
    items:
      "Creative direction · narrative and gameplay design · project management · business-process and organisational design · negotiation and conflict resolution · HR and compliance systems",
  },
  {
    id: "skills-languages",
    heading: "Languages",
    items: "Mandarin Chinese (native) · English (bilingual, extensive academic writing)",
  },
];

// Phone numbers from the source CV are deliberately omitted — a personal site is
// a scraping target, and email is sufficient for anyone with a real reason to write.
export const CONTACT_EMAIL = "shiyixuan1116@gmail.com";

/** Both addresses, in the order the home screen lists them. */
export const EMAILS = [STUDIO_EMAIL, CONTACT_EMAIL] as const;

// The centre of the site. Deliberately carries no track colour and no glyph —
// the three public identities are encoded; this one is not.
export const ADVOCACY: CvRecord[] = [
  {
    id: "crisis-text-line",
    org: "Crisis Text Line",
    role: "Certified Volunteer Crisis Counselor",
    location: "Remote",
    period: "Mar 2026 — Present",
    detail:
      "Completed 30+ hours of evidence-based crisis-counselling training and certification in February 2026, and logged 50+ hours of text-based crisis support on academic stress, relational distress, depression, and self-harm risk.",
  },
  {
    id: "xunzheng",
    org: "XunZheng Mental Health Clinic",
    role: "Mental Health Hotline Operator",
    location: "Ningbo",
    period: "Jan 2021 — Jun 2021",
    detail:
      "Managed EHR records and front-desk operations for a 12-clinician practice, de-escalated waiting-room conflicts, and received six unsolicited patient commendations; after reflective-listening training, supported crisis-hotline rotations through active listening and de-escalation.",
  },
  {
    id: "adoption-day",
    org: "Adoption Day Ningbo",
    role: "Animal Rescuer",
    location: "Ningbo",
    period: "Jan 2024 — May 2024",
    detail:
      "Rescued stray cats, provided weekend feline care and animal first aid, followed up with adopters, and coordinated with charities, independent rescuers, and shelters.",
  },
];
