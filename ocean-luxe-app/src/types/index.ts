export type Amenity = string;

export interface Resort {
  id: string;
  name: string;
  slug: string;
  destination: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state?: string | null;
  zip?: string | null;
  country: string;
  description: string;
  amenities: Amenity[];
  hero_image_url?: string | null;
  gallery_images: string[];
  active: boolean;
}

export interface ResortPackage {
  id: string;
  resort_id: string;
  package_name: string;
  check_in_rules?: string | null;
  check_out_rules?: string | null;
  nights: number;
  base_cost: number;
  markup_amount: number;
  public_price: number;
  payment_mode: "full" | "deposit";
  deposit_amount?: number | null;
  refundable: boolean;
  active: boolean;
}

export interface AvailabilityBlock {
  id: string;
  resort_id: string;
  package_id: string;
  start_date: string;
  end_date: string;
  status: "available" | "held" | "reserved" | "booked" | "blocked";
  source_type: "admin" | "import" | "booking" | "maintenance";
  notes?: string | null;
}

export interface BookingDraft {
  resort_id: string;
  package_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in_date: string;
  check_out_date: string;
  nights: number;
}

export interface BookingRecord extends BookingDraft {
  id: string;
  customer_price: number;
  base_cost: number;
  margin: number;
  payment_status: string;
  booking_status: string;
  stripe_payment_intent_id?: string | null;
  created_at: string;
}

export interface CreateIntentResponse {
  clientSecret: string;
  amount: number;
  paymentMode: "full" | "deposit";
}
