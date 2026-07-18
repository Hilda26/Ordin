-- Ordin off-chain support schema.
-- The GenLayer contract remains the source of truth for bounty status, verdicts,
-- appeals, rulings, and payouts. These tables hold identity, drafts,
-- notifications, and cached mirrors of on-chain state for search/speed only.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- identity

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  website text,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists organisation_members (
  organisation_id uuid not null references organisations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  primary key (organisation_id, user_id)
);

create table if not exists wallet_bindings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  address text not null,
  chain_id integer not null default 61999,
  label text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, address, chain_id)
);

create table if not exists resolver_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  address text not null,
  domains text[] not null default '{}',
  statement text,
  conflicts text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------ drafts

create table if not exists bounty_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  draft jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists submission_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bounty_onchain_id text not null,
  draft jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------- cached mirrors
-- every cached row records where it came from and when it was synced;
-- rows are advisory and must never be treated as final without an
-- on-chain confirmation.

create table if not exists cached_bounties (
  chain_id integer not null,
  contract_address text not null,
  onchain_id text not null,
  data jsonb not null,
  policy jsonb,
  status text,
  creator_address text,
  sync_seq bigint not null default 0,
  sync_status text not null default 'synced',
  synced_at timestamptz not null default now(),
  primary key (chain_id, contract_address, onchain_id)
);

create table if not exists cached_submissions (
  chain_id integer not null,
  contract_address text not null,
  onchain_id text not null,
  bounty_onchain_id text,
  contributor_address text,
  status text,
  data jsonb not null,
  sync_seq bigint not null default 0,
  sync_status text not null default 'synced',
  synced_at timestamptz not null default now(),
  primary key (chain_id, contract_address, onchain_id)
);

create table if not exists cached_reviews (
  chain_id integer not null,
  contract_address text not null,
  onchain_id text not null,
  submission_onchain_id text,
  kind text,
  verdict text,
  data jsonb not null,
  sync_seq bigint not null default 0,
  sync_status text not null default 'synced',
  synced_at timestamptz not null default now(),
  primary key (chain_id, contract_address, onchain_id)
);

create table if not exists cached_appeals (
  chain_id integer not null,
  contract_address text not null,
  onchain_id text not null,
  submission_onchain_id text,
  status text,
  outcome text,
  data jsonb not null,
  sync_seq bigint not null default 0,
  sync_status text not null default 'synced',
  synced_at timestamptz not null default now(),
  primary key (chain_id, contract_address, onchain_id)
);

create table if not exists cached_resolver_cases (
  chain_id integer not null,
  contract_address text not null,
  onchain_id text not null,           -- submission id acting as case id
  resolver_address text,
  status text,
  data jsonb not null,
  sync_seq bigint not null default 0,
  sync_status text not null default 'synced',
  synced_at timestamptz not null default now(),
  primary key (chain_id, contract_address, onchain_id)
);

create table if not exists cached_settlements (
  chain_id integer not null,
  contract_address text not null,
  onchain_id text not null,           -- submission id
  state text,
  receipt jsonb,
  sync_seq bigint not null default 0,
  sync_status text not null default 'synced',
  synced_at timestamptz not null default now(),
  primary key (chain_id, contract_address, onchain_id)
);

create table if not exists case_search_documents (
  chain_id integer not null,
  contract_address text not null,
  onchain_id text not null,
  kind text not null,                 -- bounty | submission
  title text,
  body text,
  fts tsvector generated always as (
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(body,''))
  ) stored,
  synced_at timestamptz not null default now(),
  primary key (chain_id, contract_address, onchain_id, kind)
);
create index if not exists case_search_fts_idx on case_search_documents using gin (fts);

-- --------------------------------------------------------------- operations

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists source_domain_flags (
  domain text primary key,
  flag text not null check (flag in ('blocked','warned','trusted')),
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists indexer_checkpoints (
  chain_id integer not null,
  contract_address text not null,
  last_event_seq bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (chain_id, contract_address)
);

create table if not exists transaction_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  address text,
  function_name text not null,
  args_hash text,
  tx_hash text,
  phase text not null,
  error text,
  created_at timestamptz not null default now()
);

create table if not exists supplementary_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  submission_onchain_id text,
  storage_path text not null,
  label text,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------------- RLS

alter table profiles enable row level security;
alter table organisations enable row level security;
alter table organisation_members enable row level security;
alter table wallet_bindings enable row level security;
alter table resolver_profiles enable row level security;
alter table bounty_drafts enable row level security;
alter table submission_drafts enable row level security;
alter table cached_bounties enable row level security;
alter table cached_submissions enable row level security;
alter table cached_reviews enable row level security;
alter table cached_appeals enable row level security;
alter table cached_resolver_cases enable row level security;
alter table cached_settlements enable row level security;
alter table case_search_documents enable row level security;
alter table notifications enable row level security;
alter table source_domain_flags enable row level security;
alter table indexer_checkpoints enable row level security;
alter table transaction_attempts enable row level security;
alter table supplementary_files enable row level security;

-- profiles: public read, self write
create policy profiles_read on profiles for select using (true);
create policy profiles_insert on profiles for insert with check (auth.uid() = id);
create policy profiles_update on profiles for update using (auth.uid() = id);

-- organisations: public read; owner writes
create policy orgs_read on organisations for select using (true);
create policy orgs_insert on organisations for insert with check (auth.uid() = owner_id);
create policy orgs_update on organisations for update using (auth.uid() = owner_id);
create policy orgs_delete on organisations for delete using (auth.uid() = owner_id);

create policy org_members_read on organisation_members for select using (true);
create policy org_members_write on organisation_members for all using (
  exists (select 1 from organisations o where o.id = organisation_id and o.owner_id = auth.uid())
);

-- wallet bindings / resolver profiles: self only (bindings private)
create policy wallets_all on wallet_bindings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy resolver_profiles_read on resolver_profiles for select using (true);
create policy resolver_profiles_write on resolver_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- drafts: strictly self
create policy bounty_drafts_all on bounty_drafts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy submission_drafts_all on submission_drafts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- cached mirrors + search: public read (cases are public on-chain);
-- writes only by the service role (indexer), which bypasses RLS.
create policy cached_bounties_read on cached_bounties for select using (true);
create policy cached_submissions_read on cached_submissions for select using (true);
create policy cached_reviews_read on cached_reviews for select using (true);
create policy cached_appeals_read on cached_appeals for select using (true);
create policy cached_resolver_cases_read on cached_resolver_cases for select using (true);
create policy cached_settlements_read on cached_settlements for select using (true);
create policy case_search_read on case_search_documents for select using (true);
create policy source_domain_flags_read on source_domain_flags for select using (true);
create policy indexer_checkpoints_read on indexer_checkpoints for select using (true);

-- notifications: strictly self
create policy notifications_all on notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- transaction attempts: self read/insert
create policy tx_attempts_read on transaction_attempts for select using (auth.uid() = user_id);
create policy tx_attempts_insert on transaction_attempts for insert with check (auth.uid() = user_id or user_id is null);

-- supplementary files: self manage
create policy supp_files_all on supplementary_files for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
