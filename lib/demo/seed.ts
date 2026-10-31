import type { Bot, Citation, Conversation, Lead, Message, Source, Subscription } from "@/lib/types";
import { chunkText } from "@/lib/rag/chunk";
import { DEMO_BOT_ID, ORTHO_BOT_ID } from "@/lib/demo/constants";
import { DENTAL_KNOWLEDGE, ORTHO_KNOWLEDGE, type KnowledgeDoc } from "@/lib/demo/knowledge";

/**
 * Builds the Juniper Dental demo workspace: two bots, their knowledge sources
 * and chunks, ~30 days of visitor conversations, leads and a Pro subscription.
 * Deterministic for a given `now`, so screenshots and the seed script match.
 */

export type SeedChunk = {
  id: string;
  botId: string;
  sourceId: string;
  content: string;
  title: string;
  url: string | null;
  position: number;
};

export type DemoDataset = {
  bots: Bot[];
  sources: Source[];
  chunks: SeedChunk[];
  conversations: Conversation[];
  messages: Message[];
  leads: Lead[];
  subscription: Subscription;
};

type PageKey = "services" | "new-patient" | "insurance" | "about" | "hours" | "emergency" | "book" | "ortho";

const PAGE_TITLES: Record<PageKey, { title: string; url: string | null; doc: string }> = {
  services: { title: "Services & Pricing 2026", url: null, doc: "services" },
  "new-patient": { title: "New Patient Guide", url: null, doc: "new-patient" },
  insurance: { title: "Insurance & Payment Policy", url: null, doc: "insurance" },
  about: { title: "About Juniper Dental Studio", url: "https://juniperdental.example/about", doc: "website" },
  hours: { title: "Hours & location", url: "https://juniperdental.example/visit", doc: "website" },
  emergency: { title: "Emergency dental care", url: "https://juniperdental.example/emergency", doc: "website" },
  book: { title: "Book an appointment", url: "https://juniperdental.example/book", doc: "website" },
  ortho: { title: "Clear aligners", url: "https://juniperdental.example/aligners", doc: "ortho-site" },
};

type Template = {
  questions: string[];
  answer: string;
  cites: { page: PageKey; heading: string }[];
  weight: number;
  answered?: boolean;
  /** The bot offered the lead form (knowledge gap or explicit request). */
  offersContact?: boolean;
};

const FALLBACK =
  "I couldn't find that in Juniper Dental's information, so I'd rather not guess. If you leave your email below, someone from the team will get back to you within one business day.";

const DENTAL_TEMPLATES: Template[] = [
  {
    questions: ["What are your opening hours?", "Are you open on Saturdays?", "What time do you close on Friday?", "Are you open on Sunday?"],
    answer:
      "We're open Monday to Thursday 8:00 am – 6:00 pm, Friday 8:00 am – 3:00 pm, and alternate Saturdays 9:00 am – 2:00 pm [1]. We're closed on Sundays and public holidays [1].",
    cites: [{ page: "hours", heading: "Opening hours" }],
    weight: 14,
  },
  {
    questions: ["How much is a cleaning?", "How much does a check-up cost without insurance?", "What's the price for a new patient exam?"],
    answer:
      "A routine check-up and cleaning is $129 for existing patients. If you're new to us, the new patient exam with a full set of digital X-rays and a cleaning is $189 [1]. If you have insurance, your out-of-pocket cost is usually lower [2].",
    cites: [
      { page: "services", heading: "Check-ups and cleanings" },
      { page: "insurance", heading: "Insurance we accept" },
    ],
    weight: 13,
  },
  {
    questions: ["Do you take my insurance?", "Do you accept PPO plans?", "Do you take Medicaid?"],
    answer:
      "We're in-network with most PPO dental plans, and we'll check your benefits before your first visit [1]. We can't accept HMO/DMO plans or Medicaid at the moment, but our Juniper Smile Club membership is a good alternative [1][2].",
    cites: [
      { page: "insurance", heading: "Insurance we accept" },
      { page: "insurance", heading: "Juniper Smile Club membership" },
    ],
    weight: 11,
  },
  {
    questions: ["I have a toothache, can I come in today?", "I broke my tooth, what should I do?", "Do you take emergencies?"],
    answer:
      "I'm sorry you're in pain. Please call us on (555) 014-2290 as early as you can — we keep same-day emergency slots open every weekday morning [1]. An emergency exam with any X-rays you need is $120, and treatment is priced separately [2].",
    cites: [
      { page: "emergency", heading: "Same-day emergencies" },
      { page: "services", heading: "Emergency visits" },
    ],
    weight: 9,
  },
  {
    questions: ["How do I book an appointment?", "Can I book online?", "How do I reschedule my appointment?"],
    answer:
      "You can book online 24/7 at juniperdental.example/book, or call us on (555) 014-2290 [1]. You'll get a confirmation by email and text, and you can reschedule any time from the link in that confirmation [2].",
    cites: [
      { page: "new-patient", heading: "Booking your first visit" },
      { page: "book", heading: "Online booking" },
    ],
    weight: 10,
  },
  {
    questions: ["How much is teeth whitening?", "Do you do whitening?"],
    answer:
      "In-chair whitening takes about 90 minutes and costs $449, including custom take-home trays for touch-ups [1]. If you'd rather whiten at home, take-home trays on their own are $249 [1].",
    cites: [{ page: "services", heading: "Teeth whitening" }],
    weight: 7,
  },
  {
    questions: ["Do you do Invisalign?", "How much are clear aligners?", "Can I get my teeth straightened?"],
    answer:
      "Yes — Dr. Luis Ferreira leads our clear aligner treatment [1]. It starts at $3,800 for minor crowding and $5,400 for comprehensive cases, including your 3D scan, all aligners, refinements and your first retainers [2]. The 30-minute consultation is free and includes a 3D smile preview [2].",
    cites: [
      { page: "about", heading: "Our team" },
      { page: "services", heading: "Clear aligners (Invisalign-style orthodontics)" },
    ],
    weight: 8,
  },
  {
    questions: ["Is there parking?", "Where are you located?", "How do I get to the clinic by bus?"],
    answer:
      "We're at 48 Harbour Lane, Suite 200, Brookhaven [1]. Free patient parking is behind the building — enter from Willow Street — and the Harbour Line bus stops right outside [1].",
    cites: [{ page: "hours", heading: "Address and parking" }],
    weight: 6,
  },
  {
    questions: ["Do you see children?", "What age should my child have their first visit?", "Can I stay with my kid during the appointment?"],
    answer:
      "Yes! We see children from their first tooth, and a child's check-up and cleaning is $95 [1]. Parents are welcome in the room, and we recommend morning appointments for younger children [2].",
    cites: [
      { page: "services", heading: "Children's dentistry" },
      { page: "new-patient", heading: "Children's first visit" },
    ],
    weight: 6,
  },
  {
    questions: ["I'm really nervous about the dentist", "Do you offer sedation?", "Do you have laughing gas?"],
    answer:
      "You're not alone — dental anxiety is really common, and we never rush you [1]. We offer noise-cancelling headphones, a weighted blanket, ceiling screens and nitrous oxide (\"laughing gas\") for $75 per visit. For longer procedures, oral sedation can be arranged with Dr. Okafor in advance [1].",
    cites: [{ page: "new-patient", heading: "Nervous patients" }],
    weight: 5,
  },
  {
    questions: ["I don't have insurance, do you have a membership?", "What is the Smile Club?"],
    answer:
      "Our Juniper Smile Club is $29 a month (or $299 a year). It includes two check-ups and cleanings, routine X-rays, one emergency exam per year and 15% off all other treatment — with no waiting period, and you can cancel anytime [1].",
    cites: [{ page: "insurance", heading: "Juniper Smile Club membership" }],
    weight: 5,
  },
  {
    questions: ["Can I pay in installments?", "Do you offer financing?"],
    answer:
      "Yes. Treatment over $1,000 can be spread over 6, 12 or 24 months with 0% financing, subject to approval [1]. We also accept all major cards, Apple Pay, Google Pay and HSA/FSA cards [1].",
    cites: [{ page: "insurance", heading: "Payment options" }],
    weight: 4,
  },
  {
    questions: ["How much does a dental implant cost?", "How long does an implant take?"],
    answer:
      "A single implant, including the abutment and crown, is $4,200 [1]. Planning starts with a 3D scan ($150, credited toward treatment if you go ahead), and most implants take three to six months from placement to the final crown [1].",
    cites: [{ page: "services", heading: "Dental implants" }],
    weight: 4,
  },
  {
    questions: ["What's your cancellation policy?", "Is there a fee if I miss my appointment?"],
    answer:
      "Please give us at least 24 hours' notice to cancel or reschedule. Late cancellations and missed appointments may incur a $50 fee — but if an emergency comes up, just call us [1].",
    cites: [{ page: "insurance", heading: "Cancellation policy" }],
    weight: 3,
  },
  {
    questions: ["Do you speak Spanish?", "Is there a dentist who speaks Portuguese?"],
    answer: "Yes — our team speaks English, Spanish and Portuguese, and Dr. Ferreira consults in all three languages [1].",
    cites: [{ page: "new-patient", heading: "Languages" }],
    weight: 2,
  },
  {
    questions: ["Can someone call me back about aligners?", "I'd like to talk to someone about implants"],
    answer:
      "Of course. Leave your email below and the team will reach out to set up a time — aligner and implant consultations start with a 3D scan so we can give you a precise plan [1].",
    cites: [{ page: "services", heading: "Clear aligners (Invisalign-style orthodontics)" }],
    weight: 3,
    offersContact: true,
  },
  {
    questions: ["Do you offer veneers?", "Do you do Botox?", "How much is a full mouth reconstruction?", "Can I get a night guard for grinding?"],
    answer: FALLBACK,
    cites: [],
    weight: 6,
    answered: false,
    offersContact: true,
  },
];

const ORTHO_TEMPLATES: Template[] = [
  {
    questions: ["How long does aligner treatment take?", "How many hours a day do I wear them?"],
    answer: "Most adults finish in 6 to 18 months. You wear the aligners 20–22 hours a day and change trays every one to two weeks [1].",
    cites: [{ page: "ortho", heading: "How clear aligners work" }],
    weight: 5,
  },
  {
    questions: ["How much do aligners cost?", "Is there financing for aligners?"],
    answer: "Treatment starts at $3,800 for minor cases and $5,400 for comprehensive cases, with 0% financing available over 24 months [1].",
    cites: [{ page: "ortho", heading: "Pricing" }],
    weight: 4,
  },
  {
    questions: ["Is the consultation free?"],
    answer:
      'Yes — the 30-minute consultation is free and includes a 3D scan and a digital preview of your new smile. Book at juniperdental.example/book and choose "Aligner consultation" [1].',
    cites: [{ page: "ortho", heading: "Free consultation" }],
    weight: 3,
  },
  {
    questions: ["Can aligners fix an overbite?"],
    answer: FALLBACK,
    cites: [],
    weight: 1,
    answered: false,
    offersContact: true,
  },
];

const LEAD_PEOPLE = [
  "Priya Nair", "Marcus Bell", "Elena Rossi", "Tom Becker", "Aisha Khan", "Daniel Park", "Sofia Alvarez", "James O'Neill",
  "Hana Sato", "Oliver Grant", "Chloe Martin", "Ravi Menon", "Grace Liu", "Noah Fischer", "Isabel Costa", "Ethan Brooks",
  "Mia Novak", "Lucas Moreau", "Zara Ahmed", "Ben Carter", "Nina Petrova", "Samuel Adeyemi",
];

const COUNTRIES = ["US", "US", "US", "US", "US", "CA", "US", "GB", "US", "MX"];

// --------------------------------------------------------------------------

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function uuidFrom(rand: () => number) {
  const hex = Array.from({ length: 32 }, () => Math.floor(rand() * 16).toString(16));
  hex[12] = "4";
  hex[16] = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const s = hex.join("");
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}

function pickWeighted<T extends { weight: number }>(items: T[], rand: () => number) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = rand() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

function sectionSnippet(docs: KnowledgeDoc[], page: PageKey, heading: string) {
  const meta = PAGE_TITLES[page];
  const doc = docs.find((d) => d.key === meta.doc);
  const md = doc?.pages.find((p) => p.title === meta.title)?.markdown ?? "";
  const match = md.split(/\n## /).find((s) => s.startsWith(heading));
  const body = (match ?? "").split("\n").slice(1).join(" ").trim();
  return body.length > 180 ? `${body.slice(0, 177).trimEnd()}…` : body;
}

function citationsFor(template: Template, docs: KnowledgeDoc[]): Citation[] {
  return template.cites.map((c, i) => ({
    n: i + 1,
    title: PAGE_TITLES[c.page].title,
    url: PAGE_TITLES[c.page].url,
    snippet: sectionSnippet(docs, c.page, c.heading),
  }));
}

const iso = (d: Date) => d.toISOString();

export function buildDemoDataset(ownerId: string, now = new Date()): DemoDataset {
  const rand = mulberry32(20261031);
  const day = 86_400_000;
  const ago = (days: number) => new Date(now.getTime() - days * day);

  const bots: Bot[] = [
    {
      id: DEMO_BOT_ID,
      ownerId,
      name: "Juni",
      avatar: "preset:tooth",
      brandColor: "#23798a",
      welcomeMessage:
        "Hi, I'm Juni 👋 I can help with appointments, prices, insurance and anything else about your visit to Juniper Dental Studio.",
      suggestedQuestions: ["What are your opening hours?", "How much is a cleaning?", "Do you take my insurance?", "I have a toothache — can I come in today?"],
      instructions:
        "You are the front-desk assistant for Juniper Dental Studio. Be warm, calm and concise. Never diagnose or give medical advice — suggest booking an exam instead. For facial swelling that affects breathing, high fever or uncontrolled bleeding, tell the visitor to go to the nearest ER.",
      leadCapture: true,
      createdAt: iso(ago(70)),
      updatedAt: iso(ago(2)),
    },
    {
      id: ORTHO_BOT_ID,
      ownerId,
      name: "Aligner Concierge",
      avatar: "preset:sparkle",
      brandColor: "#8f67ee",
      welcomeMessage: "Thinking about straighter teeth? Ask me anything about clear aligners with Dr. Ferreira.",
      suggestedQuestions: ["How long does treatment take?", "How much do aligners cost?", "Is the consultation free?"],
      instructions: "Focus on clear aligner treatment. Encourage visitors to book the free consultation.",
      leadCapture: true,
      createdAt: iso(ago(18)),
      updatedAt: iso(ago(5)),
    },
  ];

  const sources: Source[] = [];
  const chunks: SeedChunk[] = [];
  const addKnowledge = (botId: string, docs: KnowledgeDoc[], createdDaysAgo: number) => {
    docs.forEach((doc, docIndex) => {
      const sourceId = uuidFrom(rand);
      let position = 0;
      let charCount = 0;
      for (const page of doc.pages) {
        charCount += page.markdown.length;
        for (const chunk of chunkText(page.markdown)) {
          chunks.push({ id: `c${chunks.length + 1}`, botId, sourceId, content: chunk.content, title: page.title, url: page.url, position: position++ });
        }
      }
      sources.push({
        id: sourceId,
        botId,
        kind: doc.kind,
        name: doc.name,
        url: doc.url,
        status: "ready",
        error: null,
        charCount,
        chunkCount: position,
        pageCount: doc.pages.length,
        createdAt: iso(new Date(ago(createdDaysAgo).getTime() + docIndex * 7 * 60_000)),
      });
    });
  };
  addKnowledge(DEMO_BOT_ID, DENTAL_KNOWLEDGE, 69);
  addKnowledge(ORTHO_BOT_ID, ORTHO_KNOWLEDGE, 18);

  const conversations: Conversation[] = [];
  const messages: Message[] = [];
  const leads: Lead[] = [];
  const weekdayFactor = [0.55, 1.3, 1.18, 1.1, 1.04, 0.92, 0.68]; // Sun..Sat
  let leadIndex = 0;

  const simulateBot = (botId: string, templates: Template[], docs: KnowledgeDoc[], base: number, days: number) => {
    for (let d = days; d >= 0; d--) {
      const date = ago(d);
      const growth = 1 + ((days - d) / days) * 0.45;
      let count = Math.round(base * growth * weekdayFactor[date.getDay()] * (0.8 + rand() * 0.4));
      if (d === 0) count = Math.round(count * Math.min(1, now.getHours() / 20));

      for (let c = 0; c < count; c++) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        // Most traffic between 7am and 10pm, peaking around lunch and evening.
        const hour = Math.min(23, Math.max(6, Math.round(7 + rand() * 9 + rand() * 6)));
        let t = startOfDay.getTime() + hour * 3_600_000 + Math.floor(rand() * 3_600_000);
        if (t > now.getTime()) t = now.getTime() - Math.floor(rand() * 3_600_000);

        const convId = uuidFrom(rand);
        const visitorId = `v_${uuidFrom(rand).slice(0, 12)}`;
        const turns = rand() < 0.55 ? 1 : rand() < 0.75 ? 2 : 3;
        let unanswered = false;
        let leadEmail: string | null = null;
        let firstQuestion: string | null = null;
        const startedAt = iso(new Date(t));
        let lastAt = startedAt;
        let messageCount = 0;

        for (let turn = 0; turn < turns; turn++) {
          const tpl = pickWeighted(templates, rand);
          const question = tpl.questions[Math.floor(rand() * tpl.questions.length)];
          firstQuestion ??= question;
          const askedAt = new Date(t);
          const answeredAt = new Date(t + 3_000 + Math.floor(rand() * 4_000));
          messages.push({ id: uuidFrom(rand), conversationId: convId, botId, role: "user", content: question, citations: [], answered: null, createdAt: iso(askedAt) });
          messages.push({
            id: uuidFrom(rand),
            conversationId: convId,
            botId,
            role: "assistant",
            content: tpl.answer,
            citations: citationsFor(tpl, docs),
            answered: tpl.answered ?? true,
            createdAt: iso(answeredAt),
          });
          messageCount += 2;
          lastAt = iso(answeredAt);
          if (tpl.answered === false) unanswered = true;

          if (tpl.offersContact && !leadEmail && rand() < 0.6) {
            const person = LEAD_PEOPLE[leadIndex++ % LEAD_PEOPLE.length];
            const [first, last] = person.toLowerCase().replace(/'/g, "").split(" ");
            leadEmail = `${first}.${last}${leadIndex > LEAD_PEOPLE.length ? leadIndex : ""}@example.com`;
            const ageDays = (now.getTime() - answeredAt.getTime()) / day;
            leads.push({
              id: uuidFrom(rand),
              botId,
              conversationId: convId,
              email: leadEmail,
              name: rand() < 0.75 ? person : null,
              question,
              status: ageDays > 6 ? (rand() < 0.35 ? "won" : "contacted") : ageDays > 2 && rand() < 0.5 ? "contacted" : "new",
              createdAt: iso(new Date(answeredAt.getTime() + 40_000)),
            });
            break;
          }
          t = answeredAt.getTime() + 20_000 + Math.floor(rand() * 90_000);
        }

        conversations.push({
          id: convId,
          botId,
          visitorId,
          startedAt,
          lastMessageAt: lastAt,
          messageCount,
          unanswered,
          firstQuestion,
          leadEmail,
          country: COUNTRIES[Math.floor(rand() * COUNTRIES.length)],
        });
      }
    }
  };

  simulateBot(DEMO_BOT_ID, DENTAL_TEMPLATES, DENTAL_KNOWLEDGE, 8.5, 64);
  simulateBot(ORTHO_BOT_ID, ORTHO_TEMPLATES, ORTHO_KNOWLEDGE, 2.2, 16);

  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + 19);

  return {
    bots,
    sources,
    chunks,
    conversations: conversations.sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt)),
    messages,
    leads: leads.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    subscription: {
      userId: ownerId,
      plan: "pro",
      status: "active",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodEnd: periodEnd.toISOString(),
      cancelAtPeriodEnd: false,
    },
  };
}
