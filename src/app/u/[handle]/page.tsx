"use client";

import { use, useEffect, useState } from "react";
import { WorkerProfile } from "@/components/WorkerProfile";
import { Container, Empty, Skeleton } from "@/components/ui";

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
        <div className="h-64 bg-navy" />
        <Container>
          <Skeleton className="h-40" />
        </Container>
      </>
    );
  if (!wallet)
    return (
      <Container>
        <Empty>No one goes by that handle.</Empty>
      </Container>
    );
  return <WorkerProfile worker={wallet} />;
}
