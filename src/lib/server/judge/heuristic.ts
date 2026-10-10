// Offline fallback judge. No API key, no network: transparent heuristics so
// the demo never dies on stage. Reports say engine "heuristic" so nobody
// mistakes it for the Claude judge.

import { categoryById } from "../../categories";
import { normalize } from "./detect";
import type { JudgeFlag, ScoringInput, ScoringOutput } from "./types";

const STOP = new Set(
  "about above after again against their there these those which while would could should other where being every write words under least their your with from that this have will into must make one two three only also more most such than then them they what when who whom whose".split(
    " ",
  ),
);

const CLICHES = [
  "wake up and smell the coffee",
  "game changer",
  "next level",
  "best in class",
  "taste the difference",
  "like never before",
  "revolutionary",
  "world class",
  "roof of the world",
  "unleash",
  "elevate your",
  "buy now",
];

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

function briefKeywords(brief: string): string[] {
  const seen = new Map<string, number>();
  for (const w of normalize(brief).split(" ")) {
    if (w.length < 5 || STOP.has(w) || /^\d+$/.test(w)) continue;
    seen.set(w, (seen.get(w) ?? 0) + 1);
  }
  return [...seen.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14).map(([w]) => w);
}

function maxWords(brief: string): number | null {
  const m =
    brief.match(/(?:max(?:imum)?|under|at most|no more than|up to|≤)\s*(\d+)\s*words?/i) ??
    brief.match(/(\d+)\s*words?\s*(?:max|or (?:less|fewer))/i);
  return m ? Number(m[1]) : null;
}

function bannedPhrases(brief: string): string[] {
  const out: string[] = [];
  const re = /(?:no|avoid|don't use|do not use|not)[^.'"“”]*?(?:like|such as)?\s*['"“]([^'"”]{3,60})['"”]/gi;
  for (const m of brief.matchAll(re)) out.push(m[1].toLowerCase());
  return out;
}

const DEVANAGARI = /[ऀ-ॿ]/g;
const HINDI_MARKERS = /(\sहै[\s।!]|\sमें\s|\sआपका\s|\sजाता\s|\sहैं[\s।!]|\sकृपया हमें\s|\sसुबह\s)/g;
const NEPALI_MARKERS = /(\sछ[\s।!]|\sमा\s|\sहुन्छ|\sदिनुहोस्|\sहुनुहुन्छ|\sछन्|\sबिहान)/g;

function languageIssue(brief: string, content: string): string | null {
  const wantsNepali = /nepali|devanagari/i.test(brief);
  if (!wantsNepali) return null;
  const letters = content.replace(/[\s\p{P}\p{N}]/gu, "").length || 1;
  const dev = (content.match(DEVANAGARI) ?? []).length;
  if (dev / letters < 0.5) return "not written in Devanagari script";
  const padded = ` ${content} `;
  const hi = (padded.match(HINDI_MARKERS) ?? []).length;
  const ne = (padded.match(NEPALI_MARKERS) ?? []).length;
  if (hi > ne) return "reads as Hindi, not Nepali";
  return null;
}

export function scoreHeuristic(input: ScoringInput): ScoringOutput {
  const cat = categoryById(input.category);
  if (cat.slug === "code") return scoreCode(input);
  if (cat.slug === "labeling") return scoreLabels(input);
  const content = input.content.trim();
  const lines = content.split("\n").filter((l) => l.trim());
  const deliverable = cat.slug === "copy" ? (lines[0] ?? "") : content;
  const norm = normalize(content);
  const ws = norm ? norm.split(" ") : [];
  const flags: JudgeFlag[] = [];
  const strengths: string[] = [];
  const improvements: string[] = [];

  // Brief fit: keyword coverage, or for translations, completeness against
  // the quoted source text (keywords don't survive a change of language).
  const kws = briefKeywords(`${input.title} ${input.brief}`);
  const hit = kws.filter((k) => ws.some((w) => w.startsWith(k.slice(0, 5))));
  let coverage = kws.length ? hit.length / kws.length : 0.5;
  const source = input.brief.match(/["“]([^"”]{40,})["”]/)?.[1];
  if (cat.slug === "translation" && source) {
    coverage = Math.min(1, content.length / (source.length * 0.9));
  }
  let fit = 45 + coverage * 55;

  // Constraints.
  let constraints = 92;
  const limit = maxWords(input.brief);
  const delivWords = normalize(deliverable).split(" ").filter(Boolean).length;
  if (limit && delivWords > limit) {
    constraints -= 35;
    flags.push("constraint_violation");
    improvements.push(`Over the ${limit}-word limit (${delivWords} words).`);
  } else if (limit) strengths.push(`Respects the ${limit}-word limit.`);
  const banned = bannedPhrases(input.brief).filter((p) => norm.includes(normalize(p)));
  if (banned.length) {
    constraints -= 40;
    fit -= 15;
    flags.push("constraint_violation");
    improvements.push(`Uses a phrase the brief explicitly bans: "${banned[0]}".`);
  }
  const lang = languageIssue(input.brief, content);
  if (lang) {
    constraints -= 50;
    fit -= 30;
    flags.push("wrong_language");
    improvements.push(`Language requirement missed: ${lang}.`);
  }
  if (/line 2|second line|rationale/i.test(input.brief) && cat.slug === "copy" && lines.length < 2) {
    constraints -= 20;
    improvements.push("Missing the one-line rationale the brief asks for.");
  }

  // Craft: diversity, sentence shape, no shouting.
  const unique = new Set(ws).size / Math.max(1, ws.length);
  const capsRatio = (content.match(/[A-Z]/g) ?? []).length / Math.max(1, content.replace(/[^a-zA-Z]/g, "").length);
  const avgLen = ws.reduce((a, w) => a + w.length, 0) / Math.max(1, ws.length);
  let craft = 60 + unique * 25 + Math.min(avgLen, 6) * 2;
  if (capsRatio > 0.5 && ws.length > 3) {
    craft -= 25;
    improvements.push("Shouting in all caps hurts readability.");
  }
  if (/[!?]{3,}/.test(content)) craft -= 10;
  if (ws.length < 4) craft -= 35;

  // Originality: clichés.
  const cliches = CLICHES.filter((c) => norm.includes(c));
  let originality = 82 - cliches.length * 22;
  if (cliches.length) improvements.push(`Leans on clichés (${cliches.join(", ")}).`);
  else if (ws.length >= 4) strengths.push("Avoids stock phrases.");

  if (coverage >= 0.35) strengths.push("Picks up the key ideas from the brief.");
  else improvements.push("Connects weakly to the specifics of the brief.");
  if (ws.length < 4) flags.push("low_effort");

  const values = [fit, craft, originality, constraints].map(clamp);
  const criteria = cat.criteria.map((c, i) => ({
    key: c.key,
    score: values[i] ?? 70,
    comment:
      i === 0
        ? cat.slug === "translation" && source
          ? `Carries ${Math.round(coverage * 100)}% of the source text's content.`
          : `Covers ${hit.length}/${kws.length} key brief terms${hit.length ? ` (${hit.slice(0, 4).join(", ")})` : ""}.`
        : i === 1
          ? `Lexical variety ${(unique * 100).toFixed(0)}%, ${ws.length} words.`
          : i === 2
            ? cliches.length
              ? `Cliché hits: ${cliches.join(", ")}.`
              : "No stock phrases detected."
            : flags.includes("constraint_violation") || lang
              ? "Breaks at least one explicit requirement."
              : "Meets the explicit requirements we can check.",
  }));

  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return {
    criteria,
    flags,
    summary: summarize(avg),
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 3),
    model: "wukong-heuristic-v1",
  };
}

function summarize(avg: number): string {
  return avg >= 80
    ? "Strong entry that tracks the brief closely."
    : avg >= 65
      ? "Solid entry with room to sharpen."
      : avg >= 45
        ? "Weak fit for the brief."
        : "Does not meet the brief.";
}

/** Code: check the brief's requirements as a checklist against the source. */
function scoreCode(input: ScoringInput): ScoringOutput {
  const cat = categoryById(input.category);
  const src = input.content;
  const brief = input.brief.toLowerCase();
  const checks: { label: string; applies: boolean; ok: boolean }[] = [
    { label: "strips accents (normalize + combining marks)", applies: /accent/.test(brief), ok: /normalize\(\s*["'`]NF[KC]?D["'`]\s*\)/.test(src) && /0300/.test(src) },
    { label: "lowercases", applies: /lowercase/.test(brief), ok: /toLowerCase\(\)/.test(src) },
    { label: "drops non a-z0-9 characters", applies: /a-z/.test(brief), ok: /\[\^a-z0-9/.test(src) },
    { label: "collapses repeated separators", applies: /collapse|repeated/.test(brief), ok: /\]\+/.test(src) || /\+\//.test(src) },
    { label: "trims leading/trailing hyphens", applies: /leading|trailing/.test(brief), ok: /\^-\+\|-\+\$|\^-\|-\$/.test(src) || /\.trim\(\)/.test(src) },
    { label: "typed signature", applies: /typescript/.test(brief), ok: /\(\s*\w+\s*:\s*string\s*\)\s*(:\s*string)?/.test(src) },
    { label: "3 example calls", applies: /example/.test(brief), ok: (src.match(/\/\/.*slugify\(|\/\/.*->|\/\/.*===/g) ?? []).length >= 3 },
    { label: "no dependencies", applies: /no dependenc/.test(brief), ok: !/\b(import|require)\b/.test(src) },
  ].filter((c) => c.applies);
  const passed = checks.filter((c) => c.ok);
  const ratio = checks.length ? passed.length / checks.length : 0.5;
  const comments = (src.match(/\/\/[^\n]*/g) ?? []).length;
  const lines = src.split("\n").filter((l) => l.trim()).length;
  const correctness = 30 + ratio * 65;
  const clarity = Math.min(95, 60 + Math.min(comments, 5) * 5 + (lines >= 4 ? 10 : 0));
  const robustness = 35 + ratio * 55;
  const constraints = checks.some((c) => c.label === "no dependencies" && !c.ok) ? 40 : 60 + ratio * 35;
  const values = [correctness, clarity, robustness, constraints].map(clamp);
  const missed = checks.filter((c) => !c.ok).map((c) => c.label);
  return {
    criteria: cat.criteria.map((c, i) => ({
      key: c.key,
      score: values[i],
      comment:
        i === 0
          ? `Meets ${passed.length}/${checks.length} brief requirements.`
          : i === 1
            ? `${lines} lines, ${comments} comments.`
            : i === 2
              ? missed.length
                ? `Misses: ${missed.slice(0, 2).join("; ")}.`
                : "Handles every case the brief lists."
              : "Checked language, signature and dependency requirements.",
    })),
    flags: missed.length > checks.length / 2 ? ["constraint_violation"] : [],
    summary: summarize(values.reduce((a, b) => a + b, 0) / values.length),
    strengths: passed.slice(0, 3).map((c) => `Correctly ${c.label}.`),
    improvements: missed.slice(0, 3).map((c) => `Add: ${c}.`),
    model: "wukong-heuristic-v1",
  };
}

const LABEL_LINE = /^\s*(\d+)[.)]\s*([A-Za-z]+)\s*$/;

function parseLabels(text: string, lenient = false): Map<number, string> {
  const out = new Map<number, string>();
  for (const line of text.split("\n")) {
    const m = line.match(LABEL_LINE);
    if (m) out.set(Number(m[1]), m[2].toUpperCase());
  }
  if (!out.size && lenient) {
    // Peers that ignored the format still count as votes, in order.
    text
      .split(/[,\n]+/)
      .map((w) => w.trim().toUpperCase())
      .filter((w) => /^[A-Z]{3,}$/.test(w))
      .forEach((w, i) => out.set(i + 1, w));
  }
  return out;
}

/** Labeling: format check plus agreement with the crowd's majority vote. */
function scoreLabels(input: ScoringInput): ScoringOutput {
  const cat = categoryById(input.category);
  const expected = (input.brief.match(/^\s*\d+\.\s+\S/gm) ?? []).length || 1;
  const allowed = new Set(
    (input.brief.match(/\b[A-Z]{4,}\b/g) ?? []).filter((w) => !["ONE", "LABEL"].includes(w)),
  );
  const mine = parseLabels(input.content);
  const peers = (input.peers ?? []).map((p) => parseLabels(p, true)).filter((p) => p.size > 0);

  let agree = 0;
  let voted = 0;
  for (const [n, label] of mine) {
    const votes = new Map<string, number>();
    for (const p of [mine, ...peers]) {
      const l = p.get(n);
      if (l) votes.set(l, (votes.get(l) ?? 0) + 1);
    }
    const top = [...votes.entries()].sort((a, b) => b[1] - a[1])[0];
    if (top && peers.length) {
      voted++;
      if (top[0] === label && top[1] > 1) agree++;
    }
  }
  const coverage = Math.min(1, mine.size / expected);
  const validLabels = [...mine.values()].filter((l) => !allowed.size || allowed.has(l)).length;
  const consensus = voted ? agree / voted : coverage;
  const accuracy = mine.size ? 30 + consensus * 65 : 5;
  const consistency = mine.size ? 50 + (validLabels / Math.max(1, mine.size)) * 45 : 5;
  const cov = 10 + coverage * 85;
  const format = mine.size === expected ? 95 : mine.size ? 55 : 10;
  const values = [accuracy, consistency, cov, format].map(clamp);
  const improvements: string[] = [];
  if (!mine.size) improvements.push(`Use the requested format: one "<number>. <LABEL>" per line.`);
  if (mine.size && mine.size < expected) improvements.push(`Label all ${expected} items (got ${mine.size}).`);
  if (voted && agree < voted) improvements.push(`${voted - agree} label(s) disagree with the crowd consensus; re-check mixed reviews.`);
  return {
    criteria: cat.criteria.map((c, i) => ({
      key: c.key,
      score: values[i],
      comment:
        i === 0
          ? voted
            ? `Agrees with crowd consensus on ${agree}/${voted} items.`
            : "No parseable labels to compare."
          : i === 1
            ? `${validLabels}/${mine.size} labels use the allowed set.`
            : i === 2
              ? `${mine.size}/${expected} items labeled.`
              : mine.size === expected
                ? "Exact requested format."
                : "Does not follow the requested line format.",
    })),
    flags: mine.size ? [] : ["constraint_violation"],
    summary: summarize(values.reduce((a, b) => a + b, 0) / values.length),
    strengths: mine.size === expected ? ["Complete and correctly formatted."] : [],
    improvements,
    model: "wukong-heuristic-v1",
  };
}
