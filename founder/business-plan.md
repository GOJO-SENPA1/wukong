# Wukong · Business plan

**Verdict: Not yet**

- ✓ Each settled task earns $1.80 before fixed costs (60% contribution).
- ✗ Year 1 operating LOSS: $10,355.
- ✓ Break-even is 20 settled tasks a day against a capacity of 200.
- ✗ 4 of 20 simulated buyers buy (20%, the bar is 25%).

| key number | |
| --- | ---: |
| Price | $3.00 a settled task |
| Profit margin at plan | -38% per settled task |
| Break-even | 20 settled tasks a day |
| Year 1 operating profit | $-10,355 |
| Startup spend | $17,300 |
| Cash needed before it pays for itself | $27,655 |
| Startup money earned back | not in year 1 |
| Buyer panel | 4 buy · 16 pass |

## The idea

- What it is: A competitive work marketplace on Solana. A buyer posts a task and locks the USDC reward in an on-chain escrow before anyone starts; many workers submit sealed entries; an AI judge scores every entry against a public rubric and publishes each score on-chain; the program pays the top entries (winner-takes-all or 50/30/20) and builds each worker a portable on-chain reputation. AI agents can also post and pay for tasks over x402.
- Who it is for: Two sides. BUYERS: organisations and small teams that buy small, measurable tasks (copy with word limits and banned phrases, translation, code with tests, data labeling, structured research). WORKERS: freelancers and students who want to be paid for quality and build a verifiable record of real work.
- What it sells, at what price: Buyers pay the reward they choose (the demo hero task is 50 USDC) plus a platform fee taken from the reward (program default 10%, set by the admin, capped at 20% in the program). Workers enter free; some tasks add a refundable entry stake (e.g. 1 USDC) that is slashed only for spam.
- Where and how: Online, global. Web app at wukonghq.xyz (sign-in with email, Google or a Solana wallet via Privy; freelancers self-sign-up, organisations join by invitation). Open source (MIT), Anchor program, Next.js app, keeper, x402 gateway, Solana Blinks. Per the repo's own docs the deployed program is on devnet with demo USDC; mainnet is not launched and the program is not audited.
- Budget and constraints: One founder (Ansh), part-time, about 3 days of work so far, no revenue, no funding, no paying customers. Applying to the Colosseum accelerator and grants. Judge model is configurable (Claude, or any OpenAI-compatible model such as DeepSeek V4.1 Flash).

### Evidence so far (facts, not opinions)
- WukongBench (98 entries, 10 tasks, 25 prompt-injection attacks incl. 10 held-out, 11 innocent look-alikes), DeepSeek V4.1 Flash with the Wukong pipeline: 96.5% of pairs ranked correctly (bare model 90.0%), 25/25 attacks caught, 0/11 false alarms, 97.4% of published scores backed by a verified quote. Dataset written by the same team; tuned on this benchmark; judge misses sentence-by-sentence paraphrase copies.
- Cold outreach by email (Explee tool) in mid-October 2026: 19 replies. Roughly 7 positive ("send them over"): a college-career-club author (wants student "micro-internships" with a certificate), a Web3/AI community CEO in South Africa (chose "event explainers"), an artwork marketplace, an AI fashion studio, a collectibles app, a native-ads company, a launch-directory founder. Two design agencies pushed back hard on contest/spec work ("what becomes of the losers?", "not interested in working for free"). One UX consultant doubted legitimacy (no website visible in the cold email, unclear payment model). Several replies were out-of-office or "not interested". The cold emails went out under made-up sender names from separate sending domains, which caused confusion.
- No real task has been posted by an outside organisation yet.

## Summary

**What it is.** Wukong is a work marketplace on Solana: a buyer locks a reward in escrow, many people enter, an AI judge scores every entry in public against a rubric, and the program pays the top entries. It is for people who buy small, measurable tasks (copy, translation, labeling, small code) and for workers who want a verified record of real work.

**The verdict is "Not yet."** It is computed from the numbers, not written by hand. Two checks fail:
- **Year 1 loses money: -$10,355** on $3,942 of revenue, because the fee is about **$3.00** a task (10% of a $30 reward) and fixed costs of $1,060 a month need **20 settled tasks a day** to cover. The plan reaches 12 a day by month 12. The margin at plan is **-38%**.
- **Only 4 of 20 simulated buyers would try it (20%, the bar is 25%)**, and all four said yes **only to the free first task**. Across the first, larger panel of 40, it was 5 of 40 (12.5%). None would pay.

**What changes that.** The product is not the weak part: the judge's public benchmark is the best asset. The weak parts are (1) the size of the task, which makes a 10% fee tiny, (2) **payment**: 14 of the 16 simulated buyers who passed said card or invoice in dollars was the one thing that would flip them, and (3) trust: no audit, no references, no customers. With **no founder stipend**, the business covers its own costs (+$1,645 operating in year 1, break-even 2 tasks a day), which is its honest shape today.

**What the board and panel agreed and disagreed on.** The board voted 2 "fund if" and 1 "pass" (average 3.7 of 10). All three said: no outside organisation has funded a task, and most entrants work unpaid. They disagreed on the verdict: one lens passes because nothing here is defensible yet, the other two see a clear promise worth testing. The panel and the October inbox agree on who is receptive: web3 and community operators and education organisers, not design agencies.

**The biggest risk and what will be done.** Nobody has paid for a task. The plan answers it with one test: **six warm leads each get a real, founder-funded task** (success line: 3 run one, 2 call the winner usable, 1 agrees to pay for a second), reviewed on 21 December. A second risk is the name: public searches show a pending WUKONG software-services trademark filing and several other WUKONG and BLACK MYTH WUKONG marks, so get a professional clearance search before mainnet.

**What the founder needs to start.** About **$27,655** in the base case (**$17,443** without a stipend, **$12,655** without the audit), mostly the $15,000 audit estimate (no reliable price was found; get three quotes). The first test costs about **$300** of pilot rewards.

**The one thing to do this week.** Change the outreach template (real name, the site in line one, the payment catch) and send the three-idea replies to the six warm leads on Monday 16 November.

*The panel is simulated buyers and the numbers are projections built on estimates listed in `cfo-sources.md`; real customers and real quotes confirm them. Not financial, legal or tax advice.*

## What the board said

**Vote: 2 FUND IF, 1 PASS. Average score 3.7 / 10** (Offers 4, Monopoly 3, Product 4).
The lenses apply published frameworks; they are not those authors and none of this is their opinion. A PASS is a result, not a failure.

### Risks more than one member raised (these go first)

1. **No outside organisation has posted or funded a task.** All three. The ~7 positive replies are curiosity, not demand. The money step has only run on devnet with demo USDC and an unaudited program.
2. **Spec work: most entrants work for free.** All three. Two design agencies said so bluntly. Worker economics are the sharpest threat to supply, and supply is what makes the buyer's offer work.
3. **Cold start on both sides, with no named channel for the first buyers or workers.** Offers and Monopoly. Neither side is anchored.
4. **Trust and legitimacy at first contact.** Offers and Product. Invented sender names and no website in the first email made a recipient doubt it was real.
5. **Judge trust is unproven outside the team's own data.** All three. The benchmark was written and tuned by the team, and paraphrase copies get through. There is no appeal path for a loser.
6. **Cheap alternatives and no moat.** Offers and Monopoly. Fiverr-style hiring, bounty sites, or a model used directly cost less effort. The code is MIT, so a copycat with distribution can fork it.

### Where the members disagreed (kept on purpose)

- **Verdict:** the Monopoly lens passes because nothing is defensible yet and the segment that works (measurable tasks) is also where cheap AI competes. The Offers and Product lenses see a clear promise worth testing, so they vote FUND IF. They agree the evidence is not there yet.
- **Biggest killer:** Offers puts worker economics first, Monopoly puts distribution and moat first, Product puts the unproven first five minutes and the wallet barrier first.

### Conditions, merged (the rest of the pack tests what it can)

- [ ] 3+ outside organisations post real, funded tasks, with at least one repeat (Offers); 10+ in one niche to revisit the PASS (Monopoly). *Tested by: /founder-launch.*
- [ ] Timed, observed first sessions for a buyer and a worker; a buyer posts and funds in under 5 minutes without owning a wallet (Product). *Tested by: /founder-ops, /founder-launch.*
- [ ] Worker earnings data and a floor that students would accept, such as a participation payment or smaller entry pools (Offers). *Tested by: /founder-offer, /founder-cfo.*
- [ ] A written buyer guarantee with a refund or re-run rule, and a human appeal path for every loser, with a written reason (Offers, Product). *Tested by: /founder-offer.*
- [ ] Independent judge test on data the team did not write, covering the paraphrase gap (all three). *Not testable inside this pack.*
- [ ] A narrow first niche with a named, reachable buyer group (Offers, Monopoly). *Tested by: /founder-consumer, /founder-marketing.*
- [ ] A real sender identity and a visible website in all outreach (Offers, Product). *Tested by: /founder-marketing.*
- [ ] Audit, or capped small escrows, before real money on mainnet (Product). *Tested by: /founder-ops.*
- [ ] An asset a fork cannot copy: proprietary judging data, a reputation record buyers rely on, or an exclusive supply of workers (Monopoly). *Tested by: /founder-marketing, /founder-plan.*

### The strongest version the board can see

Not "a marketplace for any measurable work." The board's own conditions point to a narrower business: **a verified-work engine for one buyer group where the format fits, with the worker problem solved by design.** Student and early-career "micro-internships" are the strongest candidate in the evidence so far. One lead already asked for it, the worker side comes with the buyer (a career-centre or community that has students), losers get coaching and a record that has value to them even when they don't win, and the tasks (event explainers, localization, constrained copy, labeling) are exactly what the judge is best at. The buyer side is then companies or community organisations posting small funded tasks, not design agencies. This differs from the pitch ("any measurable work, anyone, anywhere") and the board says so plainly: the broad version has no moat and no distribution, and the narrow one might.

Open questions the other skills answer: market size and who else is there (`/founder-competitors`, done), whether buyers would actually buy (`/founder-consumer`), the real price and fee (`/founder-pricing`, `/founder-cfo`).

## The competition

Researched 2026-11-15 from public pages. **Every figure below is tagged by how well it is sourced.** Where search results conflicted, both numbers are shown. Nothing here was scraped. I did not read competitors' own homepages, so the positioning-line column in the CSV is "not fetched" rather than guessed, and ratings/review counts were not collected beyond one Trustpilot page title.

### The table (sorted by how directly each competes)

| Competitor | Type | How it works | Cost to the buyer / take (sourcing) |
|---|---|---|---|
| [99designs](https://99designs.com) | Direct | Designers compete, buyer picks | Logo packages $249 / $399 / $799 / $1,050 ([one review site](https://www.hireinsouth.com/post/99designs-pricing)); the [official Swiss page](https://en.99designs.ch/pricing) shows CHF 279 / 469 / 839 / 1,199 |
| [Topcoder](https://www.topcoder.com) | Direct | Crowd challenges, 1-5 prizes | Admin fee 20% of prize capped at $250 per [one aggregator](https://us.fitgap.com/products/057877/topcoder) (unverified) |
| [Kaggle commercial](https://www.kaggle.com) | Direct | Many teams on a scored leaderboard | $85k-$200k typical per an [unofficial copy of Kaggle's FAQ](https://www.scribd.com/document/669755793/kaggle) (unverified) |
| [Superteam Earn](https://earn.superteam.fun) | Direct (same chain) | Sponsors post bounties, review, pick winners; USDC | No fee mentioned in its [official FAQ](https://docs.superteam.fun/the-superteam-handbook/community/faqs/superteam-earn-faq); a [rival's blog](https://streamflow.finance/blog/streamflow-vs-superteam-earn) says zero commission (secondhand) |
| [Algora](https://algora.io/pricing) | Indirect | Paid GitHub issue bounties | 9% per a search snippet; page not fetchable; an older listing said 19% + 4% ([ossfund](https://ossfund.onrender.com/algora)) |
| [Gitcoin](https://gitcoin.co/blog/a-gitcoin-bounty-platform-fee) | Indirect | Bounties | 10% announced in 2022, may be outdated |
| [Braintrust](https://www.usebraintrust.com/terms-0) | Indirect | Talent network | 10% vs 15% depending on source ([A.Team comparison](https://www.a.team/talent/comparisons/braintrust)) |
| [Fiverr](https://www.fiverr.com) | Indirect | Hire one freelancer | Seller 20% + buyer 5.5% ([vaultleap](https://vaultleap.com/blog/fiverr-fees-explained-2026)); small-order fee conflicts across sources |
| [Upwork](https://www.upwork.com) | Indirect | Hire one freelancer | Freelancer fee 0-15% per contract since May 2025 ([golance](https://golance.com/blogs/upwork-fees-explained-2026)); client fee not verified |

**Substitutes (no source collected, so no numbers):** hiring a person in-house or by referral; asking an LLM directly for the draft; an agency retainer. The last two are the real competition for small measurable tasks and deserve a real test with buyers.

### Price range

Comparable item: the platform's cut on a reward a buyer posts.

- Lowest: Superteam Earn, no fee found.
- Middle: Algora ~9%, Gitcoin 10%, Braintrust 10-15%.
- Highest: Fiverr ~25% combined (20% + 5.5%), Topcoder 20% (capped $250), 99designs priced as fixed packages.
- **Wukong: 10% program default** (from `scripts/setup.ts`, admin-settable, capped at 20% in the program). It is mid-pack. It undercuts Fiverr and Topcoder and loses to Superteam's zero-fee claim, so the fee is not a reason to win the Solana-native buyer.

### Positioning map (text)

Axes: **who judges** (buyer by hand, to automated public rubric) and **when the money is locked** (after hiring, to before anyone starts).

- Fiverr, Upwork, Braintrust: buyer judges, money moves after a hire.
- 99designs, Topcoder: buyer judges (many compete), platform holds funds.
- Kaggle: automated leaderboard, but only for ML tasks and at enterprise budgets.
- Superteam Earn, Algora, Gitcoin: sponsor judges by hand, with escrow on some (Superteam per [Solana Compass](https://solanacompass.com/projects/Superteam)).
- **Wukong: automated public rubric judge, money locked first, any measurable task.** That corner is empty in the sources I found. Kaggle is the nearest and is much heavier and ML-only.

### What their customers complain about (ranked)

1. **Spec work and the losers' odds** (99designs-style contests). Designer-side criticism is long-running and ethical: unpaid work, low payouts, long odds ([SpecWatch interview](https://webdesignerdepot.com/interview-with-specwatch-the-naked-truth-about-design-contests), [Speckyboy](https://speckyboy.com/thoughts-on-why-spec-work-is-bad-and-why-you-shouldnt-do-it/), [UTS ePress paper](https://epress.lib.uts.edu.au/journals/index.php/csrj/article/view/2480/3451)). Sources are mostly old and advocacy-flavoured. **This is the objection your own design-agency leads raised.**
2. **Scams, fake accounts and unreliable freelancers** (Upwork, Fiverr): [Kimola's Trustpilot analysis](https://kimola.com/reports/upwork-feedback-analysis-dive-into-user-experiences-trustpilot-en-us-141155), [Moonlock](https://moonlock.com/fiverr-scams).
3. **Quality and undisclosed AI-generated work** (Fiverr): [golance review](https://golance.com/blogs/is-fiverr-legit-2026-review), [OneRep](https://onerep.com/blog/fiverr-scams-how-to-recognize-and-avoid-them). Anecdotal.
4. **Fees and paying just to pitch** (Upwork Connects, 20% fee on first $500 with a client): [Kimola](https://kimola.com/reports/upwork-review-terrible-support-freelancer-protection-142944), G2 reviews.
5. **Slow, one-sided dispute resolution** (Fiverr, Upwork): same Kimola reports, [Fiverr forum](https://community.fiverr.com/public/forum/boards/support-and-troubleshooting-by1/posts/335454-how-a-buyer-ruined-my-fiverr-career-and-the-customer-support-did-nothing-to-protect-me).
6. **AI slop flooding bounty programs.** Turso retired its bounty ([Neowin](https://www.neowin.net/news/turso-retires-bug-bounty-program-because-most-critical-issues-are-just-ai-slop/)); cURL changed its program ([Bugcrowd](https://www.plushcap.com/content/bugcrowd/blog/bugcrowd-hacker-opinion-piece-how-lazy-hacking-killed-curls-bug-bounty)); Bram Cohen argues [submissions should require deposits](https://bramcohen.com/p/bug-bounty-submissions-should-require). I found no direct reports of Superteam Earn payout problems.

Themes 2-4 are thin where marked anecdotal. Theme 1 is the long-documented one.

### The gap

**Trustworthy judging at scale when entries are cheap to fake.** The new pain in bounty and contest systems is AI-generated spam burying the real work (theme 6), and the old pain is hand-picked winners and holding the buyer's money (themes 2, 5). Wukong's pieces line up: an entry stake that is slashed for spam, a judge that must quote the entry to score it, deterministic checks that code enforces, and escrow before work. Backed by WukongBench (96.5% pairs ranked correctly, 25/25 attacks, with the caveat that your team wrote the dataset).

**Where there is no gap:** subjective creative work. Design agencies reject contests on principle (themes 1 and your leads), and AI judging of taste is the hardest to defend. The evidence favours the measurable categories (code with tests, translation, labeling, constrained copy).

### The threat

- **Superteam Earn** can copy fastest: same chain, existing sponsors and contributors, USDC, apparently no fee. If it adds automated scoring, Wukong's edge shrinks to the judge's quality.
- **Fiverr or Upwork** could add AI vetting or contests at huge scale, though their models center on hiring one person.
- **A plain LLM** answering the buyer's request directly is the cheapest substitute for small copy and translation tasks. Wukong's answer is verifiability and multiple human attempts, not cheaper drafts, and that needs proving with real buyers.

## The buyer panel

**4 buy · 16 pass** (20% buy) out of 20 simulated buyers. Seed 2026, so the same cards can be dealt again.

20 of 40 buyers have no valid answer and are left out: P021 (missing), P022 (missing), P023 (missing), P024 (missing), P025 (missing), P026 (missing), P027 (missing), P028 (missing), P029 (missing), P030 (missing).

These are simulated buyers, not customers. Use this to find objections and weak spots, then confirm the big ones with real people before you spend.

### By segment

| group | buyers | buy rate |
| --- | ---: | ---: |
| Marketing or content lead at an SMB or agency | 5 | 40%  (thin) |
| Web3 project ops or community manager | 3 | 33%  (thin) |
| Startup or small-team founder / ops lead | 8 | 12% |
| Community, event or education organiser (career centre, conference, nonprofit) | 4 | 0%  (thin) |

### By buying behaviour

| group | buyers | buy rate |
| --- | ---: | ---: |
| Early adopter | 2 | 100%  (thin) |
| Budget-tight, wants proof | 2 | 50%  (thin) |
| Asks for a sample, reads reviews | 2 | 50%  (thin) |
| AI first | 5 | 0%  (thin) |
| Hires a freelancer they already trust | 5 | 0%  (thin) |
| Avoids anything crypto | 3 | 0%  (thin) |
| Does it in-house | 1 | 0%  (thin) |

### By income

| group | buyers | buy rate |
| --- | ---: | ---: |
| $120,000 and up | 8 | 25% |
| under $86,000 | 6 | 17%  (thin) |
| $86,000 to $120,000 | 6 | 17%  (thin) |

### Why they pass

| reason | buyers | in their words |
| --- | ---: | --- |
| trust | 5 | "I can't tell who is really behind this, and I'd be explaining USDC on Solana and an unaudited product to whoever signs off on my budget. I'd try ChatGPT or Claude first and only pay a person if that falls short." (P001) · "I have freelancers I already trust and I go to them first. I'm not going to put company money into an unaudited smart contract on a brand new platform and then have to explain that to my boss." (P002) |
| values | 4 | "I'd just ask Claude for the draft first, and only pay someone if it's not good enough. A contest where everyone who doesn't win works for free feels like spec work, and I don't want my org tied to that." (P003) · "Everything is paid in USDC on Solana, and I won't set up a wallet or hold stablecoins for a business purchase. On top of that, writing a rubric for every task is more work than just editing a model's first draft myself." (P004) |
| habit | 4 | "I already have a freelancer I trust for copy and translation, and for anything small I'd just ask them or use ChatGPT. I'm not going to put my organisation's money on a new platform that pays in USDC on Solana." (P005) · "My backlog of small content and translation jobs goes to ChatGPT or Claude first, and I only pay a person when the draft isn't good enough. A contest where most entrants get nothing still feels like spec work to me, and I don't want to run that on my community's name." (P006) |
| convenience | 2 | "I'd hand a small task like this to an intern or the team. Paying in USDC on Solana means setting up a wallet, and that's more hassle than the task is worth." (P009) · "Paying in USDC on Solana means setting up a wallet and learning crypto just to get a 30 dollar translation done. I have a backlog, but I would rather pay a freelancer by card than deal with that." (P017) |
| price | 1 | "For a small task, 33 USDC all-in plus the work of writing a rubric and checking entries is more than I would pay one freelancer I can vet myself. I also have to explain USDC on Solana to whoever signs off my spend, and I can't do that for an unaudited product." (P018) |

### Why they buy

| reason | buyers | in their words |
| --- | ---: | --- |
| trust | 2 | "The first task is free and my spend is capped at the reward, so I can try it without risking budget. I would post one small copy task and judge it by the public scores and reasons before paying for a second." (P013) · "The first task is free and the spend is capped, so I'd try one small copy task to see if the judge's scores make sense. I wouldn't pay for a second one until I've seen what comes back." (P014) |
| need | 1 | "The first task is free and I like piloting new tools, so I'd try one copy task with a real brief just to see how the judge scores. I wouldn't pay for a second one until I've seen the entries and the score reasons." (P011) |
| other | 1 | "The first task is free and I have a backlog of small translation jobs, so I'd run one as a pilot for fun. I wouldn't put my own money in until I've seen what comes back." (P019) |

### What would flip a no

- Card or invoice payment, a named organisation or real references from other nonprofits, and an independent audit. A free first task I could run with no money from my budget would also get me to try it once.
- An independent audit, plus a way to pay by card or invoice and a few references from marketing leads at real companies who have used it.
- Pay in plain dollars by card, an independent audit done, and proof that losing entrants get something, plus a couple of real organisations like mine who ran a task and were happy.
- Let me pay by card or invoice in dollars, and handle the rubric fully for me.
- Being able to pay by card or invoice, an independent audit, and a couple of references from organisations like mine. The free first task might get me to try one small thing, but only if I don't have to touch crypto.
- If AI drafts clearly failed on a specific job, such as niche-language translation with native-level checking, and the free first task showed a winning entry beating my AI draft. Entrants being paid something just for entering would help too.
- Let me pay by card or invoice in dollars, with no wallet and no stablecoin on my side, plus a receipt I can hand to finance.
- A colleague at another organisation I trust telling me they used it and got work they were happy with, plus a way to pay by card or invoice and a human who signs off on the winner.
- Let me pay by card or invoice with no wallet, and have an independent audit done. A free first task I could try without touching crypto would also help.
- Pay by card or invoice in dollars with no wallet, plus an independent audit and a fee for every submitter who meets the bar, not only the winner.
- Paying by card with a normal invoice I can expense, an independent audit, and a case study from another marketing lead showing entries that beat what my trusted freelancer delivers.
- An independent audit, plus a way to pay by card or invoice so I don't touch crypto. Seeing a few real buyers like me with finished tasks would also help.

Buyers say they would buy **1.0 times** in the first month on average.

20 buyers gave all four price answers. Run founder-pricing's van_westendorp.py on the answers folder.

## Pricing

Price here means two things that must not be confused: **what the buyer pays in total** (reward + fee) and **what Wukong keeps** (the fee). The panel was asked about the first; the CFO model runs on the second.

### The price

**Recommend a standard task of 25 to 30 USDC reward, about 28 to 33 USDC all-in, with the fee at 10%.**

- **Buyer panel** (40 simulated buyers, `pricing-curve.md`): acceptable range **$15 to $70**, least resistance at **$15**, as many call it a bargain as call it expensive at **$30**, and above **$70** too many refuse. The pitched 55 USDC all-in sits **inside** the range but on the expensive side of the $30 midpoint.
- **Competitors** (`competitors.md`): at 10% the fee is mid-pack (Algora ~9%, Gitcoin 10%, Braintrust 10-15%, Topcoder ~20% capped at $250, Fiverr ~25% combined). Superteam Earn appears to take nothing, so the fee is not a reason to win and should not be raised until the product earns it.
- **CFO** (`cfo.md`): a $3.00 fee leaves $1.80 a task and needs 20 tasks a day to break even with a stipend. **The margin problem is the size of the task, not the fee rate.**

**The tension, stated plainly:** the price buyers say is comfortable ($30 all-in) is too small to make the business work. Raising the fee rate to 15% (8% margin at plan) or the average reward to $60 (31% margin, break-even 8 a day) both help, but the panel's curve says $60 is near the edge (PME $70). The route that works is **a larger, higher-value task type for a buyer who values it**, not squeezing small tasks.

### The ladder

| rung | what it is | reward | all-in | why step up |
| --- | --- | ---: | ---: | --- |
| Quick | one short deliverable, 1-hour of work (a headline set, one translation) | 20 USDC | 22 | the lowest-risk first task |
| Standard | a normal small task with a rubric | 30 USDC | 33 | the panel's sweet spot |
| Pro | a larger piece or a stakes-sensitive one, **human review of the winner before payout** | 80+ USDC | 88+ | the review is what several buyers asked for. **Not built yet**, so do not sell it until it exists |

### The opening offer

**The first task is free to the buyer: the founder sets it up, writes the rubric with them and funds a small reward (cap 30 USDC) from the founder's own budget.** This appeared in the pitch and is the *only* reason five of 40 simulated buyers said yes; none of them would pay afterwards without seeing results. Set an end date (for example, the first 10 pilots, closing 31 January) so it does not teach buyers to wait. The CFO books this as 10 x $30 = $300 of startup spend.

### What to test with real buyers

Two prices inside the range, as pre-sale pages or the founder's own pitch to the warm leads:
- **A: 25 USDC reward**, about $27.50 all-in (near the panel's $25 "bargain" and the $30 midpoint).
- **B: 50 USDC reward**, about $55 all-in (the original pitch, upper-middle of the range).
Compare how many of 10 real leads agree to fund each. Success line, written before running it: **at least 3 of 10 leads fund a real task at A, or at least 2 at B.**

### The panel's top price objections, verbatim

- "For a 50 USDC task I would just ask Claude for the draft and only pay a person if it came back bad. 55 USDC with only the top entries paid, plus USDC on Solana, is more hassle and money than a small task is worth to me." (P020)
- "55 USDC for a small task I could get a first draft of from a model for free, and only the top entries get paid so I might get nothing usable for it. I'm budget-tight and want to see a sample first, and this is unaudited, invitation-only and needs USDC on Solana." (P030)
- Several buyers named **card or invoice in dollars** as the one thing that would flip them, which is a payment-method problem, not a price one.

### Rules kept

- Panel price answers pick what to test; they are not proof.
- No price below variable cost, and no fake "was $X" anchors.
- Price changes go into `numbers.json` and `/founder-cfo` re-runs.

## The offer

Built with the Offers lens (a summary of a published framework, not anyone's words). The raw material is `panel-v1/results.md` (why 35 of 40 simulated buyers passed), `competitors.md`, `board.md` and the CFO's numbers.

### 1. The problem list (in the buyer's words)

Before buying: 
1. "I can't tell who is behind this or whether it's legitimate."
2. "I'd have to explain a crypto payment to whoever signs off my budget."
3. "I won't set up a wallet or hold USDC for a business purchase."
4. "It's unaudited and brand new; I won't lock money in it."
5. "Why not just ask ChatGPT, or call the freelancer I trust?"
6. "Writing a rubric for every task is extra work."
7. "55 USDC all-in is more than a small task is worth."

During: 
8. "Can an AI judge pick what I'd pick, for my taste and brand?"
9. "Only the winner is paid, so I might pay and get nothing usable."
10. "Everyone who loses works for free; that feels like spec work."
11. "I don't know how long it takes or how many entries I'll get."

After: 
12. "What if the judge is wrong? Who do I appeal to?"
13. "I need an invoice or receipt finance will accept."
14. "I want to see finished tasks where the winner was clearly good."
15. "I need a reference from an organisation like mine."

### 2. Solutions, trimmed (value to the buyer 1-5, cost to deliver 1-5; cost from `cfo.md`)

| # | solution | answers | value | cost | keep? |
| --- | --- | --- | ---: | ---: | --- |
| a | A named founder, public code, public benchmark | 1, 14 | 4 | 1 | **yes** |
| b | Founder sets up the first task and writes the rubric from a ready template | 6, 3 (partly), 11 | 5 | 2 | **yes (pilots only)** |
| c | First task free, founder funds a small reward (cap 30 USDC) | 5, 7, 9 | 5 | 3 | **yes, capped at 10 pilots** |
| d | Spend never above the reward set; early rewards capped at 100 USDC until an audit | 4, 7 | 4 | 1 | **yes** |
| e | Refund if no entry clears the bar (already in the program) | 9 | 3 | 1 | **yes** |
| f | Every entry gets a public score with a written reason (already built) | 8, 10 (partly), 12 | 4 | 1 | **yes** |
| g | Re-run once if the buyer is unhappy | 8, 9 | 4 | **5** | **limited, see the guarantee below** |
| h | Card or invoice in dollars, no wallet | 2, 3, 13 | **5** | 5 | **not built; the top blocker. See section 5** |
| i | Independent security audit | 4 | 5 | 5 | **not done; $15,000 in the CFO model** |
| j | Human review of the winner before payout (Pro tier) | 8, 12 | 4 | 4 | not built |
| k | Participation payment for entries that clear the bar | 10 | 4 | 4 | not built, breaks the unit economics |
| l | References and case studies from real organisations | 15 | 5 | 3 | cannot be faked, comes from the pilots |

### 3. The stack (only what is deliverable now)

- **The core:** "Pay only for the best, and see exactly why it won." Describe the outcome, not the escrow.
- **Bonus 1, I set it up for you:** the founder writes the rubric with the buyer from a template and the buyer approves it before anything goes live.
- **Bonus 2, free first task:** the founder funds up to 30 USDC of reward for each of the first 10 organisations.
- **Bonus 3, see the proof:** the public benchmark and a named founder; later, the pilots' own reports.
- **The guarantee:** refund if no entry clears the bar (built). The pitch also said "I re-run once if you are unhappy, at no cost." **That is not affordable as written.** A re-run means the founder re-funds a $30 reward plus about $1 of review time, so it costs more than the whole $3.00 fee at any claim rate above **9.7%** (2% claims cost $0.62 a task, 5% cost $1.55, 10% cost $3.10, 20% cost $6.20). **Recommended wording:** free re-run for the first 10 pilots (already inside the $300 pilot budget), and after that a free re-judge and rubric fix with no new reward.
- **Urgency, real:** the first 10 organisations only, ending 31 January. Not a fake countdown.
- **The name:** *The Wukong Pilot: your first task, set up for you.*

### 4. The value equation (1-10, my judgment, not measured)

| element | before | after | what moved it |
| --- | ---: | ---: | --- |
| dream outcome | 6 | 6 | unchanged: a usable result without hiring one person |
| likelihood of getting it | 3 | 5 | named founder, public benchmark, refund, capped spend |
| time to the result | 6 | 6 | unchanged |
| effort and sacrifice | 3 | 6 | founder writes the rubric and funds the first task; wallet and USDC still hurt |

### 5. The re-test: same 20 buyers, old offer vs new offer

Same seed, so the same 20 persona cards (P001-P020) saw `pitch-v1.md` and then `pitch.md`.

| | v1 | v2 |
| --- | ---: | ---: |
| Would try it | **2 of 20 (10%)** | **4 of 20 (20%)** |
| Passed because of trust | 10 | **5** |
| Passed because of values (no crypto) | 3 | 4 |
| Passed because of habit (AI or trusted freelancer first) | 4 | 4 |
| Passed on price | 1 | 1 |
| Passers who still name **card/invoice** as a flip | 14 | **14** |
| Passers who name an **audit** | 18 | 14 |
| Passers who name a **reference or case study** | 10 | 6 |
| Median price answers (too cheap / bargain / expensive / too expensive) | 10 / 25 / 55 / 100 | 8 / 20 / 45 / 80 |

**What moved:** trust-coded passes halved, which is the effect of a named founder, public code and a public benchmark. Two more buyers took the free pilot (P013, P014).

**What did not move:** the need for **card or invoice in dollars** is the same for 14 of the 16 buyers who passed. It is the biggest single blocker in this panel and it is not something the offer can fix by words. Spec-work worries are unchanged (3 and 3). The median price answers dropped, because the v2 pitch quoted a lower all-in price (33 USDC instead of 55).

**The honest limit of this result:** every one of the 4 "yes" buyers said yes **only to the free first task** and said they would not pay for a second until they had seen the results. So this offer turns curiosity into pilots, **not into revenue**. The buy rate is also an upper bound (simulated buyers lean agreeable) from only 20 people.

### 6. What the offer cannot fix without building something

1. **Card or invoice funding in dollars.** The product asks for USDC on Solana. A fiat on-ramp needs engineering and has money-handling rules attached. (The founder paying USDC on a buyer's behalf and invoicing in dollars would work operationally but touches money-handling and tax rules, so check with an accountant and a lawyer before doing it for anyone.)
2. **An independent audit** before real money, or a hard cap on every escrow until then.
3. **A written appeal path and a visible reason for every loser** (the reasons exist; the appeal process does not).
4. **Real references,** which only the pilots can create.

Rules kept: every promise above is deliverable now or marked not built; no fake scarcity, reviews or testimonials; panel quotes are research, not testimonials. Follow the advertising and consumer rules of each market for guarantees. Not legal advice.

## The numbers

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

## Unit economics: Wukong (platform fee on settled tasks)

Every number below comes from the input file. Nothing is looked up or guessed.

### One settled task

| line | per settled task |
| --- | ---: |
| Price | $3.00 |
| AI judge inference (about 10 entries x 3 samples) | -$0.10 |
| Solana transactions and RPC share | -$0.08 |
| Emails and notifications | -$0.02 |
| Human review and appeals (avg minutes per task) | -$1.00 |
| **Contribution** (what each settled task leaves to pay the fixed costs) | **$1.80** (60%) |

### The margin that matters

Fixed costs: $1,060 a month (Hosting, database, RPC, email, domain $60, Founder stipend (assumption, set to 0 to see the no-salary case) $1,000).

- **Break-even: 20 settled tasks a day.** Below that you lose money every month.
- **Profit margin at your plan** (12 a day): **-38%** of every sale, after every cost.
- Capacity: 200 a day.

### Year 1, month by month

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

### What if

| scenario | margin at plan | break-even a day | year 1 profit |
| --- | ---: | ---: | ---: |
| Base plan | -38% | 20 | -$10,355 |
| Price -10% | -53% | 24 | -$10,749 |
| Volume -20% | -63% | 20 | -$10,828 |
| Unit costs +15% | -44% | 22 | -$10,591 |

### Red flags

- Year 1 loses money on operations (-$10,355).
- The startup spend is not earned back within year 1.

## Marketing

Built from `panel-v1/results.md` and the v2 re-test (`offer.md`), `competitors.md`, `pricing.md`, `cfo.md` and the real inbox from the October outreach (documented in `idea.md`).

### 1. What the evidence says

- **Simulated buyers (40, v1):** 5 would try it, 35 pass. By segment: web3 project ops 33% (only 6 buyers, thin), marketing and content leads 20%, community, event and education organisers 10%, startup founders 0%. By behaviour: "early adopter" buyers said yes every time (5 of 5, thin); everyone who asks AI first, uses a trusted freelancer, avoids crypto, does it in-house or wants proof said no. All 5 yeses were for the **free first task only**.
- **Real replies (October outreach):** the positive ones came from a web3 and AI community CEO, a college-career-club author, an artwork marketplace, an AI fashion studio, a collectibles app and a native-ads company. The negative ones came from design agencies (spec work), a UX consultant (legitimacy), and several "not interested". The real replies line up with the panel: **web3-adjacent operators and education/community organisers are the receptive audiences; design agencies and individual consultants are not.**
- **What every group wants and does not get today:** card or invoice in dollars, an independent audit, references. Marketing cannot supply those. It can supply proof and a human face.

### 2. Positioning

```
For community, event and web3-project operators who keep a backlog of small writing, translation and labeling jobs,
Wukong is the work marketplace that shows its scoring in public and locks the reward before work starts,
unlike hiring one freelancer on trust or asking an AI that nobody checks.
```

Three versions:
1. **Proof version (recommended):** "Pay only for the best result, and see exactly why it won." Supported by the 98-entry public benchmark and the fact that trust-coded passes halved when the pitch named the founder and showed the benchmark (10 to 5 of 20).
2. **Students version:** "Real tasks, a scored report on every entry, and a record you keep." Supported by one career-centre lead asking for micro-internships. Not yet proven with students.
3. **Security version:** "Built by a security researcher who attacked his own judge first." Strong for crypto-native audiences and the founder's own network; weak for buyers who do not care about the judge's internals.

Recommend **1 for buyers, 2 for the career-centre pilot, 3 for the founder's LinkedIn.** Do not lead with "AI judge" alone: eight panel buyers said "I'd ask ChatGPT first", so the message must be about *verified, compared results*, not about AI.

### 3. Channels

| channel | why it fits | cost | how you will know |
| --- | --- | --- | --- |
| **Warm replies from the outreach inbox** (6 hot leads: a Web3/AI community CEO, a career-club author, an art marketplace, an AI studio, a collectibles app, a native-ads company) | They already said "send it" | founder time | 3 of 6 accept a free pilot within 3 weeks |
| **Founder-led cold email, rewritten** (real name, the site in the first email, the payment catch in one line, buyer vs worker stated) to web3 community ops and education/community organisers only | The two receptive segments | the tool subscription already paid | positive-reply rate, pilots booked |
| **Founder LinkedIn posts** (security-hook version, video native) | The founder's own credibility is the strongest asset (trust was the #1 pass reason) | $0 | comments asking for a demo, DMs |
| **Launch directory listing** (trylaunch.ai, free; see `competitors.md` for the unverified details) | Cheap exposure and a backlink | $0 | referral visits; treat as minor |
| **Career centre and community partnerships** (the student micro-internship angle) | One partner brings many workers *and* a buyer | founder time | a signed pilot with one centre |
| **Solana communities and bounty boards as worker supply** | Workers must exist before buyers' tasks are judged well | $0 | entries per pilot task |

**What not to do and why:** no paid ads (the CAC ceiling below is a few dollars); no more design-agency outreach (two said no on principle and the panel's trust and spec-work objections point the same way); no big launch push until a pilot report exists (there is nothing to show).

### 4. The 30-day campaign (launch day: Monday 7 December 2026; pilots start; calendar runs 23 November to 23 December)

Today is 15 November, so this assumes the first week of work starts on the 16th.

| date | channel | what goes out |
| --- | --- | --- |
| Mon 16 Nov | prep | Replace the sender name in the outreach tool with a real name and add the site and the payment catch to the template (one-line fix, highest leverage) |
| Tue 17 Nov | email | Send the three-idea replies to the 6 hot leads (drafts exist in the chat history); each asks one question |
| Wed 18 Nov | build | Prepare one finished example task: run the real judge on a small task and keep the report (needed for hook 9) |
| Mon 23 Nov (launch -14) | LinkedIn | Post 1: the security-hook post with the 24-second video; link in the first comment |
| Tue 24 Nov | email | New cold batch to web3 community operators only, using the fixed template |
| Wed 25 Nov | LinkedIn | Post 2: the benchmark, including what it still misses (honesty post) |
| Mon 30 Nov | email | New cold batch to education and community organisers only |
| Wed 2 Dec | outreach | Ask 15 to 30 real contacts to look at the Launch directory page the day it goes live (no vote swaps) |
| Mon 7 Dec (**launch -0**) | all | Pilot programme opens: "The Wukong Pilot, first 10 organisations, closes 31 January" posted on LinkedIn and sent to the warm list |
| Tue 8 Dec | email | Follow up with every warm lead who has not answered, with the finished example task attached |
| Thu 10 Dec | LinkedIn | Post 3: behind the scenes of setting up the first pilot task (what a rubric looks like) |
| Mon 14 Dec | email | Second follow-up to non-responders; stop after this one |
| Wed 16 Dec | LinkedIn | Post 4: first pilot result, only if one exists. If not, post what was learned |
| Mon 21 Dec | partnership | Send the career-centre partner a one-page pilot proposal with the example report |
| Wed 23 Dec | review | Count the numbers in section 6 and decide: keep going, change the offer, or change the segment |

When there is nothing new: post the benchmark table, a rubric template, or a scored example entry (never a made-up one).

### 5. Ten hooks (each answers one objection)

1. *Trust:* "I'm Ansh. I find the bugs where apps trust the wrong thing. Here's the code and the benchmark; read it before you believe anything." (video opening line)
2. *Ask AI first:* "Ask ChatGPT for the draft, then see whether real people beat it. The first task is on me." (ad headline)
3. *Rubric effort:* "You tell me the goal. I write the scoring rubric. You approve it before anything goes live." (email subject)
4. *Spec work:* "Every entry gets a public score and a written reason, winners and losers." (post opening)
5. *Judge wrong?:* "The judge must quote the entry to score it. Invented quotes are never published." (benchmark post)
6. *Crypto:* "You won't touch a wallet to try it: your first task is funded by me." (email line; true for pilots only)
7. *Money safe:* "The reward is locked before anyone starts. If nothing clears the bar, you get it back." (sign-up page)
8. *Price:* "A typical task: 30 USDC. You never pay more than your reward plus 10%." (pricing line)
9. *Proof:* "98 entries, 25 attack attempts, 25 caught, including 10 I wrote *after* tuning. And here's where it still fails." (post opening)
10. *Students:* "Real tasks from real organisations, a scored report on every entry, and a record you keep." (career-centre pitch)

No hook claims an audit, a card option or customers, because none exists yet.

### 6. Budget and the numbers to watch

**The most you can pay to win a customer:** each settled task leaves **$1.80** (CFO). If a buyer posts **4** tasks in year 1 (an assumption; the panel gives no paid-task data), that buyer leaves **$7.20**, so paying more than about **$3.60** to win one (half, to keep a margin) loses money. **Paid ads are not viable; the only affordable channels are founder time and free listings.** At 2 tasks a year it falls to $3.60 total.

**Budget:** $0 cash beyond the $500 launch line in the CFO model (tools and the example task). The real cost is founder hours and the $300 of pilot rewards.

**Three numbers, weekly, with the level that means "change something":**
1. *Warm replies who accept a free pilot:* below 2 of 6 by 21 December means the offer, not the audience, is the problem.
2. *Pilots completed (judged and settled):* below 3 by 31 December means setup is too heavy, simplify the rubric templates.
3. *Pilot buyers who agree to pay for a second task:* below 1 of 5 means the product, not the marketing, is the issue. Rework the offer before sending more outreach.

### Rules kept

No fake reviews, follower counts, testimonials or "as seen on". Panel quotes are research, not customer quotes. Disclose any paid partnership. Follow advertising rules for claims in the user's market. Not legal advice.

## Brand

Built from `marketing.md` (positioning and first audience), `competitors.md`, and the panel's reasons. The product already has a name, a tagline and a dark visual system (`design/`, `src/app/globals.css`), so this document **checks** what exists and flags what to fix. It does not restart the brand.

### 1. The name: a real risk to look at before real money

**Wukong is a strong story and a crowded name.** The Monkey King and the "hundred copies from one hair" image match the product exactly (a buyer gets a hundred attempts). But a public search of trademark aggregator pages (third-party sites, **not** an official register) turned up:

- **WUKONG (DingTalk), serial 99774216, Class 42 (software services), filed 20 April 2026, pending.** The closest conflict for a software product.
- **WUKONG (LAN Global), reg. 6422368, Classes 9, 41, 16, 35, registered.** Class 35 overlaps with a marketplace.
- **BLACK MYTH WUKONG**, several filings, including software-related services (one with a notice of allowance issued) and the very well known game of that name, so confusion in search and in people's heads is likely.
- UK filings for WUKONG in Class 42 also appeared in the UK journal.

Sources (aggregators, check each against the official register before relying on any): [WUKONG, serial 99774216](https://gleanmark.com/trademark/uspto-99774216), [WUKONG, serial 79292704](https://gleanmark.com/trademark/uspto-79292704), [BLACK MYTH WUKONG](https://trademarks.justia.com/905/64/black-myth-90564367.html), [UK Trade Mark Journal 2026/022](https://www.ipo.gov.uk/t-tmj.htm/t-tmj/tm-journals/2026-022/UK00004386038.html).

**What this does not tell you:** whether a clearance lawyer would call any of these a conflict for a work marketplace on a blockchain. A pending mark by a large company in Class 42 is the one that worries me most. **I am not a lawyer and I only ran public searches; nothing is registered by Wukong, and a trademark lawyer must confirm.**

#### Ten candidates (in case the check goes badly)

| # | name | what it says | how it sounds / reads on an icon | risk |
| --- | --- | --- | --- | --- |
| 1 | **Wukong** (current) | the Monkey King, a hundred clones | short, memorable, a good icon | the marks above; very well-known game |
| 2 | **Proofwork** | work you can prove | clear, a little dry | descriptive, may be hard to protect; check |
| 3 | **Hundredhands** | the hundred-copies idea, without the name | two words, longer | check for conflicts |
| 4 | **Openbench** | the public benchmark | developer-sounding | sounds like lab or hardware tools |
| 5 | **Sealwork** | sealed entries | short | a little legal-sounding |
| 6 | **Scorebound** | scored, bound by the score | slightly gamey | check |
| 7 | **Podiumwork** | the top-3 payout | long | "Podium" is crowded |
| 8 | **Manyhands** | many people, one result | warm and plain | generic; hard to own |
| 9 | **Verdict** | public scored judgments | strong word | very crowded |
| 10 | **Hairfall** | a playful nod to the hair-clone myth | memorable, odd | may confuse or sound negative |

**Shortlist three: Proofwork, Hundredhands, Openbench.** For each, the user must finish these checks themselves:
- **Trademark:** search the official registers for the name in the same classes, Class 35 (marketplace and business services), Class 42 (software), Class 9 (software) and Class 36 (financial services, relevant if payments are involved): [USPTO](https://www.uspto.gov/trademarks), [EUIPO](https://euipo.europa.eu/), [UK IPO](https://www.gov.uk/search-for-trademark), and CIPO for Canada. Then use a lawyer.
- **Domain:** the .com and .xyz for each (check, do not assume). Wukong already owns `wukonghq.xyz`.
- **Handles:** Instagram, TikTok, X, YouTube, GitHub.
- **Confusion:** none of the three is close to a competitor in `competitors.md`.

**Recommendation:** do **not** rename now. Pay for one professional clearance search on "Wukong" for Classes 9, 35, 36 and 42 **before mainnet and before any spend on branding.** If counsel flags a real conflict, rename to the shortlist; the domain, code and design carry over. Early on, a rename costs almost nothing and later it costs a lot.

### 2. The promise and the tagline

**The promise (what a buyer can count on every time):** *You only pay for the best result, and you can see exactly why it won.*

**Tagline options:**
1. **"Post a task. Summon the crowd. Pay the best."** (current, from the README; good, keep it)
2. "Many tries. One fair score. Pay for the best."
3. "Work you can verify."

### 3. Voice

Three adjectives, with a do and a don't each:

- **Plain.** *Do:* "The reward is locked before anyone starts." *Don't:* "Trustless on-chain escrow primitives."
- **Honest.** *Do:* "Losers work unpaid today; here is what they get instead." *Don't:* "A fair marketplace for everyone."
- **Exact.** *Do:* "96.5% of pairs ranked correctly, on a benchmark our own team wrote." *Don't:* "Industry-leading accuracy."

Before and after, from `pitch.md`: *Before:* "Wukong, a work marketplace at wukonghq.xyz." *After:* "Pay only for the best result, and see exactly why it won."

### 4. The look: a brief for what already exists

The current system (from `src/app/globals.css`, `design/`) is dark and editorial. Colours and what each does, **with contrast checked** (WCAG ratio against the page background `#07080c`; AA for body text is 4.5, for large text 3):

| role | colour | contrast on bg | use |
| --- | --- | ---: | --- |
| background | `#07080c` | n/a | page |
| surface | `#0c0e14` | n/a | cards |
| text | `#f1ede4` | 17.1 | body and headlines |
| muted text | `#9b9da6` | 7.4 | secondary text (passes AA) |
| faint text | `#63666f` | **3.5** | **fails AA for body text; large text or decoration only** |
| red (primary accent) | `#f0412f` | 5.2 | calls to action, "the Monkey King" |
| gold | `#d8b36c` | 10.1 | rank, rewards |
| blue | `#7383ff` | 6.1 | links, info |
| green | `#45cf8b` | 10.1 | success, paid |
| ember | `#ff8a3d` | 8.5 | warnings, hot states |

**One fix:** `#63666f` ("faint") is below AA for small text on this background. Do not use it for anything a person has to read.

**Type:** Instrument Serif (headlines), Instrument Sans (text), JetBrains Mono (labels), Anton (wordmark). These are Google Fonts under open licences, so there is no licence problem, but check each licence file before shipping a downloadable asset.

**Logo brief:** it must say "one becomes many". It must read at 32 px (an app icon or a favicon, which already exists in `public/`) and on a dark cup-sized card. Avoid a literal monkey cartoon, which clashes with a security-and-trust message and with the game's imagery. Concepts generated by an image tool are concepts, not a finished logo.

**First five touchpoints:**
1. **Homepage:** one sentence of what it is, the live total of rewards in escrow, one "post a task" button; the benchmark one click away.
2. **Task page:** the reward, the rubric and the deadline above the fold.
3. **Receipt and results email:** the score, the reason, the amount, a link to the on-chain record.
4. **First social post:** the benchmark table with its limits.
5. **Reply to the first complaint:** a named human, a written reason, a next step. The October outreach under invented sender names must not be repeated; every touchpoint shows a real name.

### Rules kept

No competitor's name, logo, colours or tagline was copied. No fonts or images are used without a right to use them. Not legal advice on trademarks.

## Operations

Built from `idea.md`, `offer.md`, `numbers.json`, and the repo's own `docs/DEPLOY.md`, `docs/LAUNCH.md` and `docs/SECURITY.md`. No supplier price was looked up for this document: prices change, and where a number is missing it says so. The CFO's $60 a month for infrastructure is an **estimate**.

### 1. The daily cycle (what has to happen every day)

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

### 2. Suppliers (every input the product needs)

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

### 3. People

One person today. A weekly rota for the planned volume:

- **Founder (Ansh), part-time:** daily check (30 min), outreach and pilot setup (the main time sink), appeals and judge-report review (about 15 minutes per task, the CFO's $1.00 line).
- **At 12 tasks a day** (the month-12 plan) that review alone is about 3 hours a day, which does not fit alongside a part-time job. **The review step has to be partly automated, or the volume plan changes.** This is the most important operational finding in the pack.
- Wage assumption: the CFO carries a $1,000 monthly founder stipend as an assumption, not a decision. Employer costs beyond wages vary by country: an accountant's job.

### 4. Routines (one page each)

**Onboard an organisation.** 1) Email thread shows interest and a real person. 2) Add their sign-in email to the approvals (Supabase `CompanyInvite` row). 3) They sign in at `/business`, set up the organisation. 4) Send the rubric template for their task type. 5) Agree reward and deadline in writing. 6) Post, fund, and send them the task link.

**Run a pilot task.** 1) Pick one of the existing categories (Copy, Translation, Code, Data labeling, Research). 2) Write the rubric from the template; the buyer approves. 3) Fix every hard requirement as a check code can measure (word limits, required phrases, language). 4) Post with a deadline of 5-7 days. 5) After judging, read every report, not only the winner's. 6) Send the buyer the results and ask three questions: was the winner usable, would you pay for the next one, what would you change.

**Handle a complaint or appeal.** 1) Acknowledge within one working day. 2) Re-read the entry and the judge's quoted evidence. 3) Reply with a written reason: upheld, or re-judged with what changed. 4) Log it. 5) If the judge was wrong, add the case to the benchmark.

**Weekly.** Review keeper logs, the status page, judge cost, and rotate nothing that is not due. Reorder nothing physical: there is no inventory.

### 5. Tools

The smallest set that runs it, all already in the repo: the app (`npm run start:prod`), the keeper, `npm run judge:bench` for regression checks, and the outreach tool already in use. Add a shared inbox address before more outreach goes out.

### 6. Licences, permits and insurance: check before real money

**The honest summary: this is a money-handling product, and the rules depend on the country, who holds the funds, and whether fiat is involved.** The program (not the company) holds the escrow, which helps, but it does not remove the questions. Each item is something to confirm with the authority or a professional, not a conclusion:

- [ ] **Where the company is formed and who the legal owner is** (no entity exists yet, per the CFO's startup line).
- [ ] **Whether operating the platform is a regulated money-handling business** in the countries you operate in or serve. In the US that is FinCEN's rules for money services businesses ([fincen.gov](https://www.fincen.gov)); other countries have their own regulators. A fiat on-ramp or invoicing buyers in dollars raises this question sharply (see `offer.md` section 6).
- [ ] **Sanctions and know-your-customer rules** for payers and payees, particularly for payouts to individuals across borders.
- [ ] **Tax:** reporting of payouts to workers, sales or VAT on the fee, and tax treatment of USDC held by the company. Revenue in the CFO model is before tax.
- [ ] **Terms of service, privacy policy and data protection** (EU and UK rules apply if anyone there signs in). Briefs and entries can contain personal data.
- [ ] **Intellectual property:** who owns an entry? The terms must say. Submissions are scored by a third-party AI model, so the privacy policy must say entries are sent to it.
- [ ] **Professional indemnity or business insurance** (an insurance broker can say whether a crypto product is insurable).
- [ ] **Trademark clearance** for the name (see `brand.md`).

### 7. Risk register (the ten most likely things to go wrong)

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

## Launch plan

Built from `ops.md`, `marketing.md`, `brand.md`, `offer.md` and `cfo.md`. Dates assume today is **Sunday 15 November 2026** and the pilot opens **Monday 7 December 2026**. Every owner is the founder (Ansh) until a second person exists.

### 1. Test before you spend: the pilot is the test

The business has not spent the big money yet (audit, entity, mainnet), so the cheapest real test is the one already in motion: **the six warm leads from the October outreach each get one real, founder-funded task.** (The tests the skill lists for a service business: paid pilot clients at the planned price. Here the first one is free by design, so the *second task* is the paid test.)

**Success lines, written before running it:**
1. **At least 3 of the 6 warm leads run a pilot task** by Monday 21 December.
2. **At least 2 of the pilots end with the buyer calling the winning entry usable.**
3. **At least 1 buyer agrees, in writing, to pay for a second task** (real reward, even a small one).

**How to read it against the simulated panel:** the panel said 10-20% would try a free pilot and no one would pay. The warm leads already answered "send it," so a higher bar (3 of 6) is fair. If only 1 of 6 takes the pilot, **trust the real buyers** over the panel and go back to `offer.md` and the segment choice in `marketing.md`. If pilots run but nobody will pay for a second task, the product does not yet earn its fee and the plan's verdict stands.

**Decision for the founder by Friday 20 November:** run the pilots on **mainnet with small capped escrows (each at most 30 USDC, founder-funded, no escrow above 100 USDC before an audit)**, or on devnet. Devnet is safe but means nobody feels the real-money step, which is the thing both the board and the panel doubt. The recommended default is **mainnet with caps, disclosed as unaudited**, after the legal checklist in `ops.md` section 6 has been looked at by someone qualified for the founder-funded case.

### 2. The countdown (15 November to 7 December)

| week | owner | tasks (deadline) | critical path? |
| --- | --- | --- | --- |
| 16-20 Nov | founder | Fix the outreach template: real name, `wukonghq.xyz` in line one, the payment catch, buyer vs worker stated (Mon 16 Nov). Send the three-idea replies to the 6 warm leads (Tue 17). Run one real example task through the judge and keep the report (Wed 18). Decide mainnet vs devnet (Fri 20). | **yes**, the first two feed everything |
| 16-20 Nov | founder | Get 3 audit quotes, ask an accountant and a lawyer the questions in `ops.md` section 6 (booked by Fri 20) | no, but needed before any scale |
| 23-27 Nov | founder | LinkedIn post 1 and cold batch to web3 community operators (Mon 23, Tue 24); benchmark honesty post (Wed 25). Write the rubric templates for the five categories into one document (Fri 27). Remove or fix any reference to the unaudited state that overstates things on the site (Fri 27). | rubric templates: **yes** |
| 30 Nov-4 Dec | founder | If mainnet: deploy the program with the config limits, fund the pilot wallet with the $300 pilot budget and the SOL for fees, run an end-to-end test with a throwaway task (Wed 2 Dec). Cold batch to education and community organisers (Mon 30 Nov). Put the keeper on an every-minute scheduler (Thu 3 Dec). Agree with each warm lead their task, reward, deadline in writing (Fri 4 Dec). | **mainnet deploy and end-to-end test: yes** |
| 7 Dec | founder | **Launch day** (section 3) | |

**Critical path:** template fix, then rubric templates, then (if mainnet) the deploy and a clean end-to-end test, then the first agreed task. If the mainnet deploy slips, the pilots slip with it; the fallback is devnet pilots, accepting they test less.

Soft open before the public launch: **run the throwaway end-to-end task on 2 December with two friends as entrants.** Friends-and-family means nothing about demand; it only proves the flow works.

### 3. Launch day: Monday 7 December (times are the founder's local time)

| time | what |
| --- | --- |
| 08:00 | Check the site, `/status`, the keeper and the wallet balances (reward funds and fee SOL) |
| 09:00 | Post "The Wukong Pilot, first 10 organisations, closes 31 January" on LinkedIn (text, native video); first comment holds the link |
| 09:15 | Send the same note to every warm lead and to the Launch directory contact |
| 10:00-12:00 | Reply to every comment and DM; each reply asks one question |
| 12:00 | Post the first agreed pilot task live (if the buyer has approved the rubric) and send the buyer the task link |
| 15:00 | Check that the first entries have arrived and are sealed |
| 18:00 | Review the day's numbers and write them in the log; reply to anything left |

**If something breaks** (from `ops.md` risk register): the site is down, post a status line and reply to leads directly; the keeper misses a deadline, run it by hand and tell the buyer; the judge returns a bad score, hold the settlement, re-read the report and tell the buyer in writing before anything is paid.

### 4. The first 30 days (7 December to 6 January)

**Weekly numbers, from the CFO and marketing:**
- **Settled tasks per day** against the CFO's break-even: **20 a day with a stipend, 2 a day without** (the realistic first target is 0.2 to 0.5 a day). Do not read the plan's verdict until the volume numbers exist.
- **Pilot funnel:** warm leads contacted, pilots agreed, tasks posted, tasks settled, buyers who would pay again.
- **Quality:** the share of pilot winners the buyer calls usable, appeals received, judge misses added to the benchmark.

**Triggers for change:**
- Fewer than 2 pilots agreed by 21 December: change the offer or the segment before sending more outreach.
- Any buyer says the winning entry was unusable: stop new tasks, review the rubric and the judge's evidence, fix, then continue.
- Zero buyers willing to pay for a second task by 6 January: go back to `board.md`. The honest options are a narrower niche, a different buyer, or a smaller project.

**Reviews:**

| day | date | questions to answer |
| --- | --- | --- |
| 7 | Mon 14 Dec | Did the pilots start? What did the first buyer misunderstand? Is the rubric template too heavy? |
| 14 | Mon 21 Dec | How many of the 6 said yes? Did anyone refuse because of the crypto step? Is there any real signal about card or invoice demand? |
| 30 | Wed 6 Jan | Did anyone pay for a second task? What would they pay? Is the verdict still "Not yet"? What do the first 5 reports say about the judge? |

### 5. What this plan does not do

It does not raise money, rename the product, build card payments or buy an audit. Those are separate decisions that depend on the pilot result, and `summary.md` lists them in order.

_The panel is simulated buyers and the numbers are projections from your inputs. Confirm demand with real customers and costs with real quotes before you spend. Not financial, legal or tax advice._
