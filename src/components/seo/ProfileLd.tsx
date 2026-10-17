import { JsonLd } from "./JsonLd";
import { breadcrumbLd } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import type { PublicProfile } from "@/lib/server/accounts";

/** ProfilePage and breadcrumb structured data for a freelancer's or organisation's public profile. */
export function ProfileLd({ path, name, profile, wallet }: { path: string; name: string; profile: PublicProfile | null; wallet: string }) {
  const company = profile?.role === "company";
  const entity = {
    "@type": company ? "Organization" : "Person",
    name,
    url: absoluteUrl(path),
    identifier: wallet,
    ...(profile?.handle ? { alternateName: `@${profile.handle}` } : {}),
    ...(profile?.bio ? { description: profile.bio } : {}),
    ...(profile?.city ? { address: { "@type": "PostalAddress", addressLocality: profile.city } } : {}),
    ...(!company && profile?.skills?.length ? { knowsAbout: profile.skills } : {}),
    ...(!company && profile?.languages?.length ? { knowsLanguage: profile.languages } : {}),
  };
  return (
    <JsonLd
      data={[
        { "@context": "https://schema.org", "@type": "ProfilePage", url: absoluteUrl(path), ...(profile ? { dateCreated: profile.joined } : {}), mainEntity: entity },
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Leaderboard", path: "/leaderboard" }, { name }]),
      ]}
    />
  );
}
