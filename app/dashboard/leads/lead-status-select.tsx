"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { updateLeadStatusAction } from "@/app/dashboard/leads/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LeadStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const TONE: Record<LeadStatus, string> = {
  new: "text-rose bg-rose/10 border-rose/20",
  contacted: "text-iris bg-iris/10 border-iris/20",
  won: "text-emerald-700 bg-emerald-50 border-emerald-200",
};

export function LeadStatusSelect({ leadId, status }: { leadId: string; status: LeadStatus }) {
  const [optimistic, setOptimistic] = useOptimistic(status);
  const [, start] = useTransition();
  return (
    <Select
      value={optimistic}
      onValueChange={(v) =>
        start(async () => {
          setOptimistic(v as LeadStatus);
          try {
            await updateLeadStatusAction(leadId, v);
          } catch {
            toast.error("Couldn't update the lead. Please try again.");
          }
        })
      }
    >
      <SelectTrigger size="sm" className={cn("h-8 w-[118px] rounded-full border text-[12px] font-semibold capitalize", TONE[optimistic])} aria-label="Lead status">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="new">New</SelectItem>
        <SelectItem value="contacted">Contacted</SelectItem>
        <SelectItem value="won">Won</SelectItem>
      </SelectContent>
    </Select>
  );
}
