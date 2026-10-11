export const dynamic = "force-dynamic";
// Every call inside is time-boxed; this is only the outer limit.
export const maxDuration = 30;

// The accounts code is loaded on demand, so that if it can't load on the host this
// still answers in JSON (and the operators' status page says which part failed) instead of a blank 500.
const load = () => Promise.all([import("@/lib/server/accounts"), import("@/lib/server/guard")]);

function crashed(err: unknown): Response {
  console.error("api/me:", err);
  return Response.json({ error: "The server hit an error loading your account. Try again in a moment." }, { status: 500 });
}

/** The signed-in user's account: email, profile, role, whether onboarding is done, and any organisation invitation. */
export async function GET(req: Request) {
  try {
    const [{ accountError, accountsEnabled, companyInviteFor, publicProfile, requireAccount }, { rateLimit }] = await load();
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
  } catch (err) {
    return crashed(err);
  }
}

/** Onboarding (first save sets handle and role) and later profile edits. */
export async function POST(req: Request) {
  try {
    const [{ accountError, OnboardSchema, publicProfile, requireAccount, saveProfile }, { rateLimit, readJson }] = await load();
    try {
      await rateLimit(req, "me-save", 10, 60_000);
      const account = await requireAccount(req);
      const input = OnboardSchema.parse(await readJson(req, 8 * 1024));
      const saved = await saveProfile(account, input);
      return Response.json({ onboarded: true, profile: { ...publicProfile(saved), emailOnWin: saved.emailOnWin } });
    } catch (err) {
      return accountError(err);
    }
  } catch (err) {
    return crashed(err);
  }
}
