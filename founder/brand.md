# Brand

Built from `marketing.md` (positioning and first audience), `competitors.md`, and the panel's reasons. The product already has a name, a tagline and a dark visual system (`design/`, `src/app/globals.css`), so this document **checks** what exists and flags what to fix. It does not restart the brand.

## 1. The name: a real risk to look at before real money

**Wukong is a strong story and a crowded name.** The Monkey King and the "hundred copies from one hair" image match the product exactly (a buyer gets a hundred attempts). But a public search of trademark aggregator pages (third-party sites, **not** an official register) turned up:

- **WUKONG (DingTalk), serial 99774216, Class 42 (software services), filed 20 April 2026, pending.** The closest conflict for a software product.
- **WUKONG (LAN Global), reg. 6422368, Classes 9, 41, 16, 35, registered.** Class 35 overlaps with a marketplace.
- **BLACK MYTH WUKONG**, several filings, including software-related services (one with a notice of allowance issued) and the very well known game of that name, so confusion in search and in people's heads is likely.
- UK filings for WUKONG in Class 42 also appeared in the UK journal.

Sources (aggregators, check each against the official register before relying on any): [WUKONG, serial 99774216](https://gleanmark.com/trademark/uspto-99774216), [WUKONG, serial 79292704](https://gleanmark.com/trademark/uspto-79292704), [BLACK MYTH WUKONG](https://trademarks.justia.com/905/64/black-myth-90564367.html), [UK Trade Mark Journal 2026/022](https://www.ipo.gov.uk/t-tmj.htm/t-tmj/tm-journals/2026-022/UK00004386038.html).

**What this does not tell you:** whether a clearance lawyer would call any of these a conflict for a work marketplace on a blockchain. A pending mark by a large company in Class 42 is the one that worries me most. **I am not a lawyer and I only ran public searches; nothing is registered by Wukong, and a trademark lawyer must confirm.**

### Ten candidates (in case the check goes badly)

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

## 2. The promise and the tagline

**The promise (what a buyer can count on every time):** *You only pay for the best result, and you can see exactly why it won.*

**Tagline options:**
1. **"Post a task. Summon the crowd. Pay the best."** (current, from the README; good, keep it)
2. "Many tries. One fair score. Pay for the best."
3. "Work you can verify."

## 3. Voice

Three adjectives, with a do and a don't each:

- **Plain.** *Do:* "The reward is locked before anyone starts." *Don't:* "Trustless on-chain escrow primitives."
- **Honest.** *Do:* "Losers work unpaid today; here is what they get instead." *Don't:* "A fair marketplace for everyone."
- **Exact.** *Do:* "96.5% of pairs ranked correctly, on a benchmark our own team wrote." *Don't:* "Industry-leading accuracy."

Before and after, from `pitch.md`: *Before:* "Wukong, a work marketplace at wukonghq.xyz." *After:* "Pay only for the best result, and see exactly why it won."

## 4. The look: a brief for what already exists

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

## Rules kept

No competitor's name, logo, colours or tagline was copied. No fonts or images are used without a right to use them. Not legal advice on trademarks.
