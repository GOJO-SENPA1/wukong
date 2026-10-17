import { HELP_EMAIL } from "./contact";

/**
 * Who the site is, for metadata, share images, structured data and the sitemap.
 * Canonical URLs always use the production domain, whatever host served the page,
 * so previews and mirrors never compete with it in search.
 */
export const SITE = {
  name: "Wukong",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://wukonghq.xyz").replace(/\/$/, ""),
  tagline: "Post a task. Summon the crowd. Pay the best.",
  description:
    "Wukong is a work marketplace where many people compete on each task, an AI judge scores every entry against a public rubric, and the winners are paid in USDC automatically, on Solana.",
  locale: "en_US",
  themeColor: "#07080c",
  email: HELP_EMAIL,
  github: "https://github.com/GOJO-SENPA1/wukong",
  founded: "2026",
  location: "Biratnagar, Nepal",
};

/** An absolute URL on the canonical domain for a path like "/tasks". */
export function absoluteUrl(path = "/"): string {
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}
