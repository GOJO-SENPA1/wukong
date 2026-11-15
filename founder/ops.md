# Operations

Built from `idea.md`, `offer.md`, `numbers.json`, and the repo's own `docs/DEPLOY.md`, `docs/LAUNCH.md` and `docs/SECURITY.md`. No supplier price was looked up for this document: prices change, and where a number is missing it says so. The CFO's $60 a month for infrastructure is an **estimate**.

## 1. The daily cycle (what has to happen every day)

For a pilot task, from first thing to last (steps a customer sees are marked ★):

1. Check the site and `/status` load; check the keeper ran (it closes tasks at their deadline, judges, settles, handles pick timeouts).
2. Read the overnight inbox: replies from leads, support, appeals.
3. ★ Onboard a new organisation: approve its sign-in email (organisations join by invitation, per `docs/LAUNCH.md`).
4. ★ Write the task with the buyer: a rubric from the template, a reward, a deadline. Buyer approves before posting.
5. ★ Fund the escrow (for pilots, the founder funds from the pilot budget).
6. ★ Entries arrive (sealed, committed on-chain by hash).
7. ★ Deadline: the keeper closes, the judge scores, every entry gets a public score and a written reason.
8. ★ Settlement pays the podium; the buyer gets the results email.
9. Review the judge's reports for the tasks that settled (spot check; this is the human review the board and panel asked for).
10. ★ Answer any appeal from a losing entrant in writing within 48 hours.
11. Log what went wrong and fix the template or rubric.

## 2. Suppliers (every input the product needs)

All are named in the repo's own deployment docs. **Check each current plan and price on its own page before relying on it.**

| need | supplier named in the docs | alternatives | notes |
| --- | --- | --- | --- |
| Web hosting and functions | [Vercel](https://vercel.com) | Fly.io container (`fly.toml` exists) | On the free Hobby plan the keeper cron runs once a day; exact timing needs a paid cron or an external scheduler such as cron-job.org with the `CRON_SECRET` header (`docs/DEPLOY.md`) |
| Database | [Supabase](https://supabase.com) | any Postgres | Accounts, profiles, notifications |
| Content store (briefs, entries, reports) | [Upstash](https://upstash.com) Redis | the Fly volume | The README's own roadmap item: content should move to Arweave/IPFS so it survives the operator |
| Sign-in and wallets | [Privy](https://privy.io) | wallet adapter only | Email and Google sign-in create a wallet for new users, so workers do not need a seed phrase; buyers still have to hold USDC |
| Email | [Resend](https://resend.com) for app emails; Zoho Mail, Google Workspace or Cloudflare Email Routing for a real inbox | | Needed so replies to outreach come from a real address |
| Solana RPC | the docs suggest Helius, Triton or QuickNode free tiers | | The public endpoint rate-limits a judging run |
| Judge model | Anthropic API, or any OpenAI-compatible model (the benchmark used DeepSeek V4.1 Flash through a provider called Command Code) | | **Decide which one runs in production and write it down:** the README says `claude-opus-5-5` is the default and the published results are DeepSeek's |
| Domain | already owned: `wukonghq.xyz` | | |
| Security audit | **none yet** | see `cfo.md` ($15,000 placeholder, get three quotes) | The biggest cost and the most requested trust signal |

## 3. People

One person today. A weekly rota for the planned volume:

- **Founder (Ansh), part-time:** daily check (30 min), outreach and pilot setup (the main time sink), appeals and judge-report review (about 15 minutes per task, the CFO's $1.00 line).
- **At 12 tasks a day** (the month-12 plan) that review alone is about 3 hours a day, which does not fit alongside a part-time job. **The review step has to be partly automated, or the volume plan changes.** This is the most important operational finding in the pack.
- Wage assumption: the CFO carries a $1,000 monthly founder stipend as an assumption, not a decision. Employer costs beyond wages vary by country: an accountant's job.

## 4. Routines (one page each)

**Onboard an organisation.** 1) Email thread shows interest and a real person. 2) Add their sign-in email to the approvals (Supabase `CompanyInvite` row). 3) They sign in at `/business`, set up the organisation. 4) Send the rubric template for their task type. 5) Agree reward and deadline in writing. 6) Post, fund, and send them the task link.

**Run a pilot task.** 1) Pick one of the existing categories (Copy, Translation, Code, Data labeling, Research). 2) Write the rubric from the template; the buyer approves. 3) Fix every hard requirement as a check code can measure (word limits, required phrases, language). 4) Post with a deadline of 5-7 days. 5) After judging, read every report, not only the winner's. 6) Send the buyer the results and ask three questions: was the winner usable, would you pay for the next one, what would you change.

**Handle a complaint or appeal.** 1) Acknowledge within one working day. 2) Re-read the entry and the judge's quoted evidence. 3) Reply with a written reason: upheld, or re-judged with what changed. 4) Log it. 5) If the judge was wrong, add the case to the benchmark.

**Weekly.** Review keeper logs, the status page, judge cost, and rotate nothing that is not due. Reorder nothing physical: there is no inventory.

## 5. Tools

The smallest set that runs it, all already in the repo: the app (`npm run start:prod`), the keeper, `npm run judge:bench` for regression checks, and the outreach tool already in use. Add a shared inbox address before more outreach goes out.

## 6. Licences, permits and insurance: check before real money

**The honest summary: this is a money-handling product, and the rules depend on the country, who holds the funds, and whether fiat is involved.** The program (not the company) holds the escrow, which helps, but it does not remove the questions. Each item is something to confirm with the authority or a professional, not a conclusion:

- [ ] **Where the company is formed and who the legal owner is** (no entity exists yet, per the CFO's startup line).
- [ ] **Whether operating the platform is a regulated money-handling business** in the countries you operate in or serve. In the US that is FinCEN's rules for money services businesses ([fincen.gov](https://www.fincen.gov)); other countries have their own regulators. A fiat on-ramp or invoicing buyers in dollars raises this question sharply (see `offer.md` section 6).
- [ ] **Sanctions and know-your-customer rules** for payers and payees, particularly for payouts to individuals across borders.
- [ ] **Tax:** reporting of payouts to workers, sales or VAT on the fee, and tax treatment of USDC held by the company. Revenue in the CFO model is before tax.
- [ ] **Terms of service, privacy policy and data protection** (EU and UK rules apply if anyone there signs in). Briefs and entries can contain personal data.
- [ ] **Intellectual property:** who owns an entry? The terms must say. Submissions are scored by a third-party AI model, so the privacy policy must say entries are sent to it.
- [ ] **Professional indemnity or business insurance** (an insurance broker can say whether a crypto product is insurable).
- [ ] **Trademark clearance** for the name (see `brand.md`).

## 7. Risk register (the ten most likely things to go wrong)

| # | risk | likelihood | how bad | plan |
| --- | --- | --- | --- | --- |
| 1 | No outside organisation ever funds a task | high | fatal | the launch test in `launch.md`; kill or pivot at the review date |
| 2 | Real money goes in before an independent audit | medium | severe | cap every escrow at 100 USDC until the audit; no mainnet before then. The repo's own `docs/SECURITY.md` describes two internal adversarial reviews and a long list of fixes, but **no independent auditor is named**, so treat the program as unaudited |
| 3 | The judge scores a task wrongly and a buyer or loser disputes it | medium | trust damage | written reason on every entry, 48-hour human appeal, add each miss to the benchmark; the known gap is paraphrased copies |
| 4 | The judge key or the judge model goes dark | low-medium | funds wait | the program's `expire_judging` returns the reward to the buyer 7 days after close if entries are unscored (`docs/SECURITY.md`); the single judge key is still a single point of failure. Multi-oracle is the program's own next version |
| 5 | The keeper does not run on time (Hobby-plan cron runs daily) | high on the free plan | late settlement | paid cron or an external scheduler every minute with the secret |
| 6 | Secrets leak or were exposed (the security page says two were pasted into chat and must be rotated) | medium | severe | rotate them now; keys only in the host's env, never in chat or git |
| 7 | Spam and AI-slop entries flood a task | medium | quality and cost | entry stakes (slashed under score 20), the injection scanner, an entry cap of 256, review of the first tasks by hand |
| 8 | A buyer cannot pay (no wallet, no USDC) | **very high, it is the panel's top blocker** | lost deals | founder-funded pilots now; a card or invoice route needs building and a legal check |
| 9 | A key person is unavailable (it is one person) | medium | everything stops | a written runbook, a second admin key holder using a multisig, and a status page note |
| 10 | Outreach damages the brand again (invented sender names, no website) | was real | trust | fixed template, real name, site in line one, one-click opt-out |

Real costs found while writing this go back to `numbers.json`. Nothing here changed a number, but the review time at volume (section 3) may: if the CFO's $1.00 review line cannot hold at 12 tasks a day, re-run `/founder-cfo` with the real figure.
