import { ActionSchema, buildAction } from "@/lib/server/actions";
import { fail, ok } from "@/lib/server/http";

export async function POST(req: Request) {
  try {
    const action = ActionSchema.parse(await req.json());
    return ok(await buildAction(action));
  } catch (err) {
    return fail(err);
  }
}
