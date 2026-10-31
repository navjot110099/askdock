"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { deleteBotAction } from "@/app/dashboard/bots/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function DeleteBotButton({ botId, name }: { botId: string; name: string }) {
  const [confirm, setConfirm] = useState("");
  const [pending, start] = useTransition();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive" className="rounded-xl">
          <Trash2 /> Delete bot
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {name}?</DialogTitle>
          <DialogDescription>
            This permanently deletes the bot, its knowledge, conversations and leads. The widget will stop working on your website.
          </DialogDescription>
        </DialogHeader>
        <label className="space-y-1.5 text-[13px]">
          <span>
            Type <strong>{name}</strong> to confirm
          </span>
          <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-10 rounded-xl" />
        </label>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" disabled={confirm !== name || pending} onClick={() => start(() => deleteBotAction(botId))}>
            {pending && <Loader2 className="animate-spin" />} Delete forever
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
