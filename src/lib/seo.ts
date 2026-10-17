import type { Metadata } from "next";
import { SITE, absoluteUrl } from "./site";

export interface PageMeta {
  /** The page's own name; the root layout's template adds " · Wukong". */
  title: string;
  /** One or two sentences, ideally 70–160 characters. */
  description: string;
  /** Canonical path on the production domain, e.g. "/tasks". */
  path: string;
  /** Keep the page out of search results (signed-in or private pages). */
  noindex?: boolean;
  /** Use `title` exactly, without the " · Wukong" suffix. */
  absoluteTitle?: boolean;
  type?: "website" | "article" | "profile";
  /** The route has its own opengraph-image file: leave the image fields to it. */
  ownImage?: boolean;
}

/** The site-wide share image (app/opengraph-image.tsx), for pages without their own. */
const DEFAULT_SHARE_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE.name}: ${SITE.tagline}` };

/**
 * Complete metadata for one page: title, description, canonical URL, Open Graph
 * and Twitter card. Next merges metadata shallowly, so every page sets the whole
 * openGraph object here rather than relying on the root layout's, including the
 * site-wide share image; a route with its own opengraph-image file overrides it.
 * The title is always absolute: a parent layout's plain-string title would
 * otherwise drop the " · Wukong" template for everything under it.
 */
export function pageMetadata(p: PageMeta): Metadata {
  const shareTitle = p.absoluteTitle ? p.title : `${p.title} · ${SITE.name}`;
  return {
    title: { absolute: shareTitle },
    description: p.description,
    alternates: { canonical: p.path },
    openGraph: {
      type: p.type ?? "website",
      siteName: SITE.name,
      locale: SITE.locale,
      url: p.path,
      title: shareTitle,
      description: p.description,
      ...(p.ownImage ? {} : { images: [DEFAULT_SHARE_IMAGE] }),
    },
    twitter: { card: "summary_large_image", title: shareTitle, description: p.description, ...(p.ownImage ? {} : { images: [DEFAULT_SHARE_IMAGE] }) },
    ...(p.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Trim text to a meta-description length on a word boundary. */
export function clip(text: string, max = 155): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20)).replace(/[\s,.;:–-]+$/, "")}…`;
}

// ---------- Schema.org structured data

export interface Crumb {
  name: string;
  /** Omit for the current page (the last crumb). */
  path?: string;
}

export function breadcrumbLd(items: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      ...(c.path ? { item: absoluteUrl(c.path) } : {}),
    })),
  };
}

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE.url}/#organization`,
    name: SITE.name,
    url: SITE.url,
    logo: absoluteUrl("/icons/icon-512.png"),
    description: SITE.description,
    foundingDate: SITE.founded,
    foundingLocation: { "@type": "Place", name: SITE.location },
    sameAs: [SITE.github],
    contactPoint: [
      { "@type": "ContactPoint", contactType: "customer support", email: SITE.email, url: absoluteUrl("/contact"), availableLanguage: ["English", "Nepali"] },
    ],
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE.url}/#website`,
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    inLanguage: "en",
    publisher: { "@id": `${SITE.url}/#organization` },
  };
}

export function faqLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}
