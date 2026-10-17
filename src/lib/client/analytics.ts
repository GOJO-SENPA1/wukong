import { analyticsAllowed } from "./consent";
import { normalizePath, type EventName, type EventProp } from "../events";

/**
 * Count a product event, only if the visitor said yes to analytics. Sent with
 * sendBeacon so it survives navigation, and never awaited: tracking can't slow
 * down or break what the visitor is doing.
 */
export function track(event: EventName, props?: Partial<Record<EventProp, string>>) {
  try {
    if (!analyticsAllowed()) return;
    const body = JSON.stringify({ event, path: normalizePath(location.pathname), props });
    const blob = new Blob([body], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/events", blob)) {
      fetch("/api/events", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => {});
    }
  } catch {
    /* never let analytics throw */
  }
}
