import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { statusKeyOk } from "@/lib/server/admin";
import { StatusView } from "./StatusView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Status", robots: { index: false, follow: false } };

/**
 * The site's health checks, for its operators only: on a public deployment it opens
 * at /status?key=<WUKONG_STATUS_KEY> and is a 404 to everyone else (and entirely,
 * when that variable isn't set).
 */
export default async function StatusPage({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams;
  if (!statusKeyOk(key)) notFound();
  return <StatusView statusKey={key ?? ""} />;
}
