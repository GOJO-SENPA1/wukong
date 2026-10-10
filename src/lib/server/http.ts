import { NextResponse } from "next/server";
import { explainError } from "../wukong";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(err: unknown, status = 400) {
  const message = err instanceof Error ? explainError(err) : String(err);
  return NextResponse.json({ error: message }, { status });
}

/** Stream an async iterable of events as newline-delimited JSON. */
export function ndjson<T>(events: AsyncIterable<T>): Response {
  const enc = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      try {
        for await (const e of events) controller.enqueue(enc.encode(`${JSON.stringify(e)}\n`));
      } catch (err) {
        controller.enqueue(enc.encode(`${JSON.stringify({ type: "error", message: explainError(err) })}\n`));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(body, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-cache, no-transform" },
  });
}
