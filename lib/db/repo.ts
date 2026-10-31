import type {
  Bot,
  ChunkInput,
  Citation,
  Conversation,
  Lead,
  LeadStatus,
  Message,
  PublicBot,
  RetrievedChunk,
  Source,
  SourceKind,
  SourceStatus,
  Subscription,
} from "@/lib/types";

export type BotSummary = Bot & { sourceCount: number; conversations30d: number; leadCount: number };

export type BotInput = Partial<Omit<Bot, "id" | "ownerId" | "createdAt" | "updatedAt">> & { name: string };

export type ConversationRow = Conversation & { botName: string; botColor: string };

export type LeadRow = Lead & { botName: string };

export type ActivityMessage = Pick<Message, "conversationId" | "botId" | "role" | "content" | "answered" | "createdAt">;

export type Activity = {
  messages: ActivityMessage[];
  conversations: Pick<Conversation, "botId" | "startedAt" | "unanswered">[];
  leads: Pick<Lead, "botId" | "createdAt">[];
};

/**
 * Storage interface shared by the Supabase implementation and the in-memory
 * demo workspace. Methods taking `ownerId` are dashboard operations scoped to
 * that user; the rest serve anonymous widget traffic.
 */
export interface Repo {
  readonly kind: "supabase" | "demo";

  getSubscription(userId: string): Promise<Subscription>;
  upsertSubscription(sub: Partial<Subscription> & { userId: string }): Promise<void>;
  findUserIdByStripeCustomer(customerId: string): Promise<string | null>;

  listBots(ownerId: string): Promise<BotSummary[]>;
  countBots(ownerId: string): Promise<number>;
  getBot(ownerId: string, botId: string): Promise<Bot | null>;
  createBot(ownerId: string, input: BotInput): Promise<Bot>;
  updateBot(ownerId: string, botId: string, patch: Partial<BotInput>): Promise<Bot>;
  deleteBot(ownerId: string, botId: string): Promise<void>;
  getPublicBot(botId: string): Promise<PublicBot | null>;
  uploadAvatar(ownerId: string, botId: string, file: File): Promise<string>;

  listSources(ownerId: string, botId: string): Promise<Source[]>;
  countSources(ownerId: string): Promise<number>;
  createSource(ownerId: string, botId: string, input: { kind: SourceKind; name: string; url: string | null }): Promise<Source>;
  completeSource(
    sourceId: string,
    result: { status: SourceStatus; error?: string | null; charCount?: number; pageCount?: number },
    chunks?: ChunkInput[],
  ): Promise<void>;
  deleteSource(ownerId: string, sourceId: string): Promise<void>;
  searchChunks(botId: string, query: string, k?: number): Promise<RetrievedChunk[]>;

  ensureConversation(input: { id: string; botId: string; visitorId: string; firstQuestion: string; country: string | null }): Promise<Conversation | null>;
  addMessage(input: { conversationId: string; botId: string; role: Message["role"]; content: string; citations?: Citation[]; answered?: boolean | null }): Promise<void>;
  countMessagesSince(ownerId: string, sinceIso: string): Promise<number>;
  listConversations(ownerId: string, opts?: { botId?: string; filter?: "all" | "unanswered" | "leads"; query?: string; limit?: number }): Promise<ConversationRow[]>;
  getConversation(ownerId: string, conversationId: string): Promise<{ conversation: ConversationRow; messages: Message[] } | null>;

  createLead(input: { botId: string; conversationId: string | null; email: string; name: string | null; question: string | null }): Promise<Lead>;
  listLeads(ownerId: string, opts?: { botId?: string; status?: LeadStatus }): Promise<LeadRow[]>;
  updateLeadStatus(ownerId: string, leadId: string, status: LeadStatus): Promise<void>;

  getActivity(ownerId: string, sinceIso: string, botId?: string): Promise<Activity>;
}

export class LimitError extends Error {}
export class NotFoundError extends Error {}
