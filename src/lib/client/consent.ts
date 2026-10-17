// The visitor's choice about optional analytics, kept in a first-party cookie for
// 180 days. Essential storage (sign-in, wallet, drafts) needs no consent and is
// never affected by it.

export interface Consent {
  analytics: boolean;
  /** When the choice was made (ms). */
  at: number;
}

const COOKIE = "wk_consent";
const MAX_AGE = 60 * 60 * 24 * 180;
export const CONSENT_CHANGED = "wukong:consent-changed";
export const OPEN_CONSENT = "wukong:consent-open";

export function readConsent(): Consent | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  const m = raw ? /^v1\.a([01])\.(\d+)$/.exec(decodeURIComponent(raw)) : null;
  return m ? { analytics: m[1] === "1", at: Number(m[2]) } : null;
}

export function saveConsent(analytics: boolean): Consent {
  const c: Consent = { analytics, at: Date.now() };
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE}=v1.a${analytics ? 1 : 0}.${c.at}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent<Consent>(CONSENT_CHANGED, { detail: c }));
  return c;
}

/** The browser asks sites not to track (Global Privacy Control or Do Not Track). */
export function privacySignal(): boolean {
  if (typeof navigator === "undefined") return false;
  const n = navigator as Navigator & { globalPrivacyControl?: boolean };
  return n.globalPrivacyControl === true || n.doNotTrack === "1";
}

/** Analytics only run after an explicit yes. */
export function analyticsAllowed(): boolean {
  return readConsent()?.analytics === true;
}

/** Open the cookie preferences panel from anywhere (the footer link, the privacy page). */
export function openConsentPreferences() {
  window.dispatchEvent(new Event(OPEN_CONSENT));
}
