import "server-only";
import { isDemoMode } from "@/lib/env";
import { demoRepo } from "@/lib/db/demo-repo";
import { supabaseRepo } from "@/lib/db/supabase-repo";
import type { Repo } from "@/lib/db/repo";

export const repo: Repo = isDemoMode ? demoRepo : supabaseRepo;

export { LimitError, NotFoundError } from "@/lib/db/repo";
export type { BotSummary, ConversationRow, LeadRow } from "@/lib/db/repo";
