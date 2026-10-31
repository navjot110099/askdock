"use client";

import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { useState } from "react";

type Props = {
  apiBase: string;
  botId: string;
  conversationId: string;
  question: string;
  color: string;
  textOnColor: string;
};

export function LeadForm({ apiBase, botId, conversationId, question, color, textOnColor }: Props) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError("");
    const res = await fetch(`${apiBase}/api/leads`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ botId, conversationId, email, name: name || undefined, question }),
    }).catch(() => null);
    if (res?.ok) {
      setState("done");
    } else {
      setState("error");
      setError((await res?.json().catch(() => null))?.error ?? "Couldn't send. Please try again.");
    }
  }

  if (state === "done") {
    return (
      <div className="mt-2 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[13px] text-emerald-900">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
        <p>
          Thanks{name ? `, ${name.split(" ")[0]}` : ""}! The team will get back to you at <strong>{email}</strong>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-2 space-y-2 rounded-xl border border-black/[0.07] bg-white p-3 shadow-sm">
      <p className="flex items-center gap-1.5 text-[12px] font-medium text-[#18131f]">
        <Mail className="size-3.5" style={{ color }} /> Leave your details and we&apos;ll follow up
      </p>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name (optional)"
        autoComplete="name"
        aria-label="Your name"
        className="h-9 w-full rounded-lg border border-black/10 bg-[#fbf8f4] px-3 text-[13px] outline-none focus:border-transparent focus:ring-2"
        style={{ ["--tw-ring-color" as string]: color }}
      />
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          autoComplete="email"
          aria-label="Your email"
          className="h-9 min-w-0 flex-1 rounded-lg border border-black/10 bg-[#fbf8f4] px-3 text-[13px] outline-none focus:border-transparent focus:ring-2"
          style={{ ["--tw-ring-color" as string]: color }}
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="inline-flex h-9 items-center gap-1 rounded-lg px-3 text-[13px] font-medium disabled:opacity-60"
          style={{ backgroundColor: color, color: textOnColor }}
        >
          {state === "sending" ? <Loader2 className="size-3.5 animate-spin" /> : "Send"}
        </button>
      </div>
      {state === "error" && <p className="text-[12px] text-red-600">{error}</p>}
    </form>
  );
}
