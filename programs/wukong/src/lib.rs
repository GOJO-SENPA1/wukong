//! Wukong — a competitive work marketplace.
//!
//! A creator posts a task and locks the reward in a program-owned USDC vault.
//! Any number of workers submit (content hash on-chain, content off-chain).
//! An AI judge oracle publishes a score for every submission on-chain; the
//! program keeps a live top-3 podium from those scores, so the winner is a
//! deterministic function of published scores, not of the judge's say-so.
//! Settlement is permissionless once every entry is scored, pays the podium
//! straight from escrow, and updates each worker's portable Reputation PDA.
//! Optional entry stakes make spam expensive: refunded for honest work,
//! slashed to the treasury for entries under the spam bar.

use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    self, CloseAccount, Mint, TokenAccount, TokenInterface, TransferChecked,
};

pub mod errors;
pub mod events;
pub mod state;

use errors::WukongError;
use events::*;
use state::*;

declare_id!("5BWF3ueP3ccwFMRv23nn1p1yFUA8hRsqrXy8cQye5zKk");

pub const CONFIG_SEED: &[u8] = b"config";
pub const TASK_SEED: &[u8] = b"task";
pub const VAULT_SEED: &[u8] = b"vault";
pub const SUBMISSION_SEED: &[u8] = b"submission";
pub const REPUTATION_SEED: &[u8] = b"reputation";

pub const BPS: u64 = 10_000;
pub const MAX_FEE_BPS: u16 = 2_000;
pub const MAX_SCORE: u16 = 10_000;
pub const MAX_SUBMISSIONS: u16 = 256;
pub const MAX_TITLE_LEN: usize = 64;
/// Entries scoring below this can never reach the podium. If nothing clears
/// the bar, the creator is refunded: the buyer's quality guarantee.
pub const MIN_PODIUM_SCORE: u16 = 2_500;
/// Smallest reward a task may lock (1 USDC at 6 decimals): makes reputation farming with dust tasks cost real money.
pub const MIN_REWARD: u64 = 1_000_000;
/// Longest a task may stay open, so entry stakes can't be locked indefinitely.
pub const MAX_OPEN_SECS: i64 = 90 * 24 * 3600;
/// If the judge hasn't scored everything this long after close, anyone may refund the creator.
pub const JUDGE_TIMEOUT_SECS: i64 = 7 * 24 * 3600;
/// Scores under this count as spam and cost the worker rating.
pub const SPAM_SCORE: u16 = 2_000;
pub const SPAM_PENALTY: u32 = 10;
pub const PLACE_BONUS: [u32; 3] = [100, 50, 25];
pub const TOP_THREE_SPLIT_BPS: [u64; 3] = [5_000, 3_000, 2_000];
pub const MAX_PICK_GRACE_SECS: u32 = 7 * 24 * 3600;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateTaskArgs {
    pub title: String,
    pub category: u8,
    pub brief_hash: [u8; 32],
    pub reward: u64,
    pub deadline: i64,
    pub payout_mode: PayoutMode,
    pub judge_mode: JudgeMode,
    pub min_rating: u32,
    pub max_submissions: u16,
    pub entry_stake: u64,
    pub pick_grace_secs: u32,
}

#[program]
pub mod wukong {
    use super::*;

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        judge: Pubkey,
        treasury: Pubkey,
        fee_bps: u16,
    ) -> Result<()> {
        require!(fee_bps <= MAX_FEE_BPS, WukongError::FeeTooHigh);
        let config = &mut ctx.accounts.config;
        config.admin = ctx.accounts.admin.key();
        config.judge = judge;
        config.treasury = treasury;
        config.mint = ctx.accounts.mint.key();
        config.fee_bps = fee_bps;
        config.task_count = 0;
        config.total_escrowed = 0;
        config.total_paid = 0;
        config.bump = ctx.bumps.config;
        Ok(())
    }

    pub fn update_config(
        ctx: Context<UpdateConfig>,
        judge: Option<Pubkey>,
        treasury: Option<Pubkey>,
        fee_bps: Option<u16>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        if let Some(judge) = judge {
            config.judge = judge;
        }
        if let Some(treasury) = treasury {
            config.treasury = treasury;
        }
        if let Some(fee_bps) = fee_bps {
            require!(fee_bps <= MAX_FEE_BPS, WukongError::FeeTooHigh);
            config.fee_bps = fee_bps;
        }
        Ok(())
    }

    /// Post a task and lock the full reward in escrow.
    pub fn create_task(ctx: Context<CreateTask>, nonce: u64, args: CreateTaskArgs) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        require!(
            !args.title.is_empty() && args.title.len() <= MAX_TITLE_LEN,
            WukongError::InvalidTitle
        );
        require!(args.reward >= MIN_REWARD, WukongError::RewardTooSmall);
        require!(args.deadline > now, WukongError::InvalidDeadline);
        require!(args.deadline <= now.saturating_add(MAX_OPEN_SECS), WukongError::DeadlineTooFar);
        require!(
            args.max_submissions >= 1 && args.max_submissions <= MAX_SUBMISSIONS,
            WukongError::InvalidMaxSubmissions
        );
        require!(args.entry_stake <= args.reward, WukongError::StakeTooHigh);
        // A small entry cap is a scarce, first-come resource: without a meaningful stake, one
        // actor could fill every slot with throwaway wallets and be the only real entry.
        require!(
            args.max_submissions == MAX_SUBMISSIONS
                || args.entry_stake >= args.reward / args.max_submissions as u64,
            WukongError::CapNeedsStake
        );
        // The creator picks a single winner; a 50/30/20 split can't apply.
        require!(
            !(args.judge_mode == JudgeMode::CreatorPicks && args.payout_mode == PayoutMode::TopThree),
            WukongError::PicksAreWinnerTakesAll
        );
        require!(args.pick_grace_secs <= MAX_PICK_GRACE_SECS, WukongError::PickGraceTooLong);

        token_interface::transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.creator_token.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.creator.to_account_info(),
                },
            ),
            args.reward,
            ctx.accounts.mint.decimals,
        )?;

        let config = &mut ctx.accounts.config;
        config.task_count = config.task_count.checked_add(1).ok_or(WukongError::Overflow)?;
        config.total_escrowed = config
            .total_escrowed
            .checked_add(args.reward)
            .ok_or(WukongError::Overflow)?;

        let task = &mut ctx.accounts.task;
        task.creator = ctx.accounts.creator.key();
        task.nonce = nonce;
        task.mint = ctx.accounts.mint.key();
        task.vault = ctx.accounts.vault.key();
        task.title = args.title.clone();
        task.category = args.category;
        task.brief_hash = args.brief_hash;
        task.reward = args.reward;
        task.fee_bps = config.fee_bps;
        task.created_at = now;
        task.deadline = args.deadline;
        task.status = TaskStatus::Open;
        task.payout_mode = args.payout_mode;
        task.judge_mode = args.judge_mode;
        task.min_rating = args.min_rating;
        task.max_submissions = args.max_submissions;
        task.entry_stake = args.entry_stake;
        task.stakes_outstanding = 0;
        task.pick_grace_secs = args.pick_grace_secs;
        task.closed_at = 0;
        task.submission_count = 0;
        task.scored_count = 0;
        task.podium = [PodiumEntry::default(); 3];
        task.paid_out = 0;
        task.fee_paid = 0;
        task.settled_at = 0;
        task.bump = ctx.bumps.task;
        task.vault_bump = ctx.bumps.vault;

        emit!(TaskCreated {
            task: task.key(),
            creator: task.creator,
            reward: task.reward,
            deadline: task.deadline,
            title: args.title,
        });
        Ok(())
    }

    /// Enter the arena: commit to a piece of work by its hash.
    pub fn submit_work(ctx: Context<SubmitWork>, content_hash: [u8; 32]) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let worker = ctx.accounts.worker.key();
        let task = &mut ctx.accounts.task;
        require!(task.status == TaskStatus::Open, WukongError::TaskNotOpen);
        require!(now <= task.deadline, WukongError::DeadlinePassed);
        require!(task.submission_count < task.max_submissions, WukongError::TaskFull);
        require_keys_neq!(worker, task.creator, WukongError::CreatorCannotSubmit);

        let rep = &mut ctx.accounts.reputation;
        if rep.worker == Pubkey::default() {
            rep.worker = worker;
            rep.bump = ctx.bumps.reputation;
        }
        require!(rep.rating >= task.min_rating, WukongError::RatingTooLow);
        rep.submissions = rep.submissions.saturating_add(1);
        rep.last_active = now;

        let stake = task.entry_stake;
        if stake > 0 {
            let (Some(mint), Some(vault), Some(worker_token), Some(token_program)) = (
                ctx.accounts.mint.as_ref(),
                ctx.accounts.vault.as_ref(),
                ctx.accounts.worker_token.as_ref(),
                ctx.accounts.token_program.as_ref(),
            ) else {
                return err!(WukongError::MissingStakeAccounts);
            };
            require_keys_eq!(mint.key(), task.mint, WukongError::StakeAccountMismatch);
            require_keys_eq!(vault.key(), task.vault, WukongError::StakeAccountMismatch);
            require_keys_eq!(worker_token.mint, task.mint, WukongError::StakeAccountMismatch);
            require_keys_eq!(worker_token.owner, worker, WukongError::StakeAccountMismatch);
            token_interface::transfer_checked(
                CpiContext::new(
                    token_program.to_account_info(),
                    TransferChecked {
                        from: worker_token.to_account_info(),
                        mint: mint.to_account_info(),
                        to: vault.to_account_info(),
                        authority: ctx.accounts.worker.to_account_info(),
                    },
                ),
                stake,
                mint.decimals,
            )?;
            task.stakes_outstanding += 1;
        }

        let sub = &mut ctx.accounts.submission;
        sub.task = task.key();
        sub.worker = worker;
        sub.index = task.submission_count;
        sub.content_hash = content_hash;
        sub.submitted_at = now;
        sub.score = 0;
        sub.scored = false;
        sub.report_hash = [0u8; 32];
        sub.rank = 0;
        sub.payout = 0;
        sub.stake = stake;
        sub.stake_settled = false;
        sub.bump = ctx.bumps.submission;

        task.submission_count += 1;

        emit!(WorkSubmitted {
            task: task.key(),
            submission: sub.key(),
            worker,
            index: sub.index,
            content_hash,
        });
        Ok(())
    }

    /// Stop accepting work and hand the task to the judge.
    /// Creator or judge can close early; anyone can close after the deadline.
    pub fn close_submissions(ctx: Context<CloseSubmissions>) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let signer = ctx.accounts.authority.key();
        let task = &mut ctx.accounts.task;
        require!(task.status == TaskStatus::Open, WukongError::TaskNotOpen);
        require!(task.submission_count > 0, WukongError::NoSubmissions);
        let privileged = signer == task.creator || signer == ctx.accounts.config.judge;
        require!(privileged || now > task.deadline, WukongError::NotAllowedToClose);
        // In creator-picks mode the creator also chooses the winner: closing early would let them
        // stop the field while a favoured entry is on the shortlist. They wait for the deadline
        // (or a full task) like everyone else.
        if signer == task.creator && signer != ctx.accounts.config.judge && now <= task.deadline && task.judge_mode == JudgeMode::CreatorPicks {
            require!(task.submission_count == task.max_submissions, WukongError::PicksCloseAtDeadline);
        }
        task.status = TaskStatus::Judging;
        task.closed_at = now;
        emit!(SubmissionsClosed {
            task: task.key(),
            submission_count: task.submission_count,
        });
        Ok(())
    }

    /// Judge publishes a final, public score. The podium updates on-chain.
    pub fn score_submission(
        ctx: Context<ScoreSubmission>,
        score: u16,
        report_hash: [u8; 32],
    ) -> Result<()> {
        require!(score <= MAX_SCORE, WukongError::InvalidScore);
        let task_key = ctx.accounts.task.key();
        let task = &mut ctx.accounts.task;
        require!(task.status == TaskStatus::Judging, WukongError::TaskNotJudging);

        let sub = &mut ctx.accounts.submission;
        require!(!sub.scored, WukongError::AlreadyScored);
        sub.score = score;
        sub.scored = true;
        sub.report_hash = report_hash;

        task.scored_count += 1;
        if score >= MIN_PODIUM_SCORE {
            insert_podium(
                &mut task.podium,
                PodiumEntry {
                    worker: sub.worker,
                    submission: sub.key(),
                    score,
                    index: sub.index,
                    filled: true,
                },
            );
        }

        let rep = &mut ctx.accounts.reputation;
        rep.scored = rep.scored.saturating_add(1);
        rep.score_sum = rep.score_sum.saturating_add(score as u64);
        rep.best_score = rep.best_score.max(score);
        if score >= 5_000 {
            rep.rating = rep.rating.saturating_add(((score - 5_000) / 100) as u32);
        } else if score < SPAM_SCORE {
            rep.rating = rep.rating.saturating_sub(SPAM_PENALTY);
        }

        emit!(SubmissionScored {
            task: task_key,
            submission: sub.key(),
            worker: sub.worker,
            score,
            report_hash,
        });
        Ok(())
    }

    /// Release escrow to the podium. Permissionless: the outcome is fully
    /// determined by the scores already on-chain.
    /// remaining_accounts: for each podium place paid, in order:
    ///   [submission (mut), worker token account (mut), worker reputation (mut)]
    pub fn settle<'info>(ctx: Context<'_, '_, 'info, 'info, Settle<'info>>) -> Result<()> {
        let task = &ctx.accounts.task;
        require!(task.status == TaskStatus::Judging, WukongError::TaskNotJudging);
        require!(task.scored_count == task.submission_count, WukongError::ScoringIncomplete);

        let (places, mode) = if task.judge_mode == JudgeMode::CreatorPicks {
            // The creator had their window and didn't pick: the AI's top entry
            // wins outright, so workers are never left unpaid. An empty
            // shortlist has nothing to pick from and refunds straight away.
            if task.podium[0].filled {
                let now = Clock::get()?.unix_timestamp;
                require!(
                    now > task.closed_at + task.pick_grace_secs as i64,
                    WukongError::PickWindowOpen
                );
            }
            (vec![0], PayoutMode::WinnerTakesAll)
        } else {
            match task.payout_mode {
                PayoutMode::WinnerTakesAll => (vec![0], PayoutMode::WinnerTakesAll),
                PayoutMode::TopThree => (vec![0, 1, 2], PayoutMode::TopThree),
            }
        };
        let winners: Vec<PodiumEntry> = places
            .iter()
            .map(|&i| task.podium[i])
            .filter(|e| e.filled)
            .collect();
        let shares = split_shares(mode, winners.len());
        pay_out(ctx, winners, shares)
    }

    /// Creator-picks mode: the AI shortlists the podium, the creator chooses.
    pub fn settle_pick<'info>(
        ctx: Context<'_, '_, 'info, 'info, Settle<'info>>,
        pick: u8,
    ) -> Result<()> {
        let task = &ctx.accounts.task;
        require!(task.status == TaskStatus::Judging, WukongError::TaskNotJudging);
        require!(task.judge_mode == JudgeMode::CreatorPicks, WukongError::WrongJudgeMode);
        require!(task.scored_count == task.submission_count, WukongError::ScoringIncomplete);
        require_keys_eq!(ctx.accounts.cranker.key(), task.creator, WukongError::NotCreator);
        let pick = pick as usize;
        require!(pick < 3 && task.podium[pick].filled, WukongError::InvalidPick);
        let winners = vec![task.podium[pick]];
        pay_out(ctx, winners, vec![BPS])
    }

    /// Settle one entry's stake after the task settles: refunded if it scored
    /// at or above the spam bar, slashed to the treasury otherwise.
    /// Permissionless; the last one closes the vault.
    pub fn claim_stake(ctx: Context<ClaimStake>) -> Result<()> {
        let task = &ctx.accounts.task;
        require!(task.status == TaskStatus::Settled, WukongError::TaskNotSettled);
        let sub = &ctx.accounts.submission;
        require!(sub.stake > 0 && !sub.stake_settled, WukongError::NothingToClaim);

        // Unscored is only possible after expire_judging: the judge failed, not the worker.
        let refunded = !sub.scored || sub.score >= SPAM_SCORE;
        let amount = sub.stake;
        let creator = task.creator;
        let nonce_bytes = task.nonce.to_le_bytes();
        let bump = [task.bump];
        let seeds: &[&[u8]] = &[TASK_SEED, creator.as_ref(), &nonce_bytes, &bump];
        let signer = &[seeds];
        // Slashing needs nothing from the worker, so closing your own token
        // account can't dodge it. Refunds go to any token account you own.
        let to = if refunded {
            let worker_token = ctx
                .accounts
                .worker_token
                .as_ref()
                .ok_or(WukongError::StakeAccountMismatch)?;
            require_keys_eq!(worker_token.owner, sub.worker, WukongError::StakeAccountMismatch);
            require_keys_eq!(worker_token.mint, task.mint, WukongError::StakeAccountMismatch);
            worker_token.to_account_info()
        } else {
            ctx.accounts.treasury_token.to_account_info()
        };
        vault_transfer(
            &ctx.accounts.token_program,
            &ctx.accounts.vault,
            &ctx.accounts.mint,
            &ctx.accounts.task,
            to,
            amount,
            signer,
        )?;

        let task = &mut ctx.accounts.task;
        task.stakes_outstanding -= 1;
        let last = task.stakes_outstanding == 0;
        let task_key = task.key();
        let sub = &mut ctx.accounts.submission;
        sub.stake_settled = true;
        emit!(StakeSettled {
            task: task_key,
            submission: sub.key(),
            worker: sub.worker,
            amount,
            refunded,
        });

        if last {
            sweep_and_close_vault(
                &ctx.accounts.token_program,
                &mut ctx.accounts.vault,
                &ctx.accounts.mint,
                &ctx.accounts.task,
                ctx.accounts.treasury_token.to_account_info(),
                ctx.accounts.creator.to_account_info(),
                signer,
            )?;
        }
        Ok(())
    }

    /// The judge went dark: if not every entry is scored long after close, anyone may
    /// refund the reward to the creator. Stakes are then refunded via claim_stake.
    pub fn expire_judging<'info>(ctx: Context<'_, '_, 'info, 'info, Settle<'info>>) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let task = &ctx.accounts.task;
        require!(task.status == TaskStatus::Judging, WukongError::TaskNotJudging);
        require!(task.scored_count < task.submission_count, WukongError::JudgingComplete);
        require!(
            now > task.closed_at.saturating_add(JUDGE_TIMEOUT_SECS),
            WukongError::JudgeTimeoutNotReached
        );
        let creator = task.creator;
        let nonce_bytes = task.nonce.to_le_bytes();
        let bump = [task.bump];
        let seeds: &[&[u8]] = &[TASK_SEED, creator.as_ref(), &nonce_bytes, &bump];
        let signer = &[seeds];
        let reward = task.reward;
        let keep_vault_open = task.stakes_outstanding > 0;
        vault_transfer(
            &ctx.accounts.token_program,
            &ctx.accounts.vault,
            &ctx.accounts.mint,
            &ctx.accounts.task,
            ctx.accounts.creator_token.to_account_info(),
            reward,
            signer,
        )?;
        if !keep_vault_open {
            let treasury = ctx.accounts.treasury_token.to_account_info();
            let creator_info = ctx.accounts.creator.to_account_info();
            sweep_and_close_vault(
                &ctx.accounts.token_program,
                &mut ctx.accounts.vault,
                &ctx.accounts.mint,
                &ctx.accounts.task,
                treasury,
                creator_info,
                signer,
            )?;
        }
        let config = &mut ctx.accounts.config;
        config.total_escrowed = config.total_escrowed.saturating_sub(reward);
        let task = &mut ctx.accounts.task;
        task.status = TaskStatus::Settled;
        task.paid_out = 0;
        task.fee_paid = 0;
        task.settled_at = now;
        emit!(JudgingExpired {
            task: task.key(),
            refunded: reward,
        });
        Ok(())
    }

    /// Pull the task before anyone has submitted; full refund.
    pub fn cancel_task(ctx: Context<CancelTask>) -> Result<()> {
        let task = &ctx.accounts.task;
        require!(task.status == TaskStatus::Open, WukongError::TaskNotOpen);
        require!(task.submission_count == 0, WukongError::CannotCancel);

        let creator = task.creator;
        let nonce_bytes = task.nonce.to_le_bytes();
        let bump = [task.bump];
        let seeds: &[&[u8]] = &[TASK_SEED, creator.as_ref(), &nonce_bytes, &bump];
        let signer = &[seeds];
        let amount = ctx.accounts.vault.amount;

        token_interface::transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.vault.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.creator_token.to_account_info(),
                    authority: ctx.accounts.task.to_account_info(),
                },
                signer,
            ),
            amount,
            ctx.accounts.mint.decimals,
        )?;
        token_interface::close_account(CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            CloseAccount {
                account: ctx.accounts.vault.to_account_info(),
                destination: ctx.accounts.creator.to_account_info(),
                authority: ctx.accounts.task.to_account_info(),
            },
            signer,
        ))?;

        let config = &mut ctx.accounts.config;
        config.total_escrowed = config.total_escrowed.saturating_sub(amount);
        let task = &mut ctx.accounts.task;
        task.status = TaskStatus::Cancelled;
        task.settled_at = Clock::get()?.unix_timestamp;
        emit!(TaskCancelled {
            task: task.key(),
            refunded: amount,
        });
        Ok(())
    }
}

/// Move tokens out of a task vault, signed by the task PDA.
fn vault_transfer<'info>(
    token_program: &Interface<'info, TokenInterface>,
    vault: &InterfaceAccount<'info, TokenAccount>,
    mint: &InterfaceAccount<'info, Mint>,
    task: &Account<'info, Task>,
    to: AccountInfo<'info>,
    amount: u64,
    signer: &[&[&[u8]]],
) -> Result<()> {
    if amount == 0 {
        return Ok(());
    }
    token_interface::transfer_checked(
        CpiContext::new_with_signer(
            token_program.to_account_info(),
            TransferChecked {
                from: vault.to_account_info(),
                mint: mint.to_account_info(),
                to,
                authority: task.to_account_info(),
            },
            signer,
        ),
        amount,
        mint.decimals,
    )
}

/// Close a drained vault. Anything left over (e.g. tokens someone sent to the
/// vault to block its closing) is swept to the treasury first, so a stray
/// deposit can never freeze settlement.
fn sweep_and_close_vault<'info>(
    token_program: &Interface<'info, TokenInterface>,
    vault: &mut Box<InterfaceAccount<'info, TokenAccount>>,
    mint: &InterfaceAccount<'info, Mint>,
    task: &Account<'info, Task>,
    treasury_token: AccountInfo<'info>,
    rent_to: AccountInfo<'info>,
    signer: &[&[&[u8]]],
) -> Result<()> {
    vault.reload()?;
    let residual = vault.amount;
    vault_transfer(token_program, vault, mint, task, treasury_token, residual, signer)?;
    token_interface::close_account(CpiContext::new_with_signer(
        token_program.to_account_info(),
        CloseAccount {
            account: vault.to_account_info(),
            destination: rent_to,
            authority: task.to_account_info(),
        },
        signer,
    ))
}

/// Keep the podium sorted by (score desc, submission index asc).
pub fn insert_podium(podium: &mut [PodiumEntry; 3], entry: PodiumEntry) {
    for i in 0..podium.len() {
        let slot = podium[i];
        let better = !slot.filled
            || entry.score > slot.score
            || (entry.score == slot.score && entry.index < slot.index);
        if better {
            for j in (i + 1..podium.len()).rev() {
                podium[j] = podium[j - 1];
            }
            podium[i] = entry;
            return;
        }
    }
}

/// Basis-point split across `n` winners. Unclaimed places roll up to first.
pub fn split_shares(mode: PayoutMode, n: usize) -> Vec<u64> {
    match mode {
        PayoutMode::WinnerTakesAll => {
            if n == 0 {
                vec![]
            } else {
                vec![BPS]
            }
        }
        PayoutMode::TopThree => {
            if n == 0 {
                return vec![];
            }
            let mut shares: Vec<u64> = TOP_THREE_SPLIT_BPS[..n].to_vec();
            let unclaimed: u64 = TOP_THREE_SPLIT_BPS[n..].iter().sum();
            shares[0] += unclaimed;
            shares
        }
    }
}

fn pay_out<'info>(
    ctx: Context<'_, '_, 'info, 'info, Settle<'info>>,
    winners: Vec<PodiumEntry>,
    shares: Vec<u64>,
) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let task = &ctx.accounts.task;
    let task_key = task.key();
    let creator = task.creator;
    let nonce_bytes = task.nonce.to_le_bytes();
    let bump = [task.bump];
    let seeds: &[&[u8]] = &[TASK_SEED, creator.as_ref(), &nonce_bytes, &bump];
    let signer = &[seeds];
    // The vault also holds entry stakes; only the reward is paid out here.
    let reward = task.reward;
    let keep_vault_open = task.stakes_outstanding > 0;
    let remaining = ctx.remaining_accounts;

    require!(
        remaining.len() == winners.len() * 3,
        WukongError::PodiumAccountMismatch
    );

    let transfer = |to: AccountInfo<'info>, amount: u64| -> Result<()> {
        vault_transfer(
            &ctx.accounts.token_program,
            &ctx.accounts.vault,
            &ctx.accounts.mint,
            &ctx.accounts.task,
            to,
            amount,
            signer,
        )
    };

    let mut fee = 0u64;
    let mut refunded = 0u64;
    let mut paid_total = 0u64;
    let mut winner_keys = Vec::with_capacity(winners.len());
    let mut amounts = Vec::with_capacity(winners.len());

    if winners.is_empty() {
        // Nothing cleared the quality bar: the buyer gets their money back.
        refunded = reward;
        transfer(ctx.accounts.creator_token.to_account_info(), refunded)?;
    } else {
        fee = (reward as u128 * task.fee_bps as u128 / BPS as u128) as u64;
        let pool = reward - fee;
        let mut payouts: Vec<u64> = shares
            .iter()
            .map(|s| (pool as u128 * *s as u128 / BPS as u128) as u64)
            .collect();
        let dust = pool - payouts.iter().sum::<u64>();
        payouts[0] += dust;

        transfer(ctx.accounts.treasury_token.to_account_info(), fee)?;

        for (place, entry) in winners.iter().enumerate() {
            let sub_info = &remaining[place * 3];
            let token_info = &remaining[place * 3 + 1];
            let rep_info = &remaining[place * 3 + 2];

            let mut sub: Account<'info, Submission> = Account::try_from(sub_info)?;
            require_keys_eq!(sub.key(), entry.submission, WukongError::PodiumAccountMismatch);
            require_keys_eq!(sub.task, task_key, WukongError::PodiumAccountMismatch);

            let token: InterfaceAccount<'info, TokenAccount> = InterfaceAccount::try_from(token_info)?;
            require_keys_eq!(token.owner, entry.worker, WukongError::PodiumAccountMismatch);
            require_keys_eq!(token.mint, task.mint, WukongError::PodiumAccountMismatch);

            let mut rep: Account<'info, Reputation> = Account::try_from(rep_info)?;
            require_keys_eq!(rep.worker, entry.worker, WukongError::PodiumAccountMismatch);

            let amount = payouts[place];
            transfer(token_info.clone(), amount)?;

            sub.rank = (place + 1) as u8;
            sub.payout = amount;
            sub.exit(&crate::ID)?;

            if place == 0 {
                rep.wins = rep.wins.saturating_add(1);
            }
            rep.podiums = rep.podiums.saturating_add(1);
            rep.total_earned = rep.total_earned.saturating_add(amount);
            rep.rating = rep.rating.saturating_add(PLACE_BONUS[place]);
            rep.last_active = now;
            rep.exit(&crate::ID)?;

            paid_total += amount;
            winner_keys.push(entry.worker);
            amounts.push(amount);
        }
    }

    if !keep_vault_open {
        let treasury = ctx.accounts.treasury_token.to_account_info();
        let creator_info = ctx.accounts.creator.to_account_info();
        sweep_and_close_vault(
            &ctx.accounts.token_program,
            &mut ctx.accounts.vault,
            &ctx.accounts.mint,
            &ctx.accounts.task,
            treasury,
            creator_info,
            signer,
        )?;
    }

    let config = &mut ctx.accounts.config;
    config.total_escrowed = config.total_escrowed.saturating_sub(reward);
    config.total_paid = config.total_paid.saturating_add(paid_total);

    let task = &mut ctx.accounts.task;
    task.status = TaskStatus::Settled;
    task.paid_out = paid_total;
    task.fee_paid = fee;
    task.settled_at = now;

    emit!(TaskSettled {
        task: task_key,
        winners: winner_keys,
        amounts,
        fee,
        refunded,
    });
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,
        payer = admin,
        space = 8 + Config::INIT_SPACE,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, Config>,
    pub mint: InterfaceAccount<'info, Mint>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    pub admin: Signer<'info>,
    #[account(mut, seeds = [CONFIG_SEED], bump = config.bump, has_one = admin)]
    pub config: Account<'info, Config>,
}

#[derive(Accounts)]
#[instruction(nonce: u64)]
pub struct CreateTask<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(mut, seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Box<Account<'info, Config>>,
    #[account(
        init,
        payer = creator,
        space = 8 + Task::INIT_SPACE,
        seeds = [TASK_SEED, creator.key().as_ref(), &nonce.to_le_bytes()],
        bump
    )]
    pub task: Box<Account<'info, Task>>,
    #[account(address = config.mint @ WukongError::WrongMint)]
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        init,
        payer = creator,
        seeds = [VAULT_SEED, task.key().as_ref()],
        bump,
        token::mint = mint,
        token::authority = task,
        token::token_program = token_program
    )]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        mut,
        token::mint = mint,
        token::authority = creator,
        token::token_program = token_program
    )]
    pub creator_token: Box<InterfaceAccount<'info, TokenAccount>>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitWork<'info> {
    #[account(mut)]
    pub worker: Signer<'info>,
    #[account(
        mut,
        seeds = [TASK_SEED, task.creator.as_ref(), &task.nonce.to_le_bytes()],
        bump = task.bump
    )]
    pub task: Box<Account<'info, Task>>,
    #[account(
        init,
        payer = worker,
        space = 8 + Submission::INIT_SPACE,
        seeds = [SUBMISSION_SEED, task.key().as_ref(), worker.key().as_ref()],
        bump
    )]
    pub submission: Box<Account<'info, Submission>>,
    #[account(
        init_if_needed,
        payer = worker,
        space = 8 + Reputation::INIT_SPACE,
        seeds = [REPUTATION_SEED, worker.key().as_ref()],
        bump
    )]
    pub reputation: Box<Account<'info, Reputation>>,
    /// Stake accounts: required only when the task has an entry stake.
    pub mint: Option<Box<InterfaceAccount<'info, Mint>>>,
    #[account(mut)]
    pub vault: Option<Box<InterfaceAccount<'info, TokenAccount>>>,
    #[account(mut)]
    pub worker_token: Option<Box<InterfaceAccount<'info, TokenAccount>>>,
    pub token_program: Option<Interface<'info, TokenInterface>>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CloseSubmissions<'info> {
    pub authority: Signer<'info>,
    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Box<Account<'info, Config>>,
    #[account(
        mut,
        seeds = [TASK_SEED, task.creator.as_ref(), &task.nonce.to_le_bytes()],
        bump = task.bump
    )]
    pub task: Box<Account<'info, Task>>,
}

#[derive(Accounts)]
pub struct ScoreSubmission<'info> {
    pub judge: Signer<'info>,
    #[account(seeds = [CONFIG_SEED], bump = config.bump, has_one = judge @ WukongError::NotJudge)]
    pub config: Box<Account<'info, Config>>,
    #[account(
        mut,
        seeds = [TASK_SEED, task.creator.as_ref(), &task.nonce.to_le_bytes()],
        bump = task.bump
    )]
    pub task: Box<Account<'info, Task>>,
    #[account(
        mut,
        seeds = [SUBMISSION_SEED, task.key().as_ref(), submission.worker.as_ref()],
        bump = submission.bump,
        has_one = task
    )]
    pub submission: Box<Account<'info, Submission>>,
    #[account(
        mut,
        seeds = [REPUTATION_SEED, submission.worker.as_ref()],
        bump = reputation.bump
    )]
    pub reputation: Box<Account<'info, Reputation>>,
}

#[derive(Accounts)]
pub struct Settle<'info> {
    /// Anyone may crank `settle`; `settle_pick` requires the creator.
    pub cranker: Signer<'info>,
    #[account(mut, seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Box<Account<'info, Config>>,
    #[account(
        mut,
        seeds = [TASK_SEED, task.creator.as_ref(), &task.nonce.to_le_bytes()],
        bump = task.bump
    )]
    pub task: Box<Account<'info, Task>>,
    #[account(
        mut,
        seeds = [VAULT_SEED, task.key().as_ref()],
        bump = task.vault_bump,
        token::mint = mint,
        token::authority = task,
        token::token_program = token_program
    )]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(address = task.mint)]
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        mut,
        token::mint = mint,
        token::authority = config.treasury,
        token::token_program = token_program
    )]
    pub treasury_token: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        mut,
        token::mint = mint,
        token::authority = task.creator,
        token::token_program = token_program
    )]
    pub creator_token: Box<InterfaceAccount<'info, TokenAccount>>,
    /// CHECK: receives the vault's rent; pinned to the task creator.
    #[account(mut, address = task.creator)]
    pub creator: UncheckedAccount<'info>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct ClaimStake<'info> {
    pub cranker: Signer<'info>,
    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Box<Account<'info, Config>>,
    #[account(
        mut,
        seeds = [TASK_SEED, task.creator.as_ref(), &task.nonce.to_le_bytes()],
        bump = task.bump
    )]
    pub task: Box<Account<'info, Task>>,
    #[account(
        mut,
        seeds = [SUBMISSION_SEED, task.key().as_ref(), submission.worker.as_ref()],
        bump = submission.bump,
        has_one = task
    )]
    pub submission: Box<Account<'info, Submission>>,
    #[account(
        mut,
        seeds = [VAULT_SEED, task.key().as_ref()],
        bump = task.vault_bump,
        token::mint = mint,
        token::authority = task,
        token::token_program = token_program
    )]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(address = task.mint)]
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    /// Required only when the stake is refunded (checked in the handler).
    #[account(mut)]
    pub worker_token: Option<Box<InterfaceAccount<'info, TokenAccount>>>,
    #[account(
        mut,
        token::mint = mint,
        token::authority = config.treasury,
        token::token_program = token_program
    )]
    pub treasury_token: Box<InterfaceAccount<'info, TokenAccount>>,
    /// CHECK: receives the vault's rent when the last stake settles.
    #[account(mut, address = task.creator)]
    pub creator: UncheckedAccount<'info>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct CancelTask<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(mut, seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Box<Account<'info, Config>>,
    #[account(
        mut,
        seeds = [TASK_SEED, task.creator.as_ref(), &task.nonce.to_le_bytes()],
        bump = task.bump,
        has_one = creator
    )]
    pub task: Box<Account<'info, Task>>,
    #[account(
        mut,
        seeds = [VAULT_SEED, task.key().as_ref()],
        bump = task.vault_bump,
        token::mint = mint,
        token::authority = task,
        token::token_program = token_program
    )]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(address = task.mint)]
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        mut,
        token::mint = mint,
        token::authority = creator,
        token::token_program = token_program
    )]
    pub creator_token: Box<InterfaceAccount<'info, TokenAccount>>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[cfg(test)]
mod tests {
    use super::*;

    fn entry(score: u16, index: u16) -> PodiumEntry {
        PodiumEntry {
            worker: Pubkey::new_unique(),
            submission: Pubkey::new_unique(),
            score,
            index,
            filled: true,
        }
    }

    #[test]
    fn podium_orders_by_score_then_index() {
        let mut podium = [PodiumEntry::default(); 3];
        for e in [entry(7000, 0), entry(9000, 1), entry(7000, 2), entry(8000, 3), entry(9000, 4)] {
            insert_podium(&mut podium, e);
        }
        let got: Vec<(u16, u16)> = podium.iter().map(|e| (e.score, e.index)).collect();
        assert_eq!(got, vec![(9000, 1), (9000, 4), (8000, 3)]);
    }

    #[test]
    fn shares_roll_up_unclaimed_places() {
        assert_eq!(split_shares(PayoutMode::TopThree, 3), vec![5000, 3000, 2000]);
        assert_eq!(split_shares(PayoutMode::TopThree, 2), vec![7000, 3000]);
        assert_eq!(split_shares(PayoutMode::TopThree, 1), vec![10000]);
        assert_eq!(split_shares(PayoutMode::WinnerTakesAll, 3), vec![10000]);
        assert!(split_shares(PayoutMode::TopThree, 0).is_empty());
    }
}
