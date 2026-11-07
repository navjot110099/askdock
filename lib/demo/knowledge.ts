/**
 * Knowledge base for the seeded bot — "Juni", the assistant for the
 * Juniper Dental Studio. Used by both the Supabase seed script
 * (chunked + embedded with OpenAI) and the in-memory workspace.
 *
 * All names, addresses, phone numbers and domains are invented.
 */

export type KnowledgeDoc = {
  key: string;
  kind: "file" | "url";
  name: string;
  url: string | null;
  /** For crawled sites: one entry per page. Files have a single page. */
  pages: { title: string; url: string | null; markdown: string }[];
};

const SERVICES = `# Juniper Dental Studio — Services & Pricing 2026

Prices below are our standard self-pay fees. If you have dental insurance, your out-of-pocket cost is usually lower — see the Insurance & Payment Policy.

## Check-ups and cleanings
A new patient exam with a full set of digital X-rays and a professional cleaning is $189. A routine check-up and cleaning for existing patients is $129. We recommend a check-up every six months; patients with gum disease may need a periodontal maintenance cleaning every three to four months ($165).

## Teeth whitening
In-chair Zoom-style whitening takes about 90 minutes and costs $449, including custom take-home trays for touch-ups. Take-home whitening trays on their own are $249. Whitening is not recommended during pregnancy or for patients with untreated cavities.

## Clear aligners (Invisalign-style orthodontics)
Clear aligner treatment starts at $3,800 for minor crowding (up to 12 months) and $5,400 for comprehensive cases. The price includes your 3D scan, all aligners, refinements and your first set of retainers. A free 30-minute aligner consultation with Dr. Luis Ferreira includes a 3D smile preview.

## Fillings, crowns and root canals
Tooth-coloured composite fillings range from $165 to $320 depending on size. A porcelain crown is $1,350 and is usually completed in two visits two weeks apart. Root canal treatment ranges from $890 (front tooth) to $1,290 (molar), not including the crown.

## Dental implants
A single dental implant, including the abutment and crown, is $4,200. Implant planning starts with a 3D cone-beam scan ($150, credited toward treatment if you go ahead). Most implants take three to six months from placement to final crown.

## Children's dentistry
We see children from their first tooth. A child's check-up and cleaning is $95, and fluoride varnish and dental sealants are $35 per tooth. Our hygienists use a "tell-show-do" approach so kids know what to expect.

## Emergency visits
An emergency exam with any X-rays needed is $120. We keep same-day emergency slots open every weekday morning. Treatment provided during the visit is priced separately.
`;

const NEW_PATIENT = `# New Patient Guide — Juniper Dental Studio

## Booking your first visit
You can book online at juniperdental.example/book, call us at (555) 014-2290, or ask Juni to help. New patient appointments last about 75 minutes. We usually have availability within the same week.

## What to bring
For your first visit, please bring a photo ID, your dental insurance card (if you have one), a list of current medications and any recent X-rays from a previous dentist. You'll receive a link to complete your health history online at least 24 hours before your appointment.

## When you arrive
Please arrive 10 minutes early. We have free parking behind the building and the Harbour Line bus stops right outside. Our studio is on the second floor with lift access and step-free entry.

## Nervous patients
Dental anxiety is very common and we never rush you. We offer noise-cancelling headphones, a weighted blanket, ceiling screens, and nitrous oxide ("laughing gas") for $75 per visit. For longer procedures, oral sedation can be arranged with Dr. Okafor in advance.

## Children's first visit
For a child's first visit, plan for 30–40 minutes. Parents are welcome in the room. We recommend booking morning appointments for younger children.

## Languages
Our team speaks English, Spanish and Portuguese. Dr. Ferreira consults in all three languages.
`;

const INSURANCE = `# Insurance & Payment Policy — Juniper Dental Studio

## Insurance we accept
We are in-network with most PPO dental plans and will check your benefits before your first visit. We are not able to accept HMO/DMO plans or Medicaid at this time. As a courtesy, we file claims for you and you only pay your estimated portion at the visit.

## Juniper Smile Club membership
No insurance? The Juniper Smile Club is $29 per month (or $299 per year) and includes two check-ups and cleanings, all routine X-rays, one emergency exam per year and 15% off all other treatment. There is no waiting period and you can cancel anytime.

## Payment options
We accept all major credit and debit cards, Apple Pay, Google Pay, HSA and FSA cards. Treatment over $1,000 can be spread over 6, 12 or 24 months with 0% financing through our financing partner, subject to approval.

## Cancellation policy
Please give us at least 24 hours' notice if you need to cancel or reschedule. Late cancellations and missed appointments may incur a $50 fee. We understand emergencies happen — just call us.

## Estimates
We provide a written treatment estimate before any work over $300. Estimates are valid for 90 days.
`;

const SITE_HOME = `# About Juniper Dental Studio
Juniper Dental Studio is a modern, family-friendly dental practice in Brookhaven. We opened in 2014 and look after more than 6,000 patients. We focus on calm, unhurried appointments, clear pricing and preventive care.

## Our team
Dr. Maya Okafor, DDS, is our founding dentist with 16 years of experience in general, cosmetic and implant dentistry. Dr. Luis Ferreira, DMD, leads our clear aligner and orthodontic treatment. Our hygienists Priya, Hannah and Tomasz have more than 30 years of combined experience.

## Technology
We use low-dose digital X-rays, an intraoral 3D scanner instead of messy impressions, and same-week crowns milled by our partner lab.
`;

const SITE_HOURS = `# Opening hours and location

## Opening hours
Monday to Thursday: 8:00 am – 6:00 pm. Friday: 8:00 am – 3:00 pm. Saturday: 9:00 am – 2:00 pm (alternate Saturdays, check online booking). Sunday: closed. We are closed on public holidays.

## Address and parking
Juniper Dental Studio, 48 Harbour Lane, Suite 200, Brookhaven. Free patient parking is available behind the building — enter from Willow Street. The Harbour Line bus stops directly outside.

## Contact
Phone: (555) 014-2290. Email: hello@juniperdental.example. We reply to emails within one business day.
`;

const SITE_EMERGENCY = `# Emergency dental care

## Same-day emergencies
If you have a toothache, swelling, a broken tooth or a lost filling, call us at (555) 014-2290 as early as possible. We hold same-day emergency slots every weekday morning, and existing patients can call our after-hours line for advice.

## Knocked-out tooth
If an adult tooth is knocked out, pick it up by the crown (not the root), rinse it gently, and try to put it back in the socket or keep it in milk. Get to a dentist within 60 minutes for the best chance of saving it.

## When to go to the ER
If you have facial swelling that affects breathing or swallowing, a high fever, or uncontrolled bleeding, go to the nearest emergency room or call emergency services immediately.
`;

const SITE_BOOK = `# Book an appointment

## Online booking
Online booking is open 24/7 at juniperdental.example/book. Choose your appointment type, pick a time, and you'll get a confirmation by email and text. You can reschedule from the link in your confirmation.

## Appointment reminders
We send a reminder text two days before and the morning of your appointment. Reply C to confirm.

## Referrals
We welcome referrals from other dentists and specialists. Referring offices can email referrals@juniperdental.example.
`;

const ORTHO = `# Juniper Ortho — clear aligners by Dr. Luis Ferreira

## How clear aligners work
Clear aligners are a series of nearly invisible trays that gradually move your teeth. You change trays every one to two weeks and wear them 20–22 hours a day. Most adults finish treatment in 6 to 18 months.

## Free consultation
Your free 30-minute consultation includes a 3D scan and a digital preview of your new smile. Book at juniperdental.example/book and choose "Aligner consultation".

## Pricing
Treatment starts at $3,800 for minor cases and $5,400 for comprehensive cases, with 0% financing available over 24 months.
`;

export const DENTAL_KNOWLEDGE: KnowledgeDoc[] = [
  {
    key: "services",
    kind: "file",
    name: "Services-and-Pricing-2026.pdf",
    url: null,
    pages: [{ title: "Services & Pricing 2026", url: null, markdown: SERVICES }],
  },
  {
    key: "new-patient",
    kind: "file",
    name: "New-Patient-Guide.docx",
    url: null,
    pages: [{ title: "New Patient Guide", url: null, markdown: NEW_PATIENT }],
  },
  {
    key: "insurance",
    kind: "file",
    name: "Insurance-and-Payment-Policy.pdf",
    url: null,
    pages: [{ title: "Insurance & Payment Policy", url: null, markdown: INSURANCE }],
  },
  {
    key: "website",
    kind: "url",
    name: "juniperdental.example",
    url: "https://juniperdental.example",
    pages: [
      { title: "About Juniper Dental Studio", url: "https://juniperdental.example/about", markdown: SITE_HOME },
      { title: "Hours & location", url: "https://juniperdental.example/visit", markdown: SITE_HOURS },
      { title: "Emergency dental care", url: "https://juniperdental.example/emergency", markdown: SITE_EMERGENCY },
      { title: "Book an appointment", url: "https://juniperdental.example/book", markdown: SITE_BOOK },
    ],
  },
];

export const ORTHO_KNOWLEDGE: KnowledgeDoc[] = [
  {
    key: "ortho-site",
    kind: "url",
    name: "juniperdental.example/aligners",
    url: "https://juniperdental.example/aligners",
    pages: [{ title: "Clear aligners", url: "https://juniperdental.example/aligners", markdown: ORTHO }],
  },
];
