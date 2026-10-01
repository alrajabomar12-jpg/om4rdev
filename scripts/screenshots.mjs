// Dev helper: full-page screenshots + per-section crops at 1440 and 390 px.
//   node scripts/screenshots.mjs [baseUrl] [outDir] [--reduced-motion]
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const base = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "http://localhost:3000";
const out = process.argv[3] && !process.argv[3].startsWith("--") ? process.argv[3] : "screenshots";
const reduced = process.argv.includes("--reduced-motion");
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
for (const width of [1440, 390]) {
  const page = await browser.newPage({
    viewport: { width, height: width === 1440 ? 900 : 844 },
    deviceScaleFactor: 1,
    reducedMotion: reduced ? "reduce" : "no-preference",
  });
  await page.goto(base, { waitUntil: "networkidle" });
  // Scroll through so IntersectionObserver reveals and lazy images run, then settle.
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 400) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1800); // count-up finishes
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  console.log(`${width}px: horizontal overflow = ${overflow}px`);
  await page.screenshot({ path: `${out}/full-${width}.png`, fullPage: true });
  for (const sel of ["#top", "section[aria-label=Stats]", "#games", "#showcase", "#about", "#contact", "footer"]) {
    const el = await page.$(sel);
    if (!el) continue;
    const name = sel.replace(/[^a-z]/gi, "").toLowerCase().replace("sectionarialabelstats", "stats");
    await el.screenshot({ path: `${out}/${name}-${width}.png` });
  }
  await page.close();
}
await browser.close();
