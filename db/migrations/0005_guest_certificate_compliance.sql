alter table public.packages
  add column if not exists guest_certificate_fee numeric(10,2) not null default 0 check (guest_certificate_fee >= 0);

alter table public.bookings
  add column if not exists guest_dob date,
  add column if not exists provider_confirmation_number text;

update public.bookings
set guest_dob = check_in_date - interval '21 years'
where guest_dob is null;

alter table public.bookings
  alter column guest_dob set not null;
