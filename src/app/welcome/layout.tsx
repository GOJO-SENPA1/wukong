import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Welcome",
  description:
    "Set up your Wukong profile.",
  path: "/welcome",
  noindex: true,
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
