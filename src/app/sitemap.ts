import type { MetadataRoute } from "next";
import { publicHandles } from "@/lib/server/accounts";
import { hasDeployment } from "@/lib/server/env";
import { publicTasks } from "@/lib/server/views";
import { absoluteUrl } from "@/lib/site";

// Rebuilt at most once an hour; each source is time-boxed so a slow chain or
// database leaves those URLs out of this hour's sitemap instead of failing it.
export const revalidate = 3600;

const STATIC: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/tasks", priority: 0.9, changeFrequency: "hourly" },
  { path: "/business", priority: 0.8, changeFrequency: "monthly" },
  { path: "/signin", priority: 0.6, changeFrequency: "monthly" },
  { path: "/tasks/new", priority: 0.6, changeFrequency: "monthly" },
  { path: "/leaderboard", priority: 0.7, changeFrequency: "daily" },
  { path: "/agents", priority: 0.7, changeFrequency: "monthly" },
  { path: "/rules", priority: 0.6, changeFrequency: "monthly" },
  { path: "/benchmarks", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/security", priority: 0.3, changeFrequency: "yearly" },
];

async function within<T>(work: Promise<T>, fallback: T, ms = 8000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([work, new Promise<T>((resolve) => (timer = setTimeout(() => resolve(fallback), ms)))]);
  } catch {
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tasks, handles] = await Promise.all([
    hasDeployment() ? within(publicTasks(), []) : Promise.resolve([]),
    within(publicHandles(), []),
  ]);
  return [
    ...STATIC.map((s) => ({ url: absoluteUrl(s.path), changeFrequency: s.changeFrequency, priority: s.priority })),
    ...tasks.map((t) => ({
      url: absoluteUrl(`/tasks/${t.pubkey}`),
      lastModified: new Date(Math.max(t.createdAt, t.closedAt, t.settledAt) * 1000),
      changeFrequency: t.status === "open" || t.status === "judging" ? ("hourly" as const) : ("monthly" as const),
      priority: t.status === "open" ? 0.8 : 0.5,
    })),
    ...handles.map((h) => ({ url: absoluteUrl(`/@${h.handle}`), lastModified: h.updatedAt, changeFrequency: "weekly" as const, priority: 0.4 })),
  ];
}
