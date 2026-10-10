use anchor_lang::prelude::*;

#[event]
pub struct TaskCreated {
    pub task: Pubkey,
    pub creator: Pubkey,
    pub reward: u64,
    pub deadline: i64,
    pub title: String,
}

#[event]
pub struct WorkSubmitted {
    pub task: Pubkey,
    pub submission: Pubkey,
    pub worker: Pubkey,
    pub index: u16,
    pub content_hash: [u8; 32],
}

#[event]
pub struct SubmissionsClosed {
    pub task: Pubkey,
    pub submission_count: u16,
}

#[event]
pub struct SubmissionScored {
    pub task: Pubkey,
    pub submission: Pubkey,
    pub worker: Pubkey,
    pub score: u16,
    pub report_hash: [u8; 32],
}

#[event]
pub struct TaskSettled {
    pub task: Pubkey,
    pub winners: Vec<Pubkey>,
    pub amounts: Vec<u64>,
    pub fee: u64,
    pub refunded: u64,
}

#[event]
pub struct TaskCancelled {
    pub task: Pubkey,
    pub refunded: u64,
}
