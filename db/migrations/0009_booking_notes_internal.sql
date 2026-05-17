alter table public.bookings
  add column if not exists notes_internal text;

