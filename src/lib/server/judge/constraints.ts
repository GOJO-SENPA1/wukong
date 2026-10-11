// The brief compiler: turns a brief's hard requirements into checks that code
// verifies exactly (word and character limits, required and banned phrases,
// language and script, line structure, item counts, code language). The facts
// go to the AI judge as verified ground truth, so it never has to count words
// or guess a script, and a broken requirement is flagged deterministically.
// Parsing is deliberately conservative: a rule we can't read with confidence
// is left to the judge rather than enforced by code.

import { categoryById } from "../../categories";
import { normalize } from "./detect";

export interface Fact {
  /** What the brief requires, in plain words */
  rule: string;
  ok: boolean;
  /** What the code measured */
  detail: string;
  /** A failed fact's flag: a broken requirement, or the wrong language */
  flag: "constraint_violation" | "wrong_language";
  /** "graded": shown to the judge, scored in its criterion (labeling coverage); "hard" (default): also flagged and capped */
  kind?: "hard" | "graded";
}

// Words as people count them (a word processor's count): whitespace-separated tokens with a letter or digit.
const wordCount = (s: string) => s.trim().split(/\s+/).filter((t) => /[\p{L}\p{N}]/u.test(t)).length;
const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
// Quoted phrases; a straight single quote only counts at a word boundary, so the apostrophe in "don't" isn't one.
const quoted = (s: string) =>
  [...s.matchAll(/["“]([^"”\n]{2,60})["”]|‘([^’\n]{2,60})’|(?<![\p{L}\p{N}])'([^'\n]{2,60})'(?![\p{L}\p{N}])/gu)].map((m) =>
    (m[1] ?? m[2] ?? m[3]).trim(),
  );
const clauses = (brief: string) => brief.split(/(?<=[.;!?])\s+|\n+/).map((c) => c.trim()).filter(Boolean);
const NEGATION = /\b(no|not|don'?t|do not|never|avoid|without|ban(?:ned)?|exclude)\b/i;
const REQUIRE = /\b(must (?:mention|include|use|contain|feature)|mention|include|use the (?:word|phrase|term)s?|contain|feature)\b/i;
const has = (hay: string, needle: string) => normalize(hay).includes(normalize(needle));

/** The part of a copy entry the brief's limits apply to: the first line when the brief asks for a separate rationale line. */
function deliverable(brief: string, category: number, content: string): { text: string; label: string } {
  if (categoryById(category).slug === "copy" && /\bline 2\b|second line|rationale/i.test(brief)) {
    return { text: lines(content)[0] ?? "", label: "line 1" };
  }
  return { text: content, label: "the entry" };
}

// Devanagari letters and vowel signs (not its digits or danda punctuation).
const DEVANAGARI = /[\u0900-\u0963\u0971-\u097F]/g;
const HINDI = /(\sहै[\s।!]|\sमें\s|\sआपका\s|\sजाता\s|\sहैं[\s।!]|\sकृपया हमें\s|\sसुबह\s|\sऔर\s|\sके लिए\s)/g;
const NEPALI = /(\sछ[\s।!]|\sमा\s|\sहुन्छ|\sदिनुहोस्|\sहुनुहुन्छ|\sछन्|\sबिहान|\sर\s|\sको लागि\s)/g;
const EN_STOP = /\b(the|and|is|are|of|to|for|with|your|our|please|we|you|this|that)\b/gi;
const ES_STOP = /\b(el|la|los|las|y|es|son|de|del|para|con|su|sus|por|que|una?|en|nuestr[oa]s?)\b/gi;

/** Which language the brief wants the entry written in, if it says so clearly. */
function targetLanguage(brief: string): "nepali" | "spanish" | null {
  const m = brief.match(/\b(?:into|to|in)\s+(nepali|spanish)\b/i) ?? brief.match(/\b(nepali|spanish)\s+(?:translation|version)\b/i);
  if (m) return m[1].toLowerCase() as "nepali" | "spanish";
  if (/devanagari/i.test(brief)) return "nepali";
  return null;
}

function languageFact(lang: "nepali" | "spanish", content: string): Fact {
  const rule = lang === "nepali" ? "Written in Nepali (Devanagari script)" : "Written in Spanish";
  if (lang === "nepali") {
    const letters = (content.match(/[\p{L}\p{M}]/gu) ?? []).length || 1;
    const dev = Math.min(1, (content.match(DEVANAGARI) ?? []).length / letters);
    if (dev < 0.5) return { rule, ok: false, detail: `only ${Math.round(dev * 100)}% of letters are Devanagari`, flag: "wrong_language" };
    const padded = ` ${content} `;
    const hi = (padded.match(HINDI) ?? []).length;
    const ne = (padded.match(NEPALI) ?? []).length;
    if (hi >= 2 && hi > ne * 2) return { rule, ok: false, detail: `Devanagari, but reads as Hindi (${hi} Hindi vs ${ne} Nepali markers)`, flag: "wrong_language" };
    return { rule, ok: true, detail: `${Math.round(dev * 100)}% Devanagari; ${ne} Nepali vs ${hi} Hindi grammar markers`, flag: "wrong_language" };
  }
  const en = (content.match(EN_STOP) ?? []).length;
  const es = (content.match(ES_STOP) ?? []).length;
  if (en >= 4 && en > es * 2) return { rule, ok: false, detail: `reads as English (${en} English vs ${es} Spanish function words)`, flag: "wrong_language" };
  return { rule, ok: true, detail: `${es} Spanish vs ${en} English function words`, flag: "wrong_language" };
}

/** Labeling briefs: how many items, and which labels are allowed. */
function labelSpec(brief: string): { count: number; labels: string[] } | null {
  const numbered = (brief.match(/^\s*\d+[.)]\s+\S/gm) ?? []).length;
  const stated = Number(brief.match(/\blabel\s+(?:all\s+|these\s+|the\s+)?(\d+)\b/i)?.[1] ?? 0);
  const count = numbered || stated;
  const labels = [...new Set((brief.match(/\b[A-Z]{4,}\b/g) ?? []).filter((w) => !["ONE", "LABEL", "ONLY", "JSON", "NOTE"].includes(w)))];
  return count ? { count, labels } : null;
}

/** Every hard requirement in the brief that code can check, evaluated against one entry. */
export function checkBrief(brief: string, category: number, content: string): Fact[] {
  const facts: Fact[] = [];
  const slug = categoryById(category).slug;
  const d = deliverable(brief, category, content);
  const words = wordCount(d.text);

  // Word limits: "max 8 words", "60-90 words", "in ≤150 words", "at least 40 words".
  const range = brief.match(/\b(\d+)\s*(?:-|–|to)\s*(\d+)\s*words?\b/i);
  const max =
    brief.match(/(?:max(?:imum)?\.?|under|at most|no more than|up to|≤|<=)\s*(\d+)\s*words?\b/i) ??
    brief.match(/\b(\d+)\s*words?\s*(?:max(?:imum)?|or (?:less|fewer))\b/i);
  const min = brief.match(/(?:at least|minimum|min\.?|no fewer than)\s*(\d+)\s*words?\b/i);
  const scope = d.label === "line 1" ? " for line 1" : "";
  if (range) {
    const [lo, hi] = [Number(range[1]), Number(range[2])].sort((a, b) => a - b);
    facts.push({ rule: `${lo}-${hi} words${scope}`, ok: words >= lo && words <= hi, detail: `${words} words`, flag: "constraint_violation" });
  } else {
    if (max) facts.push({ rule: `At most ${max[1]} words${scope}`, ok: words <= Number(max[1]), detail: `${words} words`, flag: "constraint_violation" });
    if (min) facts.push({ rule: `At least ${min[1]} words${scope}`, ok: words >= Number(min[1]), detail: `${words} words`, flag: "constraint_violation" });
  }
  const chars = brief.match(/(?:max(?:imum)?\.?|under|at most|no more than|up to|≤|<=)\s*(\d+)\s*(?:characters|chars)\b/i);
  if (chars) {
    const n = [...d.text.trim()].length;
    facts.push({ rule: `At most ${chars[1]} characters${scope}`, ok: n <= Number(chars[1]), detail: `${n} characters`, flag: "constraint_violation" });
  }

  // Structure: a deliverable plus a rationale line.
  if (slug === "copy" && /\bline 2\b|second line/i.test(brief)) {
    const n = lines(content).length;
    facts.push({ rule: "A second line (the rationale)", ok: n >= 2, detail: `${n} non-empty line${n === 1 ? "" : "s"}`, flag: "constraint_violation" });
  }

  // Required and banned phrases, read clause by clause so "don't mention 'X'" bans X.
  for (const clause of clauses(brief)) {
    const qs = quoted(clause).filter((q) => q.length <= 60);
    if (!qs.length) continue;
    if (NEGATION.test(clause)) {
      for (const q of qs) facts.push({ rule: `Must not use "${q}"`, ok: !has(content, q), detail: has(content, q) ? "used" : "not used", flag: "constraint_violation" });
    } else if (REQUIRE.test(clause)) {
      for (const q of qs) facts.push({ rule: `Must mention "${q}"`, ok: has(content, q), detail: has(content, q) ? "present" : "missing", flag: "constraint_violation" });
    }
  }
  if (/\bno exclamation (?:marks?|points?)\b/i.test(brief)) {
    const n = (content.match(/!/g) ?? []).length;
    facts.push({ rule: "No exclamation marks", ok: n === 0, detail: `${n} found`, flag: "constraint_violation" });
  }
  if (/\bno emojis?\b/i.test(brief)) {
    const n = (content.match(/\p{Extended_Pictographic}/gu) ?? []).length;
    facts.push({ rule: "No emoji", ok: n === 0, detail: `${n} found`, flag: "constraint_violation" });
  }
  if (/\bno hashtags?\b/i.test(brief)) {
    const n = (content.match(/(^|\s)#\w/g) ?? []).length;
    facts.push({ rule: "No hashtags", ok: n === 0, detail: `${n} found`, flag: "constraint_violation" });
  }

  // Language of the deliverable.
  const lang = slug === "code" ? null : targetLanguage(brief);
  if (lang) facts.push(languageFact(lang, content));

  // Code: the language asked for, the function name, no dependencies.
  if (slug === "code") {
    const wantJs = /\b(javascript|typescript|node(?:\.js)?)\b/i.test(brief);
    const python = /^\s*def\s+\w+\s*\(.*\)\s*:/m.test(content) || /^\s*(?:elif|import \w+$)/m.test(content);
    if (wantJs) facts.push({ rule: /typescript/i.test(brief) ? "Written in TypeScript/JavaScript" : "Written in JavaScript", ok: !python, detail: python ? "written in Python" : "JavaScript syntax", flag: "constraint_violation" });
    const fn = brief.match(/`(\w+)\s*\(/)?.[1] ?? brief.match(/\bfunction (?:named |called )?`?(\w+)`?\s*\(/i)?.[1];
    if (fn) {
      const defines = new RegExp(`(function\\s+${fn}\\b|\\b(?:const|let|var)\\s+${fn}\\s*=|\\bdef\\s+${fn}\\b|export\\s+(?:default\\s+)?function\\s+${fn}\\b)`).test(content);
      facts.push({ rule: `Defines ${fn}()`, ok: defines, detail: defines ? "defined" : "not defined", flag: "constraint_violation" });
    }
    if (/no (?:external )?dependenc|no (?:imports|libraries)/i.test(brief)) {
      const dep = /\b(?:require\(|import\s+[\w{*])/.test(content);
      facts.push({ rule: "No dependencies", ok: !dep, detail: dep ? "imports a module" : "no imports", flag: "constraint_violation" });
    }
  }

  // Labeling: every item labeled, only allowed labels.
  if (slug === "labeling") {
    const spec = labelSpec(brief);
    if (spec) {
      const got = new Map<number, string>();
      for (const l of content.split("\n")) {
        const m = l.match(/^\s*(\d+)\s*[.):-]\s*([A-Za-z]+)\s*$/);
        if (m) got.set(Number(m[1]), m[2].toUpperCase());
      }
      facts.push({
        rule: `All ${spec.count} items labeled, one "<n>. LABEL" per line`,
        ok: got.size === spec.count,
        detail: `${got.size} labeled lines found`,
        flag: "constraint_violation",
        kind: "graded",
      });
      if (spec.labels.length && got.size) {
        const bad = [...got.values()].filter((l) => !spec.labels.includes(l));
        facts.push({
          rule: `Only the labels ${spec.labels.join(", ")}`,
          ok: !bad.length,
          detail: bad.length ? `unknown: ${[...new Set(bad)].join(", ")}` : "all allowed",
          flag: "constraint_violation",
          kind: "graded",
        });
      }
    }
  }
  return facts;
}

/** Facts as lines for the judge: a check mark or a cross, the rule and the measurement. */
export function factLines(facts: Fact[]): string[] {
  return facts.map((f) => `${f.ok ? "PASS" : "FAIL"}: ${f.rule} (${f.detail})`);
}
