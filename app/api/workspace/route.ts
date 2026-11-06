import { NotFoundError, LimitError, type Repo } from "@/lib/db/repo";
import { discardWorkspace, memoryRepo } from "@/lib/db/memory-store";
import { DEMO_USER } from "@/lib/demo/constants";
import { isDemoMode } from "@/lib/env";
import { logger } from "@/lib/logger";

const log = logger("workspace");

export const dynamic = "force-dynamic";

/**
 * Owns the in-memory workspaces (no Supabase). Every page, server action and
 * API route reaches the store through this one function via lib/db/demo-repo,
 * because on Vercel each route is a separate serverless function with its own
 * memory. The visitor's workspace comes from the forwarded `askdock_ws` cookie.
 */
type Method = Exclude<keyof Repo, "kind" | "uploadAvatar">;

// The first argument of these is the workspace owner's id.
const OWNER_SCOPED = new Set<string>([
  "getSubscription",
  "listBots",
  "countBots",
  "getBot",
  "createBot",
  "updateBot",
  "deleteBot",
  "listSources",
  "countSources",
  "createSource",
  "deleteSource",
  "countMessagesSince",
  "listConversations",
  "getConversation",
  "listLeads",
  "updateLeadStatus",
  "getActivity",
]);
const PUBLIC = new Set<string>([
  "upsertSubscription",
  "findUserIdByStripeCustomer",
  "getPublicBot",
  "completeSource",
  "searchChunks",
  "ensureConversation",
  "addMessage",
  "createLead",
]);

export async function POST(req: Request) {
  if (!isDemoMode) return new Response("Not found", { status: 404 });

  const body = (await req.json().catch(() => null)) as { method?: unknown; args?: unknown } | null;
  const method = typeof body?.method === "string" ? body.method : "";
  // JSON turns `undefined` arguments into null; restore them so defaults and `!x` checks behave.
  const args = Array.isArray(body?.args) && body.args.length <= 4 ? body.args.map((a) => (a === null ? undefined : a)) : null;
  if (!args) return Response.json({ error: { name: "BadRequest", message: "Invalid request" } }, { status: 400 });

  if (method === "discardWorkspace") {
    await discardWorkspace();
    return Response.json({ value: null });
  }
  if (!OWNER_SCOPED.has(method) && !PUBLIC.has(method)) {
    return Response.json({ error: { name: "BadRequest", message: "Unknown method" } }, { status: 400 });
  }
  if (OWNER_SCOPED.has(method) && args[0] !== DEMO_USER.id) {
    return Response.json({ error: { name: "NotFoundError", message: "Not found" } });
  }

  try {
    const fn = memoryRepo[method as Method] as (...a: unknown[]) => Promise<unknown>;
    const value = await fn(...args);
    return Response.json({ value: value ?? null });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof LimitError) {
      // Explicit names: class names don't survive minification.
      return Response.json({ error: { name: error instanceof NotFoundError ? "NotFoundError" : "LimitError", message: error.message } });
    }
    log.error(`${method} failed`, error);
    return Response.json({ error: { name: "Error", message: "Something went wrong." } }, { status: 500 });
  }
}
