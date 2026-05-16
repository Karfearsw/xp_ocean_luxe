import type { BookingDraft, BookingRecord, CreateIntentResponse, Resort, ResortPackage } from "../types";

const fallbackResorts: Resort[] = [
  {
    id: "seed-resort-1",
    name: "Ocean Luxe at Orlando Bay",
    slug: "ocean-luxe-orlando-bay",
    destination: "Orlando",
    address_line1: "1200 Ocean Luxe Way",
    city: "Orlando",
    state: "FL",
    zip: "32819",
    country: "US",
    description: "Luxury resort inventory curated for smooth arrivals, concierge-level support, and transparent pricing from the moment you book.",
    amenities: ["Pool", "Spa", "Shuttle", "Balcony Suites"],
    hero_image_url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    gallery_images: [
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    ],
    active: true,
  },
];

const fallbackPackages: ResortPackage[] = [
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

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchResorts(destination?: string): Promise<Resort[]> {
  try {
    const search = destination ? `?destination=${encodeURIComponent(destination)}` : "";
    const response = await fetch(`/api/resorts${search}`);
    return await readJson<Resort[]>(response);
  } catch {
    return fallbackResorts.filter((resort) => !destination || resort.destination === destination);
  }
}

export async function fetchResortBySlug(slug: string): Promise<{ resort: Resort; packages: ResortPackage[] }> {
  try {
    const response = await fetch(`/api/resorts/${slug}`);
    return await readJson<{ resort: Resort; packages: ResortPackage[] }>(response);
  } catch {
    const resort = fallbackResorts.find((entry) => entry.slug === slug);
    if (!resort) throw new Error("Resort not found");
    return { resort, packages: fallbackPackages.filter((entry) => entry.resort_id === resort.id) };
  }
}

export async function createBookingDraft(payload: BookingDraft): Promise<BookingRecord> {
  const response = await fetch(`/api/bookings/create-draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return readJson<BookingRecord>(response);
}

export async function createPaymentIntent(bookingId: string): Promise<CreateIntentResponse> {
  const response = await fetch(`/api/payments/create-intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookingId }),
  });

  return readJson<CreateIntentResponse>(response);
}
