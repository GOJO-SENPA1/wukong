import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Leaderboard",
  description:
    "The top freelancers on Wukong, ranked in public by an on-chain rating that rises with strong scores and wins and falls with spam.",
  path: "/leaderboard",
  ownImage: true,
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <Container>{children}</Container>;
}
