/**
 * Captures the real AskDock screens used by the portfolio slides.
 *
 *   npm run build
 *   DEMO_SEED_NOW=2026-11-03T12:00:00+05:30 VERCEL_PROJECT_PRODUCTION_URL=askdock.vercel.app npm start -- -p 3113
 *   PORTFOLIO_BASE_URL=http://localhost:3113 npx tsx portfolio/source/capture.ts
 *
 * DEMO_SEED_NOW pins the seeded history so every run produces the same numbers;
 * the production-URL variable makes the Install tab show the live widget URL
 * instead of localhost. Start from a fresh server: the demo data is in memory. ONLY=d-hero,m-menu limits which shots are saved.
 *
 * Desktop: 1440×900 @2x. Mobile: 390×844 @3x. Every shot also records the
 * bounding boxes of the elements the slides point at (anchors.json), so the
 * numbered markers land exactly on the right UI.
 *
 * Run against a freshly started server: the demo workspace lives in memory and
 * this script uploads a file and captures a lead.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, type Browser, type BrowserContext, type Locator, type Page } from "playwright";

const BASE = (process.env.PORTFOLIO_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const BOT = "6a1d2c3e-4f50-4a7b-9c8d-0e1f2a3b4c5d";
const OUT = path.join(process.cwd(), "portfolio/source/shots");
const ONLY = process.env.ONLY?.split(",");

type Box = { x: number; y: number; w: number; h: number };
const anchors: Record<string, { w: number; h: number; a: Record<string, Box> }> = {};

async function settle(page: Page, ms = 700) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].filter((i) => !i.complete).map((i) => new Promise((r) => ((i.onload = r), (i.onerror = r)))),
    );
  });
  await page.waitForTimeout(ms);
}

async function go(page: Page, url: string) {
  await page.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded" });
  await settle(page);
}

async function scrollTo(page: Page, selector: string, offset = 90) {
  await page.evaluate(
    ([sel, off]) => {
      const el = document.querySelector(sel as string);
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - (off as number), behavior: "instant" });
    },
    [selector, offset] as const,
  );
  await page.waitForTimeout(600);
}

async function scrollBy(page: Page, y: number) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
  await page.waitForTimeout(600);
}

/** Screenshot + anchor boxes (viewport coordinates, or page coordinates for full-page shots). */
async function shot(page: Page, name: string, marks: Record<string, Locator> = {}, opts: { fullPage?: boolean } = {}) {
  if (ONLY && !ONLY.some((o) => name.startsWith(o))) return;
  await settle(page, 400);
  const vp = page.viewportSize()!;
  const scrollY = opts.fullPage ? await page.evaluate(() => window.scrollY) : 0;
  const a: Record<string, Box> = {};
  for (const [key, loc] of Object.entries(marks)) {
    const b = await loc.first().boundingBox().catch(() => null);
    if (!b) {
      console.warn(`    ! ${name}: anchor "${key}" not found`);
      continue;
    }
    a[key] = { x: Math.round(b.x), y: Math.round(b.y + scrollY), w: Math.round(b.width), h: Math.round(b.height) };
  }
  const size = opts.fullPage ? await page.evaluate(() => ({ w: document.documentElement.clientWidth, h: document.documentElement.scrollHeight })) : { w: vp.width, h: vp.height };
  anchors[name] = { w: size.w, h: size.h, a };
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: opts.fullPage ?? false });
  console.log(`  ✓ ${name}.png  (${Object.keys(a).join(", ")})`);
}

/** Element-only crop for the design-system slide. */
async function crop(loc: Locator, name: string, pad = 0) {
  if (ONLY && !ONLY.some((o) => name.startsWith(o))) return;
  const page = loc.page();
  const b = await loc.first().boundingBox();
  if (!b) return console.warn(`    ! crop ${name} not found`);
  await page.screenshot({
    path: path.join(OUT, `${name}.png`),
    clip: { x: b.x - pad, y: b.y - pad, width: b.width + pad * 2, height: b.height + pad * 2 },
  });
  anchors[name] = { w: Math.round(b.width + pad * 2), h: Math.round(b.height + pad * 2), a: {} };
  console.log(`  ✓ ${name}.png (crop)`);
}

async function waitAnswer(scope: Page | ReturnType<Page["frameLocator"]> | Locator) {
  await scope.locator('button[aria-label="Send message"]').first().waitFor({ timeout: 45_000 });
}

async function ask(scope: Locator | ReturnType<Page["frameLocator"]>, page: Page, q: string) {
  const input = scope.locator('input[aria-label="Your message"]').first();
  await input.fill(q);
  await input.press("Enter");
  await page.waitForTimeout(900);
  await waitAnswer(scope);
  await page.waitForTimeout(700);
}

async function signIn(page: Page) {
  await go(page, "/login");
  if (!page.url().includes("/dashboard")) {
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL("**/dashboard**", { timeout: 30_000 });
  }
  await settle(page);
}

async function newContext(browser: Browser, mobile: boolean): Promise<BrowserContext> {
  return browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    deviceScaleFactor: mobile ? 3 : 2,
    isMobile: mobile,
    hasTouch: mobile,
    reducedMotion: "reduce",
  });
}

// Visitor-facing screens come first for both sizes, then every dashboard screen,
// so all dashboard numbers come from the same state (chats add conversations,
// messages and leads).

async function desktopVisitor(browser: Browser) {
  console.log("\ndesktop 1440×900 @2x · visitor screens");
  const ctx = await newContext(browser, false);
  const page = await ctx.newPage();

  // Landing ------------------------------------------------------------------
  await go(page, "/");
  await page.waitForTimeout(1500);
  const hero = page.locator("main section").first();
  await shot(page, "d-hero", {
    pill: hero.getByText("Lead capture when your bot doesn't know"),
    headline: page.locator("h1 em"),
    cta: page.getByRole("link", { name: /Start free — no card needed/ }),
    trust: page.getByText("Works on any website"),
    proof: page.getByText("Services-and-Pricing-2026.pdf").first(),
    stat: page.getByText("Answered this week"),
    nav: page.locator('nav[aria-label="Main"]'),
  });
  await crop(page.locator('nav[aria-label="Main"]').locator(".."), "c-header", 0);
  await crop(hero.getByText("Lead capture when your bot doesn't know"), "c-pill", 6);
  await crop(page.getByRole("link", { name: /Start free — no card needed/ }).locator(".."), "c-ctas", 18);

  await scrollTo(page, "#how");
  await shot(page, "d-how");
  await scrollTo(page, "#features");
  await shot(page, "d-features");

  await scrollTo(page, "#demo", 60);
  const demo = page.locator("#demo");
  await crop(demo.locator("button", { hasText: "How much is a cleaning?" }).locator(".."), "c-suggested", 4);
  await ask(demo, page, "How much are clear aligners?");
  await demo.locator("button", { hasText: /sources?$/ }).first().click();
  await page.waitForTimeout(800);
  await scrollTo(page, "#demo", 60);
  if (process.env.HIDE_DEMO_NOTE) {
    // Without OPENAI_API_KEY the demo shows a developer note under the copy; with a key it isn't rendered.
    await page.getByText("Running without an OpenAI key").evaluate((el) => {
      (el.closest("p") ?? el).remove();
    });
  }
  await shot(page, "d-demo", {
    header: demo.getByText("Online · replies instantly"),
    question: demo.getByText("How much are clear aligners?").last(),
    cite: demo.locator("sup").first(),
    cite2: demo.locator("sup").last(),
    toggle: demo.locator("button", { hasText: /sources?$/ }),
    source1: demo.getByText("Services & Pricing 2026").last(),
    source2: demo.getByText("About Juniper Dental Studio").last(),
    answer: demo.locator("sup").first().locator("xpath=ancestor::div[contains(@class,'rounded-tl-md')][1]"),
    card1: demo.locator('button[aria-expanded="true"]').locator("xpath=following-sibling::ul[1]/li[1]"),
    input: demo.locator('input[aria-label="Your message"]'),
    copy: demo.getByText("Check the sources"),
  });
  await crop(demo.locator("button", { hasText: /sources?$/ }).locator(".."), "c-sources", 4);

  await scrollTo(page, "#pricing", 60);
  await shot(page, "d-pricing", { pro: page.getByText("Most popular").first() });
  await scrollTo(page, "#faq", 60);
  await shot(page, "d-faq");

  // Widget on a customer site ------------------------------------------------
  await go(page, "/widget-demo");
  await page.waitForTimeout(4300); // greeting pops up after 3.5 s
  const widget = page.locator("[data-askdock]");
  await shot(page, "d-widget-greeting", { bubble: widget.locator("button.bubble"), greeting: widget.locator(".greet") });
  await widget.locator("button.bubble").click();
  const frame = page.frameLocator("[data-askdock] iframe");
  await frame.locator('input[aria-label="Your message"]').waitFor({ timeout: 20_000 });
  await page.waitForTimeout(900);
  await ask(frame.locator("body"), page, "Are you open on Saturdays?");
  await frame.locator("button", { hasText: /sources?$/ }).first().click();
  await page.waitForTimeout(800);
  await shot(page, "d-widget-answer", {
    panel: widget.locator("iframe"),
    cite: frame.locator("sup").first(),
    sources: frame.locator("button", { hasText: /sources?$/ }),
  });
  await ask(frame.locator("body"), page, "How much is a full mouth reconstruction?");
  await frame.locator('input[aria-label="Your name"]').fill("Sam Rivera");
  await frame.locator('input[aria-label="Your email"]').fill("sam.rivera@example.com");
  await page.waitForTimeout(400);
  await shot(page, "d-widget-lead", { form: frame.locator('input[aria-label="Your email"]') });
  await frame.getByRole("button", { name: "Send", exact: true }).click();
  await frame.getByText("The team will get back to you").waitFor();
  await page.waitForTimeout(600);
  await shot(page, "d-widget-lead-done", { done: frame.getByText("The team will get back to you") });

  // Auth ---------------------------------------------------------------------
  await ctx.clearCookies();
  await go(page, "/login");
  await shot(page, "d-login");
  await go(page, "/signup");
  await shot(page, "d-signup", { google: page.getByRole("button", { name: /Google/ }) });
  await ctx.close();
}

async function desktopDashboard(browser: Browser) {
  console.log("\ndesktop 1440×900 @2x · dashboard");
  const ctx = await newContext(browser, false);
  const page = await ctx.newPage();
  await signIn(page);
  await shot(page, "d-overview", {
    kpis: page.locator("main").getByText("Conversations").first(),
    chart: page.getByText("Messages per day").first(),
    usage: page.getByText("messages this month").first(),
  });
  await go(page, "/dashboard/bots");
  await shot(page, "d-bots");
  await go(page, "/dashboard/bots/new");
  await page.fill("#name", "Studio Helper");
  await page.fill("#business", "Juniper Dental Studio");
  await shot(page, "d-bot-new");

  // Knowledge: real upload of the sample PDF, then the crawl tab.
  await go(page, `/dashboard/bots/${BOT}`);
  await page.setInputFiles('input[aria-label="Upload a knowledge file"]', path.join(process.cwd(), "samples/Cosmetic-Treatments-2026.pdf"));
  await page.getByText(/^Indexed “/).waitFor({ timeout: 30_000 });
  await page.waitForTimeout(1500);
  await shot(page, "d-knowledge", {
    tabs: page.getByRole("tab", { name: /Upload a file/ }),
    drop: page.getByText("Drop a file here, or click to browse"),
    usage: page.getByText(/sources used across your bots/),
    toast: page.getByText(/^Indexed “/),
    newSource: page.getByText("Cosmetic-Treatments-2026.pdf").last(),
    ready: page.getByText("Ready").first(),
    test: page.getByText("Test your bot"),
  });
  await crop(page.locator("text=Ready").first(), "c-ready", 4);
  await page.getByText(/^Indexed “/).waitFor({ state: "hidden", timeout: 15_000 }).catch(() => {});
  await page.getByRole("tab", { name: /Crawl a website/ }).click();
  await page.fill("#crawl-url", "https://juniperdental.example");
  await page.waitForTimeout(400);
  await shot(page, "d-crawl", {
    url: page.locator("#crawl-url"),
    button: page.getByRole("button", { name: "Crawl site" }),
    help: page.getByText(/respect robots.txt/),
    site: page.getByText("juniperdental.example").last(),
  });

  // Customise: pick a new avatar + colour so the live preview visibly updates.
  await go(page, `/dashboard/bots/${BOT}/customize`);
  await crop(page.getByText("Avatar", { exact: true }).locator(".."), "c-avatars", 6);
  await page.locator('button[aria-pressed][aria-label$="avatar"]').first().click();
  await page.locator('button[aria-label="Use colour #8f67ee"]').click();
  await page.waitForTimeout(700);
  // Scroll so the welcome message and suggestions sit beside the (sticky) live preview.
  await scrollBy(page, 330);
  await shot(page, "d-customize", {
    avatar: page.locator('button[aria-pressed][aria-label$="avatar"]').first(),
    color: page.locator('button[aria-label="Use colour #8f67ee"]'),
    hex: page.locator('input[aria-label="Hex colour"]'),
    welcome: page.getByText("Welcome message"),
    suggested: page.getByText("Suggested questions", { exact: true }),
    unsaved: page.getByText("You have unsaved changes"),
    preview: page.getByText("Live preview"),
    previewHeader: page.locator("main").getByText("Online · replies instantly"),
  });
  await go(page, `/dashboard/bots/${BOT}/install`);
  await shot(page, "d-install", {
    snippet: page.locator("pre, code").first(),
    copy: page.getByRole("button", { name: /Copy/ }).first(),
  });

  await go(page, "/dashboard/conversations");
  await shot(page, "d-conversations");
  const hrefs = await page.$$eval('a[href^="/dashboard/conversations/"]', (links) => links.map((a) => a.getAttribute("href")!));
  for (const href of hrefs.slice(0, 25)) {
    await go(page, href);
    const turns = await page.locator('section[aria-label="Transcript"] > ol > li').count();
    const cited = await page.locator('section[aria-label="Transcript"] ul li').count();
    if (turns >= 4 && cited >= 2) break;
  }
  await shot(page, "d-transcript");

  await go(page, "/dashboard/leads");
  await page.locator('button[aria-label="Lead status"]').first().click();
  await page.waitForTimeout(600);
  await shot(page, "d-leads", {
    status: page.locator('button[aria-label="Lead status"]').first(),
    listbox: page.getByRole("option", { name: "Won" }),
    csv: page.locator('a[href="/api/leads/export"]'),
    question: page.getByText("View conversation").first(),
  });
  await page.keyboard.press("Escape");

  await go(page, "/dashboard/analytics");
  await shot(page, "d-analytics", {
    kpi: page.getByText("Answer rate").first(),
    delta: page.getByText("vs previous 30d").first(),
    range: page.getByRole("link", { name: "30d" }),
    locked: page.locator('a[title^="Upgrade for 90"]'),
    bots: page.getByRole("link", { name: "All bots" }),
    chart: page.getByText("Messages per day"),
  });
  await crop(page.locator("main section, main > div > div").filter({ hasText: "Answer rate" }).last(), "c-kpi", 0);
  const topY = await page.getByText("Top questions").first().evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await scrollBy(page, topY - 420);
  await shot(page, "d-analytics-gaps", {
    top: page.getByText("Top questions").first(),
    gaps: page.getByText("Knowledge gaps").first(),
    add: page.getByRole("link", { name: "Add knowledge" }),
  });
  await go(page, "/dashboard/billing");
  await shot(page, "d-billing");

  await ctx.close();
}

async function mobileVisitor(browser: Browser) {
  console.log("\nmobile 390×844 @3x · visitor screens");
  const ctx = await newContext(browser, true);
  const page = await ctx.newPage();

  await go(page, "/");
  await page.waitForTimeout(1500);
  await shot(page, "m-hero");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.waitForTimeout(800);
  await shot(page, "m-menu");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);

  await scrollTo(page, "#demo-chat", 76);
  const demo = page.locator("#demo");
  await ask(demo, page, "How much are clear aligners?");
  await demo.locator("button", { hasText: /sources?$/ }).first().click();
  await page.waitForTimeout(800);
  await scrollTo(page, "#demo-chat", 76);
  await shot(page, "m-demo");
  await scrollTo(page, "#pricing", 70);
  await shot(page, "m-pricing");

  // Visitor journey on the clinic site (widget opens full-screen on phones).
  await go(page, "/widget-demo");
  await page.waitForTimeout(4300);
  const widget = page.locator("[data-askdock]");
  await shot(page, "m-widget-greeting", { bubble: widget.locator("button.bubble"), greeting: widget.locator(".greet") });
  await widget.locator("button.bubble").click();
  const frame = page.frameLocator("[data-askdock] iframe");
  await frame.locator('input[aria-label="Your message"]').waitFor({ timeout: 20_000 });
  await page.waitForTimeout(900);
  await ask(frame.locator("body"), page, "How much are clear aligners?");
  await frame.locator("button", { hasText: /sources?$/ }).first().click();
  await page.waitForTimeout(800);
  await frame.locator("button", { hasText: /sources?$/ }).first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await shot(page, "m-widget-answer", {
    question: frame.getByText("How much are clear aligners?").last(),
    cite: frame.locator("sup").first(),
    sources: frame.locator("button", { hasText: /sources?$/ }),
    source1: frame.getByText("Services & Pricing 2026").last(),
  });
  await ask(frame.locator("body"), page, "Do you treat sleep apnea?");
  await frame.locator('input[aria-label="Your name"]').fill("Ava Chen");
  await frame.locator('input[aria-label="Your email"]').fill("ava.chen@example.com");
  await page.waitForTimeout(500);
  await shot(page, "m-widget-lead", {
    question: frame.getByText("Do you treat sleep apnea?").last(),
    form: frame.locator('input[aria-label="Your email"]'),
  });
  await frame.getByRole("button", { name: "Send", exact: true }).click();
  await frame.getByText("The team will get back to you").waitFor();
  await page.waitForTimeout(600);
  await shot(page, "m-widget-lead-done", { done: frame.getByText("The team will get back to you") });

  await ctx.clearCookies();
  await go(page, "/signup");
  await shot(page, "m-signup");
  await ctx.close();
}

async function mobileDashboard(browser: Browser) {
  console.log("\nmobile 390×844 @3x · dashboard");
  const ctx = await newContext(browser, true);
  const page = await ctx.newPage();
  await signIn(page);
  await shot(page, "m-overview");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.waitForTimeout(800);
  await shot(page, "m-nav");
  await page.keyboard.press("Escape");
  await go(page, "/dashboard/analytics");
  await shot(page, "m-analytics");
  await go(page, "/dashboard/leads");
  await shot(page, "m-leads");
  await go(page, `/dashboard/bots/${BOT}/customize`);
  await shot(page, "m-customize");
  await go(page, "/dashboard/conversations");
  await shot(page, "m-conversations");

  await ctx.close();
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  try {
    if (!process.env.SKIP_DESKTOP) await desktopVisitor(browser);
    if (!process.env.SKIP_MOBILE) await mobileVisitor(browser);
    if (!process.env.SKIP_DESKTOP) await desktopDashboard(browser);
    if (!process.env.SKIP_MOBILE) await mobileDashboard(browser);
  } finally {
    await browser.close();
  }
  const file = path.join(OUT, "anchors.json");
  let merged = anchors;
  if (ONLY || process.env.SKIP_DESKTOP || process.env.SKIP_MOBILE) {
    const { readFile } = await import("node:fs/promises");
    const prev = JSON.parse(await readFile(file, "utf8").catch(() => "{}"));
    merged = { ...prev, ...anchors };
  }
  await writeFile(file, JSON.stringify(merged, null, 1));
  await writeFile(path.join(OUT, "anchors.js"), `window.ANCHORS = ${JSON.stringify(merged)};\n`);
  console.log(`\nSaved to ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
