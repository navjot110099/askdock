import "server-only";
import { DEMO_USER } from "@/lib/demo/constants";
import { buildDemoDataset, type DemoDataset, type SeedChunk } from "@/lib/demo/seed";
import { getPlan } from "@/lib/plans";
import { searchLexical } from "@/lib/rag/lexical";
import type { Bot, Conversation, Lead, Message, PublicBot, Source } from "@/lib/types";
import { NotFoundError, type ConversationRow, type Repo } from "@/lib/db/repo";

/**
 * In-memory workspace used when Supabase isn't configured. State lives on
 * `globalThis` so it survives hot reloads; it resets when the server restarts.
 */
type State = DemoDataset;

const store = globalThis as unknown as { __askdockDemo?: State };

function state(): State {
  store.__askdockDemo ??= buildDemoDataset(DEMO_USER.id);
  return store.__askdockDemo;
}

const now = () => new Date().toISOString();

function ownedBot(ownerId: string, botId: string) {
  const bot = state().bots.find((b) => b.id === botId && b.ownerId === ownerId);
  if (!bot) throw new NotFoundError("Bot not found");
  return bot;
}

function ownedBotIds(ownerId: string) {
  return new Set(state().bots.filter((b) => b.ownerId === ownerId).map((b) => b.id));
}

function withBot(conv: Conversation): ConversationRow {
  const bot = state().bots.find((b) => b.id === conv.botId);
  return { ...conv, botName: bot?.name ?? "Deleted bot", botColor: bot?.brandColor ?? "#8f67ee" };
}

export const demoRepo: Repo = {
  kind: "demo",

  async getSubscription(userId) {
    const sub = state().subscription;
    return sub.userId === userId ? sub : { ...sub, userId, plan: "free" };
  },
  async upsertSubscription(sub) {
    Object.assign(state().subscription, sub);
  },
  async findUserIdByStripeCustomer() {
    return null;
  },

  async listBots(ownerId) {
    const s = state();
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
    return state().bots.filter((b) => b.ownerId === ownerId).length;
  },
  async getBot(ownerId, botId) {
    return state().bots.find((b) => b.id === botId && b.ownerId === ownerId) ?? null;
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
    state().bots.push(bot);
    return bot;
  },
  async updateBot(ownerId, botId, patch) {
    const bot = ownedBot(ownerId, botId);
    Object.assign(bot, patch, { updatedAt: now() });
    return bot;
  },
  async deleteBot(ownerId, botId) {
    ownedBot(ownerId, botId);
    const s = state();
    s.bots = s.bots.filter((b) => b.id !== botId);
    s.sources = s.sources.filter((x) => x.botId !== botId);
    s.chunks = s.chunks.filter((x) => x.botId !== botId);
    s.conversations = s.conversations.filter((x) => x.botId !== botId);
    s.messages = s.messages.filter((x) => x.botId !== botId);
    s.leads = s.leads.filter((x) => x.botId !== botId);
  },
  async getPublicBot(botId) {
    const bot = state().bots.find((b) => b.id === botId);
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
    ownedBot(ownerId, botId);
    const bytes = Buffer.from(await file.arrayBuffer());
    return `data:${file.type};base64,${bytes.toString("base64")}`;
  },

  async listSources(ownerId, botId) {
    ownedBot(ownerId, botId);
    return state()
      .sources.filter((s) => s.botId === botId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async countSources(ownerId) {
    const ids = ownedBotIds(ownerId);
    return state().sources.filter((s) => ids.has(s.botId)).length;
  },
  async createSource(ownerId, botId, input) {
    ownedBot(ownerId, botId);
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
    state().sources.push(source);
    return source;
  },
  async completeSource(sourceId, result, chunks = []) {
    const s = state();
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
    const s = state();
    const source = s.sources.find((x) => x.id === sourceId);
    if (!source) return;
    ownedBot(ownerId, source.botId);
    s.sources = s.sources.filter((x) => x.id !== sourceId);
    s.chunks = s.chunks.filter((x) => x.sourceId !== sourceId);
  },
  async searchChunks(botId, query, k = 5) {
    return searchLexical(
      state().chunks.filter((c) => c.botId === botId),
      query,
      k,
    );
  },

  async ensureConversation({ id, botId, visitorId, firstQuestion, country }) {
    const s = state();
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
    const s = state();
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
    const ids = ownedBotIds(ownerId);
    return state().messages.filter((m) => m.role === "user" && ids.has(m.botId) && m.createdAt >= sinceIso).length;
  },
  async listConversations(ownerId, opts = {}) {
    const ids = ownedBotIds(ownerId);
    const q = opts.query?.toLowerCase().trim();
    return state()
      .conversations.filter(
        (c) =>
          ids.has(c.botId) &&
          (!opts.botId || c.botId === opts.botId) &&
          (opts.filter !== "unanswered" || c.unanswered) &&
          (opts.filter !== "leads" || c.leadEmail) &&
          (!q || c.firstQuestion?.toLowerCase().includes(q) || c.leadEmail?.includes(q)),
      )
      .slice(0, opts.limit ?? 50)
      .map(withBot);
  },
  async getConversation(ownerId, conversationId) {
    const conv = state().conversations.find((c) => c.id === conversationId);
    if (!conv || !ownedBotIds(ownerId).has(conv.botId)) return null;
    const messages = state()
      .messages.filter((m) => m.conversationId === conversationId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return { conversation: withBot(conv), messages };
  },

  async createLead({ botId, conversationId, email, name, question }) {
    const s = state();
    const lead: Lead = { id: crypto.randomUUID(), botId, conversationId, email, name, question, status: "new", createdAt: now() };
    s.leads.unshift(lead);
    const conv = s.conversations.find((c) => c.id === conversationId);
    if (conv) conv.leadEmail = email;
    return lead;
  },
  async listLeads(ownerId, opts = {}) {
    const ids = ownedBotIds(ownerId);
    const bots = state().bots;
    return state()
      .leads.filter((l) => ids.has(l.botId) && (!opts.botId || l.botId === opts.botId) && (!opts.status || l.status === opts.status))
      .map((l) => ({ ...l, botName: bots.find((b) => b.id === l.botId)?.name ?? "Deleted bot" }));
  },
  async updateLeadStatus(ownerId, leadId, status) {
    const lead = state().leads.find((l) => l.id === leadId);
    if (!lead || !ownedBotIds(ownerId).has(lead.botId)) throw new NotFoundError("Lead not found");
    lead.status = status;
  },

  async getActivity(ownerId, sinceIso, botId) {
    const ids = ownedBotIds(ownerId);
    const keep = (b: string) => ids.has(b) && (!botId || b === botId);
    const s = state();
    return {
      messages: s.messages.filter((m) => keep(m.botId) && m.createdAt >= sinceIso),
      conversations: s.conversations.filter((c) => keep(c.botId) && c.startedAt >= sinceIso),
      leads: s.leads.filter((l) => keep(l.botId) && l.createdAt >= sinceIso),
    };
  },
};
