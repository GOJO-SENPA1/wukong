# Offer

Built with the Offers lens (a summary of a published framework, not anyone's words). The raw material is `panel-v1/results.md` (why 35 of 40 simulated buyers passed), `competitors.md`, `board.md` and the CFO's numbers.

## 1. The problem list (in the buyer's words)

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

## 2. Solutions, trimmed (value to the buyer 1-5, cost to deliver 1-5; cost from `cfo.md`)

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

## 3. The stack (only what is deliverable now)

- **The core:** "Pay only for the best, and see exactly why it won." Describe the outcome, not the escrow.
- **Bonus 1, I set it up for you:** the founder writes the rubric with the buyer from a template and the buyer approves it before anything goes live.
- **Bonus 2, free first task:** the founder funds up to 30 USDC of reward for each of the first 10 organisations.
- **Bonus 3, see the proof:** the public benchmark and a named founder; later, the pilots' own reports.
- **The guarantee:** refund if no entry clears the bar (built). The pitch also said "I re-run once if you are unhappy, at no cost." **That is not affordable as written.** A re-run means the founder re-funds a $30 reward plus about $1 of review time, so it costs more than the whole $3.00 fee at any claim rate above **9.7%** (2% claims cost $0.62 a task, 5% cost $1.55, 10% cost $3.10, 20% cost $6.20). **Recommended wording:** free re-run for the first 10 pilots (already inside the $300 pilot budget), and after that a free re-judge and rubric fix with no new reward.
- **Urgency, real:** the first 10 organisations only, ending 31 January. Not a fake countdown.
- **The name:** *The Wukong Pilot: your first task, set up for you.*

## 4. The value equation (1-10, my judgment, not measured)

| element | before | after | what moved it |
| --- | ---: | ---: | --- |
| dream outcome | 6 | 6 | unchanged: a usable result without hiring one person |
| likelihood of getting it | 3 | 5 | named founder, public benchmark, refund, capped spend |
| time to the result | 6 | 6 | unchanged |
| effort and sacrifice | 3 | 6 | founder writes the rubric and funds the first task; wallet and USDC still hurt |

## 5. The re-test: same 20 buyers, old offer vs new offer

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

## 6. What the offer cannot fix without building something

1. **Card or invoice funding in dollars.** The product asks for USDC on Solana. A fiat on-ramp needs engineering and has money-handling rules attached. (The founder paying USDC on a buyer's behalf and invoicing in dollars would work operationally but touches money-handling and tax rules, so check with an accountant and a lawyer before doing it for anyone.)
2. **An independent audit** before real money, or a hard cap on every escrow until then.
3. **A written appeal path and a visible reason for every loser** (the reasons exist; the appeal process does not).
4. **Real references,** which only the pilots can create.

Rules kept: every promise above is deliverable now or marked not built; no fake scarcity, reviews or testimonials; panel quotes are research, not testimonials. Follow the advertising and consumer rules of each market for guarantees. Not legal advice.
