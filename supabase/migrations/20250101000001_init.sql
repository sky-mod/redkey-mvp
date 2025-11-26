-- ==================== PROFILES (KYC + ROLE) ====================
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null check (role in ('ethical_hacker', 'pentester', 'dev', 'lekarz', 'slusarz')),
  kyc_status text not null default 'pending' check (kyc_status in ('pending', 'verified', 'rejected')),
  selfie_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profile_select_own" on public.profiles
  for select using (auth.uid() = user_id);

create policy "profile_update_own" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "profile_insert_own" on public.profiles
  for insert with check (auth.uid() = user_id);

-- ==================== BOUNTY SCOPES ====================
create table if not exists public.bounty_scopes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('hackerone', 'bugcrowd')),
  program_identifier text not null,
  scope_json jsonb not null,
  created_at timestamptz not null default now()
);

create index idx_bounty_scopes_user_id on public.bounty_scopes(user_id);
create index idx_bounty_scopes_platform on public.bounty_scopes(platform);

alter table public.bounty_scopes enable row level security;

create policy "scope_select_own" on public.bounty_scopes
  for select using (auth.uid() = user_id);

create policy "scope_insert_own" on public.bounty_scopes
  for insert with check (auth.uid() = user_id);

create policy "scope_delete_own" on public.bounty_scopes
  for delete using (auth.uid() = user_id);

-- ==================== STRIPE SUBSCRIPTIONS ====================
create table if not exists public.stripe_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  stripe_customer_id text not null unique,
  stripe_subscription_id text not null unique,
  status text not null check (status in ('active', 'canceled', 'past_due')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_stripe_subs_user_id on public.stripe_subscriptions(user_id);
create index idx_stripe_subs_customer_id on public.stripe_subscriptions(stripe_customer_id);

alter table public.stripe_subscriptions enable row level security;

create policy "stripe_select_own" on public.stripe_subscriptions
  for select using (auth.uid() = user_id);

-- ==================== ACTIVITY LOGS (E2E + TTL) ====================
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  encrypted_payload jsonb not null,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index idx_activity_logs_user_id on public.activity_logs(user_id);
create index idx_activity_logs_created_at on public.activity_logs(created_at);

alter table public.activity_logs enable row level security;

create policy "logs_select_own" on public.activity_logs
  for select using (auth.uid() = user_id);

create policy "logs_insert_own" on public.activity_logs
  for insert with check (auth.uid() = user_id);

-- ==================== TTL FUNCTION (SELF-DESTRUCT) ====================
create or replace function public.purge_old_activity_logs()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  deleted_count int;
begin
  delete from public.activity_logs
  where created_at < now() - interval '30 days';
  
  get diagnostics deleted_count = row_count;
  raise notice 'Purged % old activity logs', deleted_count;
end;
$$;

-- ==================== SETUP STORAGE BUCKETS ====================
insert into storage.buckets (id, name, public)
values ('kyc-selfies', 'kyc-selfies', false)
on conflict do nothing;

-- RLS dla storage
create policy "kyc_upload_own" on storage.objects
  for insert with check (
    bucket_id = 'kyc-selfies' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "kyc_select_own" on storage.objects
  for select using (
    bucket_id = 'kyc-selfies' and
    auth.uid()::text = (storage.foldername(name))[1]
  );
