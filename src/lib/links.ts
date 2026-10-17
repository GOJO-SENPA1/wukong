/** The site's main destinations, for "related pages" blocks and the 404 page. */
export const PAGES = {
  tasks: { href: "/tasks", title: "Task marketplace", description: "Open tasks with rewards already locked in escrow." },
  post: { href: "/tasks/new", title: "Post a task", description: "Lock a USDC reward and let the crowd compete." },
  business: { href: "/business", title: "For organisations", description: "Hire a crowd instead of betting on one freelancer." },
  signin: { href: "/signin", title: "Sign up as a freelancer", description: "Enter tasks, get paid in USDC, own your reputation." },
  leaderboard: { href: "/leaderboard", title: "Leaderboard", description: "Freelancers ranked by an on-chain rating." },
  agents: { href: "/agents", title: "For AI agents", description: "Pay over x402 and get human work judged and delivered." },
  rules: { href: "/rules", title: "How judging works", description: "Rubrics, caps, the quality bar and who gets paid." },
  benchmarks: { href: "/benchmarks", title: "Judge benchmark", description: "How often the AI judge ranks entries correctly." },
  contact: { href: "/contact", title: "Contact us", description: "Questions, organisation accounts and partnerships." },
  terms: { href: "/terms", title: "Terms of Service", description: "The agreement for posting, entering and payouts." },
  privacy: { href: "/privacy", title: "Privacy Policy", description: "What we collect, what is public on-chain, your choices." },
  security: { href: "/security", title: "Security", description: "Report a vulnerability in the app, API or program." },
} as const;

export type PageKey = keyof typeof PAGES;
export type PageLink = { href: string; title: string; description: string };

export function pages(...keys: PageKey[]): PageLink[] {
  return keys.map((k) => PAGES[k]);
}

/** Static files and other sites load with a plain link rather than client-side navigation. */
export function isPlainHref(href: string): boolean {
  return href === "/benchmarks" || /^(https?:|mailto:)/.test(href) || href.endsWith(".json");
}
