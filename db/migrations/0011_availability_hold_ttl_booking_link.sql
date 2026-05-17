alter table public.availability_blocks
  add column if not exists held_at timestamptz,
  add column if not exists hold_expires_at timestamptz;

alter table public.bookings
  add column if not exists availability_block_id uuid references public.availability_blocks(id) on delete set null;

create index if not exists availability_blocks_held_expiration_idx
  on public.availability_blocks(status, hold_expires_at)
  where status = 'held';

create index if not exists bookings_availability_block_id_idx
  on public.bookings(availability_block_id)
  where availability_block_id is not null;

update public.availability_blocks
set held_at = coalesce(held_at, updated_at)
where status = 'held' and held_at is null;

