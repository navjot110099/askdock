import "server-only";
import { headers } from "next/headers";
import { LimitError, NotFoundError, type Repo } from "@/lib/db/repo";
import { siteUrl } from "@/lib/site-url";

/**
 * Repository used when Supabase isn't configured: a thin client for the
 * in-memory store behind /api/workspace (lib/db/memory-store.ts).
 *
 * On Vercel every route is its own serverless function with its own memory,
 * so an upload saved by the sources API would be invisible to the dashboard
 * page. Sending every read and write to one route keeps the whole app on a
 * single store. The visitor's cookies are forwarded so the store picks their
 * private workspace.
 */
type Method = Exclude<keyof Repo, "kind">;

const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

// Only call back into hosts that serve this app, never one taken blindly from the request.
const KNOWN_HOSTS = new Set(
  [new URL(siteUrl).host, process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]
    .filter((h): h is string => Boolean(h))
    .map((h) => h.toLowerCase()),
);

function storeUrl(h: Headers) {
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").toLowerCase();
  if (LOCAL_HOST.test(host)) return `http://${host}/api/workspace`;
  if (KNOWN_HOSTS.has(host)) return `https://${host}/api/workspace`;
  return `${siteUrl}/api/workspace`;
}

async function call<T>(method: Method | "discardWorkspace", args: unknown[]): Promise<T> {
  const h = await headers();
  const res = await fetch(storeUrl(h), {
    method: "POST",
    cache: "no-store",
    headers: { "content-type": "application/json", cookie: h.get("cookie") ?? "" },
    body: JSON.stringify({ method, args }),
  });
  const data = (await res.json().catch(() => null)) as { value?: T; error?: { name: string; message: string } } | null;
  if (data?.error) {
    if (data.error.name === "NotFoundError") throw new NotFoundError(data.error.message);
    if (data.error.name === "LimitError") throw new LimitError(data.error.message);
    throw new Error(`Workspace ${method} failed: ${data.error.message}`);
  }
  if (!res.ok || !data) throw new Error(`Workspace ${method} failed (${res.status})`);
  return data.value as T;
}

function remote<M extends Method>(method: M): Repo[M] {
  return ((...args: unknown[]) => call(method, args)) as Repo[M];
}

/** Drops the current visitor's workspace so their next sign-in starts from fresh sample data. */
export async function discardWorkspace() {
  await call("discardWorkspace", []);
}

export const demoRepo: Repo = {
  kind: "demo",

  getSubscription: remote("getSubscription"),
  upsertSubscription: remote("upsertSubscription"),
  findUserIdByStripeCustomer: remote("findUserIdByStripeCustomer"),

  listBots: remote("listBots"),
  countBots: remote("countBots"),
  getBot: remote("getBot"),
  createBot: remote("createBot"),
  updateBot: remote("updateBot"),
  deleteBot: remote("deleteBot"),
  getPublicBot: remote("getPublicBot"),
  // Files don't travel as JSON; avatars are stored inline as data URLs anyway.
  async uploadAvatar(ownerId, botId, file) {
    if (!(await demoRepo.getBot(ownerId, botId))) throw new NotFoundError("Bot not found");
    const bytes = Buffer.from(await file.arrayBuffer());
    return `data:${file.type};base64,${bytes.toString("base64")}`;
  },

  listSources: remote("listSources"),
  countSources: remote("countSources"),
  createSource: remote("createSource"),
  completeSource: remote("completeSource"),
  deleteSource: remote("deleteSource"),
  searchChunks: remote("searchChunks"),

  ensureConversation: remote("ensureConversation"),
  addMessage: remote("addMessage"),
  countMessagesSince: remote("countMessagesSince"),
  listConversations: remote("listConversations"),
  getConversation: remote("getConversation"),

  createLead: remote("createLead"),
  listLeads: remote("listLeads"),
  updateLeadStatus: remote("updateLeadStatus"),

  getActivity: remote("getActivity"),
};
