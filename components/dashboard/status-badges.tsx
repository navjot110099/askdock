import type { LeadStatus, SourceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const LEAD: Record<LeadStatus, string> = {
  new: "bg-rose/10 text-rose",
  contacted: "bg-iris/10 text-iris",
  won: "bg-emerald-50 text-emerald-700",
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize", LEAD[status])}>{status}</span>;
}

const SOURCE: Record<SourceStatus, { label: string; className: string }> = {
  ready: { label: "Ready", className: "bg-emerald-50 text-emerald-700" },
  processing: { label: "Processing", className: "bg-amber-50 text-amber-700" },
  failed: { label: "Failed", className: "bg-red-50 text-red-600" },
};

export function SourceStatusBadge({ status }: { status: SourceStatus }) {
  const s = SOURCE[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold", s.className)}>
      <span className={cn("size-1.5 rounded-full bg-current", status === "processing" && "animate-pulse")} />
      {s.label}
    </span>
  );
}
