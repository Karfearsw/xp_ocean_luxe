alter table public.resorts
  add column if not exists brand text not null default 'Westgate',
  add column if not exists region text not null default 'Orlando',
  add column if not exists has_water_park boolean not null default false,
  add column if not exists has_beach_access boolean not null default false,
  add column if not exists is_ranch boolean not null default false,
  add column if not exists is_orlando_concierge_supported boolean not null default false,
  add column if not exists description_short text,
  add column if not exists description_long text,
  add column if not exists min_nightly_rate numeric(10,2),
  add column if not exists max_nightly_rate numeric(10,2),
  add column if not exists reference_notes text,
  add column if not exists is_published boolean not null default true;

create table if not exists public.room_types (
  id uuid primary key default gen_random_uuid(),
  resort_id uuid not null references public.resorts(id) on delete cascade,
  name text not null,
  max_occupancy integer not null check (max_occupancy > 0),
  bed_config text,
  kitchen_type text,
  bath_features text,
  has_balcony_or_patio boolean not null default false,
  has_washer_dryer boolean not null default false,
  internal_code text,
  base_owner_cost_per_night numeric(10,2) not null default 0 check (base_owner_cost_per_night >= 0),
  default_markup_percent numeric(5,2) not null default 0 check (default_markup_percent >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_room_types_updated_at before update on public.room_types for each row execute function public.set_updated_at();

create table if not exists public.resort_amenities (
  id uuid primary key default gen_random_uuid(),
  resort_id uuid not null references public.resorts(id) on delete cascade,
  category text not null,
  label text not null,
  details text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_resort_amenities_updated_at before update on public.resort_amenities for each row execute function public.set_updated_at();

alter table public.media_assets
  add column if not exists room_type_id uuid references public.room_types(id) on delete cascade,
  add column if not exists is_primary boolean not null default false;

alter table public.packages
  add column if not exists slug text,
  add column if not exists summary text,
  add column if not exists details text,
  add column if not exists target_audience text,
  add column if not exists nights_min integer,
  add column if not exists nights_max integer,
  add column if not exists price_from numeric(10,2),
  add column if not exists includes_car boolean not null default false,
  add column if not exists includes_concierge boolean not null default false,
  add column if not exists is_orlando_only boolean not null default false,
  add column if not exists eligible_resort_ids uuid[];

create unique index if not exists packages_slug_unique_idx on public.packages(slug) where slug is not null;

create table if not exists public.car_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  brand text,
  category text not null,
  seats integer,
  range_estimate_miles integer,
  luggage_capacity_notes text,
  is_active boolean not null default true,
  base_daily_rate numeric(10,2) not null default 0 check (base_daily_rate >= 0),
  default_markup_percent numeric(5,2) not null default 0 check (default_markup_percent >= 0),
  cleaning_fee numeric(10,2) not null default 0 check (cleaning_fee >= 0),
  delivery_fee_orlando numeric(10,2) not null default 0 check (delivery_fee_orlando >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_car_types_updated_at before update on public.car_types for each row execute function public.set_updated_at();

create table if not exists public.concierge_services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  is_orlando_only boolean not null default true,
  base_fee numeric(10,2) not null default 0 check (base_fee >= 0),
  per_hour_rate numeric(10,2) not null default 0 check (per_hour_rate >= 0),
  max_party_size integer,
  requires_car_type_id uuid references public.car_types(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_concierge_services_updated_at before update on public.concierge_services for each row execute function public.set_updated_at();

alter table public.bookings
  add column if not exists room_type_id uuid references public.room_types(id) on delete set null,
  add column if not exists car_type_id uuid references public.car_types(id) on delete set null,
  add column if not exists concierge_service_id uuid references public.concierge_services(id) on delete set null,
  add column if not exists guests_adults integer not null default 2 check (guests_adults >= 0),
  add column if not exists guests_children integer not null default 0 check (guests_children >= 0),
  add column if not exists total_price numeric(10,2) not null default 0 check (total_price >= 0),
  add column if not exists deposit_amount numeric(10,2) not null default 0 check (deposit_amount >= 0),
  add column if not exists balance_due numeric(10,2) not null default 0 check (balance_due >= 0);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  stripe_payment_intent_id text unique,
  amount numeric(10,2) not null check (amount >= 0),
  status text not null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_payments_updated_at before update on public.payments for each row execute function public.set_updated_at();

create index if not exists room_types_resort_active_idx on public.room_types(resort_id, is_active);
create index if not exists resort_amenities_resort_idx on public.resort_amenities(resort_id, category, sort_order);
create index if not exists bookings_resort_created_idx on public.bookings(resort_id, created_at desc);
