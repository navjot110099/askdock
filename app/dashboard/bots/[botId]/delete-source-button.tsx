"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteSourceAction } from "@/app/dashboard/bots/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function DeleteSourceButton({ botId, sourceId, name }: { botId: string; sourceId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Remove ${name}`} className="text-muted-foreground hover:text-red-600">
          <Trash2 />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove this source?</DialogTitle>
          <DialogDescription>
            “{name}” and all of its indexed chunks will be deleted. The bot will stop using it to answer questions straight away.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await deleteSourceAction(botId, sourceId);
                setOpen(false);
                toast.success(`Removed “${name}”`);
              })
            }
          >
            {pending && <Loader2 className="animate-spin" />} Remove source
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
