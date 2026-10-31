import "server-only";
import { getPlan } from "@/lib/plans";
import { embedChunks, embedQuery } from "@/lib/rag/embed";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { Bot, Citation, Conversation, Lead, Message, PublicBot, Source, Subscription } from "@/lib/types";
import { NotFoundError, type ConversationRow, type Repo } from "@/lib/db/repo";

/* eslint-disable @typescript-eslint/no-explicit-any -- rows are mapped to typed domain objects below */

const toBot = (r: any): Bot => ({
  id: r.id,
  ownerId: r.owner_id,
  name: r.name,
  avatar: r.avatar,
  brandColor: r.brand_color,
  welcomeMessage: r.welcome_message,
  suggestedQuestions: r.suggested_questions ?? [],
  instructions: r.instructions ?? "",
  leadCapture: r.lead_capture,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const fromBotPatch = (p: Partial<Bot>) => {
  const row: Record<string, unknown> = {};
  if (p.name !== undefined) row.name = p.name;
  if (p.avatar !== undefined) row.avatar = p.avatar;
  if (p.brandColor !== undefined) row.brand_color = p.brandColor;
  if (p.welcomeMessage !== undefined) row.welcome_message = p.welcomeMessage;
  if (p.suggestedQuestions !== undefined) row.suggested_questions = p.suggestedQuestions;
  if (p.instructions !== undefined) row.instructions = p.instructions;
  if (p.leadCapture !== undefined) row.lead_capture = p.leadCapture;
  return row;
};

const toSource = (r: any): Source => ({
  id: r.id,
  botId: r.bot_id,
  kind: r.kind,
  name: r.name,
  url: r.url,
  status: r.status,
  error: r.error,
  charCount: r.char_count,
  chunkCount: r.chunk_count,
  pageCount: r.page_count,
  createdAt: r.created_at,
});

const toConversation = (r: any): Conversation => ({
  id: r.id,
  botId: r.bot_id,
  visitorId: r.visitor_id,
  startedAt: r.started_at,
  lastMessageAt: r.last_message_at,
  messageCount: r.message_count,
  unanswered: r.unanswered,
  firstQuestion: r.first_question,
  leadEmail: r.lead_email,
  country: r.country,
});

const toConversationRow = (r: any): ConversationRow => ({
  ...toConversation(r),
  botName: r.bots?.name ?? "Deleted bot",
  botColor: r.bots?.brand_color ?? "#8f67ee",
});

const toMessage = (r: any): Message => ({
  id: r.id,
  conversationId: r.conversation_id,
  botId: r.bot_id,
  role: r.role,
  content: r.content,
  citations: (r.citations ?? []) as Citation[],
  answered: r.answered,
  createdAt: r.created_at,
});

const toLead = (r: any): Lead => ({
  id: r.id,
  botId: r.bot_id,
  conversationId: r.conversation_id,
  email: r.email,
  name: r.name,
  question: r.question,
  status: r.status,
  createdAt: r.created_at,
});

const toSubscription = (r: any, userId: string): Subscription => ({
  userId,
  plan: r?.plan ?? "free",
  status: r?.status ?? "active",
  stripeCustomerId: r?.stripe_customer_id ?? null,
  stripeSubscriptionId: r?.stripe_subscription_id ?? null,
  currentPeriodEnd: r?.current_period_end ?? null,
  cancelAtPeriodEnd: r?.cancel_at_period_end ?? false,
});

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

async function ownedBotIds(ownerId: string) {
  const db = await createClient();
  const rows = check(await db.from("bots").select("id").eq("owner_id", ownerId));
  return (rows as { id: string }[]).map((r) => r.id);
}

export const supabaseRepo: Repo = {
  kind: "supabase",

  async getSubscription(userId) {
    const db = createAdminClient();
    const row = check(await db.from("subscriptions").select("*").eq("user_id", userId).maybeSingle());
    return toSubscription(row, userId);
  },
  async upsertSubscription(sub) {
    const row: Record<string, unknown> = { user_id: sub.userId, updated_at: new Date().toISOString() };
    if (sub.plan !== undefined) row.plan = sub.plan;
    if (sub.status !== undefined) row.status = sub.status;
    if (sub.stripeCustomerId !== undefined) row.stripe_customer_id = sub.stripeCustomerId;
    if (sub.stripeSubscriptionId !== undefined) row.stripe_subscription_id = sub.stripeSubscriptionId;
    if (sub.currentPeriodEnd !== undefined) row.current_period_end = sub.currentPeriodEnd;
    if (sub.cancelAtPeriodEnd !== undefined) row.cancel_at_period_end = sub.cancelAtPeriodEnd;
    check(await createAdminClient().from("subscriptions").upsert(row as never, { onConflict: "user_id" }));
  },
  async findUserIdByStripeCustomer(customerId) {
    const row = check(
      await createAdminClient().from("subscriptions").select("user_id").eq("stripe_customer_id", customerId).maybeSingle(),
    ) as { user_id: string } | null;
    return row?.user_id ?? null;
  },

  async listBots(ownerId) {
    const db = await createClient();
    const bots = (check(await db.from("bots").select("*").eq("owner_id", ownerId).order("created_at")) as any[]).map(toBot);
    if (!bots.length) return [];
    const ids = bots.map((b) => b.id);
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const [sources, convs, leads] = await Promise.all([
      db.from("sources").select("bot_id").in("bot_id", ids),
      db.from("conversations").select("bot_id").in("bot_id", ids).gte("started_at", since),
      db.from("leads").select("bot_id").in("bot_id", ids),
    ]);
    const count = (rows: any[] | null, id: string) => (rows ?? []).filter((r) => r.bot_id === id).length;
    return bots.map((b) => ({
      ...b,
      sourceCount: count(sources.data, b.id),
      conversations30d: count(convs.data, b.id),
      leadCount: count(leads.data, b.id),
    }));
  },
  async countBots(ownerId) {
    const db = await createClient();
    const { count } = await db.from("bots").select("id", { count: "exact", head: true }).eq("owner_id", ownerId);
    return count ?? 0;
  },
  async getBot(ownerId, botId) {
    const db = await createClient();
    const row = check(await db.from("bots").select("*").eq("id", botId).eq("owner_id", ownerId).maybeSingle());
    return row ? toBot(row) : null;
  },
  async createBot(ownerId, input) {
    const db = await createClient();
    const row = check(
      await db
        .from("bots")
        .insert({ owner_id: ownerId, ...fromBotPatch(input) } as never)
        .select("*")
        .single(),
    );
    return toBot(row);
  },
  async updateBot(ownerId, botId, patch) {
    const db = await createClient();
    const row = check(
      await db
        .from("bots")
        .update({ ...fromBotPatch(patch), updated_at: new Date().toISOString() } as never)
        .eq("id", botId)
        .eq("owner_id", ownerId)
        .select("*")
        .maybeSingle(),
    );
    if (!row) throw new NotFoundError("Bot not found");
    return toBot(row);
  },
  async deleteBot(ownerId, botId) {
    const db = await createClient();
    check(await db.from("bots").delete().eq("id", botId).eq("owner_id", ownerId));
  },
  async getPublicBot(botId) {
    if (!/^[0-9a-f-]{36}$/i.test(botId)) return null;
    const row = check(await createAdminClient().from("bots").select("*").eq("id", botId).maybeSingle());
    if (!row) return null;
    const bot = toBot(row);
    const plan = getPlan((await supabaseRepo.getSubscription(bot.ownerId)).plan);
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
    if (!(await supabaseRepo.getBot(ownerId, botId))) throw new NotFoundError("Bot not found");
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${ownerId}/${botId}-${Date.now()}.${ext}`;
    const storage = createAdminClient().storage.from("bot-avatars");
    const { error } = await storage.upload(path, file, { contentType: file.type, upsert: true });
    if (error) throw new Error(error.message);
    return storage.getPublicUrl(path).data.publicUrl;
  },

  async listSources(ownerId, botId) {
    const db = await createClient();
    if (!(await supabaseRepo.getBot(ownerId, botId))) throw new NotFoundError("Bot not found");
    const rows = check(await db.from("sources").select("*").eq("bot_id", botId).order("created_at", { ascending: false }));
    return (rows as any[]).map(toSource);
  },
  async countSources(ownerId) {
    const ids = await ownedBotIds(ownerId);
    if (!ids.length) return 0;
    const db = await createClient();
    const { count } = await db.from("sources").select("id", { count: "exact", head: true }).in("bot_id", ids);
    return count ?? 0;
  },
  async createSource(ownerId, botId, input) {
    if (!(await supabaseRepo.getBot(ownerId, botId))) throw new NotFoundError("Bot not found");
    const db = await createClient();
    const row = check(
      await db
        .from("sources")
        .insert({ bot_id: botId, kind: input.kind, name: input.name, url: input.url } as never)
        .select("*")
        .single(),
    );
    return toSource(row);
  },
  async completeSource(sourceId, result, chunks = []) {
    const db = createAdminClient();
    const source = check(await db.from("sources").select("bot_id").eq("id", sourceId).single()) as { bot_id: string };
    let chunkCount = 0;
    if (result.status === "ready" && chunks.length) {
      const embeddings = await embedChunks(chunks.map((c) => `${c.title}\n${c.content}`));
      const rows = chunks.map((c, i) => ({
        bot_id: source.bot_id,
        source_id: sourceId,
        content: c.content,
        title: c.title,
        url: c.url,
        position: c.position,
        embedding: JSON.stringify(embeddings[i]),
      }));
      for (let i = 0; i < rows.length; i += 200) check(await db.from("chunks").insert(rows.slice(i, i + 200) as never));
      chunkCount = rows.length;
    }
    check(
      await db
        .from("sources")
        .update({
          status: result.status,
          error: result.error ?? null,
          char_count: result.charCount ?? 0,
          page_count: result.pageCount ?? 0,
          chunk_count: chunkCount,
        } as never)
        .eq("id", sourceId),
    );
  },
  async deleteSource(ownerId, sourceId) {
    const db = await createClient();
    // RLS limits the delete to sources of bots this user owns.
    check(await db.from("sources").delete().eq("id", sourceId));
    void ownerId;
  },
  async searchChunks(botId, query, k = 6) {
    const embedding = await embedQuery(query);
    const rows = check(
      await createAdminClient().rpc("match_chunks", {
        p_bot_id: botId,
        p_query_embedding: JSON.stringify(embedding),
        p_match_count: k,
        p_min_similarity: 0.25,
      } as never),
    ) as unknown as any[] | null;
    return (rows ?? []).map((r) => ({ id: String(r.id), sourceId: r.source_id, content: r.content, title: r.title, url: r.url, score: r.similarity }));
  },

  async ensureConversation({ id, botId, visitorId, firstQuestion, country }) {
    const db = createAdminClient();
    const existing = check(await db.from("conversations").select("*").eq("id", id).maybeSingle()) as any;
    if (existing) return existing.bot_id === botId ? toConversation(existing) : null;
    const row = check(
      await db
        .from("conversations")
        .insert({ id, bot_id: botId, visitor_id: visitorId, first_question: firstQuestion.slice(0, 500), country } as never)
        .select("*")
        .single(),
    );
    return toConversation(row);
  },
  async addMessage({ conversationId, botId, role, content, citations = [], answered = null }) {
    check(
      await createAdminClient()
        .from("messages")
        .insert({ conversation_id: conversationId, bot_id: botId, role, content, citations, answered } as never),
    );
  },
  async countMessagesSince(ownerId, sinceIso) {
    const db = createAdminClient();
    const bots = check(await db.from("bots").select("id").eq("owner_id", ownerId)) as { id: string }[];
    if (!bots.length) return 0;
    const { count } = await db
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in(
        "bot_id",
        bots.map((b) => b.id),
      )
      .eq("role", "user")
      .gte("created_at", sinceIso);
    return count ?? 0;
  },
  async listConversations(ownerId, opts = {}) {
    const ids = opts.botId ? [opts.botId] : await ownedBotIds(ownerId);
    if (!ids.length) return [];
    const db = await createClient();
    let q = db
      .from("conversations")
      .select("*, bots(name, brand_color)")
      .in("bot_id", ids)
      .order("last_message_at", { ascending: false })
      .limit(opts.limit ?? 50);
    if (opts.filter === "unanswered") q = q.eq("unanswered", true);
    if (opts.filter === "leads") q = q.not("lead_email", "is", null);
    if (opts.query) q = q.or(`first_question.ilike.%${opts.query.replace(/[%,()]/g, "")}%,lead_email.ilike.%${opts.query.replace(/[%,()]/g, "")}%`);
    return (check(await q) as any[]).map(toConversationRow);
  },
  async getConversation(ownerId, conversationId) {
    const db = await createClient();
    const conv = check(await db.from("conversations").select("*, bots!inner(name, brand_color, owner_id)").eq("id", conversationId).maybeSingle()) as any;
    if (!conv || conv.bots.owner_id !== ownerId) return null;
    const messages = check(await db.from("messages").select("*").eq("conversation_id", conversationId).order("created_at")) as any[];
    return { conversation: toConversationRow(conv), messages: messages.map(toMessage) };
  },

  async createLead({ botId, conversationId, email, name, question }) {
    const db = createAdminClient();
    const row = check(
      await db
        .from("leads")
        .insert({ bot_id: botId, conversation_id: conversationId, email, name, question } as never)
        .select("*")
        .single(),
    );
    if (conversationId) await db.from("conversations").update({ lead_email: email } as never).eq("id", conversationId).eq("bot_id", botId);
    return toLead(row);
  },
  async listLeads(ownerId, opts = {}) {
    const ids = opts.botId ? [opts.botId] : await ownedBotIds(ownerId);
    if (!ids.length) return [];
    const db = await createClient();
    let q = db.from("leads").select("*, bots(name)").in("bot_id", ids).order("created_at", { ascending: false }).limit(500);
    if (opts.status) q = q.eq("status", opts.status);
    return (check(await q) as any[]).map((r) => ({ ...toLead(r), botName: r.bots?.name ?? "Deleted bot" }));
  },
  async updateLeadStatus(ownerId, leadId, status) {
    const db = await createClient();
    check(await db.from("leads").update({ status } as never).eq("id", leadId));
    void ownerId;
  },

  async getActivity(ownerId, sinceIso, botId) {
    const ids = botId ? [botId] : await ownedBotIds(ownerId);
    if (!ids.length) return { messages: [], conversations: [], leads: [] };
    const db = await createClient();
    const [messages, conversations, leads] = await Promise.all([
      db.from("messages").select("conversation_id, bot_id, role, content, answered, created_at").in("bot_id", ids).gte("created_at", sinceIso).limit(20_000),
      db.from("conversations").select("bot_id, started_at, unanswered").in("bot_id", ids).gte("started_at", sinceIso).limit(10_000),
      db.from("leads").select("bot_id, created_at").in("bot_id", ids).gte("created_at", sinceIso),
    ]);
    return {
      messages: ((messages.data ?? []) as any[]).map((m) => ({ conversationId: m.conversation_id, botId: m.bot_id, role: m.role, content: m.content, answered: m.answered, createdAt: m.created_at })),
      conversations: ((conversations.data ?? []) as any[]).map((c) => ({ botId: c.bot_id, startedAt: c.started_at, unanswered: c.unanswered })),
      leads: ((leads.data ?? []) as any[]).map((l) => ({ botId: l.bot_id, createdAt: l.created_at })),
    };
  },
};
