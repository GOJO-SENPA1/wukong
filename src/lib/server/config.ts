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

/** Privy server credentials, or null when auth isn't configured (demo mode). */
export function privyConfig(): PrivyConfig | null {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
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
