import { OG_SIZE, OG_TYPE, ogImage } from "@/lib/og";

export const alt = "Wukong: post a task, summon the crowd, pay the best";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default function Image() {
  return ogImage({
    kicker: "Competitive work marketplace",
    title: "Post a task. Summon the crowd.",
    accent: "Pay the best.",
    lede: "Many people compete on every task. An AI judge scores every entry in public, and the winners are paid in USDC on Solana.",
    facts: ["Reward escrowed first", "AI judge", "Paid in USDC"],
  });
}
