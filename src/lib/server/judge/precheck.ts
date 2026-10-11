// Everything code decides about an entry before any model reads it: integrity
// signals (injection, duplicates, low effort) and the brief's hard requirements.
// Production judging and the benchmark both start here.

import { checkBrief, type Fact } from "./constraints";
import { integritySignals, type PriorEntry, type Signal } from "./detect";

export function precheck(
  content: string,
  earlier: PriorEntry[],
  task: { brief: string; category: number },
): { signals: Signal[]; facts: Fact[] } {
  const signals = integritySignals(content, earlier, { headline: task.category === 0, brief: task.brief, category: task.category });
  const facts = checkBrief(task.brief, task.category, content);
  for (const f of facts) {
    if (!f.ok && f.kind !== "graded") signals.push({ flag: f.flag, detail: `${f.rule}: ${f.detail}` });
  }
  return { signals, facts };
}
