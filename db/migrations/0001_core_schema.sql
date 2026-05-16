create extension if not exists btree_gist;
create extension if not exists pgcrypto;

create type public.payment_mode as enum ('full', 'deposit');
create type public.block_status as enum ('available', 'held', 'reserved', 'booked', 'blocked');
create type public.block_source_type as enum ('admin', 'import', 'booking', 'maintenance');
create type public.payment_status as enum ('draft', 'pending', 'paid', 'failed', 'refunded');
create type public.booking_status as enum ('draft', 'pending_payment', 'confirmed', 'cancelled', 'refunded');
create type public.license_status as enum ('licensed', 'pending_review', 'rejected');
create type public.crm_destination as enum ('crm_rest', 'discord');
create type public.crm_sync_status as enum ('pending', 'processing', 'sent', 'failed', 'dead_letter');

create table if not exists public.resorts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  destination text not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text,
  zip text,
  country text not null default 'US',
  description text not null,
  amenities jsonb not null default '[]'::jsonb,
  hero_image_url text,
  gallery_images jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  resort_id uuid not null references public.resorts(id) on delete cascade,
  package_name text not null,
  check_in_rules text,
  check_out_rules text,
  nights integer not null check (nights > 0),
  base_cost numeric(10,2) not null check (base_cost >= 0),
  markup_amount numeric(10,2) not null default 0 check (markup_amount >= 0),
  public_price numeric(10,2) not null check (public_price >= 0),
  payment_mode public.payment_mode not null default 'full',
  deposit_amount numeric(10,2),
  refundable boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint packages_deposit_amount_check check (
    (payment_mode = 'full' and deposit_amount is null) or
    (payment_mode = 'deposit' and deposit_amount is not null and deposit_amount >= 0 and deposit_amount <= public_price)
  )
);

create table if not exists public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  resort_id uuid not null references public.resorts(id) on delete cascade,
  package_id uuid not null references public.packages(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  status public.block_status not null default 'available',
  source_type public.block_source_type not null default 'admin',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint availability_dates_check check (end_date > start_date)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  user_id uuid,
  resort_id uuid not null references public.resorts(id) on delete restrict,
  package_id uuid not null references public.packages(id) on delete restrict,
  guest_name text not null,
  guest_email text not null,
  guest_phone text,
  selected_dates jsonb not null,
  check_in_date date not null,
  check_out_date date not null,
  nights integer not null check (nights > 0),
  currency text not null default 'USD',
  customer_price numeric(10,2) not null check (customer_price >= 0),
  base_cost numeric(10,2) not null check (base_cost >= 0),
  margin numeric(10,2) generated always as (customer_price - base_cost) stored,
  payment_status public.payment_status not null default 'draft',
  booking_status public.booking_status not null default 'draft',
  stripe_payment_intent_id text,
  crm_sync_status public.crm_sync_status not null default 'pending',
  email_status public.crm_sync_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_dates_check check (check_out_date > check_in_date)
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  resort_id uuid not null references public.resorts(id) on delete cascade,
  file_url text not null,
  caption text,
  alt_text text,
  license_status public.license_status not null default 'pending_review',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_sync_queue (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  destination public.crm_destination not null,
  payload jsonb not null,
  status public.crm_sync_status not null default 'pending',
  attempt_count integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  last_error text,
  locked_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_profiles (
  id uuid primary key,
  email text not null unique,
  full_name text,
  role text not null default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.admin_profiles ap where ap.id = uid
  );
$$;

create or replace function public.lock_available_block(p_package_id uuid, p_start date, p_end date)
returns boolean
language plpgsql
as $$
declare
  matched_id uuid;
begin
  select id into matched_id
  from public.availability_blocks
  where package_id = p_package_id
    and status = 'available'
    and start_date <= p_start
    and end_date >= p_end
  order by start_date asc
  limit 1
  for update skip locked;

  if matched_id is null then
    return false;
  end if;

  update public.availability_blocks
  set status = 'held', updated_at = now()
  where id = matched_id;

  return true;
end;
$$;

create index if not exists resorts_destination_idx on public.resorts(destination);
create index if not exists packages_resort_active_idx on public.packages(resort_id, active);
create index if not exists availability_lookup_idx on public.availability_blocks(package_id, status, start_date, end_date);
create index if not exists bookings_lookup_idx on public.bookings(package_id, booking_status, check_in_date, check_out_date);
create index if not exists crm_sync_queue_status_idx on public.crm_sync_queue(status, next_attempt_at);

create trigger set_resorts_updated_at before update on public.resorts for each row execute function public.set_updated_at();
create trigger set_packages_updated_at before update on public.packages for each row execute function public.set_updated_at();
create trigger set_availability_updated_at before update on public.availability_blocks for each row execute function public.set_updated_at();
create trigger set_customers_updated_at before update on public.customers for each row execute function public.set_updated_at();
create trigger set_bookings_updated_at before update on public.bookings for each row execute function public.set_updated_at();
create trigger set_media_updated_at before update on public.media_assets for each row execute function public.set_updated_at();
create trigger set_crm_sync_updated_at before update on public.crm_sync_queue for each row execute function public.set_updated_at();
create trigger set_admin_updated_at before update on public.admin_profiles for each row execute function public.set_updated_at();
