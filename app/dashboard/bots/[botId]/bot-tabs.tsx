"use client";

import { BookOpen, Code2, Palette } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function BotTabs({ botId }: { botId: string }) {
  const pathname = usePathname();
  const base = `/dashboard/bots/${botId}`;
  const tabs = [
    { href: base, label: "Knowledge", icon: BookOpen },
    { href: `${base}/customize`, label: "Customise", icon: Palette },
    { href: `${base}/install`, label: "Install", icon: Code2 },
  ];
  return (
    <nav aria-label="Bot sections" className="mt-8 flex gap-1 overflow-x-auto border-b border-border">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative -mb-px flex items-center gap-2 whitespace-nowrap px-4 pb-3 pt-1 text-[14px] font-medium transition",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" /> {label}
            {active && <span className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-brand-gradient" />}
          </Link>
        );
      })}
    </nav>
  );
}
