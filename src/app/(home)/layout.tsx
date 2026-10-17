import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { FAQ } from "@/lib/faq";
import { faqLd, pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: `${SITE.name} · ${SITE.tagline}`,
  absoluteTitle: true,
  description:
    "A work marketplace on Solana: post a task, many people compete, an AI judge scores every entry in public, and the winners are paid in USDC automatically.",
  path: "/",
});

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={faqLd(FAQ)} />
      {children}
    </>
  );
}
