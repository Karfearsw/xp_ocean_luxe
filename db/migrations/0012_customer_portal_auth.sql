create table if not exists public.customer_magic_links (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  token_hash text not null unique,
  redirect_path text not null default '/account/bookings',
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_sessions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  session_token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_magic_links_customer_expires_idx on public.customer_magic_links(customer_id, expires_at desc);
create index if not exists customer_sessions_customer_expires_idx on public.customer_sessions(customer_id, expires_at desc);

create trigger set_customer_magic_links_updated_at before update on public.customer_magic_links for each row execute function public.set_updated_at();
create trigger set_customer_sessions_updated_at before update on public.customer_sessions for each row execute function public.set_updated_at();
