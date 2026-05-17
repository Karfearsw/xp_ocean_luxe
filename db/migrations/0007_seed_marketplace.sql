insert into public.resorts (
  name, slug, destination, brand, region,
  address_line1, city, state, zip, country,
  description, description_short, description_long,
  amenities, hero_image_url, gallery_images,
  has_water_park, has_beach_access, is_ranch, is_orlando_concierge_supported,
  min_nightly_rate, max_nightly_rate, is_published
)
values
(
  'Ocean Luxe at Orlando Town Center',
  'ocean-luxe-orlando-town-center',
  'Orlando/Kissimmee',
  'Westgate',
  'Orlando',
  '9500 Turkey Lake Rd',
  'Orlando',
  'FL',
  '32819',
  'US',
  'A curated Orlando resort stay designed for families and VIP leisure. Transparent pricing, date holds, and concierge support for Orlando arrivals.',
  'Curated Orlando resort stays with optional Tesla delivery and VIP concierge support.',
  'Ocean Luxe curates premium Orlando stays for guests who want clarity, speed, and high-touch support. Choose your room type, add a car, and lock in concierge services for a smooth arrival.',
  '["Multiple pools","Hot tubs","On-site dining","Near theme parks","Family activities"]'::jsonb,
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80',
  '["https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1400&q=80","https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80"]'::jsonb,
  true,
  false,
  false,
  true,
  219.00,
  499.00,
  true
),
(
  'Ocean Luxe at Cocoa Beach',
  'ocean-luxe-cocoa-beach',
  'Beach & Coast',
  'Westgate',
  'Beach',
  '3550 N Atlantic Ave',
  'Cocoa Beach',
  'FL',
  '32931',
  'US',
  'Beach-forward stays with a simple booking flow and clean pricing. Perfect for launch weekends and short coastal resets.',
  'Beach access stays with clear room types and concierge add-ons coming soon.',
  'Ocean Luxe keeps Cocoa Beach straightforward: pick the dates, pick the unit type, and secure your booking. Orlando-only concierge services are labeled clearly so expectations stay clean.',
  '["Beach access","Pools","Family-friendly","Walkable dining"]'::jsonb,
  'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80',
  '["https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80","https://images.unsplash.com/photo-1469796466635-455ede028aca?auto=format&fit=crop&w=1400&q=80"]'::jsonb,
  false,
  true,
  false,
  false,
  189.00,
  429.00,
  true
),
(
  'Ocean Luxe at River Ranch',
  'ocean-luxe-river-ranch',
  'Outdoor / Ranch',
  'Westgate',
  'Ranch',
  '3200 River Ranch Blvd',
  'River Ranch',
  'FL',
  '33867',
  'US',
  'A ranch-style weekend with outdoor activities and a slower pace. Built for groups, families, and event-driven trips.',
  'Ranch weekends with room types and curated packages built for groups.',
  'Ocean Luxe packages River Ranch as an outdoor reset: room types that match your group size, clean policies, and curated add-ons. Orlando-only concierge is not offered here in v1.',
  '["Ranch activities","Outdoor recreation","Family events","Open-air dining"]'::jsonb,
  'https://images.unsplash.com/photo-1529290130-4ca3753253ae?auto=format&fit=crop&w=1400&q=80',
  '["https://images.unsplash.com/photo-1529290130-4ca3753253ae?auto=format&fit=crop&w=1400&q=80","https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1400&q=80"]'::jsonb,
  false,
  false,
  true,
  false,
  159.00,
  389.00,
  true
),
(
  'Ocean Luxe at Smoky Mountain Escape',
  'ocean-luxe-smoky-mountain-escape',
  'Outdoor / Mountains',
  'Westgate',
  'Mountains',
  '915 Westgate Resorts Rd',
  'Gatlinburg',
  'TN',
  '37738',
  'US',
  'Mountain stays with room types sized for couples to large families. Simple booking and clear expectations.',
  'Mountain stays with room types from studio to multi-bedroom villas.',
  'Ocean Luxe keeps the Smoky Mountain experience clean: select a unit type, choose a package, and confirm. Orlando concierge and Tesla delivery are labeled as coming soon outside Orlando.',
  '["Mountain access","Pools","Family activities","On-site dining"]'::jsonb,
  'https://images.unsplash.com/photo-1482192505345-5655af888cc4?auto=format&fit=crop&w=1400&q=80',
  '["https://images.unsplash.com/photo-1482192505345-5655af888cc4?auto=format&fit=crop&w=1400&q=80","https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=80"]'::jsonb,
  false,
  false,
  false,
  false,
  179.00,
  459.00,
  true
)
on conflict (slug) do nothing;

with target as (
  select id, slug
  from public.resorts
  where slug in (
    'ocean-luxe-orlando-town-center',
    'ocean-luxe-cocoa-beach',
    'ocean-luxe-river-ranch',
    'ocean-luxe-smoky-mountain-escape'
  )
)
insert into public.room_types (
  resort_id, name, max_occupancy, bed_config, kitchen_type, bath_features,
  has_balcony_or_patio, has_washer_dryer, base_owner_cost_per_night, default_markup_percent
)
select
  t.id,
  rt.name,
  rt.max_occupancy,
  rt.bed_config,
  rt.kitchen_type,
  rt.bath_features,
  rt.has_balcony_or_patio,
  rt.has_washer_dryer,
  rt.base_owner_cost_per_night,
  rt.default_markup_percent
from target t
cross join (
  values
    ('Studio Villa', 4, '1 queen + sleeper sofa', 'Kitchenette', 'Walk-in shower', false, false, 95.00, 45.00),
    ('1BR Villa', 4, '1 king + sleeper sofa', 'Full Kitchen', 'Jetted tub', true, true, 135.00, 45.00),
    ('2BR Villa', 8, '1 king + 2 twins + sleeper sofa', 'Full Kitchen', '2 baths', true, true, 185.00, 45.00),
    ('4BR Villa', 16, 'Mixed beds + sleeper sofas', 'Full Kitchen', 'Multiple baths', true, true, 265.00, 45.00)
) as rt(name, max_occupancy, bed_config, kitchen_type, bath_features, has_balcony_or_patio, has_washer_dryer, base_owner_cost_per_night, default_markup_percent)
on conflict do nothing;

insert into public.car_types (
  slug, name, brand, category, seats, range_estimate_miles, luggage_capacity_notes,
  is_active, base_daily_rate, default_markup_percent, cleaning_fee, delivery_fee_orlando
)
values
('economy-basic', 'Basic Cheap Car', 'Other', 'Economy', 5, null, '2–3 bags', true, 49.00, 35.00, 25.00, 0.00),
('tesla-model-3', 'Tesla Model 3', 'Tesla', 'EV-Standard', 5, 272, '2–3 bags', true, 119.00, 35.00, 45.00, 75.00),
('tesla-model-y', 'Tesla Model Y', 'Tesla', 'EV-SUV', 5, 310, '3–4 bags', true, 149.00, 35.00, 55.00, 85.00),
('tesla-model-s', 'Tesla Model S', 'Tesla', 'EV-Premium', 5, 396, '2–3 bags', true, 199.00, 35.00, 65.00, 95.00),
('tesla-model-x', 'Tesla Model X', 'Tesla', 'EV-SUV', 7, 335, '4–5 bags', true, 229.00, 35.00, 75.00, 110.00),
('tesla-cybertruck', 'Cybertruck (planned)', 'Tesla', 'EV-Truck', 5, 340, '4–5 bags', false, 0.00, 35.00, 0.00, 0.00),
('tesla-roadster', 'Roadster (future)', 'Tesla', 'EV-Supercar', 2, 620, '1–2 bags', false, 0.00, 35.00, 0.00, 0.00)
on conflict (slug) do nothing;

insert into public.concierge_services (
  slug, name, description, is_orlando_only, base_fee, per_hour_rate, max_party_size, requires_car_type_id
)
select
  s.slug,
  s.name,
  s.description,
  true,
  s.base_fee,
  s.per_hour_rate,
  s.max_party_size,
  s.requires_car_type_id
from (
  values
    ('mco-meet-greet', 'MCO Meet & Greet', 'Airport arrival support with luggage assist and fast handoff into your vehicle plan.', 175.00, 0.00, 8, null::uuid),
    ('grocery-prestock', 'Grocery Pre-Stock', 'A simple pre-stock service so your first night is handled (you provide list or choose a bundle).', 95.00, 0.00, 10, null::uuid),
    ('park-planning', 'Park Planning Session', 'A 45-minute planning session covering timing, dining strategy, and day structure.', 125.00, 0.00, 10, null::uuid)
) as s(slug, name, description, base_fee, per_hour_rate, max_party_size, requires_car_type_id)
on conflict (slug) do nothing;
