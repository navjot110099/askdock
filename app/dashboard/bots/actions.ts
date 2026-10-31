"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { repo } from "@/lib/db";
import { getPlan } from "@/lib/plans";

const hex = z.string().regex(/^#[0-9a-f]{6}$/i, "Pick a valid colour");

const Settings = z.object({
  name: z.string().trim().min(1, "Give your bot a name").max(60),
  avatar: z.string().max(400_000),
  brandColor: hex,
  welcomeMessage: z.string().trim().min(1, "Add a welcome message").max(300),
  suggestedQuestions: z.array(z.string().trim().min(1).max(80)).max(4),
  instructions: z.string().trim().max(1500),
  leadCapture: z.boolean(),
});

export type BotSettings = z.infer<typeof Settings>;
export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createBotAction(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const [sub, count] = await Promise.all([repo.getSubscription(user.id), repo.countBots(user.id)]);
  const plan = getPlan(sub.plan);
  if (count >= plan.limits.bots) {
    return { ok: false, error: `Your ${plan.name} plan includes ${plan.limits.bots} bot${plan.limits.bots === 1 ? "" : "s"}. Upgrade to create more.` };
  }

  const parsed = z
    .object({ name: Settings.shape.name, brandColor: hex, avatar: z.string().startsWith("preset:"), business: z.string().trim().max(80) })
    .safeParse({
      name: formData.get("name"),
      brandColor: formData.get("brandColor"),
      avatar: formData.get("avatar"),
      business: formData.get("business") ?? "",
    });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const { name, brandColor, avatar, business } = parsed.data;
  const bot = await repo.createBot(user.id, {
    name,
    brandColor,
    avatar,
    welcomeMessage: `Hi, I'm ${name} 👋 Ask me anything about ${business || "us"} — I'm here 24/7.`,
    suggestedQuestions: [],
    instructions: business ? `You are the website assistant for ${business}.` : "",
    leadCapture: plan.leadCapture,
  });
  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/bots/${bot.id}?created=1`);
}

export async function updateBotAction(botId: string, input: BotSettings): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = Settings.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const avatar = parsed.data.avatar;
  if (!/^preset:[a-z]+$/.test(avatar) && !/^https:\/\/\S+$/.test(avatar) && !/^data:image\/(png|jpeg|webp);base64,/.test(avatar)) {
    return { ok: false, error: "Choose a preset avatar or upload an image." };
  }
  await repo.updateBot(user.id, botId, parsed.data);
  revalidatePath(`/dashboard/bots/${botId}`, "layout");
  return { ok: true };
}

export async function uploadAvatarAction(botId: string, formData: FormData): Promise<{ url?: string; error?: string }> {
  const user = await requireUser();
  const file = formData.get("file");
  if (!(file instanceof File) || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) return { error: "Upload a PNG, JPG or WebP image." };
  if (file.size > 256 * 1024) return { error: "Avatars can be up to 256 KB." };
  return { url: await repo.uploadAvatar(user.id, botId, file) };
}

export async function deleteBotAction(botId: string) {
  const user = await requireUser();
  await repo.deleteBot(user.id, botId);
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/bots");
}

export async function deleteSourceAction(botId: string, sourceId: string) {
  const user = await requireUser();
  await repo.deleteSource(user.id, sourceId);
  revalidatePath(`/dashboard/bots/${botId}`);
}
