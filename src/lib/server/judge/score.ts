import { categoryById } from "../../categories";
import type { CriterionScore, JudgeFlag, ScoringOutput } from "./types";

/**
 * Weighted rubric score plus deterministic integrity penalties. Published in
 * every report so anyone can recompute the on-chain number from the criteria.
 */
export function finalizeScore(
  category: number,
  out: ScoringOutput,
  hardFlags: JudgeFlag[],
): { flags: JudgeFlag[]; criteria: CriterionScore[]; raw: number; final: number } {
  const cat = categoryById(category);
  const flags = [...new Set<JudgeFlag>([...hardFlags, ...out.flags])];
  const criteria = cat.criteria.map((c, i) => ({
    key: c.key,
    label: c.label,
    weight: c.weight,
    score: out.criteria[i]?.score ?? 0,
    comment: out.criteria[i]?.comment ?? "",
  }));
  const raw = criteria.reduce((sum, c) => sum + c.weight * c.score, 0);

  let final = raw;
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
