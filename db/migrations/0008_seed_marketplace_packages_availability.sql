with target_resorts as (
  select id, slug
  from public.resorts
  where slug in (
    'ocean-luxe-orlando-town-center',
    'ocean-luxe-cocoa-beach',
    'ocean-luxe-river-ranch',
    'ocean-luxe-smoky-mountain-escape'
  )
),
seed as (
  select
    tr.id as resort_id,
    tr.slug as resort_slug,
    pkg.slug as slug,
    pkg.package_name,
    pkg.check_in_rules,
    pkg.check_out_rules,
    pkg.nights,
    pkg.base_cost,
    pkg.guest_certificate_fee,
    pkg.markup_amount,
    pkg.public_price,
    pkg.payment_mode::public.payment_mode as payment_mode,
    pkg.deposit_amount,
    pkg.refundable,
    pkg.summary,
    pkg.details,
    pkg.target_audience,
    pkg.nights_min,
    pkg.nights_max,
    pkg.price_from
  from target_resorts tr
  cross join (
    values
      (
        'signature-3-night',
        'Signature 3-Night Escape',
        'Flexible arrivals (typical Fri–Sat check-in windows)',
        'Checkout by 11 AM',
        3,
        420.00,
        129.00,
        180.00,
        600.00,
        'deposit',
        150.00,
        false,
        'Three nights with transparent pricing and an optional Orlando upgrade path.',
        'Pick your dates, select the room type, then secure the booking with a deposit. Guest certificate fees are included in your due-now total.',
        'Family',
        3,
        4,
        600.00
      ),
      (
        'premier-5-night',
        'Premier 5-Night Retreat',
        'Sunday through Tuesday arrivals (typical)',
        'Checkout by 10 AM',
        5,
        700.00,
        169.00,
        300.00,
        1000.00,
        'full',
        null::numeric,
        true,
        'Five nights for guests who want to lock in the full trip price up front.',
        'Secure your stay in one payment. Certificate fees are included before checkout so your confirmation is clean.',
        'Couples',
        5,
        6,
        1000.00
      )
  ) as pkg(
    slug,
    package_name,
    check_in_rules,
    check_out_rules,
    nights,
    base_cost,
    guest_certificate_fee,
    markup_amount,
    public_price,
    payment_mode,
    deposit_amount,
    refundable,
    summary,
    details,
    target_audience,
    nights_min,
    nights_max,
    price_from
  )
)
insert into public.packages (
  resort_id,
  slug,
  package_name,
  check_in_rules,
  check_out_rules,
  nights,
  base_cost,
  guest_certificate_fee,
  markup_amount,
  public_price,
  payment_mode,
  deposit_amount,
  refundable,
  summary,
  details,
  target_audience,
  nights_min,
  nights_max,
  price_from,
  active
)
select
  resort_id,
  concat(resort_slug, '-', slug),
  package_name,
  check_in_rules,
  check_out_rules,
  nights,
  base_cost,
  guest_certificate_fee,
  markup_amount,
  public_price,
  payment_mode,
  deposit_amount,
  refundable,
  summary,
  details,
  target_audience,
  nights_min,
  nights_max,
  price_from,
  true
from seed
on conflict (slug) do nothing;

with target_resorts as (
  select id
  from public.resorts
  where slug in (
    'ocean-luxe-orlando-town-center',
    'ocean-luxe-cocoa-beach',
    'ocean-luxe-river-ranch',
    'ocean-luxe-smoky-mountain-escape'
  )
),
target_packages as (
  select p.id, p.resort_id
  from public.packages p
  join target_resorts tr on tr.id = p.resort_id
  where p.slug like 'ocean-luxe-%'
)
insert into public.availability_blocks (resort_id, package_id, start_date, end_date, status, source_type, notes)
select
  tp.resort_id,
  tp.id,
  current_date,
  (current_date + 180),
  'available'::public.block_status,
  'admin'::public.block_source_type,
  'Seed inventory block (demo)'
from target_packages tp
where not exists (
  select 1
  from public.availability_blocks ab
  where ab.package_id = tp.id
    and ab.start_date = current_date
    and ab.end_date = (current_date + 180)
);

