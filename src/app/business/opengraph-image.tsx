import { OG_SIZE, OG_TYPE, ogImage } from "@/lib/og";

export const alt = "Wukong for organisations: hire a crowd, pay the best";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default function Image() {
  return ogImage({
    kicker: "For organisations",
    title: "Hire the crowd.",
    accent: "Pay the best.",
    lede: "Post work to many people instead of betting on one freelancer. If nothing clears the bar, the reward comes back.",
    facts: ["Escrow first", "AI judge", "Full refund if no winner"],
  });
}
