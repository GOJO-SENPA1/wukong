import { categoryById } from "../../categories";
import type { CriterionScore, JudgeFlag, ScoringOutput } from "./types";

/** The main criterion's score below which the whole entry is capped at 50. */
export const GATE = 35;

/**
 * Weighted rubric score plus deterministic integrity penalties. Published in
 * every report so anyone can recompute the on-chain number from the criteria.
 * Caps that only code can trigger (hardFlags): a hard requirement the brief
 * states and the entry breaks caps its constraints criterion at 40 and the
 * entry at 60, so a rule-breaker can't win on polish. A flag the model raises
 * on its own never triggers these, so a hallucinated violation can't sink an entry.
 * The category's main criterion (the first and heaviest: brief fit, accuracy,
 * correctness, label accuracy, insight) gates the rest: below 35 caps the entry at 50,
 * because a translation with the wrong meaning or code that doesn't work can't be
 * rescued by style.
 */
export function finalizeScore(
  category: number,
  out: ScoringOutput,
  hardFlags: JudgeFlag[],
): { flags: JudgeFlag[]; criteria: CriterionScore[]; raw: number; final: number } {
  const cat = categoryById(category);
  const flags = [...new Set<JudgeFlag>([...hardFlags, ...out.flags])];
  const broken = hardFlags.includes("constraint_violation");
  const criteria = cat.criteria.map((c, i) => {
    const score = out.criteria[i]?.score ?? 0;
    return {
      key: c.key,
      label: c.label,
      weight: c.weight,
      score: broken && (c.key === "constraints" || c.key === "format") ? Math.min(score, 40) : score,
      comment: out.criteria[i]?.comment ?? "",
      ...(out.criteria[i]?.evidence !== undefined ? { evidence: out.criteria[i].evidence } : {}),
    };
  });
  const raw = criteria.reduce((sum, c) => sum + c.weight * c.score, 0);

  let final = raw;
  if (broken) final = Math.min(final, 60);
  if (criteria[0] && criteria[0].score < GATE) final = Math.min(final, 50);
  if (flags.includes("prompt_injection") || flags.includes("content_missing")) final = 0;
  if (flags.includes("unsafe")) final = 0;
  if (flags.includes("duplicate") || flags.includes("plagiarism_suspected")) final = Math.min(final, 10);
  if (flags.includes("low_effort")) final = Math.min(final, 15);
  if (flags.includes("wrong_language")) final = Math.min(final, 35);
  return {
    flags,
    criteria,
    raw: Math.round(raw * 100) / 100,
    final: Math.round(final * 100) / 100,
  };
}
