insert into public.resorts (name, slug, destination, address_line1, city, state, zip, country, description, amenities, hero_image_url, gallery_images)
values
  (
    'Ocean Luxe at Orlando Bay',
    'ocean-luxe-orlando-bay',
    'Orlando',
    '1200 Ocean Luxe Way',
    'Orlando',
    'FL',
    '32819',
    'US',
    'A polished resort escape curated for families and couples who want premium convenience, transparent pricing, and Ocean Luxe concierge support.',
    '["Pool", "Spa", "Complimentary shuttle", "Private balconies"]'::jsonb,
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    '["https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80"]'::jsonb
  )
on conflict (slug) do nothing;

insert into public.packages (resort_id, package_name, check_in_rules, check_out_rules, nights, base_cost, markup_amount, public_price, payment_mode, deposit_amount, refundable)
select id, 'Signature 3-Night Escape', 'Friday and Saturday arrivals allowed', 'Checkout by 11 AM', 3, 420.00, 180.00, 600.00, 'deposit', 150.00, false
from public.resorts
where slug = 'ocean-luxe-orlando-bay'
on conflict do nothing;

insert into public.packages (resort_id, package_name, check_in_rules, check_out_rules, nights, base_cost, markup_amount, public_price, payment_mode, refundable)
select id, 'Premier 5-Night Retreat', 'Sunday through Tuesday arrivals', 'Checkout by 10 AM', 5, 700.00, 300.00, 1000.00, 'full', true
from public.resorts
where slug = 'ocean-luxe-orlando-bay'
on conflict do nothing;

insert into public.availability_blocks (resort_id, package_id, start_date, end_date, status, source_type, notes)
select r.id, p.id, current_date + 14, current_date + 17, 'available', 'admin', 'Seed inventory block'
from public.resorts r
join public.packages p on p.resort_id = r.id
where r.slug = 'ocean-luxe-orlando-bay' and p.package_name = 'Signature 3-Night Escape'
on conflict do nothing;
