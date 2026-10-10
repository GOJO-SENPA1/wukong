// Protocol rules mirrored from the on-chain program, dependency-free so both
// the browser and the server can use them.

/** Entries scoring under this (0..10000) lose their stake and cost rating. */
export const SPAM_SCORE = 2000;

/** Whether an entry's stake is (or will be) refunded rather than slashed. */
export function stakeRefunded(sub: { scored: boolean; score: number }): boolean {
  return sub.scored && sub.score >= SPAM_SCORE;
}
