// Turns a server error into one short line that's safe to show on the public
// status page: what failed and why, never a credential. Deliberately has no
// imports, so it still loads when the code it reports on doesn't.

const SECRET_ENVS = ["PRIVY_APP_SECRET", "DATABASE_URL", "DIRECT_URL", "REDIS_URL", "KV_URL", "RESEND_API_KEY", "CRON_SECRET", "ANTHROPIC_API_KEY"];

/** Every configured secret, and the password inside each connection string. */
function secrets(): string[] {
  const out: string[] = [];
  for (const name of SECRET_ENVS) {
    const v = process.env[name];
    if (!v || v.length < 6) continue;
    out.push(v);
    try {
      const u = new URL(v);
      if (u.password) out.push(u.password, decodeURIComponent(u.password));
    } catch {
      /* not a URL */
    }
  }
  return out.filter((s) => s.length >= 6).sort((a, b) => b.length - a.length);
}

/** "Name (code): message", with URLs, emails and anything key-like removed, cut to one short line. */
export function describeError(err: unknown): string {
  const e = err as { name?: string; message?: string; code?: unknown; errorCode?: unknown; status?: unknown };
  const name = e?.name && e.name !== "Error" ? e.name : "";
  const code = typeof e?.code === "string" || typeof e?.code === "number" ? String(e.code) : typeof e?.errorCode === "string" ? e.errorCode : "";
  const status = typeof e?.status === "number" ? `HTTP ${e.status}` : "";
  let message = String(e?.message ?? err ?? "unknown error");
  for (const s of secrets()) message = message.split(s).join("[secret]");
  message = message
    .replace(/\b[a-z][a-z0-9+.-]*:\/\/\S+/gi, "[url]")
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]")
    .replace(/[A-Za-z0-9_+=-]{32,}/g, "[redacted]")
    .replace(/\s+/g, " ")
    .trim();
  const tags = [code, status].filter(Boolean).join(", ");
  const head = name ? `${name}${tags ? ` (${tags})` : ""}: ` : tags ? `(${tags}) ` : "";
  const line = `${head}${message}`;
  return line.length > 280 ? `${line.slice(0, 277)}...` : line;
}
