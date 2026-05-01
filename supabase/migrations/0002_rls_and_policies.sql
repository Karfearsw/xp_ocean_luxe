alter table public.resorts enable row level security;
alter table public.packages enable row level security;
alter table public.availability_blocks enable row level security;
alter table public.customers enable row level security;
alter table public.bookings enable row level security;
alter table public.media_assets enable row level security;
alter table public.crm_sync_queue enable row level security;
alter table public.stripe_webhook_events enable row level security;
alter table public.admin_profiles enable row level security;

create policy "Public active resorts" on public.resorts
for select
using (active = true);

create policy "Public active packages" on public.packages
for select
using (active = true and exists (select 1 from public.resorts r where r.id = resort_id and r.active = true));

create policy "Public active availability" on public.availability_blocks
for select
using (
  status = 'available' and exists (
    select 1 from public.packages p
    join public.resorts r on r.id = p.resort_id
    where p.id = package_id and p.active = true and r.active = true
  )
);

create policy "Admin full resorts" on public.resorts
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "Admin full packages" on public.packages
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "Admin full availability" on public.availability_blocks
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "Admin full customers" on public.customers
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "Admin full bookings" on public.bookings
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "Admin full media" on public.media_assets
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "Admin full crm sync" on public.crm_sync_queue
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "Admin full stripe events" on public.stripe_webhook_events
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "Admin full profiles" on public.admin_profiles
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));
