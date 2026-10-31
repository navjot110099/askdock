# AskDock — AI chatbots for small businesses

AskDock turns a business's PDFs, Word documents and website into a friendly AI assistant that answers customer questions 24/7 **with cited sources**, collects the visitor's email when it can't help, and installs on any website with **one `<script>` tag**.

![AskDock landing page](screenshots/desktop/01-landing-hero.png)

> Demo project by **OVIOWEB**. "Juniper Dental Studio" and everything about it is fictional.

---

## Features

| Area | What's included |
| --- | --- |
| **Landing page** | Animated hero with a scripted widget demo, how it works, features bento, a **live demo** chatting with the seeded dental bot, pricing (Free / Pro / Business), FAQ, final CTA, JSON-LD + Open Graph image, sitemap and robots |
| **Auth** | Supabase Auth with email + password, magic link and **Google OAuth** (server actions + `@supabase/ssr` cookies, middleware-protected dashboard) |
| **Create a bot** | Name, business, colour and avatar → then add knowledge: **upload PDF / DOCX / TXT / MD** or **crawl a website URL** (same-site BFS, robots.txt, SSRF protection, plan page limits) |
| **RAG pipeline** | Heading-aware chunking → **OpenAI `text-embedding-3-small`** → **Supabase pgvector** (HNSW, cosine) → `match_chunks` RPC → grounded prompt with numbered excerpts |
| **Chat** | **Vercel AI SDK** streaming (`streamText` + UI message stream), `[n]` **source citations** rendered as chips with an expandable sources list, follow-up aware retrieval, rate limiting |
| **Lead capture** | When the answer isn't in the knowledge base (or the visitor asks for a person), the model calls a `request_contact` tool → an inline email form appears → lead saved with the question and conversation |
| **Customise** | Name, preset or uploaded avatar, brand colour (presets + custom hex), welcome message, up to 4 suggested questions, extra instructions, lead-capture toggle — with a **live preview** |
| **Embeddable widget** | `public/widget.js`: Shadow-DOM bubble + lazy iframe, greeting pop-up, mobile full-screen, `data-position` / `data-greeting` options, `window.AskDock.open()` |
| **Dashboard** | Overview KPIs with period deltas, **messages per day** chart, **top questions**, knowledge gaps, busiest hours, conversations (filters, search, transcripts with citations), leads (status pipeline, CSV export) |
| **Billing** | **Stripe test mode**: Checkout, signed **webhook** → plan sync, **customer portal**, usage meters. **Plan limits enforced** server-side (bots, sources, crawl pages, file size, monthly messages, lead capture, branding, CSV export, analytics range) |
| **Seed data** | A full dental-clinic workspace: 2 bots, 4 sources, ~2 months of realistic conversations, leads and a Pro subscription |

### Demo mode (no accounts needed)

If the Supabase keys are missing, AskDock runs on an **in-memory demo workspace** built from the same seed data, so every screen works out of the box:

- sign-in opens the seeded workspace,
- uploads and crawls really parse and chunk content (stored in memory),
- retrieval uses BM25 instead of pgvector, and without `OPENAI_API_KEY` answers are assembled extractively from the best-matching passages (still streamed, still cited, still triggering lead capture),
- plan switches on the billing page apply instantly instead of going through Stripe.

Add the keys below and the exact same UI runs on Supabase, OpenAI and Stripe.

---

## Tech stack

Next.js 15 (App Router, Server Actions, Turbopack) · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix) · Framer Motion · Vercel AI SDK v7 + `@ai-sdk/openai` · Supabase (Auth, Postgres, pgvector, Storage, RLS) · Stripe · Recharts · unpdf · mammoth · cheerio · zod · Playwright

---

## Quick start (demo mode)

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000, try the live demo, then **Sign in** — demo mode signs you straight into the Juniper Dental workspace. Sample files for testing uploads are in [`samples/`](samples).

## Full setup (live mode)

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run the migration in [`supabase/migrations/20261031000000_init.sql`](supabase/migrations/20261031000000_init.sql) — either `supabase db push` with the CLI or paste it into the SQL editor. It enables `pgvector`, creates the tables, triggers, RLS policies, the `match_chunks` function and the `bot-avatars` storage bucket.
3. **Auth → URL configuration**: set the Site URL to your app URL and add `http://localhost:3000/auth/callback` (and your production `/auth/callback`) to the redirect allow-list.
4. **Auth → Providers → Google**: enable it with a Google OAuth client (authorised redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`).
5. Copy the project URL, anon key and service-role key into `.env.local`.

### 2. OpenAI

Add `OPENAI_API_KEY`. Chat uses `OPENAI_CHAT_MODEL` (default `gpt-5.4-mini`); embeddings use `text-embedding-3-small` (1536 dimensions, matching the `vector(1536)` column).

### 3. Seed the demo bot

```bash
npm run seed
```

Creates `demo@askdock.app` (password from `SEED_DEMO_PASSWORD`, or a generated one printed once), the Juni and Aligner Concierge bots, embeds their knowledge into pgvector and inserts ~2 months of conversations and leads. It's idempotent. Keep `NEXT_PUBLIC_DEMO_BOT_ID` set to the printed bot id so the landing-page demo uses it.

### 4. Stripe (test mode)

1. In the Stripe dashboard (**test mode**), create two recurring monthly prices: **Pro $29** and **Business $99**. Put their `price_…` ids in `STRIPE_PRICE_PRO` / `STRIPE_PRICE_BUSINESS` and your `sk_test_…` key in `STRIPE_SECRET_KEY`. Live keys are rejected at startup.
2. Enable the **customer portal** (Settings → Billing → Customer portal) and allow plan switching between the two prices.
3. Forward webhooks locally:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   and put the printed `whsec_…` in `STRIPE_WEBHOOK_SECRET`. In production, add an endpoint for `checkout.session.completed` and `customer.subscription.created|updated|deleted`.
4. Pay with `4242 4242 4242 4242`, any future date, any CVC.

### 5. Deploy to Vercel

1. Push the repo and import it in Vercel (framework preset: Next.js).
2. Add every variable from `.env.example` (set `NEXT_PUBLIC_APP_URL` to the production URL).
3. Add the production `/auth/callback` URL in Supabase and the production webhook endpoint in Stripe.

Chat streams for up to 30 s and ingestion runs up to 60 s (`maxDuration` on the routes).

---

## Embedding the widget

Every bot's **Install** tab shows its snippet:

```html
<script src="https://YOUR-DOMAIN/widget.js" data-bot="BOT_ID" async></script>
```

Options: `data-position="left"`, `data-greeting="off"`. The bubble fetches public config from `/api/widget/:botId` (CORS-enabled) and opens `/embed/:botId` in an iframe (`frame-ancestors *` is set only for `/embed`). Try it on the sample site at `/widget-demo`.

## Plans & limits

| | Free | Pro | Business |
| --- | --- | --- | --- |
| Price | $0 | $29 / mo | $99 / mo |
| Bots | 1 | 3 | 10 |
| Visitor messages / month | 100 | 2,000 | 10,000 |
| Knowledge sources | 5 | 50 | 300 |
| Pages per crawl | 10 | 50 | 200 |
| Max file size | 5 MB | 15 MB | 25 MB |
| Lead capture & CSV export | — | ✓ | ✓ |
| Remove "Powered by AskDock" | — | ✓ | ✓ |
| Analytics history | 7 days | 30 days | 90 days |

Limits live in [`lib/plans.ts`](lib/plans.ts) and are enforced in server actions and API routes, not just the UI.

---

## How the RAG chat works

1. **Ingest** (`lib/rag/ingest.ts`): files are parsed with unpdf / mammoth, sites are crawled with cheerio; text is split by headings into ~1,100-character chunks with sentence overlap (`lib/rag/chunk.ts`), embedded in batches and stored in `chunks` with an HNSW index.
2. **Retrieve** (`app/api/chat/route.ts`): the visitor's question (plus the previous one for short follow-ups like "and for kids?") is embedded and matched with `match_chunks` (cosine similarity, per bot).
3. **Answer**: the excerpts are numbered in the system prompt; the model must answer only from them and cite `[n]`. Citations are streamed first as a `data-sources` part, the answer streams as text, and the `request_contact` tool emits a `data-lead` part that renders the email form.
4. **Record**: both messages are saved; a trigger maintains conversation counters and flags unanswered chats, which feed the analytics "knowledge gaps".

## Security notes

- Row Level Security on every table; dashboard queries run as the signed-in user, anonymous widget traffic goes through server routes with the service role.
- Crawler blocks private/loopback/link-local addresses (re-checked on every redirect) and caps page size, page count and time.
- Per-IP rate limits on chat and lead capture, zod validation on every input, CSV export neutralises spreadsheet formulas.
- Prompt instructs the model to ignore instructions embedded in documents or messages.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / server |
| `npm run seed` | Seed the demo workspace into Supabase |
| `npm run screenshots` | Capture every key screen at 1440×900 and 390×844 into `screenshots/` (start the app first; set `SCREENSHOT_BASE_URL` if not on :3000) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |

## Project structure

```
app/
  (marketing)/        landing page
  (auth)/             login, signup, auth server actions
  dashboard/          overview, bots (knowledge · customise · install), conversations, leads, analytics, billing
  embed/[botId]/      iframe chat used by the widget
  widget-demo/        sample customer website with the widget installed
  api/                chat (streaming RAG), sources (upload/crawl), leads, widget config, Stripe webhook
components/           chat window, marketing sections, dashboard UI, shadcn/ui
lib/
  rag/                chunking, extraction, crawler, embeddings, prompt, lexical search, offline responder
  db/                 repository interface + Supabase and in-memory demo implementations
  demo/               Juniper Dental knowledge base and deterministic seed generator
  plans.ts stripe.ts analytics.ts auth.ts env.ts
public/widget.js      the embeddable chat bubble
supabase/migrations/  schema, pgvector, RLS, triggers
scripts/              seed + Playwright screenshots
samples/              sample PDF and DOCX for testing uploads
screenshots/          desktop/ and mobile/ captures
```

## Screenshots

All screens are in [`screenshots/desktop`](screenshots/desktop) (1440×900) and [`screenshots/mobile`](screenshots/mobile) (390×844 viewport, captured at 2× pixel density): landing sections, live demo answer, widget on a website, lead capture, login/signup, dashboard overview, bots, create bot, knowledge, customise, install, conversations, transcript, leads, analytics and billing.

---

Demo project by **OVIOWEB**.
