import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProfileLd } from "@/components/seo/ProfileLd";
import { clip, pageMetadata } from "@/lib/seo";
import { getProfileByHandle, handleFromSegment } from "@/lib/server/meta";

type Props = { params: Promise<{ handle: string }>; children: React.ReactNode };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const handle = handleFromSegment((await params).handle);
  const path = `/@${handle ?? ""}`;
  const missing = pageMetadata({ title: "Profile not found", description: "No one on Wukong goes by that handle.", path, noindex: true });
  if (!handle) return missing;
  const r = await getProfileByHandle(handle);
  if (!r.found) {
    return r.known ? missing : pageMetadata({ title: `@${handle}`, description: `@${handle}'s public profile on Wukong: scores, wins and earnings, read from the chain.`, path, ownImage: true });
  }
  const p = r.value;
  const name = p.role === "company" ? p.company || p.displayName : p.displayName;
  const lead = p.role === "company" ? `${name} posts tasks on Wukong.` : `${name} (@${p.handle}) competes for work on Wukong${p.city ? ` from ${p.city}` : ""}.`;
  const detail = p.bio || (p.skills?.length ? `Skills: ${p.skills.join(", ")}.` : "Scores, wins and earnings, read from the chain.");
  return pageMetadata({ title: `${name} (@${p.handle})`, description: clip(`${lead} ${detail}`), path, type: "profile", ownImage: true });
}

async function HandleLd({ handle }: { handle: string }) {
  const r = await getProfileByHandle(handle);
  if (!r.found) return null;
  const p = r.value;
  return <ProfileLd path={`/@${p.handle}`} name={p.role === "company" ? p.company || p.displayName : p.displayName} profile={p} wallet={p.wallet} />;
}

export default async function HandleLayout({ params, children }: Props) {
  const handle = handleFromSegment((await params).handle);
  if (!handle) notFound();
  return (
    <>
      <Suspense fallback={null}>
        <HandleLd handle={handle} />
      </Suspense>
      {children}
    </>
  );
}
