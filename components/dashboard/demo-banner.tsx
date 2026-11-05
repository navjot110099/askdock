"use client";

import { Loader2, RotateCcw } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { resetDemoAction } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/** Shown on every dashboard page when the app runs on the in-memory demo workspace. */
export function DemoBanner() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function reset() {
    start(async () => {
      try {
        await resetDemoAction();
        setOpen(false);
        toast.success("Demo workspace reset", { description: "You're back on the seeded Juniper Dental data." });
      } catch {
        toast.error("Couldn't reset the demo. Please try again.");
      }
    });
  }

  return (
    <div className="flex items-center justify-center gap-2.5 border-b border-iris/15 bg-accent/70 px-4 py-2 text-[12px] text-accent-foreground sm:gap-3 sm:px-8">
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-iris shadow-sm ring-1 ring-iris/20">
        <span className="size-1.5 rounded-full bg-brand-gradient" />
        Demo mode
      </span>
      <span className="min-w-0 truncate sm:hidden">Seeded sample data</span>
      <span className="hidden min-w-0 truncate sm:inline">Seeded data for the fictional Juniper Dental Studio, kept in memory.</span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-semibold text-accent-foreground underline-offset-2 transition hover:bg-white/70 hover:underline"
          >
            <RotateCcw className="size-3.5" /> Reset demo
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset the demo workspace?</DialogTitle>
            <DialogDescription>
              This restores the seeded Juniper Dental data. Uploaded files, test chats, captured leads, customisations and plan changes are
              removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={reset} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <RotateCcw />} Reset demo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
