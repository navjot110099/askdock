"use client";

import { BarChart3, Bot, CreditCard, Inbox, LayoutDashboard, LogOut, Menu, MessagesSquare, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/app/(auth)/actions";
import { Logo } from "@/components/brand/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { AppUser } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/bots", label: "Bots", icon: Bot },
  { href: "/dashboard/conversations", label: "Conversations", icon: MessagesSquare },
  { href: "/dashboard/leads", label: "Leads", icon: Inbox },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
];

type Props = {
  user: AppUser;
  planName: string;
  planId: string;
  messagesUsed: number;
  messagesLimit: number;
  newLeads: number;
};

export function DashboardSidebar(props: Props) {
  return (
    <aside className="hidden w-[264px] shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
      <div className="sticky top-0 h-dvh">
        <SidebarBody {...props} />
      </div>
    </aside>
  );
}

export function MobileTopbar(props: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-ivory/85 px-4 backdrop-blur lg:hidden">
      <Logo href="/dashboard" />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon-lg" aria-label="Open navigation">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] gap-0 bg-sidebar p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarBody {...props} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SidebarBody({ user, planName, planId, messagesUsed, messagesLimit, newLeads, onNavigate }: Props & { onNavigate?: () => void }) {
  const pathname = usePathname();
  const pct = Math.min(100, Math.round((messagesUsed / messagesLimit) * 100));

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-4 pt-5">
        <Logo href="/dashboard" />
      </div>
      <nav aria-label="Dashboard" className="flex-1 space-y-0.5 px-3">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition",
                active ? "bg-white text-foreground shadow-[0_1px_2px_rgba(24,19,31,0.06),0_0_0_1px_rgba(24,19,31,0.04)]" : "text-foreground/65 hover:bg-white/60 hover:text-foreground",
              )}
            >
              {active && <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-brand-gradient" />}
              <Icon className={cn("size-[18px]", active ? "text-iris" : "text-foreground/45 group-hover:text-foreground/70")} />
              {label}
              {label === "Leads" && newLeads > 0 && (
                <span className="ml-auto rounded-full bg-rose/12 px-2 py-0.5 text-[11px] font-semibold text-rose">{newLeads} new</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 p-3">
        <div className="rounded-2xl border border-black/[0.06] bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold">{planName} plan</p>
            <span className="text-[12px] text-muted-foreground">{pct}%</span>
          </div>
          <Progress value={pct} className="mt-3 h-1.5 bg-muted [&>[data-slot=progress-indicator]]:bg-brand-gradient" />
          <p className="mt-2 text-[12px] text-muted-foreground">
            {messagesUsed.toLocaleString()} / {messagesLimit.toLocaleString()} messages this month
          </p>
          {planId !== "business" && (
            <Link
              href="/dashboard/billing"
              onClick={onNavigate}
              className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-ink px-3 py-2 text-[13px] font-medium text-white transition hover:bg-ink/90"
            >
              <Sparkles className="size-3.5" /> Upgrade
            </Link>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-white/70">
            <Avatar className="size-9">
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
              <AvatarFallback className="bg-brand-gradient text-[13px] font-semibold text-white">
                {user.name
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold">{user.name}</span>
              <span className="block truncate text-[12px] text-muted-foreground">{user.email}</span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-56">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Signed in as {user.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/">Back to website</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <form action={signOut} className="w-full">
                <button type="submit" className="flex w-full items-center gap-2">
                  <LogOut className="size-4" /> Sign out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
