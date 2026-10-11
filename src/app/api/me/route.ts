import { accountError, accountsEnabled, companyInviteFor, OnboardSchema, publicProfile, requireAccount, saveProfile } from "@/lib/server/accounts";
import { rateLimit, readJson } from "@/lib/server/guard";

export const dynamic = "force-dynamic";
// Every call inside is time-boxed; this is only the outer limit.
export const maxDuration = 30;

/** The signed-in user's account: email, profile, role, whether onboarding is done, and any organisation invitation. */
export async function GET(req: Request) {
  if (!accountsEnabled()) return Response.json({ enabled: false });
  try {
    await rateLimit(req, "me", 60, 60_000);
    const { auth, profile } = await requireAccount(req);
    const invite = profile?.onboardedAt ? null : await companyInviteFor(auth);
    return Response.json({
      enabled: true,
      email: auth.email ?? null,
      wallet: profile?.wallet ?? auth.wallet ?? null,
      onboarded: !!profile?.onboardedAt,
      profile: profile ? { ...publicProfile(profile), emailOnWin: profile.emailOnWin } : null,
      invite: invite ? { company: invite.company } : null,
      // The login's wallet already belongs to another account, so no profile could be made.
      walletInUse: !profile && !!auth.wallet,
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
