import { z } from "zod";
import { fund } from "@/lib/server/faucet";
import { fail, ok } from "@/lib/server/http";
import { deployment } from "@/lib/server/env";

const Body = z.object({ address: z.string().min(32).max(44), role: z.enum(["company", "worker"]) });

export async function POST(req: Request) {
  try {
    const { address, role } = Body.parse(await req.json());
    const local = deployment().cluster === "localnet";
    const res = await fund(address, {
      sol: local ? 5 : 0.05,
      minSol: local ? 1 : 0.02,
      usdc: role === "company" ? 1000 : 0,
    });
    return ok(res);
  } catch (err) {
    return fail(err);
  }
}
