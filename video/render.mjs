// Render film.html to video: every frame is a deterministic renderAt(t) call
// screenshotted in headless Chromium and piped into ffmpeg.
//   node render.mjs                         → out/film.mp4  (1920x1080, 30fps, silent)
//   node render.mjs --mode reel             → out/reel.mp4  (1080x1920, laptop framing)
//   node render.mjs --stills 1,4.5,12       → stills/<mode>-*.png for quick review
//   node render.mjs --cues                  → out/cues.json (sound-design cue list for audio.py)
//   CHROME_PATH=/path/to/chrome node render.mjs
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const arg = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : d;
};
const MODE = arg("mode", "film");
const FPS = Number(arg("fps", 30));
const OUT = arg("out", path.join(here, "out", `${MODE}.mp4`));
const stills = arg("stills");
const [W, H] = MODE === "reel" ? [1080, 1920] : [1920, 1080];

const executablePath =
  process.env.CHROME_PATH ??
  ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) =>
    fs.existsSync(p),
  );
const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(`file://${path.join(here, "film.html")}?mode=${MODE}`);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 }).catch(() => {
  throw new Error(`page never became ready: ${errors.join("; ")}`);
});
const duration = await page.evaluate(() => window.DURATION);
fs.mkdirSync(path.join(here, "out"), { recursive: true });

if (args.includes("--cues")) {
  const cues = await page.evaluate(() => ({ duration: window.DURATION, cues: window.CUES, scenes: window.SCENES }));
  fs.writeFileSync(path.join(here, "out", "cues.json"), JSON.stringify(cues, null, 1));
  console.log(`wrote out/cues.json (${cues.cues.length} cues)`);
  await browser.close();
  process.exit(0);
}

if (stills) {
  fs.mkdirSync(path.join(here, "stills"), { recursive: true });
  for (const t of stills.split(",").map(Number)) {
    await page.evaluate((tt) => window.renderAt(tt), t);
    await page.screenshot({ path: path.join(here, "stills", `${MODE}-${t.toFixed(2).padStart(6, "0")}.png`) });
  }
  console.log(`stills: ${stills}${errors.length ? `\nerrors: ${errors.join("; ")}` : ""}`);
  await browser.close();
  process.exit(errors.length ? 1 : 0);
}

const ffmpeg = spawn(
  "ffmpeg",
  ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
   "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "17", "-preset", "medium", "-movflags", "+faststart", OUT],
  { stdio: ["pipe", "inherit", "inherit"] },
);
const frames = Math.round(duration * FPS);
const started = Date.now();
for (let i = 0; i < frames; i++) {
  await page.evaluate((t) => window.renderAt(t), i / FPS);
  const buf = await page.screenshot({ type: "jpeg", quality: 93 });
  if (!ffmpeg.stdin.write(buf)) await new Promise((r) => ffmpeg.stdin.once("drain", r));
  if (i % FPS === 0) process.stdout.write(`\r${(i / FPS).toFixed(0)}s / ${duration.toFixed(1)}s`);
}
ffmpeg.stdin.end();
await new Promise((r) => ffmpeg.on("close", r));
await browser.close();
if (errors.length) console.error(`page errors: ${errors.join("; ")}`);
console.log(`\nwrote ${OUT} (${frames} frames in ${((Date.now() - started) / 1000).toFixed(0)}s)`);
