import { OG_SIZE, OG_TYPE, ogImage } from "@/lib/og";

export const alt = "Wukong task marketplace: open tasks with rewards already in escrow";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default function Image() {
  return ogImage({
    kicker: "Marketplace",
    title: "Open tasks, rewards",
    accent: "already in escrow.",
    lede: "Copywriting, translation, code, data labeling and research. Enter, compete, and the best entries are paid automatically.",
    facts: ["Escrowed in USDC", "Scored in public", "Top 3 paid"],
  });
}
