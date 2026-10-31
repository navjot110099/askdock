"use client";

import { ImageUp, Loader2, Lock, Plus, X } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateBotAction, uploadAvatarAction, type BotSettings } from "@/app/dashboard/bots/actions";
import { BotAvatar } from "@/components/bot-avatar";
import { ChatWindow } from "@/components/chat/chat-window";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AVATAR_PRESETS, BRAND_COLORS } from "@/lib/avatars";
import { isHexColor } from "@/lib/color";
import { cn } from "@/lib/utils";

type Props = {
  botId: string;
  initial: BotSettings;
  planAllowsLeads: boolean;
  showBranding: boolean;
};

export function BotCustomizer({ botId, initial, planAllowsLeads, showBranding }: Props) {
  const [s, setS] = useState<BotSettings>(initial);
  const [saved, setSaved] = useState(initial);
  const [hexDraft, setHexDraft] = useState(initial.brandColor);
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const dirty = JSON.stringify(s) !== JSON.stringify(saved);

  const set = <K extends keyof BotSettings>(key: K, value: BotSettings[K]) => setS((prev) => ({ ...prev, [key]: value }));
  const setColor = (c: string) => {
    setHexDraft(c);
    if (isHexColor(c)) set("brandColor", c.toLowerCase());
  };

  function save() {
    start(async () => {
      const payload = { ...s, suggestedQuestions: s.suggestedQuestions.map((q) => q.trim()).filter(Boolean) };
      const res = await updateBotAction(botId, payload);
      if (res.ok) {
        setS(payload);
        setSaved(payload);
        toast.success("Changes saved", { description: "Your widget updates on every website within a minute." });
      } else {
        toast.error(res.error);
      }
    });
  }

  async function upload(file: File) {
    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    const res = await uploadAvatarAction(botId, body);
    setUploading(false);
    if (res.url) set("avatar", res.url);
    else toast.error(res.error ?? "Upload failed");
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_420px]">
      <div className="space-y-6">
        <Section title="Identity" description="How your assistant introduces itself.">
          <div className="space-y-1.5">
            <Label htmlFor="bot-name">Name</Label>
            <Input id="bot-name" value={s.name} maxLength={60} onChange={(e) => set("name", e.target.value)} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Avatar</Label>
            <div className="flex flex-wrap items-center gap-2.5">
              {AVATAR_PRESETS.map((p) => {
                const value = `preset:${p.id}`;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => set("avatar", value)}
                    aria-label={`${p.label} avatar`}
                    aria-pressed={s.avatar === value}
                    className={cn("rounded-full ring-offset-2 transition", s.avatar === value ? "ring-2 ring-ink" : "hover:scale-105")}
                  >
                    <BotAvatar avatar={value} name={p.label} className="size-11" />
                  </button>
                );
              })}
              {!s.avatar.startsWith("preset:") && (
                <span className="rounded-full ring-2 ring-ink ring-offset-2">
                  <BotAvatar avatar={s.avatar} name={s.name} className="size-11" />
                </span>
              )}
              <Button type="button" variant="outline" className="h-11 rounded-full bg-white px-4" disabled={uploading} onClick={() => fileInput.current?.click()}>
                {uploading ? <Loader2 className="animate-spin" /> : <ImageUp />} Upload
              </Button>
              <input
                ref={fileInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                aria-label="Upload avatar image"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void upload(f);
                  e.target.value = "";
                }}
              />
            </div>
            <p className="text-[12px] text-muted-foreground">Square PNG, JPG or WebP, up to 256 KB.</p>
          </div>
        </Section>

        <Section title="Brand colour" description="Used for the chat bubble, header and your visitor's messages.">
          <div className="flex flex-wrap items-center gap-2.5">
            {BRAND_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Use colour ${c}`}
                aria-pressed={s.brandColor === c}
                className={cn("size-9 rounded-full ring-offset-2 transition", s.brandColor === c ? "ring-2" : "hover:scale-105")}
                style={{ backgroundColor: c, ["--tw-ring-color" as string]: c }}
              />
            ))}
            <label className="ml-1 flex h-10 items-center gap-2 rounded-xl border border-input bg-white pl-1.5 pr-3">
              <input type="color" value={s.brandColor} onChange={(e) => setColor(e.target.value)} className="size-7 cursor-pointer rounded-lg border-0 bg-transparent p-0" aria-label="Custom colour" />
              <input
                value={hexDraft}
                onChange={(e) => setColor(e.target.value)}
                maxLength={7}
                aria-label="Hex colour"
                className={cn("w-[76px] bg-transparent font-mono text-[13px] uppercase outline-none", !isHexColor(hexDraft) && "text-red-600")}
              />
            </label>
          </div>
        </Section>

        <Section title="Conversation" description="The first thing visitors see, and shortcuts to common questions.">
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <Label htmlFor="welcome">Welcome message</Label>
              <span className="text-[12px] text-muted-foreground">{s.welcomeMessage.length}/300</span>
            </div>
            <Textarea id="welcome" value={s.welcomeMessage} maxLength={300} rows={3} onChange={(e) => set("welcomeMessage", e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Suggested questions</Label>
            {s.suggestedQuestions.map((q, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={q}
                  maxLength={80}
                  aria-label={`Suggested question ${i + 1}`}
                  onChange={(e) => set("suggestedQuestions", s.suggestedQuestions.map((x, j) => (j === i ? e.target.value : x)))}
                  className="h-10 rounded-xl"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-lg"
                  aria-label="Remove question"
                  onClick={() => set("suggestedQuestions", s.suggestedQuestions.filter((_, j) => j !== i))}
                >
                  <X />
                </Button>
              </div>
            ))}
            {s.suggestedQuestions.length < 4 && (
              <Button type="button" variant="outline" className="rounded-xl bg-white" onClick={() => set("suggestedQuestions", [...s.suggestedQuestions, ""])}>
                <Plus /> Add question
              </Button>
            )}
          </div>
        </Section>

        <Section title="Behaviour" description="Fine-tune tone and what happens when the bot can't help.">
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <Label htmlFor="instructions">Extra instructions</Label>
              <span className="text-[12px] text-muted-foreground">{s.instructions.length}/1500</span>
            </div>
            <Textarea
              id="instructions"
              value={s.instructions}
              maxLength={1500}
              rows={5}
              placeholder="e.g. Be warm and concise. Never give medical advice — suggest booking an exam instead."
              onChange={(e) => set("instructions", e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="flex items-start justify-between gap-6 rounded-2xl border border-border bg-[#fbf8f4] p-4">
            <div>
              <p className="flex items-center gap-2 text-[14px] font-medium">
                Lead capture
                {!planAllowsLeads && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
                    <Lock className="size-3" /> Pro
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                When the answer isn&apos;t in your knowledge — or a visitor asks for a person — offer a form to leave their email.
                {!planAllowsLeads && (
                  <>
                    {" "}
                    <Link href="/dashboard/billing" className="font-medium text-iris hover:underline">
                      Upgrade to enable
                    </Link>
                  </>
                )}
              </p>
            </div>
            <Switch checked={planAllowsLeads && s.leadCapture} disabled={!planAllowsLeads} onCheckedChange={(v) => set("leadCapture", v)} aria-label="Lead capture" />
          </div>
        </Section>

        <div
          className={cn(
            "z-10 flex items-center justify-between gap-4 rounded-2xl border border-black/[0.06] bg-white/90 px-4 py-3 backdrop-blur",
            dirty && "sticky bottom-4 shadow-[0_20px_40px_-24px_rgba(24,19,31,0.45)]",
          )}
        >
          <p className="text-[13px] text-muted-foreground">{dirty ? "You have unsaved changes" : "All changes saved"}</p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" disabled={!dirty || pending} onClick={() => setS(saved)}>
              Discard
            </Button>
            <Button type="button" disabled={!dirty || pending || !isHexColor(s.brandColor)} onClick={save} className="rounded-xl px-5">
              {pending && <Loader2 className="animate-spin" />} Save changes
            </Button>
          </div>
        </div>
      </div>

      <div className="xl:sticky xl:top-6 xl:self-start">
        <p className="mb-3 text-[13px] font-medium text-muted-foreground">Live preview</p>
        <ChatWindow
          bot={{
            id: botId,
            name: s.name || "Your bot",
            avatar: s.avatar,
            brandColor: isHexColor(s.brandColor) ? s.brandColor : saved.brandColor,
            welcomeMessage: s.welcomeMessage,
            suggestedQuestions: s.suggestedQuestions.filter((q) => q.trim()),
            leadCapture: planAllowsLeads && s.leadCapture,
            showBranding,
          }}
          className="h-[620px]"
        />
        <p className="mt-3 text-[12px] text-muted-foreground">Looks update instantly; answers use your saved knowledge.</p>
      </div>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[22px] border border-black/[0.06] bg-white p-5 sm:p-6">
      <h2 className="text-[15px] font-semibold">{title}</h2>
      <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}
