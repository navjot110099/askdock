import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { env } from "@/lib/env";
import { htmlToText } from "@/lib/rag/extract";

export type CrawledPage = { url: string; title: string; text: string };

const USER_AGENT = `AskDockBot/1.0 (+${env.appUrl}/bot)`;
const SKIP_EXTENSIONS = /\.(png|jpe?g|gif|webp|svg|ico|pdf|zip|gz|mp4|mp3|mov|avi|css|js|json|xml|woff2?|ttf|eot|docx?|xlsx?|pptx?)$/i;
const MAX_HTML_BYTES = 2_000_000;

export class CrawlError extends Error {}

/**
 * Breadth-first, same-site crawl. Bounded by `maxPages` and a wall-clock
 * budget so it fits inside a serverless function; every request (including
 * redirects) is checked against private network ranges.
 */
export async function crawlSite(startUrl: string, opts: { maxPages: number; budgetMs?: number }) {
  const start = normaliseUrl(startUrl);
  await assertPublicUrl(start);

  const deadline = Date.now() + (opts.budgetMs ?? 40_000);
  const site = siteKey(start);
  const disallow = await loadRobots(start);
  const queue = [start.toString()];
  const seen = new Set(queue);
  const pages: CrawledPage[] = [];

  while (queue.length && pages.length < opts.maxPages && Date.now() < deadline) {
    const batch = queue.splice(0, 4);
    const results = await Promise.allSettled(batch.map((url) => fetchPage(url)));
    for (const result of results) {
      if (result.status !== "fulfilled" || !result.value) continue;
      const { page, links } = result.value;
      if (page.text.length > 120 && pages.length < opts.maxPages) pages.push(page);
      for (const link of links) {
        let url: URL;
        try {
          url = normaliseUrl(link);
        } catch {
          continue;
        }
        const key = url.toString();
        if (seen.has(key) || siteKey(url) !== site || SKIP_EXTENSIONS.test(url.pathname)) continue;
        if (disallow.some((rule) => url.pathname.startsWith(rule))) continue;
        seen.add(key);
        queue.push(key);
      }
    }
  }

  if (!pages.length) throw new CrawlError("We couldn't read any text from that website. Check the URL is public and not blocking bots.");
  return pages;
}

async function fetchPage(url: string) {
  const res = await safeFetch(url);
  if (!res || !res.ok || !(res.headers.get("content-type") ?? "").includes("text/html")) return null;
  const html = await readLimited(res, MAX_HTML_BYTES);
  const { title, text, links } = htmlToText(html, res.url || url);
  return { page: { url: res.url || url, title: title || new URL(url).pathname, text }, links };
}

/** fetch() with manual redirects so each hop is re-validated. */
async function safeFetch(input: string, hops = 0): Promise<Response | null> {
  const url = new URL(input);
  await assertPublicUrl(url);
  const res = await fetch(url, {
    redirect: "manual",
    headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml" },
    signal: AbortSignal.timeout(8_000),
  });
  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get("location");
    if (!location || hops >= 3) return null;
    return safeFetch(new URL(location, url).toString(), hops + 1);
  }
  return res;
}

async function readLimited(res: Response, maxBytes: number) {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

async function loadRobots(start: URL) {
  try {
    const res = await safeFetch(new URL("/robots.txt", start).toString());
    if (!res?.ok) return [];
    const rules: string[] = [];
    let applies = false;
    for (const raw of (await res.text()).split("\n")) {
      const line = raw.split("#")[0].trim();
      const [key, ...rest] = line.split(":");
      const value = rest.join(":").trim();
      if (/^user-agent$/i.test(key)) applies = value === "*" || /askdock/i.test(value);
      else if (applies && /^disallow$/i.test(key) && value) rules.push(value);
    }
    return rules;
  } catch {
    return [];
  }
}

export function normaliseUrl(input: string) {
  const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new CrawlError("Only http and https URLs can be crawled.");
  url.hash = "";
  url.search = "";
  if (url.pathname !== "/" && url.pathname.endsWith("/")) url.pathname = url.pathname.slice(0, -1);
  return url;
}

const siteKey = (url: URL) => url.hostname.replace(/^www\./, "");

export async function assertPublicUrl(url: URL) {
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new CrawlError("That address isn't publicly reachable.");
  }
  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true }).catch(() => [])).map((a) => a.address);
  if (!addresses.length) throw new CrawlError(`We couldn't find a website at ${host}.`);
  if (addresses.some(isPrivateAddress)) throw new CrawlError("That address isn't publicly reachable.");
}

function isPrivateAddress(ip: string) {
  if (ip.includes(":")) {
    const v = ip.toLowerCase();
    if (v.startsWith("::ffff:")) return isPrivateAddress(v.slice(7));
    return v === "::" || v === "::1" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80");
  }
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}
