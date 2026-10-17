import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Post a task",
  description:
    "Post a task to the crowd. Lock a USDC reward in escrow, set the brief and deadline, and an AI judge scores every entry and pays the best.",
  path: "/tasks/new",
  ownImage: true,
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
