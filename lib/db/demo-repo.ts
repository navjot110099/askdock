import "server-only";
import { cookies } from "next/headers";
import { DEMO_USER } from "@/lib/demo/constants";
import { buildDemoDataset, type DemoDataset, type SeedChunk } from "@/lib/demo/seed";
import { getPlan } from "@/lib/plans";
import { searchLexical } from "@/lib/rag/lexical";
import { WORKSPACE_COOKIE, WORKSPACE_ID } from "@/lib/session-cookies";
import type { Bot, Conversation, Lead, Message, PublicBot, Source } from "@/lib/types";
import { NotFoundError, type ConversationRow, type Repo } from "@/lib/db/repo";

/**
 * In-memory workspaces used when Supabase isn't configured.
 *
 * Every visitor gets a private copy of the seeded Juniper Dental workspace,
 * keyed by the `askdock_ws` cookie the middleware issues. Reads use the shared
 * pristine seed until the visitor first changes something (a chat, an upload,
 * a lead); that write clones the seed into their own workspace. Requests
 * without the cookie (e.g. the widget embedded on another site) share one
 * fallback workspace. Workspaces live on `globalThis`, are capped per server
 * instance and are dropped after a few idle hours or on sign-out.
 */
type State = DemoDataset;
type Entry = { state: State; touched: number };

const MAX_WORKSPACES = 50;
const IDLE_MS = 6 * 60 * 60 * 1000;
const SHARED = "shared";

const store = globalThis as unknown as { __askdockSeed?: State; __askdockWorkspaces?: Map<string, Entry> };

/**
 * The seeded history is generated relative to this moment. Pin it with
 * DEMO_SEED_NOW (any ISO date) to get identical numbers across restarts,
 * e.g. for screenshots; otherwise it is the server start time.
 */
function seedNow() {
  const pinned = process.env.DEMO_SEED_NOW ? new Date(process.env.DEMO_SEED_NOW) : null;
  return pinned && !Number.isNaN(pinned.getTime()) ? pinned : new Date();
}

function seed(): State {
  store.__askdockSeed ??= buildDemoDataset(DEMO_USER.id, seedNow());
  return store.__askdockSeed;
}

function workspaces() {
  store.__askdockWorkspaces ??= new Map();
  return store.__askdockWorkspaces;
}

async function workspaceId() {
  try {
    const value = (await cookies()).get(WORKSPACE_COOKIE)?.value;
    return value && WORKSPACE_ID.test(value) ? value : SHARED;
  } catch {
    // Outside a request (build time, scripts) there is no visitor.
    return SHARED;
  }
}

/** The visitor's workspace; `write` makes a private copy of the seed on first use. */
async function state(intent: "read" | "write" = "read"): Promise<State> {
  const id = await workspaceId();
  const map = workspaces();
  const entry = map.get(id);
  if (entry) {
    // Re-insert so the Map stays ordered least-recently-used first.
    map.delete(id);
    entry.touched = Date.now();
    map.set(id, entry);
    return entry.state;
  }
  if (intent === "read") return seed();

  const created: Entry = { state: structuredClone(seed()), touched: Date.now() };
  map.set(id, created);
  const cutoff = Date.now() - IDLE_MS;
  for (const [key, value] of map) {
    if (map.size <= MAX_WORKSPACES && value.touched >= cutoff) break;
    if (key !== id) map.delete(key);
  }
  return created.state;
}

/** Drops a visitor's workspace so their next visit starts from fresh sample data. */
export function discardWorkspace(id: string | undefined) {
  if (id) workspaces().delete(id);
}

const now = () => new Date().toISOString();

function ownedBot(s: State, ownerId: string, botId: string) {
  const bot = s.bots.find((b) => b.id === botId && b.ownerId === ownerId);
  if (!bot) throw new NotFoundError("Bot not found");
  return bot;
}

function ownedBotIds(s: State, ownerId: string) {
  return new Set(s.bots.filter((b) => b.ownerId === ownerId).map((b) => b.id));
}

function withBot(s: State, conv: Conversation): ConversationRow {
  const bot = s.bots.find((b) => b.id === conv.botId);
  return { ...conv, botName: bot?.name ?? "Deleted bot", botColor: bot?.brandColor ?? "#8f67ee" };
}

export const demoRepo: Repo = {
  kind: "demo",

  async getSubscription(userId) {
    const sub = (await state()).subscription;
    return sub.userId === userId ? sub : { ...sub, userId, plan: "free" };
  },
  async upsertSubscription(sub) {
    Object.assign((await state("write")).subscription, sub);
  },
  async findUserIdByStripeCustomer() {
    return null;
  },

  async listBots(ownerId) {
    const s = await state();
    const since = Date.now() - 30 * 86_400_000;
    return s.bots
      .filter((b) => b.ownerId === ownerId)
      .map((bot) => ({
        ...bot,
        sourceCount: s.sources.filter((x) => x.botId === bot.id).length,
        conversations30d: s.conversations.filter((c) => c.botId === bot.id && Date.parse(c.startedAt) >= since).length,
        leadCount: s.leads.filter((l) => l.botId === bot.id).length,
      }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },
  async countBots(ownerId) {
    return (await state()).bots.filter((b) => b.ownerId === ownerId).length;
  },
  async getBot(ownerId, botId) {
    return (await state()).bots.find((b) => b.id === botId && b.ownerId === ownerId) ?? null;
  },
  async createBot(ownerId, input) {
    const bot: Bot = {
      id: crypto.randomUUID(),
      ownerId,
      name: input.name,
      avatar: input.avatar ?? "preset:spark",
      brandColor: input.brandColor ?? "#8f67ee",
      welcomeMessage: input.welcomeMessage ?? "Hi! How can I help you today?",
      suggestedQuestions: input.suggestedQuestions ?? [],
      instructions: input.instructions ?? "",
      leadCapture: input.leadCapture ?? true,
      createdAt: now(),
      updatedAt: now(),
    };
    (await state("write")).bots.push(bot);
    return bot;
  },
  async updateBot(ownerId, botId, patch) {
    const bot = ownedBot(await state("write"), ownerId, botId);
    Object.assign(bot, patch, { updatedAt: now() });
    return bot;
  },
  async deleteBot(ownerId, botId) {
    const s = await state("write");
    ownedBot(s, ownerId, botId);
    s.bots = s.bots.filter((b) => b.id !== botId);
    s.sources = s.sources.filter((x) => x.botId !== botId);
    s.chunks = s.chunks.filter((x) => x.botId !== botId);
    s.conversations = s.conversations.filter((x) => x.botId !== botId);
    s.messages = s.messages.filter((x) => x.botId !== botId);
    s.leads = s.leads.filter((x) => x.botId !== botId);
  },
  async getPublicBot(botId) {
    const bot = (await state()).bots.find((b) => b.id === botId);
    if (!bot) return null;
    const plan = getPlan((await demoRepo.getSubscription(bot.ownerId)).plan);
    return {
      id: bot.id,
      ownerId: bot.ownerId,
      name: bot.name,
      avatar: bot.avatar,
      brandColor: bot.brandColor,
      welcomeMessage: bot.welcomeMessage,
      suggestedQuestions: bot.suggestedQuestions,
      instructions: bot.instructions,
      leadCapture: bot.leadCapture && plan.leadCapture,
      showBranding: !plan.removeBranding,
    } satisfies PublicBot;
  },
  async uploadAvatar(ownerId, botId, file) {
    ownedBot(await state(), ownerId, botId);
    const bytes = Buffer.from(await file.arrayBuffer());
    return `data:${file.type};base64,${bytes.toString("base64")}`;
  },

  async listSources(ownerId, botId) {
    const st = await state();
    ownedBot(st, ownerId, botId);
    return st.sources
      .filter((s) => s.botId === botId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async countSources(ownerId) {
    const st = await state();
    const ids = ownedBotIds(st, ownerId);
    return st.sources.filter((s) => ids.has(s.botId)).length;
  },
  async createSource(ownerId, botId, input) {
    const st = await state("write");
    ownedBot(st, ownerId, botId);
    const source: Source = {
      id: crypto.randomUUID(),
      botId,
      kind: input.kind,
      name: input.name,
      url: input.url,
      status: "processing",
      error: null,
      charCount: 0,
      chunkCount: 0,
      pageCount: 0,
      createdAt: now(),
    };
    st.sources.push(source);
    return source;
  },
  async completeSource(sourceId, result, chunks = []) {
    const s = await state("write");
    const source = s.sources.find((x) => x.id === sourceId);
    if (!source) return;
    Object.assign(source, {
      status: result.status,
      error: result.error ?? null,
      charCount: result.charCount ?? source.charCount,
      pageCount: result.pageCount ?? source.pageCount,
      chunkCount: chunks.length,
    });
    s.chunks.push(
      ...chunks.map<SeedChunk>((c) => ({
        id: crypto.randomUUID(),
        botId: source.botId,
        sourceId,
        content: c.content,
        title: c.title,
        url: c.url,
        position: c.position,
      })),
    );
  },
  async deleteSource(ownerId, sourceId) {
    const s = await state("write");
    const source = s.sources.find((x) => x.id === sourceId);
    if (!source) return;
    ownedBot(s, ownerId, source.botId);
    s.sources = s.sources.filter((x) => x.id !== sourceId);
    s.chunks = s.chunks.filter((x) => x.sourceId !== sourceId);
  },
  async searchChunks(botId, query, k = 5) {
    return searchLexical(
      (await state()).chunks.filter((c) => c.botId === botId),
      query,
      k,
    );
  },

  async ensureConversation({ id, botId, visitorId, firstQuestion, country }) {
    const s = await state("write");
    const existing = s.conversations.find((c) => c.id === id);
    if (existing) return existing.botId === botId ? existing : null;
    const conv: Conversation = {
      id,
      botId,
      visitorId,
      startedAt: now(),
      lastMessageAt: now(),
      messageCount: 0,
      unanswered: false,
      firstQuestion,
      leadEmail: null,
      country,
    };
    s.conversations.unshift(conv);
    return conv;
  },
  async addMessage({ conversationId, botId, role, content, citations = [], answered = null }) {
    const s = await state("write");
    const msg: Message = { id: crypto.randomUUID(), conversationId, botId, role, content, citations, answered, createdAt: now() };
    s.messages.push(msg);
    const conv = s.conversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.messageCount += 1;
      conv.lastMessageAt = msg.createdAt;
      if (role === "assistant" && answered === false) conv.unanswered = true;
      // Keep most-recent-first ordering.
      s.conversations = [conv, ...s.conversations.filter((c) => c.id !== conversationId)];
    }
  },
  async countMessagesSince(ownerId, sinceIso) {
    const st = await state();
    const ids = ownedBotIds(st, ownerId);
    return st.messages.filter((m) => m.role === "user" && ids.has(m.botId) && m.createdAt >= sinceIso).length;
  },
  async listConversations(ownerId, opts = {}) {
    const st = await state();
    const ids = ownedBotIds(st, ownerId);
    const q = opts.query?.toLowerCase().trim();
    return st.conversations
      .filter(
        (c) =>
          ids.has(c.botId) &&
          (!opts.botId || c.botId === opts.botId) &&
          (opts.filter !== "unanswered" || c.unanswered) &&
          (opts.filter !== "leads" || c.leadEmail) &&
          (!q || c.firstQuestion?.toLowerCase().includes(q) || c.leadEmail?.includes(q)),
      )
      .slice(0, opts.limit ?? 50)
      .map((c) => withBot(st, c));
  },
  async getConversation(ownerId, conversationId) {
    const st = await state();
    const conv = st.conversations.find((c) => c.id === conversationId);
    if (!conv || !ownedBotIds(st, ownerId).has(conv.botId)) return null;
    const messages = st.messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return { conversation: withBot(st, conv), messages };
  },

  async createLead({ botId, conversationId, email, name, question }) {
    const s = await state("write");
    const lead: Lead = { id: crypto.randomUUID(), botId, conversationId, email, name, question, status: "new", createdAt: now() };
    s.leads.unshift(lead);
    const conv = s.conversations.find((c) => c.id === conversationId);
    if (conv) conv.leadEmail = email;
    return lead;
  },
  async listLeads(ownerId, opts = {}) {
    const st = await state();
    const ids = ownedBotIds(st, ownerId);
    const bots = st.bots;
    return st.leads
      .filter((l) => ids.has(l.botId) && (!opts.botId || l.botId === opts.botId) && (!opts.status || l.status === opts.status))
      .map((l) => ({ ...l, botName: bots.find((b) => b.id === l.botId)?.name ?? "Deleted bot" }));
  },
  async updateLeadStatus(ownerId, leadId, status) {
    const st = await state("write");
    const lead = st.leads.find((l) => l.id === leadId);
    if (!lead || !ownedBotIds(st, ownerId).has(lead.botId)) throw new NotFoundError("Lead not found");
    lead.status = status;
  },

  async getActivity(ownerId, sinceIso, botId) {
    const s = await state();
    const ids = ownedBotIds(s, ownerId);
    const keep = (b: string) => ids.has(b) && (!botId || b === botId);
    return {
      messages: s.messages.filter((m) => keep(m.botId) && m.createdAt >= sinceIso),
      conversations: s.conversations.filter((c) => keep(c.botId) && c.startedAt >= sinceIso),
      leads: s.leads.filter((l) => keep(l.botId) && l.createdAt >= sinceIso),
    };
  },
};
