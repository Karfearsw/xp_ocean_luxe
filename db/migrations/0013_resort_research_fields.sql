alter table public.resorts
  add column if not exists property_name text,
  add column if not exists official_url text,
  add column if not exists min_checkin_age_default integer not null default 21 check (min_checkin_age_default >= 0),
  add column if not exists min_checkin_age_override integer check (min_checkin_age_override >= 0),
  add column if not exists from_rate_reference numeric(10,2) check (from_rate_reference >= 0),
  add column if not exists from_rate_currency text not null default 'USD',
  add column if not exists from_rate_source text;

alter table public.resorts
  alter column is_published set default false;

