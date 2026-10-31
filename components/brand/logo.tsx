import Link from "next/link";
import { useId } from "react";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 64 64" className={cn("size-8", className)} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff9a6c" />
          <stop offset=".4" stopColor="#ee5f92" />
          <stop offset=".75" stopColor="#8f67ee" />
          <stop offset="1" stopColor="#3fb5c2" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="#18131f" />
      <path d="M16 18h32a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6H31l-9 7v-7h-6a6 6 0 0 1-6-6V24a6 6 0 0 1 6-6z" fill={`url(#${id})`} />
      <path d="M22 35c3 3.2 6.4 4.8 10 4.8S39 38.2 42 35" fill="none" stroke="#18131f" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 rounded-lg", className)} aria-label="AskDock home">
      <LogoMark />
      <span className="text-[19px] font-semibold tracking-tight">
        Ask<span className="font-display text-[22px] italic">Dock</span>
      </span>
    </Link>
  );
}
