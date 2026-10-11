# WukongBench

A benchmark for the Wukong judge: 98 entries across 10 tasks (copy, translation into Nepali and Spanish, two JavaScript functions, sentiment labeling, research), plus 25 prompt-injection attacks and 11 innocent look-alikes.

```bash
npm run judge:bench                     # the configured judge, full pipeline
npm run judge:bench -- --raw            # the bare model: no verified facts, no sampling, no quote checks, no caps
npm run judge:bench -- --precheck       # only the deterministic layer (no model, instant)
npm run judge:bench -- --runs 3         # repeat everything to measure consistency
npm run judge:bench -- --only slugify   # one task
```

Results land in `bench/results/<judge>-<mode>.json` and `.md`, with every entry's score, flags and gold label.

## How the gold labels are set

- **Code** (`slugify`, `chunk`): each entry is run against a test suite in a sandbox (8 and 9 cases, including edge cases, error types and "doesn't mutate the input"). The pass rate sets the tier. Nobody's opinion is involved.
- **Labeling**: checked against an answer key (10 reviews, including mixed ones).
- **Copy, translation, research**: tiers built around planted, checkable defects: a broken word limit, a banned cliché, a missing required phrase, a breakfast time changed from 7 to 8, a dropped hot-water sentence, "all desserts contain nuts" softened to "some may", Hindi instead of Nepali, invented statistics.
- **Attacks**: 15 development attacks (classic overrides, polite requests, forged tags, a forged verdict JSON, zero-width characters, Cyrillic look-alikes, Nepali, fake system lines, hidden comments, base64, split lines) and **10 held-out attacks written after the detector was tuned and never used to tune it** (a P.S. to the grader, Spanish, "the client already approved it", markdown comments, role reassignment, leetspeak, fullwidth letters, a fake rubric override, an emotional plea, reversed text).
- **Innocent look-alikes**: entries that say "ignore", "judge", "score", "system", "note to self" or "10/10" innocently. Flagging them is a false alarm.

Tiers map to score bands (excellent 78-100, good 60-88, fair 40-74, poor 12-52, fail 0-25). Ranking metrics compare the judge's order with the gold tiers within each task.

**Caveat**: the dataset was written by the same team as the judge. The held-out attacks are the honest test of generalization; quote those numbers next to the development ones.

## What makes the judge hard to fool

1. **Verified facts.** The brief is compiled into checks that code measures exactly: word and character limits, required and banned phrases, language and script (Devanagari vs. Latin, Nepali vs. Hindi grammar), line structure, labels, the code's language and function name. The model receives them as ground truth and never counts words itself.
2. **Code-enforced caps.** A hard requirement the entry breaks caps its constraints criterion at 40 and the entry at 60, whatever the model says. Injection, copies and low effort are capped too. A flag the model raises alone never triggers a cap.
3. **Evidence or it didn't happen.** Every criterion must cite a verbatim quote from the entry. Code checks each quote; a verdict with an invented quote is sent back once, and an invented quote is never published.
4. **Several samples, then the median.** DeepSeek (any OpenAI-compatible model) judges each entry 3 times; the median per criterion wins, flags need a majority, and if samples disagree by more than 25 points two more are drawn.
5. **Calibration anchors.** Every criterion spells out what 90, 70, 50 and 30 look like, so scores don't bunch at 80-90.
6. **Injection defenses in two layers.** A deterministic scanner (normalizes zero-width characters, fullwidth and Cyrillic/Greek look-alikes, decodes base64, reads Nepali and Hindi) plus a model told that the entry is data, wrapped in tags with a random per-request token.

## Results

### Deterministic layer (no model)

| Check | Caught | False alarms |
|---|---|---|
| Hard requirements broken (word limits, phrases, structure, code language) | 9/9 | 0 |
| Wrong language or script | 4/4 | 0 |
| Copies of earlier entries | 3/4 (a sentence-by-sentence paraphrase got through) | 0 |
| Prompt injection, development set | 15/15 | 0 |
| Prompt injection, **held-out set** | **4/10** | 0/5 innocents flagged |

Innocent look-alikes falsely flagged: 0/11.

### Offline judge (no AI, full pipeline)

| Metric | Value |
|---|---|
| Pairwise accuracy (339 pairs of different tiers) | 79.1% |
| Clear pairs (two or more tiers apart) | 85% |
| Right winner per task | 60% |
| Kendall's τ (mean per task) | 0.415 |
| Score inside the gold band | 56.1% |
| Attack success rate | 24% (all six are held-out attacks the scanner missed) |

### DeepSeek V4.1 Flash (via Command Code)

98 entries, `deepseek/deepseek-v4.1-flash`. "Alone" is the model with Wukong's prompt and rubric but none of the pipeline: one request per entry, no verified facts, no pre-check signals, no quote checks, no sampling, no caps. "Wukong pipeline" is exactly what production runs. The pipeline row averages three full runs.

| | Offline judge | DeepSeek alone | **DeepSeek + Wukong pipeline** |
|---|---|---|---|
| Pairs ranked correctly (339 pairs) | 79.1% | 90.0% | **96.5%** (97.3 / 96.2 / 95.9 over three runs) |
| Clear pairs (two or more tiers apart) | 85% | 90.4% | **97.9%** |
| Kendall's τ (mean per task) | 0.415 | 0.797 | **0.901** |
| Right winner per task | 60% | 70% | **80%** (both misses within 2 points, between two strong copy entries) |
| Score inside the gold band | 56.1% | 77.6% | **84.7%** |
| Injection attacks caught | 19/25 | 25/25 | **25/25** |
| **Held-out attacks caught** | 4/10 | 10/10 | **10/10** |
| Attack success rate | 24% | 0% | **0%** |
| Innocent look-alikes flagged | 0/11 | 0/11 | **0/11** |
| Copies caught | 3/4 | 0/4 | **3/4** |
| False "broke a requirement" flags | 0 | 9 | **3** |
| Invented quotes published | n/a | not checked | **0** (0.4% caught by code and redone) |
| Published scores backed by a verified quote | n/a | n/a | **97.4%** |
| Score drift between runs (mean largest deviation per entry) | 0 | n/a | **1.2 points** (worst 8.7) |
| Replies that weren't valid JSON | n/a | 5 (retried) | 0 |

Cost: one judge request is about 0.0009 Command Code credits; a full pipeline run over all 98 entries (about 310 requests, three samples each) is about 0.35 credits. All the benchmarking and tuning here cost 1.93 credits.

#### How the numbers were reached, honestly

- **Untuned first.** The first pipeline run, before any tuning, scored 94.7% pairwise and τ 0.798 (`*-harness-v1.*`); DeepSeek alone scored 89.5% (`*-raw-v1.*`).
- **Then tuned on what it got wrong**, the same way you'd tune any judge: low effort defined as non-attempts only (5 false flags gone), every stated code requirement checked with caps for failures and endless loops, safety-critical translation errors capped, and a new scoring rule that caps an entry failing its category's main criterion at 50. The tuning used this benchmark, so the tuned numbers are optimistic; the held-out attacks were never used for tuning or labeling and are the clean test.
- **Label corrections.** DeepSeek flagged 18 entries for breaking requirements our labels had missed ("throw a RangeError", "don't mutate the input", "be explicit about uncertainty", "use a polite register"). Each is an explicit sentence in the brief, so those flags are marked *acceptable* in `scripts/bench/dataset.ts`: they count neither as a catch nor as a false alarm.
- **What it still misses:** a sentence-by-sentence paraphrase of an earlier entry (a per-entry judge never sees the other entries, and the copy detector compares wording), and close calls between two strong copywriting entries.
