// Scripted recording of the real app for the pitch video (silent, no captions; the pitch adds them).
// Logs a marker (seconds since recording start) at each step, for cutting.
//   node record.mjs <out dir> [agent task URL]   with the local demo running on :3000
import fs from "node:fs";
import { chromium } from "playwright-core";

const BASE = "http://127.0.0.1:3000";
const OUT = process.argv[2];
const AGENT_URL = process.argv[3];
const W = 1600, H = 900;
const executablePath = process.env.CHROME_PATH ?? ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const browser = await chromium.launch({ executablePath });
const context = await browser.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: OUT, size: { width: W, height: H } } });
await context.addInitScript(() => {
  const install = () => {
    if (document.getElementById("__cursor")) return;
    const c = document.createElement("div");
    c.id = "__cursor";
    Object.assign(c.style, {
      position: "fixed", left: "-40px", top: "-40px", width: "20px", height: "20px", borderRadius: "50%",
      background: "rgba(240,65,47,0.9)", border: "2px solid #fff", zIndex: "2147483647",
      pointerEvents: "none", transform: "translate(-50%,-50%)", boxShadow: "0 0 16px rgba(240,65,47,0.8)",
    });
    document.body.appendChild(c);
  };
  document.addEventListener("mousemove", (e) => {
    const c = document.getElementById("__cursor");
    if (c) { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; }
  }, true);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install); else install();
});
const t0 = Date.now();
const marks = [];
const mark = (name) => { const s = (Date.now() - t0) / 1000; marks.push({ name, s }); console.log(s.toFixed(2), name); };
const page = await context.newPage();
const wait = (ms) => page.waitForTimeout(ms);
async function moveTo(loc) {
  await loc.scrollIntoViewIfNeeded();
  const b = await loc.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 20 });
  await wait(250);
}
async function click(loc) { await moveTo(loc); await loc.click(); }
async function smooth(dy, steps = 30) { for (let i = 0; i < steps; i++) { await page.mouse.wheel(0, dy / steps); await wait(25); } }
async function persona(name) {
  await click(page.locator('header button[aria-haspopup="menu"]').first());
  await wait(600);
  await click(page.getByRole("menuitem").filter({ hasText: name }).first());
  await wait(900);
}

try {
  await page.goto(BASE + "/", { waitUntil: "load" });
  await wait(6000); // burner personas get funded on first load
  mark("landing");
  await page.mouse.move(800, 450, { steps: 10 });
  await wait(2500);
  await smooth(700, 45);
  await wait(1500);

  await page.goto(BASE + "/tasks/new", { waitUntil: "load" });
  await wait(1500);
  mark("new");
  await click(page.getByRole("button", { name: /Launch tagline: Himalayan cold brew/ }));
  await wait(1200);
  mark("template");
  await smooth(500, 30);
  await wait(1500);
  const publish = page.getByRole("button", { name: /Lock 50\.00 USDC and publish/ });
  await moveTo(publish);
  await wait(800);
  mark("publish");
  await publish.click();
  await page.waitForURL(/\/tasks\/[1-9A-HJ-NP-Za-km-z]{32,}/, { timeout: 90000 });
  await wait(2500);
  mark("task");
  fs.writeFileSync(OUT + "/task-url.txt", page.url());
  await wait(2000);

  await persona("Aarav");
  mark("aarav");
  const fill = page.getByRole("button", { name: /Fill a sample/ });
  await click(fill);
  await wait(1200);
  mark("filled");
  await click(page.getByRole("button", { name: /and submit/ }));
  await page.getByText(/Your entry is sealed/).waitFor({ timeout: 60000 });
  mark("sealed");
  await wait(2500);

  await click(page.getByRole("button", { name: /Summon the crowd/ }));
  mark("summon");
  await page.getByRole("button", { name: /Summon the crowd/ }).and(page.locator(":enabled")).waitFor({ timeout: 180000 });
  mark("crowd-done");
  await wait(2000);
  await smooth(600, 30);
  await wait(2500);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await wait(1200);

  await persona("Himalayan Java");
  mark("company");
  await click(page.getByRole("button", { name: /Close and judge/ }));
  mark("judge");
  await wait(1500);
  await smooth(820, 40);
  mark("judge-view");
  await page.getByText(/Escrow released in one transaction/).first().waitFor({ timeout: 600000 });
  mark("settled");
  await wait(2500);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await wait(1200);
  mark("paid-top");
  await wait(3000);
  const entries = page.getByText(/^Entries/).first();
  await entries.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy({ top: -90, behavior: "smooth" }));
  await wait(1500);
  mark("entries");
  await wait(2500);
  const judgeBtn = page.locator('button[aria-expanded]').filter({ hasText: "Judge" }).first();
  await click(judgeBtn);
  await wait(900);
  await smooth(420, 30);
  mark("report");
  await wait(5000);
  await smooth(1400, 70);
  await wait(1500);
  mark("flagged");
  await wait(3500);
  await smooth(900, 50);
  await wait(3000);
  mark("flagged2");
  await wait(2000);

  if (AGENT_URL) await page.goto(AGENT_URL, { waitUntil: "load" });
  await wait(2500);
  mark("agent-task");
  await wait(3000);
  await smooth(700, 40);
  await wait(3000);
  mark("agent-end");
} catch (e) {
  console.log("ERROR", e.message);
  await page.screenshot({ path: OUT + "/error.png" });
}
fs.writeFileSync(OUT + "/marks.json", JSON.stringify(marks, null, 1));
await context.close();
await browser.close();
