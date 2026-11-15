# Pricing

Price here means two things that must not be confused: **what the buyer pays in total** (reward + fee) and **what Wukong keeps** (the fee). The panel was asked about the first; the CFO model runs on the second.

## The price

**Recommend a standard task of 25 to 30 USDC reward, about 28 to 33 USDC all-in, with the fee at 10%.**

- **Buyer panel** (40 simulated buyers, `pricing-curve.md`): acceptable range **$15 to $70**, least resistance at **$15**, as many call it a bargain as call it expensive at **$30**, and above **$70** too many refuse. The pitched 55 USDC all-in sits **inside** the range but on the expensive side of the $30 midpoint.
- **Competitors** (`competitors.md`): at 10% the fee is mid-pack (Algora ~9%, Gitcoin 10%, Braintrust 10-15%, Topcoder ~20% capped at $250, Fiverr ~25% combined). Superteam Earn appears to take nothing, so the fee is not a reason to win and should not be raised until the product earns it.
- **CFO** (`cfo.md`): a $3.00 fee leaves $1.80 a task and needs 20 tasks a day to break even with a stipend. **The margin problem is the size of the task, not the fee rate.**

**The tension, stated plainly:** the price buyers say is comfortable ($30 all-in) is too small to make the business work. Raising the fee rate to 15% (8% margin at plan) or the average reward to $60 (31% margin, break-even 8 a day) both help, but the panel's curve says $60 is near the edge (PME $70). The route that works is **a larger, higher-value task type for a buyer who values it**, not squeezing small tasks.

## The ladder

| rung | what it is | reward | all-in | why step up |
| --- | --- | ---: | ---: | --- |
| Quick | one short deliverable, 1-hour of work (a headline set, one translation) | 20 USDC | 22 | the lowest-risk first task |
| Standard | a normal small task with a rubric | 30 USDC | 33 | the panel's sweet spot |
| Pro | a larger piece or a stakes-sensitive one, **human review of the winner before payout** | 80+ USDC | 88+ | the review is what several buyers asked for. **Not built yet**, so do not sell it until it exists |

## The opening offer

**The first task is free to the buyer: the founder sets it up, writes the rubric with them and funds a small reward (cap 30 USDC) from the founder's own budget.** This appeared in the pitch and is the *only* reason five of 40 simulated buyers said yes; none of them would pay afterwards without seeing results. Set an end date (for example, the first 10 pilots, closing 31 January) so it does not teach buyers to wait. The CFO books this as 10 x $30 = $300 of startup spend.

## What to test with real buyers

Two prices inside the range, as pre-sale pages or the founder's own pitch to the warm leads:
- **A: 25 USDC reward**, about $27.50 all-in (near the panel's $25 "bargain" and the $30 midpoint).
- **B: 50 USDC reward**, about $55 all-in (the original pitch, upper-middle of the range).
Compare how many of 10 real leads agree to fund each. Success line, written before running it: **at least 3 of 10 leads fund a real task at A, or at least 2 at B.**

## The panel's top price objections, verbatim

- "For a 50 USDC task I would just ask Claude for the draft and only pay a person if it came back bad. 55 USDC with only the top entries paid, plus USDC on Solana, is more hassle and money than a small task is worth to me." (P020)
- "55 USDC for a small task I could get a first draft of from a model for free, and only the top entries get paid so I might get nothing usable for it. I'm budget-tight and want to see a sample first, and this is unaudited, invitation-only and needs USDC on Solana." (P030)
- Several buyers named **card or invoice in dollars** as the one thing that would flip them, which is a payment-method problem, not a price one.

## Rules kept

- Panel price answers pick what to test; they are not proof.
- No price below variable cost, and no fake "was $X" anchors.
- Price changes go into `numbers.json` and `/founder-cfo` re-runs.
