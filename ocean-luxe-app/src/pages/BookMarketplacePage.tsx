import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import EmptyState from "../components/state/EmptyState";
import ErrorState from "../components/state/ErrorState";
import LoadingState from "../components/state/LoadingState";
import { createBookingDraft, createPaymentIntent, fetchCarTypes, fetchConciergeServices, searchBookOptions } from "../lib/api-client";
import { formatCurrency, nightsBetween } from "../lib/formatters";
import type { BookSearchResult } from "../lib/api-client";
import type { CarType, ConciergeService } from "../types";

type Step = 1 | 2 | 3 | 4;

export default function BookMarketplacePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const presetRegion = searchParams.get("region") ?? "";
  const presetResort = searchParams.get("resort") ?? "";

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [selected, setSelected] = useState<BookSearchResult | null>(null);
  const [dates, setDates] = useState({ startDate: "", endDate: "" });
  const [guests, setGuests] = useState(2);
  const [cars, setCars] = useState<CarType[]>([]);
  const [conciergeServices, setConciergeServices] = useState<ConciergeService[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [selectedConciergeId, setSelectedConciergeId] = useState<string | null>(null);
  const [form, setForm] = useState({
    guest_name: "",
    guest_email: "",
    guest_phone: "",
    guest_dob: "",
    compliance_acknowledged: false,
  });

  const nights = useMemo(() => {
    if (!dates.startDate || !dates.endDate) return 1;
    return nightsBetween(dates.startDate, dates.endDate);
  }, [dates.endDate, dates.startDate]);

  const dueNow = selected
    ? selected.payment_mode === "deposit"
      ? (selected.deposit_amount ?? 0) + selected.guest_certificate_fee
      : selected.public_price + selected.guest_certificate_fee
    : 0;

  const isOrlandoSupported = selected?.is_orlando_concierge_supported === true;

  useEffect(() => {
    if (!selected) return;
    setSelectedCarId(null);
    setSelectedConciergeId(null);
    setCars([]);
    setConciergeServices([]);

    let mounted = true;
    Promise.all([
      fetchCarTypes({ orlandoOnly: false }),
      fetchConciergeServices({ orlandoOnly: true }),
    ])
      .then(([carsResp, conciergeResp]) => {
        if (!mounted) return;
        setCars(carsResp.cars);
        setConciergeServices(conciergeResp.services);
      })
      .catch(() => {
        if (!mounted) return;
        setCars([]);
        setConciergeServices([]);
      });
    return () => {
      mounted = false;
    };
  }, [selected]);

  async function runSearch() {
    if (!dates.startDate || !dates.endDate) {
      setError("Select check-in and check-out dates.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await searchBookOptions({
        startDate: dates.startDate,
        endDate: dates.endDate,
        guests,
        region: presetRegion || undefined,
        resort: presetResort || undefined,
      });
      setResults(data.results);
      setStep(2);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      const booking = await createBookingDraft({
        resort_id: selected.resort_id,
        package_id: selected.package_id,
        room_type_id: selected.room_type_id,
        car_type_id: selectedCarId,
        concierge_service_id: selectedConciergeId,
        guest_name: form.guest_name,
        guest_email: form.guest_email,
        guest_phone: form.guest_phone,
        guest_dob: form.guest_dob,
        compliance_acknowledged: form.compliance_acknowledged,
        check_in_date: dates.startDate,
        check_out_date: dates.endDate,
        nights,
        guests_adults: guests,
        guests_children: 0,
      });
      await createPaymentIntent(booking.id);
      navigate(`/booking/confirmed/${booking.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Checkout failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Book</p>
        <h1 className="text-4xl font-semibold md:text-5xl">Check availability, then secure your stay</h1>
        <p className="max-w-3xl text-slate-300">
          Select dates, choose the room type, and confirm payment. Orlando concierge and Tesla delivery show only when the destination supports it.
        </p>
      </header>

      {loading && step === 2 ? <LoadingState title="Searching inventory" description="Matching resorts, room types, and packages." /> : null}
      {error ? <ErrorState title="Booking flow error" message={error} /> : null}

      <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 md:p-8">
        <div className="flex flex-wrap gap-3 text-sm">
          {[
            { label: "Dates", id: 1 },
            { label: "Room + package", id: 2 },
            { label: "Extras", id: 3 },
            { label: "Guest + payment", id: 4 },
          ].map((s) => (
            <div key={s.id} className={`rounded-full px-4 py-2 ${step >= (s.id as Step) ? "bg-cyan-300 text-slate-950" : "bg-white/10 text-slate-300"}`}>
              {s.id}. {s.label}
            </div>
          ))}
        </div>

        {step === 1 ? (
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <label className="space-y-2 text-sm text-slate-300">
              Check-in
              <input type="date" value={dates.startDate} onChange={(e) => setDates((v) => ({ ...v, startDate: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              Check-out
              <input type="date" value={dates.endDate} onChange={(e) => setDates((v) => ({ ...v, endDate: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              Guests
              <input type="number" min={1} value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
            </label>
            <div className="md:col-span-3 flex flex-wrap items-center justify-between gap-3 pt-2">
              <Link to="/destinations" className="text-sm text-slate-300 hover:text-white">Browse destinations</Link>
              <button type="button" onClick={() => runSearch()} className="rounded-full bg-cyan-300 px-6 py-3 font-medium text-slate-950 transition hover:bg-cyan-200">
                Search availability
              </button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-8 space-y-5">
            {!results.length ? (
              <EmptyState title="No availability found" description="Try different dates, reduce filters, or browse destinations to pick another resort." actionLabel="Back to dates" actionHref="#" />
            ) : (
              <div className="grid gap-4">
                {results.slice(0, 30).map((item) => {
                  const due = item.payment_mode === "deposit"
                    ? (item.deposit_amount ?? 0) + item.guest_certificate_fee
                    : item.public_price + item.guest_certificate_fee;
                  return (
                    <button
                      key={`${item.package_id}-${item.room_type_id}`}
                      type="button"
                      onClick={() => {
                        setSelected(item);
                        setStep(3);
                      }}
                      className="text-left rounded-3xl border border-white/10 bg-slate-950/40 p-5 hover:bg-slate-950/55"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="text-xs tracking-[0.24em] text-white/50">{item.region}</div>
                          <div className="mt-1 text-xl font-semibold">{item.resort_name}</div>
                          <div className="mt-1 text-sm text-slate-300">
                            {item.room_type_name} · sleeps {item.max_occupancy} · {item.package_name}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Due now</div>
                          <div className="mt-1 text-lg font-semibold">{formatCurrency(due)}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
                <div className="flex items-center justify-between pt-2">
                  <button type="button" onClick={() => setStep(1)} className="text-sm text-slate-300 hover:text-white">Back</button>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-8 space-y-5">
            {!selected ? (
              <EmptyState title="Select an option" description="Pick a room + package to continue." actionLabel="Back" actionHref="#" />
            ) : (
              <>
                <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-5">
                  <div className="text-xs tracking-[0.24em] text-white/50">SELECTED</div>
                  <div className="mt-2 text-2xl font-semibold">{selected.resort_name}</div>
                  <div className="mt-2 text-sm text-slate-300">{selected.room_type_name} · {selected.package_name}</div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <div className="text-sm uppercase tracking-[0.35em] text-cyan-200">Car Rental</div>
                    <p className="mt-3 text-sm text-slate-300">
                      Add transport to your booking. Orlando-supported resorts can request Tesla delivery options. Add-ons are collected now and confirmed by the team after payment.
                    </p>
                    <div className="mt-5 space-y-3">
                      <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200">
                        <span>No car</span>
                        <input
                          type="radio"
                          name="car"
                          checked={selectedCarId == null}
                          onChange={() => setSelectedCarId(null)}
                          className="size-4 accent-cyan-300"
                        />
                      </label>
                      {cars
                        .filter((c) => c.category === "Economy")
                        .map((car) => (
                          <label key={car.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200">
                            <span>{car.name}</span>
                            <input
                              type="radio"
                              name="car"
                              checked={selectedCarId === car.id}
                              onChange={() => setSelectedCarId(car.id)}
                              className="size-4 accent-cyan-300"
                            />
                          </label>
                        ))}
                      {cars
                        .filter((c) => c.category !== "Economy")
                        .map((car) => (
                          <label
                            key={car.id}
                            className={`flex items-center justify-between gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm ${
                              isOrlandoSupported ? "bg-slate-950/40 text-slate-200" : "bg-slate-950/20 text-slate-500"
                            }`}
                          >
                            <span>{car.name}</span>
                            <input
                              type="radio"
                              name="car"
                              checked={selectedCarId === car.id}
                              onChange={() => setSelectedCarId(car.id)}
                              disabled={!isOrlandoSupported}
                              className="size-4 accent-cyan-300 disabled:opacity-50"
                            />
                          </label>
                        ))}
                      {!isOrlandoSupported ? (
                        <div className="rounded-2xl border border-white/10 bg-slate-950/20 px-4 py-3 text-xs text-slate-400">
                          Tesla delivery is Orlando-only in v1.
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <div className="text-sm uppercase tracking-[0.35em] text-cyan-200">Concierge</div>
                    <p className="mt-3 text-sm text-slate-300">
                      Orlando-only concierge services can be added to your booking request. A team member confirms scope and scheduling after payment.
                    </p>
                    <div className="mt-5 space-y-3">
                      <label className="block text-sm text-slate-300">
                        Service
                        <select
                          value={selectedConciergeId ?? ""}
                          onChange={(e) => setSelectedConciergeId(e.target.value ? e.target.value : null)}
                          disabled={!isOrlandoSupported}
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none disabled:opacity-50"
                        >
                          <option value="">No concierge</option>
                          {conciergeServices.map((service) => (
                            <option key={service.id} value={service.id}>
                              {service.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      {!isOrlandoSupported ? (
                        <div className="rounded-2xl border border-white/10 bg-slate-950/20 px-4 py-3 text-xs text-slate-400">
                          Concierge is currently available only for Orlando/Kissimmee stays.
                        </div>
                      ) : null}
                      <Link to="/concierge-orlando" className="text-sm text-cyan-200 hover:text-cyan-100">
                        Need full Orlando handling? Submit concierge details →
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button type="button" onClick={() => setStep(2)} className="text-sm text-slate-300 hover:text-white">Back</button>
                  <button type="button" onClick={() => setStep(4)} className="rounded-full bg-cyan-300 px-6 py-3 font-medium text-slate-950 transition hover:bg-cyan-200">
                    Continue
                  </button>
                </div>
              </>
            )}
          </div>
        ) : null}

        {step === 4 ? (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <form className="space-y-5" onSubmit={handleCheckout}>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-300">
                  Guest name
                  <input required value={form.guest_name} onChange={(e) => setForm((s) => ({ ...s, guest_name: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
                </label>
                <label className="space-y-2 text-sm text-slate-300">
                  Phone
                  <input required value={form.guest_phone} onChange={(e) => setForm((s) => ({ ...s, guest_phone: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
                </label>
              </div>
              <label className="block space-y-2 text-sm text-slate-300">
                Email
                <input required type="email" value={form.guest_email} onChange={(e) => setForm((s) => ({ ...s, guest_email: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
              </label>
              <label className="block space-y-2 text-sm text-slate-300">
                Date of birth
                <input required type="date" value={form.guest_dob} onChange={(e) => setForm((s) => ({ ...s, guest_dob: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
              </label>
              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
                <input
                  required
                  type="checkbox"
                  checked={form.compliance_acknowledged}
                  onChange={(e) => setForm((s) => ({ ...s, compliance_acknowledged: e.target.checked }))}
                  className="mt-1 size-4 accent-cyan-300"
                />
                <span>I agree to present a valid photo ID and a major credit card matching my name for a security deposit upon check-in at the resort.</span>
              </label>

              <div className="flex items-center justify-between gap-4 pt-2">
                <button type="button" onClick={() => setStep(3)} className="text-sm text-slate-300 hover:text-white">Back</button>
                <button type="submit" disabled={!selected || loading} className="rounded-full bg-cyan-300 px-6 py-3 font-medium text-slate-950 transition hover:bg-cyan-200 disabled:opacity-60">
                  {loading ? "Creating payment" : "Confirm & pay"}
                </button>
              </div>
            </form>

            <aside className="space-y-6 rounded-[1.75rem] border border-white/10 bg-slate-950/50 p-6">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Review</p>
                <h2 className="mt-3 text-2xl font-semibold">Due now</h2>
              </div>
              {selected ? (
                <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span>Resort</span>
                    <span className="text-right">{selected.resort_name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span>Room</span>
                    <span>{selected.room_type_name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span>Package</span>
                    <span className="text-right">{selected.package_name}</span>
                  </div>
                  <div className="border-t border-white/10 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Due now</span>
                      <span className="text-2xl font-semibold">{formatCurrency(dueNow)}</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-400">
                      Payment confirmation is issued only after Stripe webhook verification.
                    </p>
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        ) : null}
      </section>
    </div>
  );
}
