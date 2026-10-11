// Work categories. The on-chain program stores only the numeric id; the
// rubric the judge applies for each one lives here so it is public and
// versioned alongside the code. RUBRIC_VERSION goes into every report.

export const RUBRIC_VERSION = "v2";

export interface Criterion {
  key: string;
  label: string;
  weight: number;
  guide: string;
  /** Score anchors the judge calibrates against (rubric v2) */
  anchors: string;
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
      { key: "brief_fit", label: "Brief fit", weight: 0.35, guide: "Does it do exactly what the brief asks, for the stated audience, tone and constraints?", anchors: "90: aimed squarely at the stated audience and goal, uses the brief's specifics; 70: on brief but generic about the audience; 50: only loosely about the product or audience; 25: about something else" },
      { key: "craft", label: "Craft", weight: 0.3, guide: "Clarity, rhythm, word choice, memorability. Would a professional editor ship it?", anchors: "90: an editor would ship it unchanged, memorable; 70: clear with one weak word or clumsy rhythm; 50: understandable but flat or awkward; 25: confusing, errors, or shouting" },
      { key: "originality", label: "Originality", weight: 0.2, guide: "Fresh angle versus cliché or generic filler.", anchors: "90: a fresh, specific angle nobody else would write; 70: some specificity; 50: generic, could sell any product; 25: stock clichés" },
      { key: "constraints", label: "Constraints", weight: 0.15, guide: "Length limits, required keywords, format and language requirements.", anchors: "95: every requirement met (see verified facts); 40 or less: any hard requirement failed" },
    ],
  },
  {
    id: 1,
    slug: "translation",
    label: "Translation",
    emoji: "🌏",
    blurb: "Localization with cultural nuance",
    criteria: [
      { key: "accuracy", label: "Accuracy", weight: 0.4, guide: "Meaning preserved, nothing added or dropped.", anchors: "90: every sentence, number, time and name carried over; 70: one minor nuance off; 50: a sentence, number or key detail wrong or missing; 25: large parts missing or wrong" },
      { key: "fluency", label: "Fluency", weight: 0.3, guide: "Reads like it was written natively in the target language.", anchors: "90: reads as native writing; 70: natural with a stiff phrase; 50: word-for-word, clearly translated; 25: ungrammatical" },
      { key: "localization", label: "Localization", weight: 0.2, guide: "Cultural fit, idioms, register, local conventions.", anchors: "90: register and conventions right for the audience (honorifics, units, formats); 70: mostly right; 50: register off; 25: culturally wrong or offensive" },
      { key: "constraints", label: "Constraints", weight: 0.1, guide: "Formatting, terminology and length requirements from the brief.", anchors: "95: every requirement met (see verified facts); 40 or less: any hard requirement failed" },
    ],
  },
  {
    id: 2,
    slug: "code",
    label: "Code",
    emoji: "🧩",
    blurb: "Functions, scripts, reviews, fixes",
    criteria: [
      { key: "correctness", label: "Correctness", weight: 0.45, guide: "Solves the stated problem, handles edge cases, no bugs on careful reading.", anchors: "95: correct on every example and edge case you trace by hand; 70: one edge case wrong; 45: the main case works but a stated requirement fails; 20: wrong, crashes or does not run" },
      { key: "clarity", label: "Clarity", weight: 0.25, guide: "Readable, idiomatic, sensibly named.", anchors: "90: idiomatic and easy to follow; 70: readable with some noise; 50: hard to follow; 25: obfuscated" },
      { key: "robustness", label: "Robustness", weight: 0.2, guide: "Input validation, failure modes, efficiency.", anchors: "90: handles empty, unusual and large input safely; 70: one failure mode unhandled; 50: fragile; 25: crashes or hangs on ordinary input" },
      { key: "constraints", label: "Constraints", weight: 0.1, guide: "Language, signature and dependency requirements from the brief.", anchors: "95: every requirement met (see verified facts); 40 or less: any hard requirement failed" },
    ],
  },
  {
    id: 3,
    slug: "labeling",
    label: "Data Labeling",
    emoji: "🏷️",
    blurb: "Classification, tagging, annotation",
    criteria: [
      { key: "accuracy", label: "Label accuracy", weight: 0.5, guide: "Labels are correct under the brief's guidelines.", anchors: "Decide the correct label for every item yourself first, then score the share correct: all correct 95; one wrong 85; 70% correct 65; half 45; mostly wrong 20" },
      { key: "consistency", label: "Consistency", weight: 0.25, guide: "Same kind of input gets the same label every time.", anchors: "90: similar items get the same label; 60: some similar items labeled differently; 30: the same label for everything regardless of content" },
      { key: "coverage", label: "Coverage", weight: 0.15, guide: "Every item labeled, nothing skipped.", anchors: "95: every item labeled; then minus 10 per missing item" },
      { key: "format", label: "Format", weight: 0.1, guide: "Output follows the requested format exactly.", anchors: "95: exactly the requested format and label set; 60: small deviations; 30: a different format" },
    ],
  },
  {
    id: 4,
    slug: "research",
    label: "Research",
    emoji: "🔎",
    blurb: "Summaries, comparisons, market scans",
    criteria: [
      { key: "insight", label: "Insight", weight: 0.35, guide: "Non-obvious, decision-useful findings.", anchors: "90: specific trade-offs a decision-maker can act on; 70: sound but expected points; 50: generic; 25: off the question" },
      { key: "accuracy", label: "Accuracy", weight: 0.3, guide: "Claims are plausible and carefully hedged; no fabrication.", anchors: "90: every claim plausible and hedged where uncertain; 60: one overstated claim; 30 or less: invented statistics, studies, quotes or precise figures with no source" },
      { key: "structure", label: "Structure", weight: 0.2, guide: "Scannable, well organized, right length.", anchors: "90: scannable, ordered by importance; 70: organized; 50: a wall of text or a bare list; 25: disorganized" },
      { key: "constraints", label: "Constraints", weight: 0.15, guide: "Scope and format requirements from the brief.", anchors: "95: every requirement met (see verified facts); 40 or less: any hard requirement failed" },
    ],
  },
];

export function categoryById(id: number): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
}
