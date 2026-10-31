import type { UIMessage } from "ai";
import type { PlanId } from "@/lib/plans";

export type Bot = {
  id: string;
  ownerId: string;
  name: string;
  /** Either `preset:<id>` (see lib/avatars) or an image URL. */
  avatar: string;
  brandColor: string;
  welcomeMessage: string;
  suggestedQuestions: string[];
  /** Extra guidance appended to the system prompt (tone, scope, escalation rules). */
  instructions: string;
  leadCapture: boolean;
  createdAt: string;
  updatedAt: string;
};

/** The subset of a bot that is safe to expose to anonymous website visitors. */
export type PublicBot = Pick<
  Bot,
  "id" | "ownerId" | "name" | "avatar" | "brandColor" | "welcomeMessage" | "suggestedQuestions" | "instructions" | "leadCapture"
> & { showBranding: boolean };

export type SourceKind = "file" | "url";
export type SourceStatus = "processing" | "ready" | "failed";

export type Source = {
  id: string;
  botId: string;
  kind: SourceKind;
  name: string;
  url: string | null;
  status: SourceStatus;
  error: string | null;
  charCount: number;
  chunkCount: number;
  pageCount: number;
  createdAt: string;
};

export type ChunkInput = {
  content: string;
  /** Title shown on citations — the file name or the crawled page title. */
  title: string;
  url: string | null;
  position: number;
  embedding?: number[];
};

export type RetrievedChunk = {
  id: string;
  sourceId: string;
  content: string;
  title: string;
  url: string | null;
  score: number;
};

export type Citation = {
  /** 1-based number used in `[n]` markers inside the answer. */
  n: number;
  title: string;
  url: string | null;
  snippet: string;
};

export type Conversation = {
  id: string;
  botId: string;
  visitorId: string;
  startedAt: string;
  lastMessageAt: string;
  messageCount: number;
  unanswered: boolean;
  firstQuestion: string | null;
  leadEmail: string | null;
  country: string | null;
};

export type MessageRole = "user" | "assistant";

export type Message = {
  id: string;
  conversationId: string;
  botId: string;
  role: MessageRole;
  content: string;
  citations: Citation[];
  /** Assistant messages only: false when the bot couldn't answer from its knowledge. */
  answered: boolean | null;
  createdAt: string;
};

export type LeadStatus = "new" | "contacted" | "won";

export type Lead = {
  id: string;
  botId: string;
  conversationId: string | null;
  email: string;
  name: string | null;
  question: string | null;
  status: LeadStatus;
  createdAt: string;
};

export type Subscription = {
  userId: string;
  plan: PlanId;
  status: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

export type AppUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
};

/** Custom data parts streamed alongside chat answers. */
export type ChatDataParts = {
  sources: { citations: Citation[] };
  lead: { reason: string };
  notice: { text: string };
};

export type ChatMessage = UIMessage<never, ChatDataParts>;
