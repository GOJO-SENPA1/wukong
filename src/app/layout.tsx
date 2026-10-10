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

const display = Anton({ subsets: ["latin"], variable: "--font-anton", weight: "400" });
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument-sans" });
const serif = Instrument_Serif({ subsets: ["latin"], variable: "--font-instrument-serif", weight: "400", style: ["normal", "italic"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const viewport: Viewport = {
  themeColor: "#07080c",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://wukonghq.xyz"),
  title: "Wukong · Post a task. Summon the crowd. Pay the best.",
  description:
    "Competitive work marketplace on Solana: USDC escrow, many submissions, an AI judge that publishes every score on-chain, and portable reputation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body className="min-h-screen overflow-x-clip">
        <PrivyWrapper>
          <Providers>
            <ScrollProgress />
            <Nav />
            <main className="relative min-h-[100svh]">{children}</main>
            <Footer />
            <BurstLayer />
            <SummonEgg />
            <OnboardingGate />
            <AuthNotice />
            <div className="grain" aria-hidden />
          </Providers>
        </PrivyWrapper>
      </body>
    </html>
  );
}
