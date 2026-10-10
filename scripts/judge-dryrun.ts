// Score every demo template's crowd offline (no chain) to sanity-check the
// judge. Uses Claude when ANTHROPIC_API_KEY is set, heuristics otherwise.
//   npx tsx scripts/judge-dryrun.ts [template-id]
import { TEMPLATES } from "../src/lib/demo";
import { claudeAvailable, scoreWithClaude } from "../src/lib/server/judge/claude";
import { integritySignals, type PriorEntry } from "../src/lib/server/judge/detect";
import { scoreHeuristic } from "../src/lib/server/judge/heuristic";
import { finalizeScore } from "../src/lib/server/judge/score";

const only = process.argv[2];
const useClaude = claudeAvailable();

async function main() {
  console.log(`engine: ${useClaude ? "claude" : "heuristic"}`);
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
        const out = useClaude ? await scoreWithClaude(input) : scoreHeuristic(input);
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
