// The judge on any OpenAI-compatible chat API (DeepSeek, OpenRouter, Together,
// Groq, a self-hosted server...). Same system prompt, rubric, tags and pre-checks
// as the Claude judge; the verdict comes back as JSON and is validated before use.
// Configured with WUKONG_JUDGE_BASE_URL, WUKONG_JUDGE_API_KEY and WUKONG_JUDGE_MODEL.

import { z } from "zod";
import { cleanCredential } from "../config";
import { describeError } from "../diagnose";
import { JudgeRefusal, judgeRequest, MODEL_FLAGS, SYSTEM, toOutput, Verdict } from "./prompt";
import type { ScoringInput, ScoringOutput } from "./types";

export interface CompatibleConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

/** The OpenAI-compatible judge's settings, or null unless all three are set. */
export function compatibleConfig(): CompatibleConfig | null {
  // Accept the API root or a full endpoint URL pasted from the provider's docs.
  const baseUrl = process.env.WUKONG_JUDGE_BASE_URL?.trim()
    .replace(/\/+$/, "")
    .replace(/\/chat\/completions$/, "");
  const apiKey = cleanCredential(process.env.WUKONG_JUDGE_API_KEY);
  const model = process.env.WUKONG_JUDGE_MODEL?.trim();
  return baseUrl && apiKey && model ? { baseUrl, apiKey, model } : null;
}

const REQUEST_MS = 120_000;
const JSON_RULES = `

Reply with a single JSON object and nothing else (no prose, no code fences), matching this JSON Schema:
${JSON.stringify(z.toJSONSchema(Verdict))}`;

// Models outside Claude's structured outputs drift a little: coerce numbers, default
// missing lists, and drop flags we don't know rather than failing the whole verdict.
const KNOWN_FLAGS: readonly string[] = MODEL_FLAGS;
const Loose = z.object({
  criteria: z.array(z.object({ key: z.string(), score: z.coerce.number(), comment: z.string().default("") })),
  flags: z
    .array(z.string())
    .default([])
    .transform((fs) => fs.filter((f): f is (typeof MODEL_FLAGS)[number] => KNOWN_FLAGS.includes(f))),
  summary: z.string().default(""),
  strengths: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
});

interface ChatCompletion {
  model?: string;
  choices?: { finish_reason?: string; message?: { content?: string | null; refusal?: string | null } }[];
}

function post(cfg: CompatibleConfig, body: object): Promise<Response> {
  return fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { authorization: `Bearer ${cfg.apiKey}`, "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_MS),
  });
}

/** The provider's error message, short and with any credential stripped. */
async function errorText(res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  let message = text;
  try {
    const j = JSON.parse(text) as { error?: { message?: string } | string; message?: string };
    message = (typeof j.error === "string" ? j.error : j.error?.message) ?? j.message ?? text;
  } catch {
    /* not JSON */
  }
  return describeError(new Error(message.slice(0, 300) || res.statusText));
}

/** The JSON object in a reply, ignoring any reasoning block or code fence around it. */
function extractJson(text: string): unknown {
  const t = text.replace(/<think>[\s\S]*?<\/think>/g, "");
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("no JSON object in the reply");
  return JSON.parse(t.slice(start, end + 1));
}

export async function scoreWithCompatible(input: ScoringInput): Promise<ScoringOutput> {
  const cfg = compatibleConfig();
  if (!cfg) throw new Error("The OpenAI-compatible judge isn't configured");
  const request = {
    model: cfg.model,
    messages: [
      { role: "system", content: SYSTEM + JSON_RULES },
      { role: "user", content: judgeRequest(input) },
    ],
    max_tokens: 8000,
  };
  // Deterministic scoring and JSON mode where the provider supports them; one that
  // rejects either (HTTP 400) gets the plain request, which still asks for JSON.
  let res = await post(cfg, { ...request, temperature: 0, response_format: { type: "json_object" } });
  if (res.status === 400) res = await post(cfg, request);
  if (!res.ok) throw new Error(`Judge API answered HTTP ${res.status}: ${await errorText(res)}`);

  const data = (await res.json()) as ChatCompletion;
  const choice = data.choices?.[0];
  const content = choice?.message?.content ?? "";
  if (choice?.finish_reason === "content_filter" || (choice?.message?.refusal && !content)) {
    throw new JudgeRefusal(choice?.finish_reason === "content_filter" ? "content_filter" : "refusal");
  }
  let verdict: z.infer<typeof Loose>;
  try {
    verdict = Loose.parse(extractJson(content));
  } catch {
    throw new Error(`Judge returned no parseable verdict (finish_reason=${choice?.finish_reason ?? "none"})`);
  }
  if (!verdict.summary) verdict.summary = "Scored against the brief's rubric.";
  return toOutput(input, verdict, data.model ?? cfg.model);
}

/**
 * For the status page: does the provider accept the key at this address, and does
 * it list the model? Uses the free GET /models, so checking costs nothing.
 */
export async function compatibleDiagnosis(): Promise<{ reachable: { ok: boolean | null; reason?: string }; model: { ok: boolean | null; reason?: string } }> {
  const cfg = compatibleConfig();
  if (!cfg) return { reachable: { ok: null }, model: { ok: null } };
  let res: Response;
  try {
    res = await fetch(`${cfg.baseUrl}/models`, { headers: { authorization: `Bearer ${cfg.apiKey}` }, signal: AbortSignal.timeout(6_000) });
  } catch (err) {
    return { reachable: { ok: false, reason: `Couldn't reach ${new URL(cfg.baseUrl).host}: ${describeError(err)}` }, model: { ok: null } };
  }
  if (res.status === 401 || res.status === 403) {
    return { reachable: { ok: false, reason: `The provider refused the API key (HTTP ${res.status}).` }, model: { ok: null } };
  }
  if (!res.ok) {
    return { reachable: { ok: false, reason: `HTTP ${res.status} from ${cfg.baseUrl}/models: ${await errorText(res)}` }, model: { ok: null } };
  }
  const ids = (((await res.json().catch(() => null)) as { data?: { id?: string }[] } | null)?.data ?? []).map((m) => m.id);
  if (!ids.length) return { reachable: { ok: true }, model: { ok: null, reason: "The provider doesn't list its models, so the name wasn't checked." } };
  return {
    reachable: { ok: true },
    model: ids.includes(cfg.model)
      ? { ok: true }
      : { ok: false, reason: `"${cfg.model}" isn't in this provider's model list. Similar: ${similar(cfg.model, ids as string[]).join(", ") || "none"}.` },
  };
}

/** Up to five listed models that look like the one asked for (shared words), to help fix a typo. */
function similar(want: string, ids: string[]): string[] {
  const words = want.toLowerCase().split(/[^a-z0-9.]+/).filter((w) => w.length > 1);
  return ids
    .map((id) => ({ id, hits: words.filter((w) => id.toLowerCase().includes(w)).length }))
    .filter((m) => m.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 5)
    .map((m) => m.id);
}
