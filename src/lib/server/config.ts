// App-level configuration for the production web stack (domain, auth, email,
// database). Deliberately free of Solana/Anchor imports so lightweight routes
// can read it cheaply. Every accessor degrades gracefully: when its env is
// absent the feature is simply off, so the demo keeps working with none of it.

/** Public base URL of the app. Used for email links and Privy callbacks. */
export function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.WUKONG_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export interface PrivyConfig {
  appId: string;
  appSecret: string;
}

/**
 * A credential as pasted into a dashboard, minus what copying tends to add:
 * surrounding whitespace, invisible characters (zero-width spaces, byte-order
 * marks) and wrapping quotes, straight or curly. Keys and secrets never
 * contain any of these, and Privy's client throws on anything that isn't plain text.
 */
export function cleanCredential(value: string | undefined): string | undefined {
  const v = value
    ?.replace(/[\u200b-\u200d\u2060\ufeff\u00a0]/g, "")
    .trim()
    .replace(/^['"`\u2018\u2019\u201c\u201d]+|['"`\u2018\u2019\u201c\u201d]+$/g, "")
    .trim();
  return v || undefined;
}

/** Privy server credentials, or null when auth isn't configured (demo mode). */
export function privyConfig(): PrivyConfig | null {
  const appId = cleanCredential(process.env.NEXT_PUBLIC_PRIVY_APP_ID);
  const appSecret = cleanCredential(process.env.PRIVY_APP_SECRET);
  return appId && appSecret ? { appId, appSecret } : null;
}

export interface ResendConfig {
  apiKey: string;
  from: string;
}

/** Resend credentials, or null when email isn't configured. */
export function resendConfig(): ResendConfig | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  const from = process.env.EMAIL_FROM ?? "Wukong <noreply@send.wukonghq.xyz>";
  return { apiKey, from };
}

/** Whether a Postgres database (Supabase) is wired up for accounts/profiles. */
export function hasDatabase(): boolean {
  return !!process.env.DATABASE_URL;
}
