/**
 * Captures every key AskDock screen at desktop (1440×900) and mobile (390×844)
 * sizes into /screenshots. Run against a running app:
 *
 *   npm run build && npm start            # in one terminal
 *   npm run screenshots                   # in another
 *
 * Options (env): SCREENSHOT_BASE_URL (default http://localhost:3000),
 * SCREENSHOT_EMAIL / SCREENSHOT_PASSWORD for live Supabase mode.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium, type Browser, type Page } from "playwright";

const BASE = (process.env.SCREENSHOT_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const DEMO_BOT = process.env.NEXT_PUBLIC_DEMO_BOT_ID || "6a1d2c3e-4f50-4a7b-9c8d-0e1f2a3b4c5d";
const OUT = path.join(process.cwd(), "screenshots");

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900, scale: 1, mobile: false },
  { name: "mobile", width: 390, height: 844, scale: 2, mobile: true },
] as const;

type Viewport = (typeof VIEWPORTS)[number];

async function settle(page: Page, ms = 600) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(ms);
}

async function shot(page: Page, vp: Viewport, name: string, opts: { fullPage?: boolean } = {}) {
  const file = path.join(OUT, vp.name, `${name}.png`);
  await page.screenshot({ path: file, fullPage: opts.fullPage ?? false });
  console.log(`  ✓ ${vp.name}/${name}.png`);
}

async function go(page: Page, url: string) {
  await page.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded" });
  await settle(page);
}

/** Scrolls an element to the top of the viewport (below the fixed header). */
async function scrollToSection(page: Page, selector: string, offset = 90) {
  await page.evaluate(
    ([sel, off]) => {
      const el = document.querySelector(sel as string);
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - (off as number), behavior: "instant" });
    },
    [selector, offset],
  );
  await page.waitForTimeout(500);
}

async function ask(page: Page, question: string, scope = "body") {
  const input = page.locator(`${scope} input[aria-label="Your message"]`).first();
  await input.fill(question);
  await input.press("Enter");
  await page.waitForTimeout(800);
  // Wait until the stream finishes (send button returns in place of "Stop").
  await page.locator(`${scope} button[aria-label="Send message"]`).first().waitFor({ timeout: 45_000 });
  await page.waitForTimeout(500);
}

async function signIn(page: Page) {
  await go(page, "/login");
  if (page.url().includes("/dashboard")) return;
  const demo = await page.getByText("Demo mode.").count();
  if (!demo) {
    if (!process.env.SCREENSHOT_EMAIL || !process.env.SCREENSHOT_PASSWORD) throw new Error("Set SCREENSHOT_EMAIL and SCREENSHOT_PASSWORD for live mode.");
    await page.fill("#email", process.env.SCREENSHOT_EMAIL);
    await page.fill("#password", process.env.SCREENSHOT_PASSWORD);
  }
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL("**/dashboard**", { timeout: 30_000 });
  await settle(page);
}

async function capture(browser: Browser, vp: Viewport) {
  console.log(`\n${vp.name} (${vp.width}×${vp.height})`);
  await mkdir(path.join(OUT, vp.name), { recursive: true });
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.scale,
    isMobile: vp.mobile,
    hasTouch: vp.mobile,
    // Reveal-on-scroll content renders immediately, so full-page captures are complete.
    reducedMotion: "reduce",
  });
  const page = await context.newPage();

  // --- Marketing ----------------------------------------------------------
  await go(page, "/");
  await page.waitForTimeout(1200);
  await shot(page, vp, "01-landing-hero");
  await shot(page, vp, "02-landing-full-page", { fullPage: true });
  await scrollToSection(page, "#how");
  await shot(page, vp, "03-landing-how-it-works");
  await scrollToSection(page, "#features");
  await shot(page, vp, "04-landing-features");

  await scrollToSection(page, vp.mobile ? "#demo-chat" : "#demo", vp.mobile ? 76 : 60);
  await page.locator("#demo button", { hasText: "How much is a cleaning?" }).first().click();
  await page.locator('#demo button[aria-label="Send message"]').waitFor({ timeout: 45_000 });
  await page.waitForTimeout(600);
  await page.locator("#demo button", { hasText: /sources?$/ }).first().click().catch(() => {});
  await page.waitForTimeout(700);
  if (vp.mobile) await scrollToSection(page, "#demo-chat", 76);
  await shot(page, vp, "05-landing-live-demo-answer");

  await scrollToSection(page, "#pricing");
  await shot(page, vp, "06-landing-pricing");
  await scrollToSection(page, "#faq");
  await shot(page, vp, "07-landing-faq");

  // --- Widget on a customer website --------------------------------------
  await go(page, "/widget-demo");
  await page.waitForTimeout(4200); // greeting pop-up appears after 3.5s
  await shot(page, vp, "08-widget-on-website");
  await page.locator("[data-askdock]").locator("button.bubble").click();
  const frame = page.frameLocator("[data-askdock] iframe");
  await frame.locator('input[aria-label="Your message"]').waitFor({ timeout: 20_000 });
  await page.waitForTimeout(800);
  await frame.locator('input[aria-label="Your message"]').fill("Are you open on Saturdays?");
  await frame.locator('input[aria-label="Your message"]').press("Enter");
  await frame.locator('button[aria-label="Send message"]').waitFor({ timeout: 45_000 });
  await page.waitForTimeout(800);
  await shot(page, vp, "09-widget-open-answer");

  // --- Embedded chat: lead capture ---------------------------------------
  await go(page, `/embed/${DEMO_BOT}`);
  await ask(page, "Do you offer Botox?");
  await page.fill('input[aria-label="Your name"]', "Sam Rivera");
  await page.fill('input[aria-label="Your email"]', "sam.rivera@example.com");
  await shot(page, vp, "10-chat-lead-capture-form");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await page.getByText("The team will get back to you").waitFor();
  await shot(page, vp, "11-chat-lead-captured");

  // --- Auth -----------------------------------------------------------------
  await context.clearCookies();
  await go(page, "/login");
  await shot(page, vp, "12-login");
  await go(page, "/signup");
  await shot(page, vp, "13-signup");

  // --- Dashboard ------------------------------------------------------------
  await signIn(page);
  await shot(page, vp, "14-dashboard-overview");
  await shot(page, vp, "15-dashboard-overview-full", { fullPage: true });

  await go(page, "/dashboard/bots");
  await shot(page, vp, "16-bots");
  await go(page, "/dashboard/bots/new");
  await page.fill("#name", "Studio Helper");
  await page.fill("#business", "Juniper Dental Studio");
  await shot(page, vp, "17-bot-create");

  await go(page, `/dashboard/bots/${DEMO_BOT}`);
  await shot(page, vp, "18-bot-knowledge", { fullPage: !vp.mobile });
  await go(page, `/dashboard/bots/${DEMO_BOT}/customize`);
  await shot(page, vp, "19-bot-customize", { fullPage: !vp.mobile });
  await go(page, `/dashboard/bots/${DEMO_BOT}/install`);
  await shot(page, vp, "20-bot-install", { fullPage: !vp.mobile });

  await go(page, "/dashboard/conversations");
  await shot(page, vp, "21-conversations");
  // Prefer a multi-turn seeded conversation with cited answers for the transcript shot.
  const hrefs = await page.$$eval('a[href^="/dashboard/conversations/"]', (links) => links.map((a) => a.getAttribute("href")!));
  for (const href of hrefs.slice(0, 25)) {
    await go(page, href);
    const turns = await page.locator('section[aria-label="Transcript"] > ol > li').count();
    const cited = await page.locator('section[aria-label="Transcript"] ul li').count();
    if (turns >= 4 && cited >= 2) break;
  }
  await shot(page, vp, "22-conversation-transcript", { fullPage: !vp.mobile });

  await go(page, "/dashboard/leads");
  await shot(page, vp, "23-leads", { fullPage: !vp.mobile });
  await go(page, "/dashboard/analytics");
  await shot(page, vp, "24-analytics", { fullPage: !vp.mobile });
  await go(page, "/dashboard/billing");
  await shot(page, vp, "25-billing", { fullPage: !vp.mobile });

  await context.close();
}

async function main() {
  const browser = await chromium.launch();
  try {
    for (const vp of VIEWPORTS) await capture(browser, vp);
  } finally {
    await browser.close();
  }
  console.log(`\nSaved to ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
