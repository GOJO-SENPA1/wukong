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
    #[msg("Remaining accounts do not match the podium")]
    PodiumAccountMismatch,
    #[msg("Only tasks with zero submissions can be cancelled")]
    CannotCancel,
    #[msg("Arithmetic overflow")]
    Overflow,
}
