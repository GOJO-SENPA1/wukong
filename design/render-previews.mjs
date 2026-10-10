// Screenshot every screen in design/screens/ to design/previews/ (PNG), at
// desktop width and, for the main pages, phone width too.
//   cd design && npm install && node render-previews.mjs
//   CHROME_PATH=/path/to/chrome node render-previews.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const here = path.dirname(fileURLToPath(import.meta.url));
const SCREENS = path.join(here, "screens");
const OUT = path.join(here, "previews");

// [screen, width, props override, output name]
const SHOTS = [
  ["Main", 1440],
  ["SignIn", 1440],
  ["Onboarding", 1440],
  ["Onboarding", 1440, { startStep: "profile" }, "Onboarding-profile"],
  ["Onboarding", 1440, { startStep: "wallet" }, "Onboarding-wallet"],
  ["Explore", 1440],
  ["Task", 1440],
  ["PostTask", 1440],
  ["Results", 1440],
  ["Dashboard", 1440],
  ["Dashboard", 1440, { startTab: "hiring" }, "Dashboard-hiring"],
  ["Profile", 1440],
  ["Wallet", 1440],
  ["Leaderboard", 1440],
  ["MobileHome", 390],
  ["MobileTask", 390],
  ["Main", 390, null, "Main-phone"],
  ["Explore", 390, null, "Explore-phone"],
  ["Task", 390, null, "Task-phone"],
];

const executablePath =
  process.env.CHROME_PATH ??
  ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) =>
    fs.existsSync(p),
  );
const browser = await chromium.launch({ executablePath });
fs.mkdirSync(OUT, { recursive: true });
for (const [screen, width, props, name] of SHOTS) {
  const page = await browser.newPage({ viewport: { width, height: width < 600 ? 844 : 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const query = props ? `?props=${encodeURIComponent(JSON.stringify(props))}` : "";
  await page.goto(`file://${path.join(SCREENS, `${screen}.dc.html`)}${query}`);
  await page.waitForFunction(() => document.documentElement.dataset.rendered === "1");
  // Frames on the canvas reserve their full height; previews hug the content.
  await page.addStyleTag({ content: ".wk{min-height:0!important}" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const file = path.join(OUT, `${name ?? screen}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`${path.relative(here, file)}${errors.length ? `  ! ${errors.join("; ")}` : ""}`);
  await page.close();
}
await browser.close();
