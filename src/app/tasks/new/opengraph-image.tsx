import { OG_SIZE, OG_TYPE, ogImage } from "@/lib/og";

export const alt = "Post a task on Wukong";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default function Image() {
  return ogImage({
    kicker: "For organisations",
    title: "Post a task.",
    accent: "Pay only the best.",
    lede: "Lock a USDC reward, set the brief and deadline. The crowd competes and the AI judge pays the winners.",
    facts: ["No winner, full refund", "10% fee", "Scores on-chain"],
  });
}
