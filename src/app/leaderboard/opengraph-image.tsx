import { OG_SIZE, OG_TYPE, ogImage } from "@/lib/og";

export const alt = "Wukong leaderboard: freelancers ranked in public by an on-chain rating";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default function Image() {
  return ogImage({
    kicker: "Leaderboard",
    title: "The best,",
    accent: "ranked in public.",
    lede: "Ratings rise with strong scores and wins and fall with spam, read straight from the chain.",
    facts: ["On-chain rating", "Wins and earnings", "No hidden algorithm"],
  });
}
