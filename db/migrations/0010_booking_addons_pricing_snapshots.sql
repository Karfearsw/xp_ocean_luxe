create table if not exists public.booking_concierge_services (
  booking_id uuid not null references public.bookings(id) on delete cascade,
  concierge_service_id uuid not null references public.concierge_services(id) on delete restrict,
  service_name text not null,
  base_fee numeric(10,2) not null default 0 check (base_fee >= 0),
  per_hour_rate numeric(10,2) not null default 0 check (per_hour_rate >= 0),
  created_at timestamptz not null default now(),
  primary key (booking_id, concierge_service_id)
);

alter table public.bookings
  add column if not exists due_now numeric(10,2) not null default 0 check (due_now >= 0),
  add column if not exists car_total numeric(10,2) not null default 0 check (car_total >= 0),
  add column if not exists concierge_total numeric(10,2) not null default 0 check (concierge_total >= 0),
  add column if not exists car_daily_rate numeric(10,2) not null default 0 check (car_daily_rate >= 0),
  add column if not exists car_cleaning_fee numeric(10,2) not null default 0 check (car_cleaning_fee >= 0),
  add column if not exists car_delivery_fee numeric(10,2) not null default 0 check (car_delivery_fee >= 0),
  add column if not exists car_markup_percent numeric(5,2) not null default 0 check (car_markup_percent >= 0);

create index if not exists booking_concierge_services_booking_idx on public.booking_concierge_services(booking_id);
