/**
 * Renders portfolio/source/slides/slide-NN.html to portfolio/slide-NN.png at
 * exactly 2000×1125.
 *
 *   npx tsx portfolio/source/render.ts          # all slides
 *   npx tsx portfolio/source/render.ts 3 7      # just slides 03 and 07
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const ROOT = path.join(process.cwd(), "portfolio");
const SLIDES = path.join(ROOT, "source/slides");

async function main() {
  const only = process.argv.slice(2).map(Number);
  const numbers = only.length ? only : Array.from({ length: 10 }, (_, i) => i + 1);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 2000, height: 1125 }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.error(`  page error: ${e.message}`));
  let failed = false;
  for (const n of numbers) {
    const id = String(n).padStart(2, "0");
    const file = path.join(SLIDES, `slide-${id}.html`);
    if (!existsSync(file)) {
      console.warn(`  - slide-${id}.html missing`);
      continue;
    }
    await page.goto(pathToFileURL(file).href, { waitUntil: "load" });
    await page.waitForSelector("body[data-ready='1']", { timeout: 30_000 });
    await page.waitForTimeout(250);
    const errors: string[] = await page.evaluate(() => (window as unknown as { __errors: string[] }).__errors ?? []);
    // Flag text that overflows its box (a cheap automated overflow check).
    const overflow: string[] = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>(".note p, .note h3, .headline, .sub, .chip, .card *")]
        .filter((el) => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== "visible")
        .map((el) => el.textContent!.slice(0, 40)),
    );
    const fonts: boolean = await page.evaluate(() => document.fonts.check('400 40px "Instrument Serif"') && document.fonts.check('600 20px "Geist"'));
    await page.screenshot({ path: path.join(ROOT, `slide-${id}.png`), clip: { x: 0, y: 0, width: 2000, height: 1125 } });
    const issues = [...errors, ...overflow.map((t) => `overflow: ${t}`), ...(fonts ? [] : ["fonts not loaded"])];
    if (issues.length) failed = true;
    console.log(`  ${issues.length ? "!" : "✓"} slide-${id}.png${issues.length ? `  ${issues.join(" | ")}` : ""}`);
  }
  await browser.close();
  if (failed) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
