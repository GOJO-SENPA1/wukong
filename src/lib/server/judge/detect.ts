// Deterministic integrity checks that run before any model sees a
// submission. They are cheap, explainable, and can't be talked out of a
// verdict by the submission itself.

import type { JudgeFlag } from "./types";

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(text: string): string[] {
  const n = normalize(text);
  return n ? n.split(" ") : [];
}

function shingles(ws: string[], k: number): Set<string> {
  const out = new Set<string>();
  if (ws.length < k) {
    if (ws.length) out.add(ws.join(" "));
    return out;
  }
  for (let i = 0; i + k <= ws.length; i++) out.add(ws.slice(i, i + k).join(" "));
  return out;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

/**
 * Similarity in [0,1] that works for one-liners and long texts. With
 * `headline`, the first line (the deliverable in copy tasks: the tagline
 * itself) is compared on its own, so a copied tagline with a reworded
 * rationale is still caught.
 */
export function similarity(a: string, b: string, opts: { headline?: boolean } = {}): number {
  const wa = words(a);
  const wb = words(b);
  if (!wa.length || !wb.length) return 0;
  if (wa.join(" ") === wb.join(" ")) return 1;
  const k = Math.min(wa.length, wb.length) < 12 ? 1 : 3;
  const bag = jaccard(shingles(wa, k), shingles(wb, k));
  if (!opts.headline) return bag;
  const headA = words(a.split("\n")[0]);
  const headB = words(b.split("\n")[0]);
  if (headA.length < 3 || headB.length < 3) return bag;
  const head = jaccard(new Set(headA), new Set(headB));
  return Math.max(bag, head * 0.95);
}

const INJECTION_PATTERNS: RegExp[] = [
  /ignore (all |any |the )?(previous|prior|above|earlier) (instructions|prompts|rules)/i,
  /disregard (the |all |your )?(rubric|instructions|rules|guidelines)/i,
  // "ignore the rubric" is an attack; "forget the rules of sleep" is a tagline: only judging words count
  /(ignore|forget|override|bypass) (the |all |any |your |these )?(rubric|instructions|scoring (guide|rules|criteria)|grading (guide|rules|criteria)|evaluation (rules|criteria))/i,
  /(ignore|forget|override|bypass) your (rules|guidelines)/i,
  /you are (now )?(the |an? )?(ai |llm )?(judge|grader|evaluator)/i,
  /(score|rate|grade|mark) (this|me|it|my)( (entry|submission|answer|response|tagline|translation|code|work))? (a |as |at )?(100|10\/10|perfect|maximum|the highest|full marks)/i,
  /\b(system|developer) prompt\b/i,
  /<\/?(system|instructions?|judge)>/i,
  /as the (ai )?judge,? you (must|should|will)/i,
  /new instructions?:/i,
  // tag breakout: closing or forging the judge's own blocks
  /<\/?\s*(submission|brief|rubric|task|precheck_signals|verified_facts)[\w-]*\s*[>\s]/i,
  /\b(assign|give|award)\b.{0,40}\b(full|maximum|perfect|100)\b.{0,20}\b(score|marks|points)\b/i,
  // messages addressed to whoever grades the entry
  /\b(note|message|instructions?|memo)\s+(to|for)\s+(the\s+)?(ai\s+)?(judge|grader|evaluator|marker|reviewer|scorer)\b/i,
  /\b(grader|judge|evaluator|scorer)\s*(note|notice)?\s*:/i,
  /\brecord\s+(the\s+)?(correctness|score|grade|rating|it|this)\s+as\s+\d+/i,
  /\b(correct|expected|right|official)\s+(evaluation\s+|judging\s+)?(output|verdict|score|grade|rating)s?\s+(for|of)\s+this\s+(entry|submission|answer|response)/i,
  // a forged verdict: the judge's own JSON shape with a perfect score
  /"(criteria|flags)"\s*:\s*\[[\s\S]{0,400}"score"\s*:\s*(100|10)\b/i,
  // a fake role line that talks about how entries are scored
  /^\s*(system|developer|assistant)\s*(message|prompt|update)?\s*:.{0,160}\b(rubric|evaluat\w*|scor\w*|marks|grad\w*|judg\w*|criteri\w*)/im,
  // Nepali and Hindi: "ignore the instructions", "give 100 marks", addressing the judge
  /(निर्देशन|निर्देश)\S*\s*(\S+\s+){0,2}(बेवास्ता|नमान्नु|अनदेखा|नज़रअंदाज़|नजरअंदाज)/,
  /(१००|100)\s*(अंक|नम्बर|नंबर)\s*(दिनुहोस्|दिनु|दें|दीजिए|दो)/,
  /(न्यायाधीश|निर्णायक|मूल्याङ्कनकर्ता|परीक्षक|जज)\S*\s*[:,।]/,
];

// Letters from other scripts that look identical to Latin ones (Cyrillic, Greek), mapped back,
// so "Ignоre" spelled with a Cyrillic о still reads as "Ignore".
const CONFUSABLE: Record<string, string> = {
  "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "у": "y", "х": "x", "і": "i", "ј": "j", "ѕ": "s", "һ": "h", "ԁ": "d", "ӏ": "l", "ԛ": "q", "ԝ": "w",
  "А": "A", "В": "B", "Е": "E", "К": "K", "М": "M", "Н": "H", "О": "O", "Р": "P", "С": "C", "Т": "T", "Х": "X", "І": "I", "Ј": "J", "Ѕ": "S",
  "ο": "o", "α": "a", "ε": "e", "ι": "i", "κ": "k", "ν": "v", "ρ": "p", "τ": "t", "υ": "u", "χ": "x",
  "Α": "A", "Β": "B", "Ε": "E", "Ζ": "Z", "Η": "H", "Ι": "I", "Κ": "K", "Μ": "M", "Ν": "N", "Ο": "O", "Ρ": "P", "Τ": "T", "Υ": "Y", "Χ": "X",
};
const CONFUSABLE_RE = new RegExp(`[${Object.keys(CONFUSABLE).join("")}]`, "g");

/** Undo the usual disguises: compatibility forms, zero-width and soft-hyphen characters, look-alike letters, odd spacing. */
function normalizeForScan(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/[\u00AD\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g, "")
    .replace(/[^\S\n]+/g, " ")
    .replace(CONFUSABLE_RE, (c) => CONFUSABLE[c]);
}

/** Text hidden in base64 blobs (40+ characters that decode to readable text), so encoded instructions get scanned too. */
function decodedBlobs(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/[A-Za-z0-9+/]{40,}={0,2}/g)) {
    const decoded = Buffer.from(m[0], "base64").toString("utf8");
    if (/^[\x20-\x7E\s]{20,}$/.test(decoded)) out.push(decoded);
  }
  return out;
}

export function detectInjection(text: string): string | null {
  for (const candidate of [text, ...decodedBlobs(text)]) {
    const norm = normalizeForScan(candidate);
    // Line breaks are kept for the role-line pattern; everything else also sees the text on one line.
    for (const re of INJECTION_PATTERNS) {
      const m = norm.match(re) ?? norm.replace(/\n/g, " ").match(re);
      if (m) return m[0].slice(0, 120);
    }
  }
  return null;
}

/** Briefs that legitimately want a very short answer (a name, a 3-word slogan). */
export function briefAllowsShort(brief: string): boolean {
  return /\b(one|single|1|2|3|4)[- ]word|max(imum)?\s*[1-4]\s*words?|\b(a |the )?names?\b|\bnaming\b|\btitle\b|\bheadline\b|\bhashtag/i.test(brief);
}

export function detectLowEffort(text: string, opts: { brief?: string } = {}): string | null {
  const ws = words(text);
  if (ws.length === 0) return "empty submission";
  if (!/\p{L}/u.test(text)) return "no actual words";
  if (ws.length < 5 && !(opts.brief && briefAllowsShort(opts.brief))) {
    return `only ${ws.length} word${ws.length === 1 ? "" : "s"}`;
  }
  const unique = new Set(ws).size;
  if (ws.length >= 8 && unique / ws.length < 0.3) return "highly repetitive";
  return null;
}

export interface PriorEntry {
  index: number;
  submittedAt: number;
  content: string;
}

export interface Signal {
  flag: JudgeFlag;
  detail: string;
}

export const DUPLICATE_THRESHOLD = 0.72;

/**
 * How similar an entry must be to an earlier one to count as a copy, by category.
 * Honest work converges in some categories: a short source has few good
 * translations (so only near-exact copies count), a short function has one
 * idiomatic form and a single character changes its meaning (so only an exact
 * copy, ignoring whitespace, counts), and correct labels are identical by design
 * (never a copy). Copy and research are original writing: 72% overlap is a copy.
 */
export function duplicateThreshold(category?: number): number | null {
  if (category === 3) return null; // labeling
  if (category === 2) return 1; // code: exact copies only (see integritySignals)
  if (category === 1) return 0.95; // translation
  return DUPLICATE_THRESHOLD; // copy, research
}

/** Run every deterministic check for one submission against earlier ones. */
export function integritySignals(
  content: string,
  earlier: PriorEntry[],
  opts: { headline?: boolean; brief?: string; category?: number } = {},
): Signal[] {
  const out: Signal[] = [];
  const inj = detectInjection(content);
  if (inj) out.push({ flag: "prompt_injection", detail: `tries to instruct the judge: "${inj}"` });
  const low = detectLowEffort(content, { brief: opts.brief });
  if (low) out.push({ flag: "low_effort", detail: low });
  const threshold = duplicateThreshold(opts.category);
  let best: { index: number; sim: number } | null = null;
  const squash = (s: string) => s.replace(/\s+/g, "");
  for (const e of threshold === null ? [] : earlier) {
    const sim = opts.category === 2 ? (squash(content) === squash(e.content) ? 1 : 0) : similarity(content, e.content, opts);
    if (!best || sim > best.sim) best = { index: e.index, sim };
  }
  if (best && threshold !== null && best.sim >= threshold) {
    out.push({
      flag: "duplicate",
      detail: `${Math.round(best.sim * 100)}% overlap with earlier submission #${best.index + 1}`,
    });
  }
  return out;
}
