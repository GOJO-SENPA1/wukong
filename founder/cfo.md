# CFO's note

**The margin.** Each settled task leaves **$1.80** after its own costs (60% of the $3.00 fee). At the plan volume of 12 tasks a day the margin is **-38%**, because fixed costs of $1,060 a month need **20 tasks a day** to cover, and year 1 only gets to 12 a day by month 12.

**The line to watch: the fee per task.** $3.00 comes from a 10% fee on a $30 reward, the size the buyer panel found comfortable. That is very little revenue per task, so everything else (a $1,000 stipend, a $15,000 audit) is out of proportion to it. The human review and appeals line ($1.00, a third of the fee) is the largest variable cost, and it is a cost the product does not have today but the board and the panel both asked for.

**Cash.** The base case needs **$27,655** before it pays for itself. Without the founder stipend that drops to **$17,443**. Without the audit it drops to **$12,655**. Neither is earned back in year 1.

**Three ways to improve the margin (each measured with the tool, not guessed):**
1. **Bigger average reward, $60 instead of $30** (fee $6.00): margin at plan **+31%**, break-even **8 tasks a day**, year 1 operating loss shrinks from $10,355 to $6,413. This means selling a different, larger kind of task than the panel's price curve supports, so it must be tested.
2. **Fee of 15% instead of 10%** (fee $4.50 on a $30 reward): margin **+8%**, break-even **11 a day**. Fiverr's combined take is about 25% and Topcoder's about 20%, but Superteam Earn appears to charge nothing, so this is not free of risk.
3. **No stipend** (the founder works unpaid, as today): margin **+54%**, break-even **2 a day**, year 1 operating profit **+$1,645**. This is the honest shape of the business today: it covers its hosting but not a person.

**The board's money conditions** (`board.md`): the audit is in the startup spend; a participation floor for non-winners and the cost of a buyer guarantee are **not** modelled and would lower every number above.

Nothing here is financial, tax or legal advice. An accountant should check the structure, payroll and tax before money moves. All inputs and which are estimates: `cfo-sources.md`.

---

# Unit economics: Wukong (platform fee on settled tasks)

Every number below comes from the input file. Nothing is looked up or guessed.

## One settled task

| line | per settled task |
| --- | ---: |
| Price | $3.00 |
| AI judge inference (about 10 entries x 3 samples) | -$0.10 |
| Solana transactions and RPC share | -$0.08 |
| Emails and notifications | -$0.02 |
| Human review and appeals (avg minutes per task) | -$1.00 |
| **Contribution** (what each settled task leaves to pay the fixed costs) | **$1.80** (60%) |

## The margin that matters

Fixed costs: $1,060 a month (Hosting, database, RPC, email, domain $60, Founder stipend (assumption, set to 0 to see the no-salary case) $1,000).

- **Break-even: 20 settled tasks a day.** Below that you lose money every month.
- **Profit margin at your plan** (12 a day): **-38%** of every sale, after every cost.
- Capacity: 200 a day.

## Year 1, month by month

| month | settled tasks a day | revenue | profit | cumulative (after $17,300 startup) |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 0 | $18 | -$1,049 | -$18,349 |
| 2 | 0 | $27 | -$1,044 | -$19,393 |
| 3 | 0 | $45 | -$1,033 | -$20,426 |
| 4 | 1 | $72 | -$1,017 | -$21,443 |
| 5 | 1 | $108 | -$995 | -$22,438 |
| 6 | 2 | $162 | -$963 | -$23,401 |
| 7 | 2 | $225 | -$925 | -$24,326 |
| 8 | 4 | $315 | -$871 | -$25,197 |
| 9 | 5 | $450 | -$790 | -$25,987 |
| 10 | 7 | $630 | -$682 | -$26,669 |
| 11 | 9 | $810 | -$574 | -$27,243 |
| 12 | 12 | $1,080 | -$412 | -$27,655 |

- **Year 1 operating profit: -$10,355** on $3,942 of revenue.
- After the $17,300 startup spend: -$27,655.
- Startup money earned back: not within year 1.
- Cash you need before it pays for itself: **$27,655**.

## What if

| scenario | margin at plan | break-even a day | year 1 profit |
| --- | ---: | ---: | ---: |
| Base plan | -38% | 20 | -$10,355 |
| Price -10% | -53% | 24 | -$10,749 |
| Volume -20% | -63% | 20 | -$10,828 |
| Unit costs +15% | -44% | 22 | -$10,591 |

## Red flags

- Year 1 loses money on operations (-$10,355).
- The startup spend is not earned back within year 1.
