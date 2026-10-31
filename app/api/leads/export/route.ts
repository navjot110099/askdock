import { getCurrentUser } from "@/lib/auth";
import { repo } from "@/lib/db";
import { getPlan } from "@/lib/plans";

const cell = (value: string | null) => {
  const v = value ?? "";
  // Neutralise spreadsheet formula injection and quote every field.
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Sign in required", { status: 401 });
  const plan = getPlan((await repo.getSubscription(user.id)).plan);
  if (!plan.csvExport) return new Response("CSV export is available on Pro and Business plans.", { status: 402 });

  const leads = await repo.listLeads(user.id);
  const rows = [
    ["Email", "Name", "Question", "Bot", "Status", "Captured at"].map(cell).join(","),
    ...leads.map((l) => [l.email, l.name, l.question, l.botName, l.status, l.createdAt].map(cell).join(",")),
  ];
  return new Response(rows.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="askdock-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
