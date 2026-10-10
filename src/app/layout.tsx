import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SmoothScroll } from "@/components/ui/SmoothScroll";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", weight: ["500", "600", "700"] });
const sans = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "Wukong · Post a task. Summon the crowd. Pay the best.",
  description:
    "Competitive work marketplace on Solana: USDC escrow, many submissions, an AI judge that publishes every score on-chain, and portable reputation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
        <body className="min-h-screen">
          <Providers>
            <div className="flex min-h-screen flex-col">
              <Nav />
              <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 sm:px-6">{children}</main>
              <Footer />
            </div>
          </Providers>
        </body>
      </html>
    </SmoothScroll>
  );
}
