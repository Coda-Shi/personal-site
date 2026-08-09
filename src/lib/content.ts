export type TrackId = "scholarly" | "professional" | "creative";

export type Entry = {
  org: string;
  unit?: string;
  role: string;
  location: string;
  period: string;
  detail: string[];
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

export const PROFILE =
  "Interdisciplinary researcher, creative director and young professional whose current works span across Psychology and Psychometrics, AI-native game production and organizational leadership.";

export const HINT = "Hover and tap to explore more";

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
    lede: "Philosophy, psychology, public affairs. An intellectual obsession with the collective psyche.",
    entries: [
      {
        org: "Tsinghua University",
        unit: "Department of Psychology and Cognitive Science",
        role: "Research Assistant, Center for Cultural Psychology",
        location: "Beijing",
        period: "Aug 2026 — Present",
        detail: [
          "Interdisciplinary work spanning cultural-psychology theory, culturally grounded interventions, depression neuroimaging, and applications of AI to mental health.",
          "Supports MRI scanning, TMS intervention, behavioural assessment, and questionnaire, physiological, and wearable-device data collection.",
          "Principal investigator: Prof. Chao-Gan Yan.",
        ],
      },
      {
        org: "Southern Methodist University",
        unit: "Department of Psychology",
        role: "Independent Research — Lead Analyst",
        location: "Dallas, TX",
        period: "Spring 2026 — Present",
        detail: [
          "Measurement invariance of the PHQ-9 and GAD-7 in a Shanghai tertiary-hospital psychiatric outpatient sample (N = 10,080), addressing a literature where Chinese invariance studies typically sit below N = 1,000.",
          "Built a reproducible R pipeline in tidyverse, psych, lavaan, semTools, and flextable, following Putnick & Bornstein (2016) and Fischer & Karl (2019) reporting standards.",
          "Manuscript in preparation; targeting a clinical-methodological journal, Fall 2026.",
        ],
      },
      {
        org: "Southern Methodist University",
        unit: "Delta Adult Attachment & Personality Development Lab",
        role: "Research Assistant",
        location: "Dallas, TX",
        period: "Oct 2025 — Present",
        detail: [
          "Co-piloted two Sonar studies and coded 500 entries for an ongoing friendship research project.",
          "Cleaned 1,500 raw questionnaire entries for a longitudinal volitional personality-change study.",
        ],
      },
      {
        org: "Providence City Council",
        unit: "Brown University Watson Institute",
        role: "Policy in Action Project Researcher",
        location: "Providence, RI",
        period: "Jan 2025 — May 2025",
        detail: [
          "Comparative inclusionary-zoning research across East Palo Alto, Fairfax County, and further U.S. cases, contributing to a difference-in-differences analysis.",
          "Co-authored a policy brief on zoning and sustainable parking policy and presented findings to Providence City Council officials.",
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
    lede: "Operations, compliance, industrial and policy research. Investigation and system design as means to a greater end.",
    entries: [
      {
        org: "Everglory Products Corporation",
        role: "Director of Operations & Compliance",
        location: "Denton, TX",
        period: "Oct 2025 — Apr 2026",
        detail: [
          "Full-cycle HR, compliance, facility, and operating authority for a $6M plant spanning five departments, 30 employees, and two production lines.",
          "Designed and enforced order-to-fulfilment workflows, safety and supervisor protocols, SOPs, preventive maintenance, and lockout/tagout procedures.",
          "Acquired a large retail account through tradeshow cold outreach, contributing to a 15% revenue increase.",
        ],
      },
      {
        org: "Everglory Products Corporation",
        role: "Management Analyst",
        location: "Denton, TX",
        period: "Jul 2025 — Oct 2025",
        detail: [
          "Supported cross-department teams through a $4M factory setup and audit phase.",
          "Led internal investigations into alleged vendor and contractor misconduct, implementing cross-check controls that reduced an estimated $500K exposure.",
        ],
      },
      {
        org: "Ningbo Institute of Materials Technology & Engineering",
        unit: "Chinese Academy of Sciences",
        role: "Strategic Analyst Intern",
        location: "Ningbo",
        period: "Jul 2023 — Sep 2023",
        detail: [
          "Authored a 17-page comparative report on novel polymer materials and international regulation; its section on Japan's bottom-up plastic regulation was incorporated into the institute's annual report.",
          "Organised a conference with ten CAS researchers and Ningbo industry entrepreneurs, and conducted follow-up interviews that refined a materials-application product project.",
        ],
      },
      {
        org: "China Securities Co., Ltd.",
        role: "Research Intern",
        location: "Remote",
        period: "May 2023 — Jun 2023",
        detail: [
          "Analysed semiconductor IC manufacturing at market and company level in SQL and Tableau, authoring a weekly industry report.",
          "Mapped the global IC raw-material supply chain and screened niche-sector startups into four target briefs.",
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
    lede: "Game studio, music collective, literary pieces. Visions that defy the mind's confinement.",
    entries: [
      {
        org: "ELEGISTS STUDIO",
        role: "Co-Founder & Creative Director",
        location: "Remote",
        period: "May 2026 — Present",
        detail: [
          "Co-founded a remote independent game studio and manages all eight team members across creative and production functions.",
          "Conceived DEAR SUSPECT, an AI-native deduction game, and leads its creative vision, aesthetic direction, narrative and gameplay design, and design-system development.",
          "Wrote approximately 100,000 Chinese characters of game script and owns the project's production, publishing, financing, and business-development workstreams.",
        ],
      },
      {
        org: "Hot Sound Club",
        role: "Vice President & Co-Founder",
        location: "Irvine, CA",
        period: "Mar 2022 — Jul 2023",
        detail: [
          "Co-founded and led a cultural collective of 100 students and artists, developing six student bands and their operating teams.",
          "Grew the organisation into one of the five largest music-focused student associations on campus within six months.",
          "Produced three concerts, raising approximately $6,000 and drawing a combined audience of over 5,000.",
        ],
      },
    ],
  },
];

export const EDUCATION = [
  {
    org: "Brown University",
    role: "Master of Public Affairs",
    location: "Providence, RI",
    period: "Jun 2024 — Jun 2025",
    detail: "Econometrics, probability, data analysis and visualisation, public policy, corporate finance, public administration.",
  },
  {
    org: "Harvard University",
    role: "International Business / Trade / Commerce (non-degree)",
    location: "Cambridge, MA",
    period: "Aug 2024 — Dec 2024",
    detail: "Cross-registration during the Brown MPA.",
  },
  {
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
    texture: [
      { text: "τ_g = τ", face: "mono" },
      { text: "Θ_g = Θ", face: "mono" },
      { text: "ΔCFI ≤ .01", face: "mono" },
      { text: "RMSEA ≤ .06", face: "mono" },
      { text: "WLSMV", face: "mono" },
      { text: "ω", face: "mono" },
      // Philosophy: terms only for anyone still in copyright. Lichtung and
      // Geworfenheit are Heidegger, who is not out until 2046; a term is not
      // a quotation, a paragraph would be.
      { text: "Geworfenheit", face: "serif" },
      { text: "Lichtung", face: "serif" },
      { text: "Nachträglichkeit", face: "serif" },
      // One concept each, the most load-bearing one that analyst is known for.
      // Bion gets two because both are notation rather than prose.
      { text: "paranoid-schizoid position", face: "serif" },
      { text: "β → α", face: "mono" },
      { text: "L · H · K", face: "mono" },
      { text: "transitional object", face: "serif" },
      { text: "identification with the aggressor", face: "serif" },
      { text: "collective unconscious", face: "serif" },
      // Personality and trauma. Volitional personality change is the Delta Lab
      // work, so the sector points at something he actually did.
      { text: "volitional personality change", face: "serif" },
      { text: "disorganised attachment", face: "serif" },
      { text: "complex PTSD", face: "serif" },
      { text: "dissociation", face: "serif" },
      { text: "window of tolerance", face: "serif" },
      { text: "posttraumatic growth", face: "serif" },
      { text: "HEXACO", face: "mono" },
      // ⊨ is absent on purpose: it is this sector's mark on the ring, and
      // repeating it here is the one duplication that would read as an error.
      // Φ is absent too — it is already in the knot, as JΦ.
      { text: "⊢", face: "mono" },
      { text: "∀", face: "mono" },
      { text: "∃", face: "mono" },
      { text: "¬", face: "mono" },
      { text: "□", face: "mono" },
      { text: "◇", face: "mono" },
      { text: "∴", face: "mono" },
      { text: "λ", face: "mono" },
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
    heading: "Statistical & programming",
    items:
      "R (tidyverse, psych, lavaan, semTools, flextable) · Python (NumPy, pandas) · SPSS · SQL · Tableau · Power BI · Quarto / R Markdown · Git",
  },
  {
    heading: "Research methods",
    items:
      "Ordinal and multi-group CFA · measurement invariance testing · Cramér's V diagnostics · missingness audits · MNFA · econometrics · reproducible research workflows",
  },
  {
    heading: "Leadership & operations",
    items:
      "Creative direction · narrative and gameplay design · project management · business-process and organisational design · negotiation and conflict resolution · HR and compliance systems",
  },
  {
    heading: "Languages",
    items: "Mandarin Chinese (native) · English (bilingual, extensive academic writing)",
  },
];

// Phone numbers from the source CV are deliberately omitted — a personal site is
// a scraping target, and email is sufficient for anyone with a real reason to write.
export const CONTACT_EMAIL = "shiyixuan1116@gmail.com";

// The centre of the site. Deliberately carries no track colour and no glyph —
// the three public identities are encoded; this one is not.
export const ADVOCACY = [
  {
    org: "Crisis Text Line",
    role: "Certified Volunteer Crisis Counselor",
    location: "Remote",
    period: "Mar 2026 — Present",
    detail:
      "30+ hours of evidence-based crisis-counselling training and certification, and 50+ hours of text-based support on academic stress, relational distress, depression, and self-harm risk.",
  },
  {
    org: "XunZheng Mental Health Clinic",
    role: "Mental Health Hotline Operator",
    location: "Ningbo",
    period: "Jan 2021 — Jun 2021",
    detail:
      "Supported crisis-hotline rotations after reflective-listening training, and managed front-desk operations for a twelve-clinician practice.",
  },
  {
    org: "Adoption Day Ningbo",
    role: "Animal Rescuer",
    location: "Ningbo",
    period: "Jan 2024 — May 2024",
    detail:
      "Rescued stray cats, provided weekend feline care and animal first aid, and coordinated with charities, independent rescuers, and shelters.",
  },
];
