function toNumber(value: unknown) {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : 0;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function computeCarTotal(params: {
  nights: number;
  isOrlandoSupported: boolean;
  carType: {
    base_daily_rate: unknown;
    cleaning_fee: unknown;
    delivery_fee_orlando: unknown;
    default_markup_percent: unknown;
  } | null;
}) {
  if (!params.carType) {
    return {
      car_total: 0,
      car_daily_rate: 0,
      car_cleaning_fee: 0,
      car_delivery_fee: 0,
      car_markup_percent: 0,
    };
  }

  const car_daily_rate = toNumber(params.carType.base_daily_rate);
  const car_cleaning_fee = toNumber(params.carType.cleaning_fee);
  const car_delivery_fee = params.isOrlandoSupported ? toNumber(params.carType.delivery_fee_orlando) : 0;
  const car_markup_percent = toNumber(params.carType.default_markup_percent);

  const base = car_daily_rate * Math.max(1, params.nights) + car_cleaning_fee + car_delivery_fee;
  const car_total = roundCurrency(base * (1 + car_markup_percent / 100));

  return {
    car_total,
    car_daily_rate: roundCurrency(car_daily_rate),
    car_cleaning_fee: roundCurrency(car_cleaning_fee),
    car_delivery_fee: roundCurrency(car_delivery_fee),
    car_markup_percent: roundCurrency(car_markup_percent),
  };
}

export function computeConciergeTotal(services: Array<{ base_fee: unknown }>) {
  const concierge_total = roundCurrency(services.reduce((sum, entry) => sum + toNumber(entry.base_fee), 0));
  return { concierge_total };
}

export function computeBookingTotals(params: {
  payment_mode: "full" | "deposit";
  public_price: unknown;
  deposit_amount: unknown;
  guest_certificate_fee: unknown;
  nights: number;
  isOrlandoSupported: boolean;
  carType: {
    base_daily_rate: unknown;
    cleaning_fee: unknown;
    delivery_fee_orlando: unknown;
    default_markup_percent: unknown;
  } | null;
  conciergeServices: Array<{ base_fee: unknown }>;
}) {
  const guestCertificateFee = toNumber(params.guest_certificate_fee);
  const publicPrice = toNumber(params.public_price);
  const depositAmount = toNumber(params.deposit_amount);

  const car = computeCarTotal({
    nights: params.nights,
    isOrlandoSupported: params.isOrlandoSupported,
    carType: params.carType,
  });

  const concierge = computeConciergeTotal(params.conciergeServices);
  const addonsTotal = car.car_total + concierge.concierge_total;

  const total_price = roundCurrency(publicPrice + guestCertificateFee + addonsTotal);
  const due_now = params.payment_mode === "deposit"
    ? roundCurrency(depositAmount + guestCertificateFee + addonsTotal)
    : total_price;
  const balance_due = roundCurrency(Math.max(0, total_price - due_now));

  return {
    total_price,
    due_now,
    balance_due,
    car_total: car.car_total,
    concierge_total: concierge.concierge_total,
    car_daily_rate: car.car_daily_rate,
    car_cleaning_fee: car.car_cleaning_fee,
    car_delivery_fee: car.car_delivery_fee,
    car_markup_percent: car.car_markup_percent,
  };
}

