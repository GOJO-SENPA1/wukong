import { z } from "zod";
import { sha256Hex } from "@/lib/hash";
import { accountError, writerFor } from "@/lib/server/accounts";
import { rateLimit, readJson } from "@/lib/server/guard";
import { fail, ok } from "@/lib/server/http";
import { store } from "@/lib/server/store";

const Body = z.object({
  title: z.string().min(1).max(64),
  category: z.number().int().min(0).max(255),
  brief: z.string().min(10).max(8000),
  creatorName: z.string().max(40).optional(),
  template: z.string().max(64).optional(),
});

/** Store a brief before its hash goes on-chain. With accounts on, only organisations post. */
export async function POST(req: Request) {
  let body: z.infer<typeof Body>;
  try {
    await rateLimit(req, "briefs", 20, 60_000);
    body = Body.parse(await readJson(req, 48 * 1024));
  } catch (err) {
    return fail(err);
  }
  try {
    const profile = await writerFor(req, "company");
    const hash = sha256Hex(body.brief);
    const creatorName = profile ? profile.company || profile.displayName : body.creatorName;
    await store.putBrief({ hash, title: body.title, category: body.category, brief: body.brief, creatorName, template: body.template, createdAt: Date.now(), origin: "web" });
    return ok({ hash });
  } catch (err) {
    return accountError(err);
  }
}
