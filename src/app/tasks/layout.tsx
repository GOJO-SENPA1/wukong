import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Task marketplace",
  description:
    "Browse open tasks on Wukong: copywriting, translation, code, data labeling and research. Rewards are locked in USDC escrow before anyone starts.",
  path: "/tasks",
  ownImage: true,
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <Container>{children}</Container>;
}
