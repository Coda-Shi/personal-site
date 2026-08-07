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
  glyph: string;
  glyphName: string;
  lede: string;
  entries: Entry[];
};

export const NAME = 'Yixuan "Coda" Shi';

export const PROFILE =
  "Interdisciplinary researcher and creative director working across cultural psychology, psychometrics, crisis intervention, and AI-native game development.";

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
    glyph: "∀",
    glyphName: "universal quantifier",
    lede: "Cultural psychology, psychometrics, and the question of whether a construct means the same thing to everyone it is measured on.",
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
    lede: "Operations, compliance, and the unglamorous systems that decide whether a plant ships on time or does not.",
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
    glyph: "◇",
    glyphName: "modal possibility operator",
    lede: "A game studio, a music collective, and roughly a hundred thousand characters of script. The territory of what could be the case.",
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
