import { z } from "zod";
import { fund } from "@/lib/server/faucet";
import { fail, ok } from "@/lib/server/http";
import { demoMode, deployment } from "@/lib/server/env";

const recent = new Map<string, number>();

const Body = z.object({ address: z.string().min(32).max(44), role: z.enum(["company", "worker"]) });

export async function POST(req: Request) {
  if (!demoMode()) return fail("Demo-only endpoint (WUKONG_DEMO_MODE=0)", 403);
  try {
    const { address, role } = Body.parse(await req.json());
    if (Date.now() - (recent.get(address) ?? 0) < 3_000) return fail("Slow down: faucet is rate limited", 429);
    recent.set(address, Date.now());
    const local = deployment().cluster === "localnet";
    const res = await fund(address, {
      sol: local ? 5 : 0.05,
      minSol: local ? 1 : 0.02,
      usdc: role === "company" ? 1000 : 20, // workers: a float for entry stakes
    });
    return ok(res);
  } catch (err) {
    return fail(err);
  }
}
