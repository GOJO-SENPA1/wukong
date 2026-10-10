use anchor_lang::prelude::*;

#[error_code]
pub enum WukongError {
    #[msg("Platform fee is above the 20% cap")]
    FeeTooHigh,
    #[msg("Title must be 1-64 bytes")]
    InvalidTitle,
    #[msg("Reward must be greater than zero")]
    InvalidReward,
    #[msg("Deadline must be in the future")]
    InvalidDeadline,
    #[msg("max_submissions must be between 1 and 256")]
    InvalidMaxSubmissions,
    #[msg("Task mint does not match the protocol settlement mint")]
    WrongMint,
    #[msg("Task is not open for submissions")]
    TaskNotOpen,
    #[msg("Submission deadline has passed")]
    DeadlinePassed,
    #[msg("Task has reached its submission cap")]
    TaskFull,
    #[msg("Task creators cannot compete on their own task")]
    CreatorCannotSubmit,
    #[msg("Reputation rating too low for this task")]
    RatingTooLow,
    #[msg("Only the creator or judge can close submissions before the deadline")]
    NotAllowedToClose,
    #[msg("Task has no submissions; cancel it instead")]
    NoSubmissions,
    #[msg("Task is not in the judging phase")]
    TaskNotJudging,
    #[msg("Signer is not the protocol judge")]
    NotJudge,
    #[msg("Score must be between 0 and 10000")]
    InvalidScore,
    #[msg("Submission was already scored; scores are final")]
    AlreadyScored,
    #[msg("Not every submission has been scored yet")]
    ScoringIncomplete,
    #[msg("This task's judge mode does not allow that settlement path")]
    WrongJudgeMode,
    #[msg("Pick is not on the AI shortlist")]
    InvalidPick,
    #[msg("Only the task creator can pick the winner")]
    NotCreator,
    #[msg("Remaining accounts do not match the podium")]
    PodiumAccountMismatch,
    #[msg("Only tasks with zero submissions can be cancelled")]
    CannotCancel,
    #[msg("Entry stake cannot exceed the reward")]
    StakeTooHigh,
    #[msg("Pick grace period is capped at 7 days")]
    PickGraceTooLong,
    #[msg("This task requires a stake: pass the mint, vault, your token account and the token program")]
    MissingStakeAccounts,
    #[msg("Stake account does not match the task")]
    StakeAccountMismatch,
    #[msg("This submission has no stake left to settle")]
    NothingToClaim,
    #[msg("Task is not settled yet")]
    TaskNotSettled,
    #[msg("The creator's pick window is still open")]
    PickWindowOpen,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Reward must be at least 1 USDC")]
    RewardTooSmall,
    #[msg("Deadline can be at most 90 days away")]
    DeadlineTooFar,
    #[msg("A task with fewer than 256 entry slots needs an entry stake of at least reward / slots")]
    CapNeedsStake,
    #[msg("Creator-picks tasks pay a single winner: use winner takes all")]
    PicksAreWinnerTakesAll,
    #[msg("Creator-picks tasks close at the deadline (or when full), not early")]
    PicksCloseAtDeadline,
    #[msg("Every entry is scored; settle the task instead")]
    JudgingComplete,
    #[msg("The judge still has time to finish scoring")]
    JudgeTimeoutNotReached,
}
