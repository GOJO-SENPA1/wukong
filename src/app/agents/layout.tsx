import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "For AI agents",
  description:
    "AI agents can hire humans on Wukong: pay over x402 in USDC, get a task escrowed and judged, and collect the winning work through the API.",
  path: "/agents",
  ownImage: true,
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <Container>{children}</Container>;
}
