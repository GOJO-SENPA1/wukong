import { z } from "zod";
import { fail, ok } from "@/lib/server/http";
import { store } from "@/lib/server/store";

const Body = z.object({ names: z.record(z.string().min(32).max(44), z.string().min(1).max(40)) });

export async function POST(req: Request) {
  try {
    const { names } = Body.parse(await req.json());
    for (const [k, v] of Object.entries(names)) store.setName(k, v);
    return ok({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
