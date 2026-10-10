// Result emails. notifyTask(task) reads the task from the chain and sends
// whatever is due, once: each (user, kind, task) gets a Notification row before
// its email goes out, and the row's unique key makes repeats a no-op. Safe to
// call from the judge, the keeper, cron and the relay as often as they like.

import { PublicKey } from "@solana/web3.js";
import { fetchSubmissions, fetchTask, type SubmissionView, type TaskView } from "../wukong";
import { accountsEnabled, profilesByWallets } from "./accounts";
import { db } from "./db";
import { emailEnabled, sendEmail, type EmailContent } from "./email";
import { program } from "./env";

const usdc = (base: number) => (base / 1_000_000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const place = (rank: number) => ["", "1st", "2nd", "3rd"][rank] ?? `#${rank}`;

type Profiles = Awaited<ReturnType<typeof profilesByWallets>>;

/** Claim the (user, kind, task) slot; false if it was already claimed. */
async function claim(userId: string, kind: string, task: string, payload: object): Promise<boolean> {
  try {
    await db().notification.create({ data: { userId, kind, task, payload } });
    return true;
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") return false;
    throw err;
  }
}

async function deliver(p: Profiles[number], kind: string, task: string, subject: string, content: EmailContent, payload: object) {
  if (!(await claim(p.userId, kind, task, payload))) return;
  if (!p.emailOnWin || !p.user.email || !emailEnabled()) return;
  if (await sendEmail(p.user.email, subject, content)) {
    await db().notification.update({ where: { userId_kind_task: { userId: p.userId, kind, task } }, data: { emailedAt: new Date() } });
  }
}

function entrantEmail(t: TaskView, s: SubmissionView): { subject: string; content: EmailContent } {
  const score = (s.score / 100).toFixed(1);
  const path = `/tasks/${t.pubkey}`;
  if (s.payout > 0) {
    return {
      subject: `You placed ${place(s.rank)}: +${usdc(s.payout)} USDC`,
      content: {
        kicker: "You won",
        headline: `${place(s.rank)} place on “${t.title}”`,
        paragraphs: [`Your entry scored ${score} out of 100. The payout is already in your wallet.`],
        highlight: { value: `+${usdc(s.payout)} USDC`, caption: "paid to your wallet on Solana" },
        cta: { label: "See the results", path },
      },
    };
  }
  return {
    subject: `Results are in: “${t.title}”`,
    content: {
      kicker: "Results are in",
      headline: `Your entry scored ${score}`,
      paragraphs: [`“${t.title}” has been judged. Read the judge's report on your entry to see what worked and what to try next time.`],
      highlight: { value: `${score} / 100`, caption: s.rank ? `${place(s.rank)} place` : "not on the podium this time" },
      cta: { label: "Read your report", path },
    },
  };
}

export async function notifyTask(taskKey: string): Promise<void> {
  if (!accountsEnabled()) return;
  const prog = program();
  const pk = new PublicKey(taskKey);
  const t = await fetchTask(prog, pk);
  if (!t) return;
  const subs = await fetchSubmissions(prog, pk);
  const shortlistReady = t.status === "judging" && t.judgeMode === "creatorPicks" && t.submissionCount > 0 && t.scoredCount === t.submissionCount;
  if (t.status !== "settled" && !shortlistReady) return;

  const profiles = await profilesByWallets([t.creator, ...subs.map((s) => s.worker)]);
  const byWallet = new Map(profiles.map((p) => [p.wallet, p]));
  const creator = byWallet.get(t.creator);
  const path = `/tasks/${t.pubkey}`;

  if (shortlistReady) {
    if (creator)
      await deliver(creator, "shortlist", t.pubkey, `Pick your winner: “${t.title}”`, {
        kicker: "Shortlist ready",
        headline: "The AI shortlist is in. Your pick.",
        paragraphs: [`All ${t.submissionCount} entries on “${t.title}” are scored. Choose the winner from the top three; the payout goes out the moment you pick.`],
        cta: { label: "Pick the winner", path },
      }, { scored: t.scoredCount });
    return;
  }

  for (const s of subs) {
    const p = byWallet.get(s.worker);
    if (!p || !s.scored) continue;
    const { subject, content } = entrantEmail(t, s);
    await deliver(p, "judged", t.pubkey, subject, content, { score: s.score, rank: s.rank, payout: s.payout });
  }
  if (creator) {
    const paid = subs.filter((s) => s.payout > 0).length;
    const refunded = t.paidOut === 0;
    await deliver(
      creator,
      refunded ? "refunded" : "paid_out",
      t.pubkey,
      refunded ? `Refunded: “${t.title}”` : `Paid out: “${t.title}”`,
      refunded
        ? {
            kicker: "Refunded",
            headline: "No entry cleared the quality bar",
            paragraphs: [`Nothing on “${t.title}” scored 25 or more, so your full reward went back to your wallet, with no fee.`],
            highlight: { value: `${usdc(t.reward)} USDC`, caption: "returned to your wallet" },
            cta: { label: "See the entries", path },
          }
        : {
            kicker: "Paid out",
            headline: `${paid} ${paid === 1 ? "winner" : "winners"} paid on “${t.title}”`,
            paragraphs: [`Every entry was scored in public and the escrow released in one transaction. The full judge reports are on the task page.`],
            highlight: { value: `${usdc(t.paidOut)} USDC`, caption: `paid from escrow to ${paid} ${paid === 1 ? "person" : "people"}` },
            cta: { label: "See the results", path },
          },
      { paidOut: t.paidOut, winners: paid },
    );
  }
}

/** Fire-and-forget wrapper: never let email trouble break judging or settlement. */
export async function notifyTaskSafe(taskKey: string): Promise<void> {
  try {
    await notifyTask(taskKey);
  } catch (err) {
    console.error("notify:", (err as Error).message);
  }
}
