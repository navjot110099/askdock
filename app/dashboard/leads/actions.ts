"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { repo } from "@/lib/db";

const Status = z.enum(["new", "contacted", "won"]);

export async function updateLeadStatusAction(leadId: string, status: string) {
  const user = await requireUser();
  await repo.updateLeadStatus(user.id, leadId, Status.parse(status));
  revalidatePath("/dashboard", "layout");
}
