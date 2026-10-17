import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Sign in or sign up",
  description:
    "Sign in to Wukong with Google or email to enter tasks, get paid in USDC and build a reputation you own. A wallet is created for you.",
  path: "/signin",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
