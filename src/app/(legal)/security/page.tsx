import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { Doc, List, Mail } from "@/components/legal/Doc";

export const metadata: Metadata = pageMetadata({
  title: "Security",
  description: "How to report a vulnerability in Wukong's app, API, AI judge or Solana program, and what we promise researchers in return.",
  path: "/security",
  type: "article",
});

const sections = [
  {
    id: "report",
    title: "Reporting a vulnerability",
    body: (
      <>
        <p>
          If you find a security problem in the Wukong app, its API, the AI judge or the Wukong program on Solana, email <Mail /> with &ldquo;Security&rdquo; in the
          subject. Include what you found, how to reproduce it and what an attacker could do with it.
        </p>
        <p>We will acknowledge your report within 3 working days and keep you updated until it is fixed.</p>
      </>
    ),
  },
  {
    id: "scope",
    title: "What's in scope",
    body: (
      <List>
        <li>wukonghq.xyz and its API, including the x402 endpoints and Solana Actions.</li>
        <li>The Wukong Solana program: escrow, scoring, settlement, stakes and reputation.</li>
        <li>Ways to make the AI judge give a score the rubric doesn&apos;t justify, such as prompt injection or hidden instructions.</li>
      </List>
    ),
  },
  {
    id: "rules",
    title: "Please",
    body: (
      <List>
        <li>Test on devnet or a local validator, never against other people&apos;s funds or accounts.</li>
        <li>Don&apos;t access or change other users&apos; data, and stop as soon as you have shown the problem.</li>
        <li>Don&apos;t disrupt the service, spam tasks or run denial-of-service tests.</li>
        <li>Give us reasonable time to fix the problem before you share it publicly.</li>
      </List>
    ),
  },
  {
    id: "safe-harbor",
    title: "Safe harbor",
    body: (
      <p>
        We won&apos;t pursue legal action against good-faith research that follows this policy. If you&apos;re unsure whether something is allowed, ask us first.
      </p>
    ),
  },
  {
    id: "status",
    title: "Where we are",
    body: (
      <List>
        <li>The Wukong program has not yet had an external audit. One is planned before significant funds move through it.</li>
        <li>We don&apos;t run a paid bug bounty yet. We will credit researchers who report valid issues, with their permission.</li>
      </List>
    ),
  },
];

export default function SecurityPage() {
  return (
    <Doc
      kicker="Security"
      title={
        <>
          Report a <em>vulnerability</em>
        </>
      }
      lede="Wukong holds rewards in escrow and pays people based on an AI judge's scores, so we take reports seriously. Here's how to reach us and what we ask of researchers."
      current="/security"
      sections={sections}
    />
  );
}
