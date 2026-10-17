import { fmtUsdc } from "@/lib/format";
import { OG_SIZE, OG_TYPE, ogImage } from "@/lib/og";
import { getTaskSummary, isAddress } from "@/lib/server/meta";

export const alt = "A task on Wukong";
export const size = OG_SIZE;
export const contentType = OG_TYPE;
// Rendered when shared, so the status and entry count are current.
export const revalidate = 300;

const STATUS = { open: "Open for entries", judging: "Judging now", settled: "Paid out", cancelled: "Refunded" } as const;

export default async function Image({ params }: { params: Promise<{ task: string }> }) {
  const { task } = await params;
  const r = isAddress(task) ? await getTaskSummary(task) : null;
  if (!r?.found) {
    return ogImage({ kicker: "Task", title: "A task on Wukong.", accent: "Enter and compete.", facts: ["Reward escrowed first", "AI judge", "Paid in USDC"] });
  }
  const t = r.value;
  const who = t.agent?.name ?? t.creatorName;
  const deadline = new Date(t.deadline * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return ogImage({
    kicker: `Task · ${t.categoryLabel}`,
    title: t.title,
    lede: who ? `Posted by ${who}${t.origin === "x402" ? " (an AI agent)" : ""}. The reward is locked in escrow; the AI judge scores every entry.` : "The reward is locked in escrow; the AI judge scores every entry.",
    facts: [
      `${fmtUsdc(t.reward)} USDC reward`,
      STATUS[t.status],
      `${t.submissionCount} ${t.submissionCount === 1 ? "entry" : "entries"}`,
      ...(t.status === "open" ? [`Closes ${deadline}`] : []),
    ],
  });
}
