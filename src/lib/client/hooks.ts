"use client";

import { useEffect, useState } from "react";
import { getJSON } from "./api";
import type { workerView } from "@/lib/server/views";

export type WorkerData = Awaited<ReturnType<typeof workerView>>;

/** A worker's reputation, balance and history, refreshed every few seconds. */
export function useWorker(pubkey: string | null | undefined, every = 8000) {
  const [data, setData] = useState<WorkerData | null>(null);
  useEffect(() => {
    if (!pubkey) return setData(null);
    let alive = true;
    const load = () =>
      getJSON<WorkerData>(`/api/workers/${pubkey}`)
        .then((d) => alive && setData(d))
        .catch(() => {});
    load();
    const id = setInterval(load, every);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [pubkey, every]);
  return data;
}
