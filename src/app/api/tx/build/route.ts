import { accountError, accountsEnabled, authFromRequest, HttpError, requireAccount } from "@/lib/server/accounts";
import { rateLimit, readJson } from "@/lib/server/guard";
import { ActionSchema, buildAction, type Action } from "@/lib/server/actions";
import { fail, ok } from "@/lib/server/http";

// Which role may build which action. The program itself is permissionless (and
// checks creator-only instructions on-chain); these are the app's rules.
const ROLE: Partial<Record<Action["kind"], "worker" | "company">> = {
  create_task: "company",
  submit: "worker",
  close: "company",
  settle_pick: "company",
  cancel: "company",
};

export async function POST(req: Request) {
  let action: Action;
  try {
    await rateLimit(req, "build", 30, 60_000);
    action = ActionSchema.parse(await readJson(req, 16 * 1024));
  } catch (err) {
    return fail(err);
  }
  try {
    const signedIn = accountsEnabled() && (await authFromRequest(req)) !== null;
    if (signedIn) {
      const { profile } = await requireAccount(req);
      if (!profile?.onboardedAt) throw new HttpError(403, "Finish setting up your account first");
      if (action.signer !== profile.wallet) throw new HttpError(403, "You can only sign with your own account's wallet");
      const need = ROLE[action.kind];
      if (need && profile.role !== need) {
        throw new HttpError(403, need === "company" ? "Only organisation accounts can post and manage tasks" : "Organisation accounts can't enter tasks");
      }
    } else if (accountsEnabled() && (action.kind === "create_task" || action.kind === "submit")) {
      // With accounts on, posting and entering always need a signed-in account (demo personas only exist without sign-in).
      throw new HttpError(401, "Sign in to continue");
    }
  } catch (err) {
    return accountError(err);
  }
  try {
    return ok(await buildAction(action));
  } catch (err) {
    return fail(err);
  }
}
