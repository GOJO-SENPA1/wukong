import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Wallet",
  description:
    "Your Wukong wallet: USDC and SOL balances, deposits and withdrawals.",
  path: "/wallet",
  noindex: true,
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
