# Competitors: who a buyer already uses, and the gap

Researched 2026-11-15 from public pages. **Every figure below is tagged by how well it is sourced.** Where search results conflicted, both numbers are shown. Nothing here was scraped. I did not read competitors' own homepages, so the positioning-line column in the CSV is "not fetched" rather than guessed, and ratings/review counts were not collected beyond one Trustpilot page title.

## The table (sorted by how directly each competes)

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

## Price range

Comparable item: the platform's cut on a reward a buyer posts.

- Lowest: Superteam Earn, no fee found.
- Middle: Algora ~9%, Gitcoin 10%, Braintrust 10-15%.
- Highest: Fiverr ~25% combined (20% + 5.5%), Topcoder 20% (capped $250), 99designs priced as fixed packages.
- **Wukong: 10% program default** (from `scripts/setup.ts`, admin-settable, capped at 20% in the program). It is mid-pack. It undercuts Fiverr and Topcoder and loses to Superteam's zero-fee claim, so the fee is not a reason to win the Solana-native buyer.

## Positioning map (text)

Axes: **who judges** (buyer by hand, to automated public rubric) and **when the money is locked** (after hiring, to before anyone starts).

- Fiverr, Upwork, Braintrust: buyer judges, money moves after a hire.
- 99designs, Topcoder: buyer judges (many compete), platform holds funds.
- Kaggle: automated leaderboard, but only for ML tasks and at enterprise budgets.
- Superteam Earn, Algora, Gitcoin: sponsor judges by hand, with escrow on some (Superteam per [Solana Compass](https://solanacompass.com/projects/Superteam)).
- **Wukong: automated public rubric judge, money locked first, any measurable task.** That corner is empty in the sources I found. Kaggle is the nearest and is much heavier and ML-only.

## What their customers complain about (ranked)

1. **Spec work and the losers' odds** (99designs-style contests). Designer-side criticism is long-running and ethical: unpaid work, low payouts, long odds ([SpecWatch interview](https://webdesignerdepot.com/interview-with-specwatch-the-naked-truth-about-design-contests), [Speckyboy](https://speckyboy.com/thoughts-on-why-spec-work-is-bad-and-why-you-shouldnt-do-it/), [UTS ePress paper](https://epress.lib.uts.edu.au/journals/index.php/csrj/article/view/2480/3451)). Sources are mostly old and advocacy-flavoured. **This is the objection your own design-agency leads raised.**
2. **Scams, fake accounts and unreliable freelancers** (Upwork, Fiverr): [Kimola's Trustpilot analysis](https://kimola.com/reports/upwork-feedback-analysis-dive-into-user-experiences-trustpilot-en-us-141155), [Moonlock](https://moonlock.com/fiverr-scams).
3. **Quality and undisclosed AI-generated work** (Fiverr): [golance review](https://golance.com/blogs/is-fiverr-legit-2026-review), [OneRep](https://onerep.com/blog/fiverr-scams-how-to-recognize-and-avoid-them). Anecdotal.
4. **Fees and paying just to pitch** (Upwork Connects, 20% fee on first $500 with a client): [Kimola](https://kimola.com/reports/upwork-review-terrible-support-freelancer-protection-142944), G2 reviews.
5. **Slow, one-sided dispute resolution** (Fiverr, Upwork): same Kimola reports, [Fiverr forum](https://community.fiverr.com/public/forum/boards/support-and-troubleshooting-by1/posts/335454-how-a-buyer-ruined-my-fiverr-career-and-the-customer-support-did-nothing-to-protect-me).
6. **AI slop flooding bounty programs.** Turso retired its bounty ([Neowin](https://www.neowin.net/news/turso-retires-bug-bounty-program-because-most-critical-issues-are-just-ai-slop/)); cURL changed its program ([Bugcrowd](https://www.plushcap.com/content/bugcrowd/blog/bugcrowd-hacker-opinion-piece-how-lazy-hacking-killed-curls-bug-bounty)); Bram Cohen argues [submissions should require deposits](https://bramcohen.com/p/bug-bounty-submissions-should-require). I found no direct reports of Superteam Earn payout problems.

Themes 2-4 are thin where marked anecdotal. Theme 1 is the long-documented one.

## The gap

**Trustworthy judging at scale when entries are cheap to fake.** The new pain in bounty and contest systems is AI-generated spam burying the real work (theme 6), and the old pain is hand-picked winners and holding the buyer's money (themes 2, 5). Wukong's pieces line up: an entry stake that is slashed for spam, a judge that must quote the entry to score it, deterministic checks that code enforces, and escrow before work. Backed by WukongBench (96.5% pairs ranked correctly, 25/25 attacks, with the caveat that your team wrote the dataset).

**Where there is no gap:** subjective creative work. Design agencies reject contests on principle (themes 1 and your leads), and AI judging of taste is the hardest to defend. The evidence favours the measurable categories (code with tests, translation, labeling, constrained copy).

## The threat

- **Superteam Earn** can copy fastest: same chain, existing sponsors and contributors, USDC, apparently no fee. If it adds automated scoring, Wukong's edge shrinks to the judge's quality.
- **Fiverr or Upwork** could add AI vetting or contests at huge scale, though their models center on hiring one person.
- **A plain LLM** answering the buyer's request directly is the cheapest substitute for small copy and translation tasks. Wukong's answer is verifiability and multiple human attempts, not cheaper drafts, and that needs proving with real buyers.
