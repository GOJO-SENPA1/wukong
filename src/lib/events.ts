/**
 * The product events Wukong counts, with consent only, as anonymous daily totals:
 * no cookies, no user or wallet ids, no IP addresses, no third parties. Shared by
 * the browser (which sends them) and the API (which accepts only these).
 */
export const EVENTS = {
  page_view: "Viewed a page",
  cta_click: "Clicked a call to action",
  sign_in_start: "Started signing in",
  sign_up_complete: "Finished setting up a profile",
  task_posted: "Posted a task",
  entry_submitted: "Submitted an entry",
  contact_sent: "Sent the contact form",
  org_request: "Asked for an organisation account",
  blink_copied: "Copied a task's Blink link",
  agent_snippet_copied: "Copied the agent API example",
  profile_shared: "Copied a profile link",
} as const;

export type EventName = keyof typeof EVENTS;
export const EVENT_NAMES = Object.keys(EVENTS) as [EventName, ...EventName[]];

/** The only details an event may carry, each a short label (never an id or free text). */
export const EVENT_PROPS = ["cta", "method", "role", "category", "topic"] as const;
export type EventProp = (typeof EVENT_PROPS)[number];

/** Collapse ids in a path, so counts are per page type and never per task or person. */
export function normalizePath(path: string): string {
  return (
    path
      .replace(/^\/tasks\/(?!new$)[^/]+/, "/tasks/[task]")
      .replace(/^\/workers\/[^/]+/, "/workers/[worker]")
      .replace(/^\/u\/[^/]+/, "/u/[handle]")
      .replace(/^\/@[^/]+/, "/@[handle]")
      .replace(/[^\w/[\]@.-]/g, "")
      .slice(0, 80) || "/"
  );
}
