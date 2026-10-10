// Work categories. The on-chain program stores only the numeric id; the
// rubric the judge applies for each one lives here so it is public and
// versioned alongside the code.

export interface Criterion {
  key: string;
  label: string;
  weight: number;
  guide: string;
}

export interface Category {
  id: number;
  slug: string;
  label: string;
  emoji: string;
  blurb: string;
  criteria: Criterion[];
}

export const CATEGORIES: Category[] = [
  {
    id: 0,
    slug: "copy",
    label: "Copy & Content",
    emoji: "✍️",
    blurb: "Taglines, product copy, posts, scripts",
    criteria: [
      { key: "brief_fit", label: "Brief fit", weight: 0.35, guide: "Does it do exactly what the brief asks, for the stated audience, tone and constraints?" },
      { key: "craft", label: "Craft", weight: 0.3, guide: "Clarity, rhythm, word choice, memorability. Would a professional editor ship it?" },
      { key: "originality", label: "Originality", weight: 0.2, guide: "Fresh angle versus cliché or generic filler." },
      { key: "constraints", label: "Constraints", weight: 0.15, guide: "Length limits, required keywords, format and language requirements." },
    ],
  },
  {
    id: 1,
    slug: "translation",
    label: "Translation",
    emoji: "🌏",
    blurb: "Localization with cultural nuance",
    criteria: [
      { key: "accuracy", label: "Accuracy", weight: 0.4, guide: "Meaning preserved, nothing added or dropped." },
      { key: "fluency", label: "Fluency", weight: 0.3, guide: "Reads like it was written natively in the target language." },
      { key: "localization", label: "Localization", weight: 0.2, guide: "Cultural fit, idioms, register, local conventions." },
      { key: "constraints", label: "Constraints", weight: 0.1, guide: "Formatting, terminology and length requirements from the brief." },
    ],
  },
  {
    id: 2,
    slug: "code",
    label: "Code",
    emoji: "🧩",
    blurb: "Functions, scripts, reviews, fixes",
    criteria: [
      { key: "correctness", label: "Correctness", weight: 0.45, guide: "Solves the stated problem, handles edge cases, no bugs on careful reading." },
      { key: "clarity", label: "Clarity", weight: 0.25, guide: "Readable, idiomatic, sensibly named." },
      { key: "robustness", label: "Robustness", weight: 0.2, guide: "Input validation, failure modes, efficiency." },
      { key: "constraints", label: "Constraints", weight: 0.1, guide: "Language, signature and dependency requirements from the brief." },
    ],
  },
  {
    id: 3,
    slug: "labeling",
    label: "Data Labeling",
    emoji: "🏷️",
    blurb: "Classification, tagging, annotation",
    criteria: [
      { key: "accuracy", label: "Label accuracy", weight: 0.5, guide: "Labels are correct under the brief's guidelines." },
      { key: "consistency", label: "Consistency", weight: 0.25, guide: "Same kind of input gets the same label every time." },
      { key: "coverage", label: "Coverage", weight: 0.15, guide: "Every item labeled, nothing skipped." },
      { key: "format", label: "Format", weight: 0.1, guide: "Output follows the requested format exactly." },
    ],
  },
  {
    id: 4,
    slug: "research",
    label: "Research",
    emoji: "🔎",
    blurb: "Summaries, comparisons, market scans",
    criteria: [
      { key: "insight", label: "Insight", weight: 0.35, guide: "Non-obvious, decision-useful findings." },
      { key: "accuracy", label: "Accuracy", weight: 0.3, guide: "Claims are plausible and carefully hedged; no fabrication." },
      { key: "structure", label: "Structure", weight: 0.2, guide: "Scannable, well organized, right length." },
      { key: "constraints", label: "Constraints", weight: 0.15, guide: "Scope and format requirements from the brief." },
    ],
  },
];

export function categoryById(id: number): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
}
