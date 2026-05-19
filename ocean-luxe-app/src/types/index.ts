export type Amenity = string;

export interface Resort {
  id: string;
  name: string;
  property_name?: string | null;
  slug: string;
  destination: string;
  brand?: string;
  region?: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state?: string | null;
  zip?: string | null;
  country: string;
  description: string;
  description_short?: string | null;
  description_long?: string | null;
  amenities: Amenity[];
  hero_image_url?: string | null;
  gallery_images: string[];
  active: boolean;
  is_published?: boolean;
  has_water_park?: boolean;
  has_beach_access?: boolean;
  is_ranch?: boolean;
  is_orlando_concierge_supported?: boolean;
  min_nightly_rate?: number | null;
  max_nightly_rate?: number | null;
  official_url?: string | null;
  min_checkin_age_default?: number;
  min_checkin_age_override?: number | null;
  from_rate_reference?: number | null;
  from_rate_currency?: string;
  from_rate_source?: string | null;
  reference_notes?: string | null;
}

export interface RoomType {
  id: string;
  resort_id: string;
  name: string;
  max_occupancy: number;
  bed_config?: string | null;
  kitchen_type?: string | null;
  bath_features?: string | null;
  has_balcony_or_patio?: boolean;
  has_washer_dryer?: boolean;
  internal_code?: string | null;
  base_owner_cost_per_night?: number;
  default_markup_percent?: number;
  is_active?: boolean;
}

export interface CarType {
  id: string;
  slug: string;
  name: string;
  brand?: string | null;
  category: string;
  seats?: number | null;
  range_estimate_miles?: number | null;
  luggage_capacity_notes?: string | null;
  is_active: boolean;
  base_daily_rate: number;
  default_markup_percent: number;
  cleaning_fee: number;
  delivery_fee_orlando: number;
}

export interface ConciergeService {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  is_orlando_only: boolean;
  base_fee: number;
  per_hour_rate: number;
  max_party_size?: number | null;
  requires_car_type_id?: string | null;
}

export interface ResortPackage {
  id: string;
  resort_id: string;
  package_name: string;
  check_in_rules?: string | null;
  check_out_rules?: string | null;
  nights: number;
  base_cost: number;
  guest_certificate_fee: number;
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
  room_type_id?: string | null;
  package_id: string;
  car_type_id?: string | null;
  concierge_service_id?: string | null;
  concierge_service_ids: string[];
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  guest_dob: string;
  compliance_acknowledged: boolean;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  guests_adults?: number;
  guests_children?: number;
}

export interface BookingRecord extends BookingDraft {
  id: string;
  customer_price: number;
  base_cost: number;
  margin: number;
  payment_status: string;
  booking_status: string;
  stripe_payment_intent_id?: string | null;
  provider_confirmation_number?: string | null;
  total_price?: number;
  deposit_amount?: number;
  due_now?: number;
  balance_due?: number;
  car_total?: number;
  concierge_total?: number;
  created_at: string;
}

export interface CreateIntentResponse {
  clientSecret: string;
  amount: number;
  paymentMode: "full" | "deposit";
}
