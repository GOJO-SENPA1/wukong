import type { Metadata, Viewport } from "next";
import { Anton, Instrument_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { PrivyWrapper } from "@/components/PrivyWrapper";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { BurstLayer, SummonEgg } from "@/components/fx/Overlay";
import { ScrollProgress } from "@/components/fx/motion";
import { OnboardingGate } from "@/components/auth/OnboardingGate";
import { AuthNotice } from "@/components/auth/AuthNotice";
import { JsonLd } from "@/components/seo/JsonLd";
import { Toaster } from "@/components/Toast";
import { Consent, PageViews } from "@/components/Consent";
import { MotionPrefs } from "@/components/MotionPrefs";
import { organizationLd, websiteLd } from "@/lib/seo";
import { SITE } from "@/lib/site";

// Fonts are self-hosted by next/font: no request to Google at runtime, Latin subset
// only, swap so text shows at once, and size-adjusted fallbacks so the swap doesn't
// shift the layout. Sans and Mono are variable fonts (one file for every weight).
// The three faces seen above the fold are preloaded; the mono labels are not.
const display = Anton({ subsets: ["latin"], variable: "--font-anton", weight: "400", display: "swap", fallback: ["Impact", "Arial Narrow", "sans-serif"] });
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument-sans", display: "swap", fallback: ["system-ui", "sans-serif"] });
const serif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  fallback: ["Iowan Old Style", "Georgia", "serif"],
});
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap", preload: false, fallback: ["ui-monospace", "monospace"] });

export const viewport: Viewport = {
  themeColor: SITE.themeColor,
  colorScheme: "dark",
};

// Defaults for every page. Each route sets its own title, description, canonical
// URL and Open Graph object (see pageMetadata); share images come from the
// nearest opengraph-image file, and icons from icon.svg, favicon.ico and apple-icon.png.
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} · ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.name,
  category: "business",
  formatDetection: { telephone: false, address: false, email: false },
  appleWebApp: { title: SITE.name, statusBarStyle: "black-translucent" },
  openGraph: { type: "website", siteName: SITE.name, locale: SITE.locale, title: `${SITE.name} · ${SITE.tagline}`, description: SITE.description },
  twitter: { card: "summary_large_image", title: `${SITE.name} · ${SITE.tagline}`, description: SITE.description },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body className="min-h-screen overflow-x-clip">
        <JsonLd data={[organizationLd(), websiteLd()]} />
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <MotionPrefs>
          <PrivyWrapper>
            <Providers>
              <ScrollProgress />
              <Nav />
              <main id="main" className="relative min-h-[100svh]">
                {children}
              </main>
              <Footer />
              <BurstLayer />
              <SummonEgg />
              <OnboardingGate />
              <AuthNotice />
              <div className="grain" aria-hidden />
            </Providers>
          </PrivyWrapper>
          <Toaster />
          <Consent />
          <PageViews />
        </MotionPrefs>
      </body>
    </html>
  );
}
