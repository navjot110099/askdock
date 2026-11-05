"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { resetDemoData } from "@/lib/db/demo-repo";
import { isDemoMode } from "@/lib/env";

/** Demo mode only: restores the seeded Juniper Dental workspace on this server. */
export async function resetDemoAction() {
  if (!isDemoMode) throw new Error("Reset is only available in demo mode.");
  await requireUser();
  resetDemoData();
  revalidatePath("/", "layout");
}
