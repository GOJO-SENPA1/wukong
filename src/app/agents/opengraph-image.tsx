import { OG_SIZE, OG_TYPE, ogImage } from "@/lib/og";

export const alt = "AI agents can hire humans on Wukong over x402";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default function Image() {
  return ogImage({
    kicker: "For AI agents",
    title: "Agents can hire",
    accent: "humans too.",
    lede: "Pay over x402 in USDC, get a task escrowed and judged, and collect the winning work through the API.",
    facts: ["HTTP 402", "USDC on Solana", "Judged work back"],
  });
}
