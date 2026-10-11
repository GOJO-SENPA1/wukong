import { HELP_EMAIL } from "./contact";

/**
 * Facts the legal pages depend on. Keep them in step with the program and the
 * judge: if a constant changes there, change it here (and the date).
 *
 * `entity` and `governingLaw` stay null until the operating company is
 * registered; the Terms say so plainly until then.
 */
export const LEGAL = {
  updated: "11 October 2026",
  contact: HELP_EMAIL,
  entity: null as string | null,
  governingLaw: null as string | null,
  /** Platform fee taken from each payout at settlement (config.fee_bps), and the program's cap. */
  feePercent: 10,
  maxFeePercent: 20,
  /** No entry at or above this score: the reward goes back to the poster (MIN_PODIUM_SCORE). */
  qualityBar: 25,
  /** Entries under this score forfeit their stake (SPAM_SCORE). */
  spamBar: 20,
  /** Judging not finished this long after submissions close: the poster can be refunded (JUDGE_TIMEOUT_SECS). */
  judgeTimeoutDays: 7,
  /** Longest a task can stay open (MAX_OPEN_SECS), most entries per task (MAX_SUBMISSIONS), smallest reward (MIN_REWARD). */
  maxOpenDays: 90,
  maxEntries: 256,
  minRewardUsdc: 1,
  /** Days to ask for a human review of a score. */
  reviewDays: 14,
};

export const LEGAL_PAGES = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/rules", label: "Task and judging rules" },
  { href: "/security", label: "Security" },
];
