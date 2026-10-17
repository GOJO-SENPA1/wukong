import { OG_SIZE, OG_TYPE, ogImage } from "@/lib/og";
import { getProfileByHandle, handleFromSegment } from "@/lib/server/meta";

export const alt = "A public profile on Wukong";
export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ handle: string }> }) {
  const handle = handleFromSegment((await params).handle);
  const r = handle ? await getProfileByHandle(handle) : null;
  if (!r?.found) {
    return ogImage({ kicker: "Profile", title: handle ? `@${handle}` : "A Wukong profile", accent: "on Wukong.", facts: ["Scores on-chain", "Paid in USDC"] });
  }
  const p = r.value;
  const company = p.role === "company";
  return ogImage({
    kicker: company ? "Organisation" : `Freelancer${p.city ? ` · ${p.city}` : ""}`,
    title: company ? p.company || p.displayName : p.displayName,
    accent: `@${p.handle}`,
    lede: p.bio || (company ? "Posts tasks on Wukong." : "Competes for work on Wukong. Every score and payout is on-chain."),
    facts: company ? ["Posts tasks", "Pays in USDC"] : [...(p.skills ?? []).slice(0, 3), ...(p.skills?.length ? [] : ["Scores on-chain", "Paid in USDC"])],
  });
}
