import type { Metadata } from "next";
import { NotFoundView } from "@/components/NotFoundView";
import { RelatedLinks } from "@/components/RelatedLinks";
import { pages } from "@/lib/links";

export const metadata: Metadata = {
  title: { absolute: "Page not found · Wukong" },
  description: "This page doesn't exist on Wukong. Browse open tasks, the leaderboard or how judging works instead.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <NotFoundView />
      <div className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <RelatedLinks title="Popular pages" links={pages("tasks", "business", "signin", "leaderboard", "agents", "rules")} />
      </div>
    </>
  );
}
