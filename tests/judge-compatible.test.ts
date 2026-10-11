// The OpenAI-compatible judge (DeepSeek and others) against a local mock provider: no network, no key.
import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { createServer, type IncomingMessage, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { categoryById } from "../src/lib/categories";
import { compatibleConfig, compatibleDiagnosis, scoreWithCompatible } from "../src/lib/server/judge/compatible";
import { JudgeRefusal } from "../src/lib/server/judge/prompt";

const KEY = "test-key-not-a-real-secret-0123456789";
const keys = categoryById(0).criteria.map((c) => c.key);
const input = { brief: "Write ONE tagline. Max 8 words.", title: "Cold brew tagline", category: 0, content: "Brewed at altitude.", index: 2, signals: [] };

type Reply = { status: number; body: unknown };
let replies: Reply[] = [];
let seen: { url: string; auth?: string; body: Record<string, unknown> }[] = [];
let server: Server;

const read = (req: IncomingMessage) =>
  new Promise<string>((resolve) => {
    let s = "";
    req.on("data", (c) => (s += c));
    req.on("end", () => resolve(s));
  });
const completion = (content: string, extra: Record<string, unknown> = {}) => ({
  status: 200,
  body: { model: "deepseek-v4.1-flash-2026", choices: [{ finish_reason: "stop", message: { content }, ...extra }] },
});
const verdict = (over: Record<string, unknown> = {}) =>
  JSON.stringify({
    criteria: keys.map((key, i) => ({ key, score: 70 + i, comment: `Specific note ${i}` })),
    flags: [],
    summary: "Clear and on brief.",
    strengths: ["Tight", "Vivid"],
    improvements: ["Shorter"],
    ...over,
  });

before(async () => {
  server = createServer(async (req, res) => {
    const raw = await read(req);
    seen.push({ url: req.url ?? "", auth: req.headers.authorization, body: raw ? JSON.parse(raw) : {} });
    const r = replies.shift() ?? { status: 500, body: { error: { message: "no reply queued" } } };
    res.writeHead(r.status, { "content-type": "application/json" });
    res.end(JSON.stringify(r.body));
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  // A full endpoint URL, as pasted from a provider's docs, is accepted too.
  process.env.WUKONG_JUDGE_BASE_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1/chat/completions`;
  process.env.WUKONG_JUDGE_API_KEY = KEY;
  process.env.WUKONG_JUDGE_MODEL = "deepseek-v4.1-flash";
});
after(() => server.close());
beforeEach(() => {
  replies = [];
  seen = [];
});

describe("OpenAI-compatible judge", () => {
  it("is configured only when base URL, key and model are all set", () => {
    assert.equal(compatibleConfig()?.baseUrl.endsWith("/v1"), true);
    const model = process.env.WUKONG_JUDGE_MODEL;
    delete process.env.WUKONG_JUDGE_MODEL;
    assert.equal(compatibleConfig(), null);
    process.env.WUKONG_JUDGE_MODEL = model;
  });

  it("sends the judge prompt and turns the JSON verdict into rubric scores", async () => {
    replies.push(completion(verdict({ flags: ["off_topic", "made_up_flag"] })));
    const out = await scoreWithCompatible(input);
    const req = seen[0];
    assert.equal(req.url, "/v1/chat/completions");
    assert.equal(req.auth, `Bearer ${KEY}`);
    assert.equal(req.body.model, "deepseek-v4.1-flash");
    assert.equal(req.body.temperature, 0);
    assert.deepEqual(req.body.response_format, { type: "json_object" });
    const [system, user] = req.body.messages as { role: string; content: string }[];
    assert.match(system.content, /You are the Wukong judge/);
    assert.match(system.content, /JSON Schema/);
    assert.match(user.content, /<submission_[\w-]+ number="3">\nBrewed at altitude\.\n<\/submission_/);
    assert.deepEqual(out.criteria.map((c) => c.key), keys);
    assert.deepEqual(out.criteria.map((c) => c.score), keys.map((_, i) => 70 + i));
    assert.deepEqual(out.flags, ["off_topic"]); // unknown flags are dropped, not fatal
    assert.equal(out.model, "deepseek-v4.1-flash-2026");
  });

  it("reads a verdict wrapped in reasoning and a code fence, and clamps scores", async () => {
    const v = JSON.parse(verdict());
    v.criteria[0].score = 140;
    v.criteria[1].score = "55";
    replies.push(completion(`<think>weighing it up {not json}</think>\n\`\`\`json\n${JSON.stringify(v)}\n\`\`\``));
    const out = await scoreWithCompatible(input);
    assert.equal(out.criteria[0].score, 100);
    assert.equal(out.criteria[1].score, 55);
  });

  it("retries without JSON mode and temperature when the provider rejects them", async () => {
    replies.push({ status: 400, body: { error: { message: "response_format is not supported for this model" } } }, completion(verdict()));
    const out = await scoreWithCompatible(input);
    assert.equal(seen.length, 2);
    assert.equal(seen[1].body.response_format, undefined);
    assert.equal(seen[1].body.temperature, undefined);
    assert.equal(out.summary, "Clear and on brief.");
  });

  it("reports a refused key without ever echoing it", async () => {
    replies.push({ status: 401, body: { error: { message: `Invalid API key: ${KEY}` } } });
    await assert.rejects(scoreWithCompatible(input), (err: Error) => {
      assert.match(err.message, /HTTP 401/);
      assert.ok(!err.message.includes(KEY), "the key must not appear in errors");
      return true;
    });
  });

  it("treats a content filter as a refusal, and junk as a retryable failure", async () => {
    replies.push({ status: 200, body: { choices: [{ finish_reason: "content_filter", message: { content: "" } }] } });
    await assert.rejects(scoreWithCompatible(input), JudgeRefusal);
    replies.push(completion("I think this entry is great, 9/10!"));
    await assert.rejects(scoreWithCompatible(input), /no parseable verdict/);
  });

  it("checks the key and model name for /status with the free model list", async () => {
    replies.push({ status: 200, body: { data: [{ id: "deepseek-v4.1-flash" }, { id: "deepseek-v4.1" }] } });
    assert.deepEqual(await compatibleDiagnosis(), { reachable: { ok: true }, model: { ok: true } });
    assert.equal(seen[0].url, "/v1/models");

    replies.push({ status: 200, body: { data: [{ id: "deepseek-chat" }, { id: "deepseek-v4-flash" }, { id: "llama-3" }] } });
    const typo = await compatibleDiagnosis();
    assert.equal(typo.model.ok, false);
    assert.match(typo.model.reason ?? "", /deepseek-v4-flash/);

    replies.push({ status: 401, body: { error: "unauthorized" } });
    const refused = await compatibleDiagnosis();
    assert.equal(refused.reachable.ok, false);
    assert.match(refused.reachable.reason ?? "", /refused the API key/);
  });
});
