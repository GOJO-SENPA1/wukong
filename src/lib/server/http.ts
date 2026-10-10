import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { explainError } from "../wukong";
import { HttpError } from "./guard";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

// Messages that look like internals (paths, network errors, URLs, JSON, keys)
// are logged on the server and replaced with a generic line for the client.
const INTERNAL = /[\/\\][\w.-]+[\/\\]|ENOENT|EACCES|EPERM|ECONN|ETIMEDOUT|ENOTFOUND|fetch failed|socket|https?:\/\/|[{}[\]]|Unexpected token|secret|private|\bat [\w.]+ \(|prisma|redis|sql/i;

export function publicMessage(err: unknown): string {
  if (err instanceof HttpError) return err.message;
  if (err instanceof ZodError) {
    const issue = err.issues[0];
    return issue ? `Invalid ${issue.path.join(".") || "request"}: ${issue.message}` : "Invalid request";
  }
  const message = err instanceof Error ? explainError(err) : String(err);
  if (message.length > 200 || INTERNAL.test(message)) {
    console.error("api error:", err instanceof Error ? err.message : err);
    return "Something went wrong. Try again in a moment.";
  }
  return message;
}

export function fail(err: unknown, status = 400) {
  const code = err instanceof HttpError ? err.status : status;
  return NextResponse.json({ error: publicMessage(err) }, { status: code });
}

/** Stream an async iterable of events as newline-delimited JSON. */
export function ndjson<T>(events: AsyncIterable<T>): Response {
  const enc = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      try {
        for await (const e of events) controller.enqueue(enc.encode(`${JSON.stringify(e)}\n`));
      } catch (err) {
        controller.enqueue(enc.encode(`${JSON.stringify({ type: "error", message: publicMessage(err) })}\n`));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(body, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-cache, no-transform" },
  });
}
