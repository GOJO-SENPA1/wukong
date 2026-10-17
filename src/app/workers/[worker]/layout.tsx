import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProfileLd } from "@/components/seo/ProfileLd";
import { pageMetadata } from "@/lib/seo";
import { shortAddr } from "@/lib/format";
import { getWorkerSummary, isAddress, type WorkerSummary } from "@/lib/server/meta";

type Props = { params: Promise<{ worker: string }>; children: React.ReactNode };

function nameOf(w: WorkerSummary): string {
  const p = w.profile;
  if (p) return p.role === "company" ? p.company || p.displayName : p.displayName;
  return w.name?.split(" · ")[0] || `Worker ${shortAddr(w.wallet)}`;
}

/** A wallet with a handle has one public address for its profile: /@handle. */
function pathOf(w: WorkerSummary): string {
  return w.profile?.handle ? `/@${w.profile.handle}` : `/workers/${w.wallet}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { worker } = await params;
  if (!isAddress(worker)) return pageMetadata({ title: "Profile not found", description: "That isn't a Solana address.", path: `/workers/${worker}`, noindex: true });
  const r = await getWorkerSummary(worker);
  if (!r.found) {
    return pageMetadata({ title: `Worker ${shortAddr(worker)}`, description: "A freelancer's public record on Wukong: scores, wins and earnings, read from the chain.", path: `/workers/${worker}` });
  }
  const w = r.value;
  const record = w.submissions
    ? `${w.submissions} ${w.submissions === 1 ? "entry" : "entries"}, ${w.wins} ${w.wins === 1 ? "win" : "wins"}, rating ${w.rating}.`
    : "No entries yet.";
  return pageMetadata({
    title: nameOf(w),
    description: `${nameOf(w)}'s public record on Wukong, read from the chain: ${record}`,
    path: pathOf(w),
    type: "profile",
    // A wallet nobody has used yet is an empty page: keep it out of search.
    noindex: !w.submissions && !w.profile,
  });
}

async function WorkerLd({ worker }: { worker: string }) {
  const r = await getWorkerSummary(worker);
  if (!r.found || (!r.value.submissions && !r.value.profile)) return null;
  return <ProfileLd path={pathOf(r.value)} name={nameOf(r.value)} profile={r.value.profile} wallet={worker} />;
}

export default async function WorkerLayout({ params, children }: Props) {
  const { worker } = await params;
  if (!isAddress(worker)) notFound();
  return (
    <>
      <Suspense fallback={null}>
        <WorkerLd worker={worker} />
      </Suspense>
      {children}
    </>
  );
}
