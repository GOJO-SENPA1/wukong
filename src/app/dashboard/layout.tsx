import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Dashboard",
  description:
    "Your tasks, entries, results and payouts on Wukong.",
  path: "/dashboard",
  noindex: true,
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
