"use client";

import { use } from "react";
import { WorkerProfile } from "@/components/WorkerProfile";

export default function WorkerPage({ params }: { params: Promise<{ worker: string }> }) {
  const { worker } = use(params);
  return <WorkerProfile worker={worker} />;
}
