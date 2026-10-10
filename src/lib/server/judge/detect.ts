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
  /you are (now )?(the |an? )?(ai |llm )?(judge|grader|evaluator)/i,
  /(score|rate|grade|mark) (this|me|it|my (entry|submission))( submission)? (a |as )?(100|10\/10|perfect|maximum|the highest)/i,
  /\b(system|developer) prompt\b/i,
  /<\/?(system|instructions?|judge)>/i,
  /as the (ai )?judge,? you (must|should|will)/i,
  /new instructions?:/i,
];

export function detectInjection(text: string): string | null {
  for (const re of INJECTION_PATTERNS) {
    const m = text.match(re);
    if (m) return m[0];
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

/** Run every deterministic check for one submission against earlier ones. */
export function integritySignals(
  content: string,
  earlier: PriorEntry[],
  opts: { headline?: boolean; brief?: string } = {},
): Signal[] {
  const out: Signal[] = [];
  const inj = detectInjection(content);
  if (inj) out.push({ flag: "prompt_injection", detail: `tries to instruct the judge: "${inj}"` });
  const low = detectLowEffort(content, { brief: opts.brief });
  if (low) out.push({ flag: "low_effort", detail: low });
  let best: { index: number; sim: number } | null = null;
  for (const e of earlier) {
    const sim = similarity(content, e.content, opts);
    if (!best || sim > best.sim) best = { index: e.index, sim };
  }
  if (best && best.sim >= DUPLICATE_THRESHOLD) {
    out.push({
      flag: "duplicate",
      detail: `${Math.round(best.sim * 100)}% overlap with earlier submission #${best.index + 1}`,
    });
  }
  return out;
}
