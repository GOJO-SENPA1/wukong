// The Claude judge: one structured-output call per submission, rubric-anchored,
// with the submission treated strictly as untrusted data (see prompt.ts).

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { JudgeRefusal, judgeRequest, SYSTEM, toOutput, Verdict } from "./prompt";
import type { ScoringInput, ScoringOutput } from "./types";

export const JUDGE_MODEL = process.env.WUKONG_JUDGE_MODEL ?? "claude-opus-5-5";
type Effort = "low" | "medium" | "high" | "xhigh" | "max";
const JUDGE_EFFORT = (process.env.WUKONG_JUDGE_EFFORT ?? "medium") as Effort;

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

export function claudeAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

export async function scoreWithClaude(input: ScoringInput): Promise<ScoringOutput> {
  const params = {
    model: JUDGE_MODEL,
    max_tokens: 16000,
    output_config: { effort: JUDGE_EFFORT, format: betaZodOutputFormat(Verdict) },
    system: [{ type: "text" as const, text: SYSTEM, cache_control: { type: "ephemeral" as const } }],
    messages: [{ role: "user" as const, content: judgeRequest(input) }],
  };

  // Server-side refusal fallback keeps a classifier false-positive from
  // stalling a payout. If an org can't use the beta, retry without it.
  let response;
  try {
    response = await anthropic().beta.messages.parse({
      ...params,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });
  } catch (err) {
    if (!(err instanceof Anthropic.BadRequestError) || !/fallback/i.test(err.message)) throw err;
    response = await anthropic().beta.messages.parse(params);
  }

  if (response.stop_reason === "refusal") throw new JudgeRefusal(response.stop_details?.category ?? "unknown");
  const parsed = response.parsed_output;
  if (!parsed) throw new Error(`Judge returned no parseable verdict (stop_reason=${response.stop_reason})`);
  return toOutput(input, parsed, response.model);
}
