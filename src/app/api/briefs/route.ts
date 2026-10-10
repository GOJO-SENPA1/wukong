import { z } from "zod";
import { sha256Hex } from "@/lib/hash";
import { fail, ok } from "@/lib/server/http";
import { store } from "@/lib/server/store";

const Body = z.object({
  title: z.string().min(1).max(64),
  category: z.number().int().min(0).max(255),
  brief: z.string().min(10).max(8000),
  creatorName: z.string().max(40).optional(),
  template: z.string().max(64).optional(),
});

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json());
    const hash = sha256Hex(body.brief);
    await store.putBrief({ hash, ...body, createdAt: Date.now(), origin: "web" });
    return ok({ hash });
  } catch (err) {
    return fail(err);
  }
}
