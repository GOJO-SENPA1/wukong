import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { fmtUsdc } from "@/lib/format";
import { breadcrumbLd, clip, pageMetadata } from "@/lib/seo";
import { getTaskSummary, isAddress } from "@/lib/server/meta";
import type { TaskSummary } from "@/lib/server/views";

type Props = { params: Promise<{ task: string }>; children: React.ReactNode };

const STATUS: Record<TaskSummary["status"], string> = {
  open: "Open for entries",
  judging: "Being judged now",
  settled: "Judged and paid out",
  cancelled: "Closed and refunded",
};

function describe(t: TaskSummary): string {
  const who = t.agent?.name ?? t.creatorName;
  const lead = `${fmtUsdc(t.reward)} USDC ${t.categoryLabel.toLowerCase()} task${who ? ` from ${who}` : ""}. ${STATUS[t.status]}, ${t.submissionCount} ${t.submissionCount === 1 ? "entry" : "entries"}.`;
  return clip(t.briefText ? `${lead} ${t.briefText}` : `${lead} The AI judge scores every entry and the best are paid automatically.`);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { task } = await params;
  const path = `/tasks/${task}`;
  const missing = pageMetadata({ title: "Task not found", description: "This task doesn't exist on Wukong, or it was removed.", path, noindex: true });
  if (!isAddress(task)) return missing;
  const r = await getTaskSummary(task);
  if (!r.found) {
    return r.known
      ? missing
      : pageMetadata({ title: "Task", description: "A task on Wukong: the reward is escrowed on Solana, an AI judge scores every entry and the best are paid in USDC.", path, ownImage: true });
  }
  return pageMetadata({ title: r.value.title, description: describe(r.value), path, type: "article", ownImage: true });
}

/** Breadcrumb structured data, streamed in after the page so a slow chain read never delays it. */
async function TaskLd({ task }: { task: string }) {
  const r = await getTaskSummary(task);
  if (!r.found) return null;
  return <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Marketplace", path: "/tasks" }, { name: r.value.title }])} />;
}

export default async function TaskLayout({ params, children }: Props) {
  const { task } = await params;
  // Not an address at all: a real 404. A valid address that isn't found yet may be a
  // task posted seconds ago, so the page itself handles that case.
  if (!isAddress(task)) notFound();
  return (
    <>
      <Suspense fallback={null}>
        <TaskLd task={task} />
      </Suspense>
      {children}
    </>
  );
}
