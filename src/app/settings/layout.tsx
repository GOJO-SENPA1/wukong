import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Settings",
  description:
    "Your Wukong profile, handle and email preferences.",
  path: "/settings",
  noindex: true,
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
