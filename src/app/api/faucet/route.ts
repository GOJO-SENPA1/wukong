import { z } from "zod";
import { fund } from "@/lib/server/faucet";
import { fail, ok } from "@/lib/server/http";
import { demoMode, deployment } from "@/lib/server/env";
import { rateLimit, readJson } from "@/lib/server/guard";

const Body = z.object({ address: z.string().min(32).max(44), role: z.enum(["company", "worker"]) });

// Demo networks only. Limits hold across server instances (Redis): per IP, per
// address, and a global daily cap so the faucet can't be drained by rotating addresses.
export async function POST(req: Request) {
  if (!demoMode()) return fail("Demo-only endpoint (WUKONG_DEMO_MODE is off)", 403);
  try {
    const { address, role } = Body.parse(await readJson(req, 2048));
    await rateLimit(req, "faucet-ip", 20, 3600_000);
    await rateLimit(req, "faucet-addr", 1, 10 * 60_000, address);
    await rateLimit(req, "faucet-day", 300, 24 * 3600_000, "all");
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
