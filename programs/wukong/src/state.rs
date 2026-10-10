use anchor_lang::prelude::*;

/// Global protocol configuration. One per deployment.
#[account]
#[derive(InitSpace)]
pub struct Config {
    /// Can rotate the judge, treasury and fee.
    pub admin: Pubkey,
    /// Off-chain AI judge oracle. The only key allowed to publish scores.
    pub judge: Pubkey,
    /// Wallet that receives the platform fee (its token account for `mint`).
    pub treasury: Pubkey,
    /// The settlement asset every task is paid in (USDC).
    pub mint: Pubkey,
    /// Platform fee, in basis points of the reward.
    pub fee_bps: u16,
    /// Lifetime counters, handy for dashboards.
    pub task_count: u64,
    pub total_escrowed: u64,
    pub total_paid: u64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum TaskStatus {
    /// Accepting submissions. Reward sits in the escrow vault.
    Open,
    /// Submissions closed, judge is publishing scores.
    Judging,
    /// Rewards released to the podium (or refunded if nothing qualified).
    Settled,
    /// Creator cancelled before anyone submitted. Reward refunded.
    Cancelled,
}

/// How the reward pool is split across the podium.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum PayoutMode {
    /// 100% to the best submission.
    WinnerTakesAll,
    /// 50 / 30 / 20 to the top three.
    TopThree,
}

/// Who makes the final call.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum JudgeMode {
    /// AI scores are final; anyone can crank settlement once every entry is scored.
    AiFinal,
    /// AI scores shortlist the podium, the creator picks the winner from it.
    CreatorPicks,
}

/// One slot of the live podium, maintained on-chain as scores land.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default, InitSpace, Debug)]
pub struct PodiumEntry {
    pub worker: Pubkey,
    pub submission: Pubkey,
    pub score: u16,
    pub index: u16,
    pub filled: bool,
}

#[account]
#[derive(InitSpace)]
pub struct Task {
    pub creator: Pubkey,
    pub nonce: u64,
    pub mint: Pubkey,
    pub vault: Pubkey,
    #[max_len(64)]
    pub title: String,
    pub category: u8,
    /// sha256 of the full brief stored off-chain; the judge verifies it before scoring.
    pub brief_hash: [u8; 32],
    pub reward: u64,
    /// Fee snapshot at creation, so later config changes can't touch live escrow.
    pub fee_bps: u16,
    pub created_at: i64,
    pub deadline: i64,
    pub status: TaskStatus,
    pub payout_mode: PayoutMode,
    pub judge_mode: JudgeMode,
    /// Minimum on-chain reputation rating required to submit.
    pub min_rating: u32,
    pub max_submissions: u16,
    /// Refundable stake each entrant locks (0 = none). Slashed to the treasury
    /// if the entry scores under the spam bar; refunded otherwise.
    pub entry_stake: u64,
    /// Staked entries whose stake has not been refunded or slashed yet.
    pub stakes_outstanding: u16,
    /// Creator-picks mode: after this long past closing, anyone can settle on
    /// the AI's top pick. Protects workers from a buyer who never decides.
    pub pick_grace_secs: u32,
    pub closed_at: i64,
    pub submission_count: u16,
    pub scored_count: u16,
    pub podium: [PodiumEntry; 3],
    pub paid_out: u64,
    pub fee_paid: u64,
    pub settled_at: i64,
    pub bump: u8,
    pub vault_bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Submission {
    pub task: Pubkey,
    pub worker: Pubkey,
    pub index: u16,
    /// sha256 of the submitted work; content lives off-chain and is verified against this.
    pub content_hash: [u8; 32],
    pub submitted_at: i64,
    /// 0..=10_000 (two implied decimals), published by the judge.
    pub score: u16,
    pub scored: bool,
    /// sha256 of the judge's full written report for this submission.
    pub report_hash: [u8; 32],
    /// 0 = not placed, 1..=3 = podium place after settlement.
    pub rank: u8,
    pub payout: u64,
    pub stake: u64,
    pub stake_settled: bool,
    pub bump: u8,
}

/// Portable, on-chain worker reputation. Survives any front-end.
#[account]
#[derive(InitSpace)]
pub struct Reputation {
    pub worker: Pubkey,
    pub submissions: u32,
    pub scored: u32,
    pub score_sum: u64,
    pub best_score: u16,
    pub wins: u32,
    pub podiums: u32,
    pub total_earned: u64,
    pub rating: u32,
    pub last_active: i64,
    pub bump: u8,
}
