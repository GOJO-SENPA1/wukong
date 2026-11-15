# CFO sources and estimates

Every number in `numbers.json`, and where it comes from. **"Estimate" means nothing here has been checked against a quote or an invoice.**

| input | value | source |
| --- | --- | --- |
| price per unit (the fee) | $3.00 | **Derived.** Program default fee is 10% (`scripts/setup.ts`, `--fee-bps` default 1000, admin-settable, capped at 20% in the program). The reward is the buyer's choice. $30 is assumed as the typical reward: near the panel's "bargain" point of about $25 and its all-in sweet spot of about $30 (`pricing-curve.md`). Fee = 10% x $30. |
| judge inference | $0.10 | **Estimate.** The benchmark README gives about 0.0009 "Command Code credits" per judge request. How many dollars a credit is worth was not found, so $0.10 for about 30 requests per task is a deliberately generous round number. |
| Solana transactions and RPC | $0.08 | **Estimate.** One score transaction per entry plus settlement, at base fees of fractions of a cent each, plus a share of an RPC plan. Account rent is mostly refundable and not counted. |
| emails and notifications | $0.02 | **Estimate.** Resend free/low tier spread over tasks. |
| human review and appeals | $1.00 | **Estimate, and the most important one.** The board and the buyer panel both asked for a written reason for every loser and a human appeal path. About 15 minutes a task at a low hourly rate. This is a cost that does not exist in the repo today. |
| hosting, database, RPC, email, domain | $60 / month | **Estimate.** The docs (`docs/DEPLOY.md`, `docs/LAUNCH.md`) use Vercel, Supabase, Upstash Redis, Privy, Resend. Early free tiers may make it lower; paid tiers for real traffic make it higher. Check current plans. |
| founder stipend | $1,000 / month | **Assumption.** There is no salary today. The model includes a modest one on purpose, because a plan with a zero-cost founder hides the real break-even. Set it to 0 to see the no-salary case. |
| security audit | $15,000 | **Estimate. No reliable price was found** in one search (results were vendor marketing). Get at least three quotes. The board (Product lens) and four of the panel's "what would flip a no" answers name an independent audit. |
| legal entity and terms | $1,000 | **Estimate.** Varies by country. Ask an accountant. |
| mainnet deploy | $500 | **Estimate.** |
| pilot rewards | $300 | **Derived.** 10 tasks x $30 funded by the founder. |
| launch marketing | $500 | **Estimate.** |
| ramp (tasks per day, months 1-12) | 0.2 to 12 | **Assumption.** Month 1 is about 6 tasks, mostly founder-funded pilots. Month 12 is 12 tasks a day (about 360 a month). Sanity check against the panel: 5 of 40 simulated buyers say yes, all only to the free pilot, and the skill says to treat that rate as an upper bound. So the ramp does not assume organic paying demand early. |
| capacity | 200 / day | **Assumption.** Not a hard limit; the judge and chain scale far past this. |

Revenue is before tax. Not financial, tax or legal advice: an accountant should check the structure, payroll and tax before money moves.
