export const fallbackResorts = [
  {
    id: "seed-resort-1",
    name: "Ocean Luxe at Orlando Bay",
    slug: "ocean-luxe-orlando-bay",
    destination: "Orlando",
    address_line1: "1200 Ocean Luxe Way",
    address_line2: null,
    city: "Orlando",
    state: "FL",
    zip: "32819",
    country: "US",
    description: "A premium inventory collection with concierge-level stay planning, verified dates, and Ocean Luxe support throughout the booking lifecycle.",
    amenities: ["Pool", "Spa", "Shuttle", "Balcony Suites"],
    hero_image_url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    gallery_images: [
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80"
    ],
    active: true,
  },
];

export const fallbackPackages = [
  {
    id: "seed-package-1",
    resort_id: "seed-resort-1",
    package_name: "Signature 3-Night Escape",
    check_in_rules: "Friday and Saturday arrivals allowed",
    check_out_rules: "Checkout by 11 AM",
    nights: 3,
    base_cost: 420,
    guest_certificate_fee: 129,
    markup_amount: 180,
    public_price: 600,
    payment_mode: "deposit",
    deposit_amount: 150,
    refundable: false,
    active: true,
  },
  {
    id: "seed-package-2",
    resort_id: "seed-resort-1",
    package_name: "Premier 5-Night Retreat",
    check_in_rules: "Sunday through Tuesday arrivals",
    check_out_rules: "Checkout by 10 AM",
    nights: 5,
    base_cost: 700,
    guest_certificate_fee: 169,
    markup_amount: 300,
    public_price: 1000,
    payment_mode: "full",
    deposit_amount: null,
    refundable: true,
    active: true,
  },
];

export const fallbackAvailability = [
  {
    id: "seed-availability-1",
    resort_id: "seed-resort-1",
    package_id: "seed-package-1",
    start_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 17 * 86400000).toISOString().slice(0, 10),
    status: "available",
    source_type: "admin",
    notes: "Seed inventory block",
  },
];
