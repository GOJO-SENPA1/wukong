import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "For organisations",
  description:
    "Post work to a crowd instead of hiring one freelancer. Wukong escrows the reward, an AI judge scores every entry, and the best are paid automatically.",
  path: "/business",
  ownImage: true,
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
