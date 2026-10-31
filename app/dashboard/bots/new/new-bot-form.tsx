"use client";

import { Loader2 } from "lucide-react";
import { useActionState, useState } from "react";
import { createBotAction } from "@/app/dashboard/bots/actions";
import { BotAvatar } from "@/components/bot-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AVATAR_PRESETS, BRAND_COLORS } from "@/lib/avatars";
import { cn } from "@/lib/utils";

export function NewBotForm() {
  const [state, action, pending] = useActionState(createBotAction, undefined);
  const [name, setName] = useState("");
  const [color, setColor] = useState(BRAND_COLORS[1]);
  const [avatar, setAvatar] = useState("preset:spark");

  return (
    <form action={action} className="grid gap-6 rounded-[24px] border border-black/[0.06] bg-white p-6 sm:p-8 md:grid-cols-[1fr_240px]">
      <div className="space-y-6">
        <div className="space-y-1.5">
          <Label htmlFor="name">Bot name</Label>
          <Input id="name" name="name" required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Juni, Studio Helper, Ask Sam" className="h-11 rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="business">Business name</Label>
          <Input id="business" name="business" maxLength={80} placeholder="e.g. Juniper Dental Studio" className="h-11 rounded-xl" />
          <p className="text-[12px] text-muted-foreground">Used in the greeting and to give the assistant context.</p>
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Brand colour</legend>
          <div className="flex flex-wrap gap-2.5">
            {BRAND_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Use colour ${c}`}
                aria-pressed={color === c}
                className={cn("size-9 rounded-full ring-offset-2 ring-offset-white transition", color === c ? "ring-2" : "hover:scale-105")}
                style={{ backgroundColor: c, ["--tw-ring-color" as string]: c }}
              />
            ))}
          </div>
          <input type="hidden" name="brandColor" value={color} />
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Avatar</legend>
          <div className="flex flex-wrap gap-2.5">
            {AVATAR_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setAvatar(`preset:${p.id}`)}
                aria-label={`${p.label} avatar`}
                aria-pressed={avatar === `preset:${p.id}`}
                className={cn("rounded-full ring-offset-2 transition", avatar === `preset:${p.id}` ? "ring-2 ring-ink" : "hover:scale-105")}
              >
                <BotAvatar avatar={`preset:${p.id}`} name={p.label} className="size-10" />
              </button>
            ))}
          </div>
          <input type="hidden" name="avatar" value={avatar} />
        </fieldset>
        {state && !state.ok && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
            {state.error}
          </p>
        )}
        <Button type="submit" size="lg" disabled={pending || !name.trim()} className="h-11 rounded-xl px-6">
          {pending && <Loader2 className="animate-spin" />} Create bot & add knowledge
        </Button>
      </div>

      <div aria-hidden className="hidden flex-col items-center justify-center gap-3 rounded-2xl bg-[#fbf8f4] p-6 text-center md:flex">
        <div className="w-full overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          <div className="flex items-center gap-2 px-3 py-2.5" style={{ backgroundColor: color }}>
            <BotAvatar avatar={avatar} name={name} className="size-7 ring-2 ring-white/40" />
            <span className="truncate text-[13px] font-semibold text-white">{name || "Your bot"}</span>
          </div>
          <div className="space-y-2 p-3 text-left">
            <div className="h-2.5 w-4/5 rounded-full bg-muted" />
            <div className="h-2.5 w-3/5 rounded-full bg-muted" />
            <div className="ml-auto h-6 w-1/2 rounded-full" style={{ backgroundColor: `${color}26` }} />
          </div>
        </div>
        <p className="text-[12px] text-muted-foreground">Live preview</p>
      </div>
    </form>
  );
}
