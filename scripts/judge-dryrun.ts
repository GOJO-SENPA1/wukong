// Score every demo template's crowd offline (no chain) to sanity-check the
// judge. Uses the deployment's judge: an OpenAI-compatible API (WUKONG_JUDGE_BASE_URL
// + _API_KEY + _MODEL), Claude (ANTHROPIC_API_KEY), or heuristics otherwise.
//   npx tsx scripts/judge-dryrun.ts [template-id]
import { TEMPLATES } from "../src/lib/demo";
import { scoreWithClaude } from "../src/lib/server/judge/claude";
import { scoreWithCompatible } from "../src/lib/server/judge/compatible";
import { integritySignals, type PriorEntry } from "../src/lib/server/judge/detect";
import { scoreHeuristic } from "../src/lib/server/judge/heuristic";
import { judgeEngine } from "../src/lib/server/judge";
import { finalizeScore } from "../src/lib/server/judge/score";
import type { ScoringInput, ScoringOutput } from "../src/lib/server/judge/types";

const only = process.argv[2];
const { engine, model } = judgeEngine();
const score: (input: ScoringInput) => Promise<ScoringOutput> =
  engine === "claude" ? scoreWithClaude : engine === "openai-compatible" ? scoreWithCompatible : async (input) => scoreHeuristic(input);

async function main() {
  console.log(`engine: ${engine} (${model})`);
  for (const t of TEMPLATES.filter((t) => !only || t.id === only)) {
    if (!t.crowd.length) continue;
    console.log(`\n== ${t.title}`);
    const earlier: PriorEntry[] = [];
    const contents = t.crowd.map((c) => c.content);
    const rows = await Promise.all(
      t.crowd.map(async (entry, index) => {
        const signals = integritySignals(entry.content, t.crowd.slice(0, index).map((c, i) => ({ index: i, submittedAt: i, content: c.content })), {
          headline: t.category === 0,
          brief: t.brief,
        });
        const input = {
          brief: t.brief,
          title: t.title,
          category: t.category,
          content: entry.content,
          index,
          signals: signals.map((s) => `${s.flag}: ${s.detail}`),
          peers: contents.filter((_, i) => i !== index),
        };
        const out = await score(input);
        const f = finalizeScore(t.category, out, signals.map((s) => s.flag));
        return { entry, f, out };
      }),
    );
    void earlier;
    rows
      .map((r, i) => ({ ...r, i }))
      .sort((a, b) => b.f.final - a.f.final)
      .forEach(({ entry, f, out, i }) => {
        console.log(
          `  #${i + 1} ${entry.name.padEnd(14)} final ${f.final.toFixed(1).padStart(5)}  raw ${f.raw.toFixed(1).padStart(5)}  [${f.criteria.map((c) => c.score).join(",")}] ${f.flags.join(",")}`,
        );
        console.log(`       ${out.summary}`);
      });
  }
}
main();
