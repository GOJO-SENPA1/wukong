import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Preview deployments stay out of search entirely; only production is indexed.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [
      {
        userAgent: "*",
        // Solana Actions (Blinks) must stay reachable; the rest of the API and signed-in pages are not for search.
        allow: ["/", "/api/actions/", "/actions.json"],
        disallow: ["/api/", "/dashboard", "/settings", "/wallet", "/welcome", "/status"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
