import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name}: competitive work marketplace`,
    short_name: SITE.name,
    description: SITE.description,
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: SITE.themeColor,
    theme_color: SITE.themeColor,
    categories: ["business", "finance", "productivity"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Find work", url: "/tasks", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Post a task", url: "/tasks/new", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
