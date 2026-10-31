export type PlanId = "free" | "pro" | "business";

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  priceMonthly: number;
  limits: {
    bots: number;
    messagesPerMonth: number;
    sources: number;
    crawlPages: number;
    fileSizeMb: number;
    analyticsDays: number;
  };
  leadCapture: boolean;
  removeBranding: boolean;
  csvExport: boolean;
  features: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "Try AskDock on one website.",
    priceMonthly: 0,
    limits: { bots: 1, messagesPerMonth: 100, sources: 5, crawlPages: 10, fileSizeMb: 5, analyticsDays: 7 },
    leadCapture: false,
    removeBranding: false,
    csvExport: false,
    features: [
      "1 chatbot",
      "100 messages / month",
      "5 knowledge sources",
      "Crawl up to 10 pages",
      "7-day analytics",
      "“Powered by AskDock” badge",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "For a growing small business.",
    priceMonthly: 29,
    limits: { bots: 3, messagesPerMonth: 2000, sources: 50, crawlPages: 50, fileSizeMb: 15, analyticsDays: 30 },
    leadCapture: true,
    removeBranding: true,
    csvExport: true,
    features: [
      "3 chatbots",
      "2,000 messages / month",
      "50 knowledge sources",
      "Crawl up to 50 pages per site",
      "Lead capture + CSV export",
      "Remove AskDock branding",
      "30-day analytics",
    ],
  },
  business: {
    id: "business",
    name: "Business",
    tagline: "Multiple locations, brands or clients.",
    priceMonthly: 99,
    limits: { bots: 10, messagesPerMonth: 10000, sources: 300, crawlPages: 200, fileSizeMb: 25, analyticsDays: 90 },
    leadCapture: true,
    removeBranding: true,
    csvExport: true,
    features: [
      "10 chatbots",
      "10,000 messages / month",
      "300 knowledge sources",
      "Crawl up to 200 pages per site",
      "Lead capture + CSV export",
      "Remove AskDock branding",
      "90-day analytics",
      "Priority email support",
    ],
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "pro", "business"];

export function getPlan(id: string | null | undefined): Plan {
  return PLANS[(id as PlanId) in PLANS ? (id as PlanId) : "free"];
}
