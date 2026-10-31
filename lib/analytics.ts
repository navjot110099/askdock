import type { Activity } from "@/lib/db/repo";

export type DailyPoint = { date: string; label: string; visitor: number; bot: number; conversations: number };

export type Analytics = {
  days: number;
  daily: DailyPoint[];
  totals: { messages: number; questions: number; conversations: number; leads: number; answerRate: number; avgTurns: number };
  previous: { messages: number; conversations: number; leads: number; answerRate: number };
  topQuestions: { question: string; count: number }[];
  unanswered: { question: string; count: number; lastAsked: string }[];
};

const dayKey = (iso: string) => iso.slice(0, 10);

function normalise(q: string) {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9$\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function rate(answered: number, total: number) {
  return total ? answered / total : 1;
}

/**
 * Turns raw activity for the last `2 × days` into dashboard metrics: the
 * current window plus the previous one for period-over-period deltas.
 */
export function computeAnalytics(activity: Activity, days: number, now = new Date()): Analytics {
  const end = new Date(now);
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const prevStart = new Date(start);
  prevStart.setUTCDate(prevStart.getUTCDate() - days);
  const startIso = start.toISOString();
  const prevIso = prevStart.toISOString();

  const current = {
    messages: activity.messages.filter((m) => m.createdAt >= startIso),
    conversations: activity.conversations.filter((c) => c.startedAt >= startIso),
    leads: activity.leads.filter((l) => l.createdAt >= startIso),
  };
  const prev = {
    messages: activity.messages.filter((m) => m.createdAt >= prevIso && m.createdAt < startIso),
    conversations: activity.conversations.filter((c) => c.startedAt >= prevIso && c.startedAt < startIso),
    leads: activity.leads.filter((l) => l.createdAt >= prevIso && l.createdAt < startIso),
  };

  const daily = new Map<string, DailyPoint>();
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    daily.set(key, {
      date: key,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      visitor: 0,
      bot: 0,
      conversations: 0,
    });
  }
  for (const m of current.messages) {
    const point = daily.get(dayKey(m.createdAt));
    if (point) point[m.role === "user" ? "visitor" : "bot"] += 1;
  }
  for (const c of current.conversations) {
    const point = daily.get(dayKey(c.startedAt));
    if (point) point.conversations += 1;
  }

  const questions = current.messages.filter((m) => m.role === "user");
  const replies = current.messages.filter((m) => m.role === "assistant");
  const prevReplies = prev.messages.filter((m) => m.role === "assistant");

  // Group questions by normalised text; keep the most frequent original wording.
  const groups = new Map<string, { count: number; variants: Map<string, number>; last: string }>();
  for (const q of questions) {
    const key = normalise(q.content);
    if (!key) continue;
    const g = groups.get(key) ?? { count: 0, variants: new Map(), last: q.createdAt };
    g.count += 1;
    g.variants.set(q.content, (g.variants.get(q.content) ?? 0) + 1);
    if (q.createdAt > g.last) g.last = q.createdAt;
    groups.set(key, g);
  }
  const label = (g: { variants: Map<string, number> }) => [...g.variants.entries()].sort((a, b) => b[1] - a[1])[0][0];

  // An unanswered reply belongs to the visitor question right before it in the same conversation.
  const unansweredKeys = new Set<string>();
  const lastQuestion = new Map<string, string>();
  for (const m of [...current.messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    if (m.role === "user") lastQuestion.set(m.conversationId, m.content);
    else if (m.answered === false && lastQuestion.has(m.conversationId)) unansweredKeys.add(normalise(lastQuestion.get(m.conversationId)!));
  }

  const sortedGroups = [...groups.entries()].sort((a, b) => b[1].count - a[1].count);

  return {
    days,
    daily: [...daily.values()],
    totals: {
      messages: current.messages.length,
      questions: questions.length,
      conversations: current.conversations.length,
      leads: current.leads.length,
      answerRate: rate(replies.filter((r) => r.answered !== false).length, replies.length),
      avgTurns: current.conversations.length ? questions.length / current.conversations.length : 0,
    },
    previous: {
      messages: prev.messages.length,
      conversations: prev.conversations.length,
      leads: prev.leads.length,
      answerRate: rate(prevReplies.filter((r) => r.answered !== false).length, prevReplies.length),
    },
    topQuestions: sortedGroups
      .filter(([key]) => !unansweredKeys.has(key))
      .slice(0, 8)
      .map(([, g]) => ({ question: label(g), count: g.count })),
    unanswered: sortedGroups
      .filter(([key]) => unansweredKeys.has(key))
      .slice(0, 8)
      .map(([, g]) => ({ question: label(g), count: g.count, lastAsked: g.last })),
  };
}

export function delta(current: number, previous: number) {
  if (!previous) return current ? 1 : 0;
  return (current - previous) / previous;
}
