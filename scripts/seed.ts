/**
 * Seeds the Juniper Dental demo workspace into Supabase:
 * a demo user (Pro plan), two bots, their knowledge (chunked + embedded with
 * OpenAI into pgvector), ~2 months of conversations and leads.
 *
 *   npm run seed
 *
 * Idempotent: re-running replaces the two demo bots and everything under them.
 */
import { randomBytes } from "node:crypto";
import { createOpenAI } from "@ai-sdk/openai";
import { createClient } from "@supabase/supabase-js";
import { embedMany } from "ai";
import { config } from "dotenv";
import { DEMO_BOT_ID, DEMO_USER, ORTHO_BOT_ID } from "../lib/demo/constants";
import { buildDemoDataset } from "../lib/demo/seed";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;
if (!url || !serviceKey || !openaiKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or OPENAI_API_KEY in .env.local");
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });
const openai = createOpenAI({ apiKey: openaiKey });
const email = process.env.SEED_DEMO_EMAIL || DEMO_USER.email;

function check<T>(label: string, res: { data: T; error: { message: string } | null }) {
  if (res.error) throw new Error(`${label}: ${res.error.message}`);
  return res.data;
}

async function inBatches<T>(rows: T[], size: number, fn: (batch: T[]) => Promise<void>) {
  for (let i = 0; i < rows.length; i += size) await fn(rows.slice(i, i + size));
}

async function findOrCreateUser() {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const existing = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (existing) return { id: existing.id, password: null };
    if (data.users.length < 200) break;
  }
  const password = process.env.SEED_DEMO_PASSWORD || randomBytes(9).toString("base64url");
  const { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: DEMO_USER.name },
  });
  if (error) throw error;
  return { id: data.user.id, password };
}

async function main() {
  console.log("→ Demo user");
  const user = await findOrCreateUser();
  const ds = buildDemoDataset(user.id);

  console.log("→ Clearing previous demo bots");
  check("delete bots", await db.from("bots").delete().in("id", [DEMO_BOT_ID, ORTHO_BOT_ID]));

  console.log("→ Bots & sources");
  check(
    "insert bots",
    await db.from("bots").insert(
      ds.bots.map((b) => ({
        id: b.id,
        owner_id: user.id,
        name: b.name,
        avatar: b.avatar,
        brand_color: b.brandColor,
        welcome_message: b.welcomeMessage,
        suggested_questions: b.suggestedQuestions,
        instructions: b.instructions,
        lead_capture: b.leadCapture,
        created_at: b.createdAt,
        updated_at: b.updatedAt,
      })),
    ),
  );
  check(
    "insert sources",
    await db.from("sources").insert(
      ds.sources.map((s) => ({
        id: s.id,
        bot_id: s.botId,
        kind: s.kind,
        name: s.name,
        url: s.url,
        status: "ready",
        char_count: s.charCount,
        chunk_count: s.chunkCount,
        page_count: s.pageCount,
        created_at: s.createdAt,
      })),
    ),
  );

  console.log(`→ Embedding ${ds.chunks.length} chunks with OpenAI`);
  const { embeddings } = await embedMany({
    model: openai.embeddingModel(process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small"),
    values: ds.chunks.map((c) => `${c.title}\n${c.content}`),
  });
  await inBatches(
    ds.chunks.map((c, i) => ({
      bot_id: c.botId,
      source_id: c.sourceId,
      content: c.content,
      title: c.title,
      url: c.url,
      position: c.position,
      embedding: JSON.stringify(embeddings[i]),
    })),
    100,
    async (batch) => void check("insert chunks", await db.from("chunks").insert(batch)),
  );

  console.log(`→ ${ds.conversations.length} conversations, ${ds.messages.length} messages`);
  // Counters, last_message_at and `unanswered` are maintained by the on_message_created trigger.
  await inBatches(
    ds.conversations.map((c) => ({
      id: c.id,
      bot_id: c.botId,
      visitor_id: c.visitorId,
      started_at: c.startedAt,
      last_message_at: c.startedAt,
      first_question: c.firstQuestion,
      country: c.country,
    })),
    500,
    async (batch) => void check("insert conversations", await db.from("conversations").insert(batch)),
  );
  await inBatches(
    [...ds.messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map((m) => ({
      id: m.id,
      conversation_id: m.conversationId,
      bot_id: m.botId,
      role: m.role,
      content: m.content,
      citations: m.citations,
      answered: m.answered,
      created_at: m.createdAt,
    })),
    500,
    async (batch) => void check("insert messages", await db.from("messages").insert(batch)),
  );

  console.log(`→ ${ds.leads.length} leads`);
  check(
    "insert leads",
    await db.from("leads").insert(
      ds.leads.map((l) => ({
        id: l.id,
        bot_id: l.botId,
        conversation_id: l.conversationId,
        email: l.email,
        name: l.name,
        question: l.question,
        status: l.status,
        created_at: l.createdAt,
      })),
    ),
  );
  for (const lead of ds.leads) {
    if (lead.conversationId) check("link lead", await db.from("conversations").update({ lead_email: lead.email }).eq("id", lead.conversationId));
  }

  console.log("→ Pro subscription");
  check(
    "subscription",
    await db.from("subscriptions").upsert(
      { user_id: user.id, plan: "pro", status: "active", current_period_end: ds.subscription.currentPeriodEnd, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    ),
  );

  console.log("\n✓ Seeded Juniper Dental demo workspace");
  console.log(`  Sign in as ${email}${user.password ? ` with password: ${user.password}` : " (existing user — password unchanged)"}`);
  console.log(`  Demo bot id: ${DEMO_BOT_ID} (set NEXT_PUBLIC_DEMO_BOT_ID to this value)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
