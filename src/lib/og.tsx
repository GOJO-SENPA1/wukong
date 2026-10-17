// Share images (Open Graph / Twitter cards), drawn with next/og in the site's own
// type and colours. One layout for every page: the wordmark, a kicker, a serif
// headline with an italic gold accent, and a row of facts.

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_TYPE = "image/png";

const C = {
  bg: "#07080c",
  fg: "#f1ede4",
  muted: "#9b9da6",
  faint: "#63666f",
  red: "#f0412f",
  gold: "#d8b36c",
  gold2: "#f0d9a6",
  line: "rgba(255,255,255,0.13)",
};

let fonts: Promise<{ name: string; data: Buffer; weight: 400 | 500 | 600; style: "normal" | "italic" }[]> | null = null;

function loadFonts() {
  const dir = join(process.cwd(), "src/assets/og");
  const f = (file: string) => readFile(join(dir, file));
  fonts ??= Promise.all([
    f("Anton-Regular.ttf").then((data) => ({ name: "Anton", data, weight: 400 as const, style: "normal" as const })),
    f("InstrumentSerif-Regular.ttf").then((data) => ({ name: "Serif", data, weight: 400 as const, style: "normal" as const })),
    f("InstrumentSerif-Italic.ttf").then((data) => ({ name: "Serif", data, weight: 400 as const, style: "italic" as const })),
    f("InstrumentSans-Regular.ttf").then((data) => ({ name: "Sans", data, weight: 400 as const, style: "normal" as const })),
    f("InstrumentSans-SemiBold.ttf").then((data) => ({ name: "Sans", data, weight: 600 as const, style: "normal" as const })),
    f("JetBrainsMono-Medium.ttf").then((data) => ({ name: "Mono", data, weight: 500 as const, style: "normal" as const })),
  ]);
  return fonts;
}

export interface OgCard {
  /** Small caps line above the headline, e.g. "Task · Translation". */
  kicker: string;
  /** Headline in the serif; `accent` follows it in italic gold. */
  title: string;
  accent?: string;
  /** One supporting sentence under the headline. */
  lede?: string;
  /** Up to four short facts along the bottom, e.g. "50 USDC reward". The first is highlighted. */
  facts?: string[];
}

function clamp(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).replace(/\s+\S*$/, "")}…` : text;
}

export async function ogImage(card: OgCard): Promise<ImageResponse> {
  const title = clamp(card.title, 110);
  const long = title.length + (card.accent?.length ?? 0);
  const size = long > 80 ? 60 : long > 50 ? 72 : 88;
  const facts = (card.facts ?? []).slice(0, 4);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: C.bg,
          backgroundImage: `radial-gradient(circle at 0% 0%, rgba(240,65,47,0.22), rgba(240,65,47,0) 45%), radial-gradient(circle at 100% 100%, rgba(216,179,108,0.18), rgba(216,179,108,0) 50%)`,
          color: C.fg,
          fontFamily: "Sans",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 16, height: 16, borderRadius: 999, background: C.red }} />
            <div style={{ fontFamily: "Anton", fontSize: 34, letterSpacing: 2 }}>WUKONG</div>
          </div>
          <div style={{ display: "flex", fontFamily: "Mono", fontSize: 20, letterSpacing: 4, color: C.gold, textTransform: "uppercase" }}>{clamp(card.kicker, 48)}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", flexDirection: "column", fontFamily: "Serif", fontSize: size, lineHeight: 1.04, letterSpacing: -1, maxWidth: 1050 }}>
            <span>{title}</span>
            {card.accent && <span style={{ fontStyle: "italic", color: C.gold2 }}>{card.accent}</span>}
          </div>
          {card.lede && <div style={{ display: "flex", fontSize: 28, lineHeight: 1.4, color: C.muted, maxWidth: 940 }}>{clamp(card.lede, 150)}</div>}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
          <div style={{ display: "flex", gap: 14 }}>
            {facts.map((f, i) => (
              <div
                key={f}
                style={{
                  display: "flex",
                  padding: "12px 20px",
                  borderRadius: 999,
                  fontSize: 22,
                  fontWeight: 600,
                  border: `1.5px solid ${i === 0 ? "rgba(240,65,47,0.6)" : C.line}`,
                  background: i === 0 ? "rgba(240,65,47,0.14)" : "rgba(255,255,255,0.03)",
                  color: i === 0 ? "#ff8b78" : C.fg,
                }}
              >
                {clamp(f, 28)}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", fontFamily: "Mono", fontSize: 20, color: C.faint, letterSpacing: 1 }}>wukonghq.xyz</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await loadFonts() },
  );
}
