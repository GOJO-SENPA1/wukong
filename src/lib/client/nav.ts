/**
 * Only same-site paths are allowed as ?next= targets (no open redirects).
 * Resolves the value against this origin and keeps it only if it stays here;
 * control characters and backslashes (which browsers strip or rewrite) are refused.
 */
export function safeNext(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || next.length > 512 || !next.startsWith("/") || /[\u0000-\u001f\u007f\\]/.test(next)) return fallback;
  try {
    const base = typeof window === "undefined" ? "https://wukonghq.xyz" : window.location.origin;
    const url = new URL(next, base);
    if (url.origin !== base) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
