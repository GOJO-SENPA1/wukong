import { z } from "zod";
import { accountsEnabled, requireAccount } from "@/lib/server/accounts";
import { fund } from "@/lib/server/faucet";
import { fail, ok } from "@/lib/server/http";
import { demoMode, deployment } from "@/lib/server/env";
import { HttpError, rateLimit, readJson } from "@/lib/server/guard";

const Body = z.object({ address: z.string().min(32).max(44), role: z.enum(["company", "worker"]) });

// Test networks only (WUKONG_DEMO_MODE). Limits hold across server instances (Redis):
// per IP, per address, and a global daily cap so the faucet can't be drained by
// rotating addresses. Where accounts exist, it only tops up the signed-in account's
// own wallet, and only once a balance runs low: the app does this quietly, so
// people can pay fees (and organisations fund tasks) without a test-money button.
export async function POST(req: Request) {
  if (!demoMode()) return fail("Demo-only endpoint (WUKONG_DEMO_MODE is off)", 403);
  try {
    await rateLimit(req, "faucet-ip", 20, 3600_000);
    const body = Body.parse(await readJson(req, 2048));
    const { address } = body;
    let role = body.role;
    const accounts = accountsEnabled();
    if (accounts) {
      const { auth, profile } = await requireAccount(req);
      if (address !== (profile?.wallet ?? auth.wallet)) throw new HttpError(403, "Only your own wallet can be topped up");
      role = profile?.role === "company" ? "company" : "worker";
    }
    await rateLimit(req, "faucet-addr", 1, 10 * 60_000, address);
    await rateLimit(req, "faucet-day", 300, 24 * 3600_000, "all");
    const local = deployment().cluster === "localnet";
    const usdc = role === "company" ? 1000 : 20; // workers: a float for entry stakes
    const res = await fund(address, {
      sol: local ? 5 : 0.05,
      minSol: local ? 1 : 0.02,
      usdc,
      minUsdc: accounts ? usdc / 2 : undefined,
    });
    return ok(res);
  } catch (err) {
    return fail(err);
  }
}
