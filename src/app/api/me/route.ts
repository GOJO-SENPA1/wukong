import { accountError, accountsEnabled, OnboardSchema, publicProfile, requireAccount, saveProfile } from "@/lib/server/accounts";
import { rateLimit, readJson } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

/** The signed-in user's account: email, profile, role and whether onboarding is done. */
export async function GET(req: Request) {
  if (!accountsEnabled()) return Response.json({ enabled: false });
  try {
    await rateLimit(req, "me", 60, 60_000);
    const { auth, profile } = await requireAccount(req);
    return Response.json({
      enabled: true,
      email: auth.email ?? null,
      wallet: profile?.wallet ?? auth.wallet ?? null,
      onboarded: !!profile?.onboardedAt,
      profile: profile ? { ...publicProfile(profile), emailOnWin: profile.emailOnWin } : null,
    });
  } catch (err) {
    return accountError(err);
  }
}

/** Onboarding (first save sets handle and role) and later profile edits. */
export async function POST(req: Request) {
  try {
    await rateLimit(req, "me-save", 10, 60_000);
    const account = await requireAccount(req);
    const input = OnboardSchema.parse(await readJson(req, 8 * 1024));
    const saved = await saveProfile(account, input);
    return Response.json({ onboarded: true, profile: { ...publicProfile(saved), emailOnWin: saved.emailOnWin } });
  } catch (err) {
    return accountError(err);
  }
}
