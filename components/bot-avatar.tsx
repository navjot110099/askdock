import { getAvatarPreset } from "@/lib/avatars";
import { cn } from "@/lib/utils";

export function BotAvatar({ avatar, name, className }: { avatar: string; name: string; className?: string }) {
  const preset = getAvatarPreset(avatar);
  if (preset) {
    return (
      <span
        className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-full text-white shadow-sm ring-1 ring-black/5", className)}
        style={{ backgroundImage: `linear-gradient(135deg, ${preset.from}, ${preset.to})` }}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="size-[55%]" fill="currentColor">
          <path d={preset.glyph} />
        </svg>
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- user-uploaded avatars come from arbitrary storage hosts
    <img src={avatar} alt={`${name} avatar`} className={cn("size-9 shrink-0 rounded-full object-cover ring-1 ring-black/5", className)} />
  );
}
