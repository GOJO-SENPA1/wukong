// The judge's anti-hallucination layers: the brief compiler, quote checking, and consensus.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { categoryById } from "../src/lib/categories";
import { checkBrief } from "../src/lib/server/judge/constraints";
import { judgeWithModel, type Ask } from "../src/lib/server/judge/consensus";
import { precheck } from "../src/lib/server/judge/precheck";
import { JudgeRefusal, quoteStatus, type Verdict } from "../src/lib/server/judge/prompt";
import { finalizeScore } from "../src/lib/server/judge/score";

const TAGLINE = "Write ONE tagline for Himalayan cold brew. Max 8 words. Line 2: a one-sentence rationale. Avoid clichés like 'wake up and smell the coffee'.";
const entry = "Brewed at altitude. Built for 2AM deadlines.\nKathmandu students live on late nights; this owns them.";
const input = { brief: TAGLINE, title: "Cold brew", category: 0, content: entry, index: 0, signals: [] };
const keys = categoryById(0).criteria.map((c) => c.key);
const verdict = (scores: number[], over: Partial<Verdict> = {}, evidence = "Built for 2AM deadlines"): Verdict => ({
  criteria: keys.map((key, i) => ({ key, evidence, comment: "note", score: scores[i] })),
  flags: [],
  summary: "s",
  strengths: [],
  improvements: [],
  ...over,
});
/** A fake model that answers from a script, recording every call. */
function scripted(answers: (Verdict | Error)[]) {
  const calls: Parameters<Ask>[0][] = [];
  const ask: Ask = async (turns) => {
    calls.push(turns);
    const a = answers.shift();
    if (!a) throw new Error("script ran out");
    if (a instanceof Error) throw a;
    return { verdict: a, model: "fake" };
  };
  return { ask, calls };
}

describe("brief compiler", () => {
  it("checks the deliverable line's word limit, structure and banned phrases", () => {
    const ok = checkBrief(TAGLINE, 0, entry);
    assert.ok(ok.every((f) => f.ok), JSON.stringify(ok));
    const over = checkBrief(TAGLINE, 0, "Cold mountain brew that keeps Kathmandu students awake all night long\nWhy: they study late.");
    assert.equal(over.find((f) => f.rule.startsWith("At most 8 words"))?.ok, false);
    assert.equal(checkBrief(TAGLINE, 0, "Wake up and smell the coffee, Kathmandu\nA classic.").find((f) => f.rule.startsWith("Must not"))?.ok, false);
    assert.equal(checkBrief(TAGLINE, 0, "Brewed at altitude.").find((f) => f.rule.startsWith("A second line"))?.ok, false);
  });

  it("reads required phrases, negations and punctuation bans clause by clause", () => {
    const brief = "60-90 words. Must mention 'Pokhara' and 'machine washable'. Don't mention 'cheap'. No exclamation marks.";
    const facts = checkBrief(brief, 0, "Made in Pokhara, cheap and cosy!");
    const by = (r: string) => facts.find((f) => f.rule.includes(r))!;
    assert.equal(by("60-90").ok, false);
    assert.equal(by('"Pokhara"').ok, true);
    assert.equal(by('"machine washable"').ok, false);
    assert.equal(by('"cheap"').rule.startsWith("Must not"), true);
    assert.equal(by('"cheap"').ok, false);
    assert.equal(by("exclamation").ok, false);
  });

  it("tells Nepali from Hindi and English, and Python from JavaScript", () => {
    const ne = "Translate this note into Nepali.";
    assert.equal(checkBrief(ne, 1, "हाम्रो होमस्टेमा स्वागत छ। बिहान आठ बजे चिया दिइन्छ र खाना पनि।")[0].ok, true);
    assert.equal(checkBrief(ne, 1, "हमारे होमस्टे में आपका स्वागत है। सुबह आठ बजे चाय दी जाती है और नाश्ता भी।")[0].ok, false);
    assert.equal(checkBrief(ne, 1, "Welcome to our homestay, tea is at eight.")[0].ok, false);
    const code = checkBrief("Write `slugify(s)` in JavaScript.", 2, "def slugify(s):\n    return s.lower()");
    assert.equal(code.find((f) => f.rule.startsWith("Written in"))?.ok, false);
  });

  it("flags hard failures for the scorer but leaves labeling coverage to the judge", () => {
    const { signals } = precheck("Cold mountain brew that keeps Kathmandu students awake all night long\nWhy.", [], { brief: TAGLINE, category: 0 });
    assert.ok(signals.some((s) => s.flag === "constraint_violation"));
    const labels = precheck("1. POSITIVE", [], { brief: "Label these POSITIVE or NEGATIVE.\n1. good\n2. bad", category: 3 });
    assert.ok(!labels.signals.some((s) => s.flag === "constraint_violation"));
    assert.ok(labels.facts.some((f) => !f.ok && f.kind === "graded"));
  });

  it("caps a broken hard requirement in code, never for a model's own flag", () => {
    const out = { criteria: keys.map((key) => ({ key, score: 95, comment: "" })), flags: [], summary: "", strengths: [], improvements: [], model: "m" };
    const capped = finalizeScore(0, out, ["constraint_violation"]);
    assert.equal(capped.criteria.find((c) => c.key === "constraints")?.score, 40);
    assert.equal(capped.final, 60);
    const modelOnly = finalizeScore(0, { ...out, flags: ["constraint_violation"] }, []);
    assert.equal(modelOnly.final, 95);
  });
});

describe("quote checking", () => {
  it("accepts exact quotes whatever the case, spacing or quote style, and fragments joined by an ellipsis", () => {
    assert.equal(quoteStatus("built for 2am   deadlines", entry), "grounded");
    assert.equal(quoteStatus("Brewed at altitude … Built for 2AM", entry), "grounded");
    assert.equal(quoteStatus("“this owns them”", entry), "grounded");
  });
  it("rejects paraphrases and invented text, and treats a near-empty quote as none", () => {
    assert.equal(quoteStatus("Made for midnight study sessions", entry), "hallucinated");
    assert.equal(quoteStatus("Built for 3AM deadlines", entry), "hallucinated");
    assert.equal(quoteStatus("", entry), "absent");
    assert.equal(quoteStatus("…", entry), "absent");
  });
});

describe("consensus", () => {
  it("takes the median of each criterion and keeps only majority flags", async () => {
    const { ask } = scripted([verdict([80, 70, 60, 90], { flags: ["off_topic"] }), verdict([60, 74, 66, 95]), verdict([70, 72, 64, 92])]);
    const out = await judgeWithModel(input, ask, { samples: 3, maxSamples: 3 });
    assert.deepEqual(out.criteria.map((c) => c.score), [70, 72, 64, 92]);
    assert.deepEqual(out.flags, []);
    assert.equal(out.consensus?.samples, 3);
    assert.equal(out.consensus?.grounded, 4);
  });

  it("sends back a verdict that invents a quote, and uses the repaired one", async () => {
    const { ask, calls } = scripted([verdict([90, 90, 90, 90], {}, "Made for midnight study"), verdict([70, 70, 70, 70])]);
    const out = await judgeWithModel(input, ask, { samples: 1, maxSamples: 1 });
    assert.equal(calls.length, 2);
    assert.match(calls[1][2].content, /does not appear in the submission verbatim/);
    assert.deepEqual(out.criteria.map((c) => c.score), [70, 70, 70, 70]);
    assert.deepEqual(out.consensus?.hallucinatedQuotes, { before: 4, after: 0 });
  });

  it("never publishes an invented quote, and prefers samples whose quotes check out", async () => {
    const fake = verdict([95, 95, 95, 95], {}, "invented praise line");
    const { ask } = scripted([fake, fake, verdict([60, 60, 60, 60]), verdict([62, 62, 62, 62]), fake]);
    const out = await judgeWithModel(input, ask, { samples: 3, maxSamples: 3 });
    // Two samples invented quotes twice (repair failed); the median comes from the verifiable ones.
    assert.ok(out.criteria.every((c) => c.score <= 62 && c.evidence !== "invented praise line"));
  });

  it("draws more samples when the first ones disagree", async () => {
    const { ask, calls } = scripted([verdict([90, 90, 90, 90]), verdict([40, 40, 40, 40]), verdict([60, 60, 60, 60]), verdict([62, 62, 62, 62]), verdict([58, 58, 58, 58])]);
    const out = await judgeWithModel(input, ask, { samples: 3, maxSamples: 5 });
    assert.equal(calls.length, 5);
    assert.deepEqual(out.criteria.map((c) => c.score), [60, 60, 60, 60]);
  });

  it("survives a failed sample, and treats a majority of refusals as a refusal", async () => {
    const one = scripted([verdict([70, 70, 70, 70]), new Error("timeout"), verdict([72, 72, 72, 72])]);
    assert.equal((await judgeWithModel(input, one.ask, { samples: 3, maxSamples: 3 })).consensus?.samples, 2);
    const refused = scripted([new JudgeRefusal("cyber"), new JudgeRefusal("cyber"), verdict([70, 70, 70, 70])]);
    await assert.rejects(judgeWithModel(input, refused.ask, { samples: 3, maxSamples: 3 }), JudgeRefusal);
  });
});

describe("main-criterion gate", () => {
  it("caps an entry that fails its main criterion at 50, however polished the rest", () => {
    const keys = ["accuracy", "fluency", "localization", "constraints"];
    const out = (first: number) => ({ criteria: keys.map((key, i) => ({ key, score: i === 0 ? first : 95, comment: "" })), flags: [], summary: "", strengths: [], improvements: [], model: "m" });
    assert.equal(finalizeScore(1, out(30), []).final, 50);
    assert.ok(finalizeScore(1, out(40), []).final > 50);
  });
});
