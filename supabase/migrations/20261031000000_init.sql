-- AskDock schema: bots, knowledge sources + pgvector chunks, conversations,
-- leads and Stripe subscriptions. Run with `supabase db push` or paste into the
-- Supabase SQL editor.

create extension if not exists vector with schema extensions;

-- ---------------------------------------------------------------------------
-- Profiles & subscriptions
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro', 'business')),
  status text not null default 'active',
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Every new auth user gets a profile and a Free subscription row.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  insert into public.subscriptions (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Bots & knowledge
-- ---------------------------------------------------------------------------

create table public.bots (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  avatar text not null default 'preset:spark',
  brand_color text not null default '#8f67ee' check (brand_color ~* '^#[0-9a-f]{6}$'),
  welcome_message text not null default 'Hi! How can I help you today?',
  suggested_questions text[] not null default '{}',
  instructions text not null default '',
  lead_capture boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index bots_owner_idx on public.bots (owner_id);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid not null references public.bots (id) on delete cascade,
  kind text not null check (kind in ('file', 'url')),
  name text not null,
  url text,
  status text not null default 'processing' check (status in ('processing', 'ready', 'failed')),
  error text,
  char_count integer not null default 0,
  chunk_count integer not null default 0,
  page_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index sources_bot_idx on public.sources (bot_id);

create table public.chunks (
  id bigint generated always as identity primary key,
  bot_id uuid not null references public.bots (id) on delete cascade,
  source_id uuid not null references public.sources (id) on delete cascade,
  content text not null,
  title text not null,
  url text,
  position integer not null default 0,
  embedding extensions.vector(1536) not null
);
create index chunks_bot_idx on public.chunks (bot_id);
create index chunks_embedding_idx on public.chunks
  using hnsw (embedding extensions.vector_cosine_ops);

-- Cosine-similarity search scoped to one bot.
create or replace function public.match_chunks(
  p_bot_id uuid,
  p_query_embedding extensions.vector(1536),
  p_match_count integer default 6,
  p_min_similarity double precision default 0.2
)
returns table (
  id bigint,
  source_id uuid,
  content text,
  title text,
  url text,
  similarity double precision
)
language sql
stable
set search_path = public, extensions
as $$
  select c.id, c.source_id, c.content, c.title, c.url,
         1 - (c.embedding <=> p_query_embedding) as similarity
  from public.chunks c
  where c.bot_id = p_bot_id
    and 1 - (c.embedding <=> p_query_embedding) >= p_min_similarity
  order by c.embedding <=> p_query_embedding
  limit p_match_count;
$$;

-- ---------------------------------------------------------------------------
-- Conversations, messages & leads
-- ---------------------------------------------------------------------------

create table public.conversations (
  id uuid primary key,
  bot_id uuid not null references public.bots (id) on delete cascade,
  visitor_id text not null,
  started_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  message_count integer not null default 0,
  unanswered boolean not null default false,
  first_question text,
  lead_email text,
  country text
);
create index conversations_bot_idx on public.conversations (bot_id, last_message_at desc);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  bot_id uuid not null references public.bots (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  citations jsonb not null default '[]',
  answered boolean,
  created_at timestamptz not null default now()
);
create index messages_conversation_idx on public.messages (conversation_id, created_at);
create index messages_bot_created_idx on public.messages (bot_id, created_at desc);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid not null references public.bots (id) on delete cascade,
  conversation_id uuid references public.conversations (id) on delete set null,
  email text not null,
  name text,
  question text,
  status text not null default 'new' check (status in ('new', 'contacted', 'won')),
  created_at timestamptz not null default now()
);
create index leads_bot_idx on public.leads (bot_id, created_at desc);

-- Keeps conversation counters current without a round trip from the app.
create or replace function public.bump_conversation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.conversations
     set message_count = message_count + 1,
         last_message_at = new.created_at,
         unanswered = unanswered or (new.role = 'assistant' and new.answered is false)
   where id = new.conversation_id;
  return new;
end;
$$;

create trigger on_message_created
  after insert on public.messages
  for each row execute function public.bump_conversation();

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Dashboard reads/writes go through the signed-in user's session, so owners
-- only ever see their own rows. Anonymous widget traffic (chat, lead capture)
-- is handled by server routes using the service-role key.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.bots enable row level security;
alter table public.sources enable row level security;
alter table public.chunks enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.leads enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Plan changes only come from the Stripe webhook (service role).
create policy "read own subscription" on public.subscriptions
  for select using (auth.uid() = user_id);

create policy "own bots" on public.bots
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create or replace function public.owns_bot(p_bot_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.bots b where b.id = p_bot_id and b.owner_id = auth.uid());
$$;

create policy "own sources" on public.sources
  for all using (public.owns_bot(bot_id)) with check (public.owns_bot(bot_id));
create policy "own chunks" on public.chunks
  for all using (public.owns_bot(bot_id)) with check (public.owns_bot(bot_id));
create policy "own conversations" on public.conversations
  for select using (public.owns_bot(bot_id));
create policy "own messages" on public.messages
  for select using (public.owns_bot(bot_id));
create policy "own leads" on public.leads
  for select using (public.owns_bot(bot_id));
create policy "update own leads" on public.leads
  for update using (public.owns_bot(bot_id)) with check (public.owns_bot(bot_id));

-- ---------------------------------------------------------------------------
-- Storage: public bucket for bot avatars (written by the server).
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bot-avatars', 'bot-avatars', true, 524288, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;
