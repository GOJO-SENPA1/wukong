import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { A, Doc, List, Mail } from "@/components/legal/Doc";
import { CATEGORIES, RUBRIC_VERSION } from "@/lib/categories";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = pageMetadata({
  title: "Task and judging rules",
  description: "How every Wukong task runs: entering, how the AI judge scores, the caps it applies, who gets paid and how stakes work.",
  path: "/rules",
  ownImage: true,
  type: "article",
});

const L = LEGAL;

const CAPS: [string, string][] = [
  ["Breaks a hard requirement in the brief (a word limit, a required or banned phrase, the language, the code language)", "Constraints criterion at most 40, total at most 60"],
  ["Scores under 35 on the category's main criterion (brief fit, accuracy, correctness, label accuracy or insight)", "Total at most 50"],
  ["Tries to manipulate the judge (hidden instructions, prompt injection), is unsafe, or has no real content", "0"],
  ["Copies an earlier entry", "At most 10"],
  ["Isn't a real attempt at the task", "At most 15"],
  ["Is in the wrong language or script", "At most 35"],
];

const sections = [
  {
    id: "lifecycle",
    title: "How a task runs",
    body: (
      <List>
        <li>
          <b>Open.</b> The poster locks the reward in escrow and the task takes entries until its deadline or until the poster closes it.
        </li>
        <li>
          <b>Judging.</b> Entries are revealed and the AI judge scores each one. Every score is published on-chain with a hash of its written report.
        </li>
        <li>
          <b>Paid out.</b> The program pays the winners from escrow in one transaction, or refunds the poster if nothing clears the quality bar.
        </li>
      </List>
    ),
  },
  {
    id: "entering",
    title: "Entering",
    body: (
      <List>
        <li>One entry per wallet per task, up to the task&apos;s entry limit (at most {L.maxEntries}).</li>
        <li>Some tasks require a minimum on-chain rating, or a refundable entry stake.</li>
        <li>Your entry is stored by Wukong and committed on-chain as a sha256 hash. Nobody, including the poster, sees it until submissions close.</li>
        <li>The judge only scores an entry whose content matches its on-chain hash, so an entry can&apos;t be changed after it is submitted.</li>
      </List>
    ),
  },
  {
    id: "judging",
    title: "How the judge scores",
    body: (
      <>
        <List>
          <li>
            <b>Checks in code first.</b> The brief is turned into facts that code measures exactly: word and character limits, required and banned phrases,
            language and script, line structure, labels, and the code&apos;s language and function name. Entries are also checked for copies of earlier entries,
            spam and attempts to manipulate the judge.
          </li>
          <li>
            <b>Then the AI judge.</b> It scores each criterion of the task&apos;s rubric from 0 to 100 and must quote the entry word for word to justify each score. Code
            checks every quote, and a verdict with an invented quote is redone. For most entries the judge scores several times and takes the middle score for each
            criterion.
          </li>
          <li>
            <b>The final score</b> is the weighted sum of the criteria, then the caps below. It is published on-chain with a hash of the full report, and the report
            is shown with the entry, including what to improve next time.
          </li>
        </List>
        <p>The judge&apos;s measured accuracy and its known limits are published at <a className="text-fg underline decoration-line-2 underline-offset-4 hover:decoration-gold" href="/benchmarks">wukonghq.xyz/benchmarks</a>.</p>
      </>
    ),
  },
  {
    id: "caps",
    title: "Caps the judge applies",
    body: (
      <>
        <p>These caps are applied by code, whatever the AI says. A flag raised by the AI alone, without the checks agreeing, never triggers a cap.</p>
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[520px] text-left text-[14px]">
            <thead className="bg-fg/[0.03] font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint">
              <tr>
                <th className="px-4 py-3 font-medium">If the entry…</th>
                <th className="px-4 py-3 font-medium">Score</th>
              </tr>
            </thead>
            <tbody>
              {CAPS.map(([when, cap]) => (
                <tr key={when} className="border-t border-line align-top">
                  <td className="px-4 py-3 text-fg/80">{when}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold">{cap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    ),
  },
  {
    id: "rubrics",
    title: "Rubrics",
    body: (
      <>
        <p>Every task uses its category&apos;s rubric (version {RUBRIC_VERSION}). The first criterion in each list is the category&apos;s main criterion.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {CATEGORIES.map((c) => (
            <div key={c.id} className="rounded-2xl border border-line bg-fg/[0.02] p-4">
              <div className="text-[15px] font-semibold text-fg">{c.label}</div>
              <ul className="mt-3 flex flex-col gap-2.5">
                {c.criteria.map((k) => (
                  <li key={k.key} className="text-[13.5px] leading-relaxed">
                    <span className="font-semibold text-fg">{k.label}</span> <span className="font-mono text-[12px] text-gold">{Math.round(k.weight * 100)}%</span>
                    <span className="block text-muted">{k.guide}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    id: "winners",
    title: "Who gets paid",
    body: (
      <List>
        <li>Only entries scoring {L.qualityBar} or more can win. If none does, the whole reward goes back to the poster.</li>
        <li>The highest scores win. If two entries tie, the earlier entry ranks first.</li>
        <li>
          Wukong&apos;s fee ({L.feePercent}% of the reward on the tasks posted today, fixed when a task is posted) is taken first. Then the rest is paid to the winners:
          all of it to first place in &ldquo;winner takes all&rdquo; tasks, or 50%, 30% and 20% in &ldquo;top three&rdquo; tasks. If fewer than three entries qualify,
          the unclaimed shares go to first place.
        </li>
        <li>
          In &ldquo;AI shortlists, I pick&rdquo; tasks the poster chooses the winner from the AI&apos;s top three within the task&apos;s pick window. If the poster
          doesn&apos;t pick in time, anyone can trigger the payout to the AI&apos;s top entry.
        </li>
        <li>Payouts are sent by the program directly to the winners&apos; wallets in USDC.</li>
      </List>
    ),
  },
  {
    id: "stakes",
    title: "Entry stakes",
    body: (
      <List>
        <li>A stake is a refundable deposit that discourages spam. The prize is funded only by the poster.</li>
        <li>After judging, an entry scoring {L.spamBar} or more gets its stake back. An entry scoring under {L.spamBar} forfeits it to the Wukong treasury.</li>
        <li>If judging never finishes, every stake is returned.</li>
      </List>
    ),
  },
  {
    id: "timeouts",
    title: "If something stalls",
    body: (
      <List>
        <li>If judging hasn&apos;t finished {L.judgeTimeoutDays} days after submissions close, anyone can trigger a refund of the reward to the poster, and stakes are returned.</li>
        <li>A poster can cancel a task, with a full refund, only while it has no entries.</li>
      </List>
    ),
  },
  {
    id: "reviews",
    title: "Reviews and appeals",
    body: (
      <p>
        If you think an entry was scored wrongly, email <Mail /> within {L.reviewDays} days of the result with the task link and what you think the judge got wrong. A
        person will review it, explain the outcome and, if the judge made an error, tell you how we will put it right. Payouts already settled on-chain can&apos;t be
        reversed. See our <A href="/terms">Terms</A>.
      </p>
    ),
  },
  {
    id: "reputation",
    title: "Reputation",
    body: (
      <p>
        Each scored entry updates your on-chain reputation: submissions, average score, wins, podium places, earnings and a rating. Podium places add to your rating
        and entries scoring under {L.spamBar} lower it. Tasks can require a minimum rating to enter.
      </p>
    ),
  },
];

export default function RulesPage() {
  return (
    <Doc
      kicker="How it works"
      title={
        <>
          Task and judging <em>rules</em>
        </>
      }
      lede="The rules every Wukong task runs on: entering, how the AI judge scores, the caps it applies, who gets paid and what happens to stakes. The numbers here are the ones the program and the judge enforce."
      current="/rules"
      sections={sections}
    />
  );
}
