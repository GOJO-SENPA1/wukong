"use client";

import { use, useEffect, useState } from "react";
import { WorkerProfile } from "@/components/WorkerProfile";
import Link from "next/link";
import { Container, EmptyState, Skeleton } from "@/components/ui";

/** wukonghq.xyz/@handle (rewritten here) and /u/handle: a profile by its handle. */
export default function HandlePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = use(params);
  const [wallet, setWallet] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    fetch(`/api/profiles/${encodeURIComponent(decodeURIComponent(handle).replace(/^@/, ""))}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setWallet(d?.profile?.wallet ?? null))
      .catch(() => setWallet(null));
  }, [handle]);
  if (wallet === undefined)
    return (
      <>
        <div className="h-64 border-b border-line" />
        <Container>
          <Skeleton className="h-40" />
        </Container>
      </>
    );
  if (!wallet)
    return (
      <Container>
        <EmptyState
          title="No one goes by that handle"
          actions={
            <>
              <Link href="/leaderboard" className="btn btn-red h-11 px-5">
                See the leaderboard
              </Link>
              <Link href="/signin" className="btn btn-line h-11 px-5">
                Claim a handle
              </Link>
            </>
          }
        >
          Handles are 3 to 20 letters, numbers or underscores. Check the spelling, or find people on the leaderboard.
        </EmptyState>
      </Container>
    );
  return <WorkerProfile worker={wallet} />;
}
