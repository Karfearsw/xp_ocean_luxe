import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import EmptyState from "../components/state/EmptyState";
import ErrorState from "../components/state/ErrorState";
import LoadingState from "../components/state/LoadingState";
import { createBookingDraft, createPaymentIntent, fetchResortBySlug } from "../lib/api-client";
import { formatCurrency, nightsBetween } from "../lib/formatters";
import type { Resort, ResortPackage } from "../types";

const initialForm = {
  guest_name: "",
  guest_email: "",
  guest_phone: "",
  guest_dob: "",
  compliance_acknowledged: false,
  check_in_date: "",
  check_out_date: "",
};

export default function BookingFlowPage() {
  const { resortSlug = "", packageId = "" } = useParams();
  const navigate = useNavigate();
  const [resort, setResort] = useState<Resort | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<ResortPackage | null>(null);
  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchResortBySlug(resortSlug)
      .then((data) => {
        if (!isMounted) return;
        setResort(data.resort);
        setSelectedPackage(data.packages.find((entry) => entry.id === packageId) ?? null);
      })
      .catch((reason: Error) => {
        if (!isMounted) return;
        setError(reason.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [packageId, resortSlug]);

  const nights = useMemo(() => {
    if (!form.check_in_date || !form.check_out_date) return selectedPackage?.nights ?? 1;
    return nightsBetween(form.check_in_date, form.check_out_date);
  }, [form.check_in_date, form.check_out_date, selectedPackage?.nights]);

  const amountDueNow = selectedPackage?.payment_mode === "deposit"
    ? selectedPackage.deposit_amount ?? 0
    : selectedPackage?.public_price ?? 0;
  const guestAge = form.guest_dob
    ? Math.floor((Date.now() - Date.parse(form.guest_dob)) / (365.25 * 24 * 60 * 60 * 1000))
    : null;
  const isUnder21 = guestAge != null && guestAge < 21;
  const canSubmit = !submitting && !isUnder21 && form.compliance_acknowledged;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resort || !selectedPackage) return;
    setSubmitting(true);
    setError(null);

    try {
      const booking = await createBookingDraft({
        resort_id: resort.id,
        package_id: selectedPackage.id,
        concierge_service_ids: [],
        guest_name: form.guest_name,
        guest_email: form.guest_email,
        guest_phone: form.guest_phone,
        guest_dob: form.guest_dob,
        compliance_acknowledged: form.compliance_acknowledged,
        check_in_date: form.check_in_date,
        check_out_date: form.check_out_date,
        nights,
      });

      const intent = await createPaymentIntent(booking.id);
      setPaymentMessage(`Payment intent created for ${formatCurrency(intent.amount)}. Complete the secure payment integration by mounting Stripe Elements with the returned client secret.`);
      navigate(`/booking/confirmed/${booking.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to start the booking.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState title="Preparing your booking flow" description="Checking package details and active inventory." />;
  if (error && !resort) return <ErrorState message={error} />;
  if (!resort || !selectedPackage) {
    return <EmptyState title="Package not found" description="This stay is no longer available for online booking." actionLabel="Browse resorts" actionHref="/resorts" />;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Secure your dates</p>
        <h1 className="mt-3 text-3xl font-semibold md:text-4xl">{selectedPackage.package_name}</h1>
        <p className="mt-3 max-w-2xl text-slate-300">Guest checkout keeps the flow simple while Ocean Luxe verifies pricing, inventory, and payment before final confirmation.</p>

        <div className="mt-8 flex gap-3 text-sm">
          {["Dates", "Guest details", "Review & payment"].map((label, index) => (
            <div key={label} className={`rounded-full px-4 py-2 ${step >= index + 1 ? "bg-cyan-300 text-slate-950" : "bg-white/10 text-slate-300"}`}>
              {index + 1}. {label}
            </div>
          ))}
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-300">
              Check-in date
              <input required type="date" value={form.check_in_date} onChange={(event) => { setForm((current) => ({ ...current, check_in_date: event.target.value })); setStep(Math.max(step, 1)); }} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              Check-out date
              <input required type="date" value={form.check_out_date} onChange={(event) => { setForm((current) => ({ ...current, check_out_date: event.target.value })); setStep(Math.max(step, 1)); }} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
            </label>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-300">
              Guest name
              <input required value={form.guest_name} onChange={(event) => { setForm((current) => ({ ...current, guest_name: event.target.value })); setStep(Math.max(step, 2)); }} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              Phone
              <input required value={form.guest_phone} onChange={(event) => { setForm((current) => ({ ...current, guest_phone: event.target.value })); setStep(Math.max(step, 2)); }} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
            </label>
          </div>
          <label className="block space-y-2 text-sm text-slate-300">
            Email
            <input required type="email" value={form.guest_email} onChange={(event) => { setForm((current) => ({ ...current, guest_email: event.target.value })); setStep(3); }} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
          </label>
          <label className="block space-y-2 text-sm text-slate-300">
            Date of birth
            <input required type="date" value={form.guest_dob} onChange={(event) => setForm((current) => ({ ...current, guest_dob: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
          </label>
          <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
            <input
              required
              type="checkbox"
              checked={form.compliance_acknowledged}
              onChange={(event) => setForm((current) => ({ ...current, compliance_acknowledged: event.target.checked }))}
              className="mt-1 size-4 accent-cyan-300"
            />
            <span>I agree to present a valid photo ID and a major credit card matching my name for a security deposit upon check-in at the resort.</span>
          </label>
          {isUnder21 ? (
            <div className="rounded-2xl border border-amber-300/30 bg-amber-400/10 p-3 text-sm text-amber-100">
              Primary guest must be 21 or older to complete checkout.
            </div>
          ) : null}

          {paymentMessage ? <div className="rounded-2xl border border-cyan-300/30 bg-cyan-400/10 p-4 text-sm text-cyan-100">{paymentMessage}</div> : null}
          {error ? <ErrorState title="Booking draft failed" message={error} /> : null}

          <div className="flex items-center justify-between gap-4 pt-4">
            <Link to={`/resorts/${resort.slug}`} className="text-sm text-slate-300 hover:text-white">Back to resort</Link>
            <button type="submit" disabled={!canSubmit} className="rounded-full bg-cyan-300 px-6 py-3 font-medium text-slate-950 transition hover:bg-cyan-200 disabled:opacity-60">
              {submitting ? "Preparing secure payment" : "Reserve now"}
            </button>
          </div>
        </form>
      </section>

      <aside className="space-y-6 rounded-[1.75rem] border border-white/10 bg-slate-950/50 p-6">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Review</p>
          <h2 className="mt-3 text-2xl font-semibold">Transparent pricing</h2>
        </div>
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>Package</span>
            <span>{selectedPackage.package_name}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>Stay length</span>
            <span>{nights} nights</span>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>Public price</span>
            <span>{formatCurrency(selectedPackage.public_price)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>Base cost</span>
            <span>{formatCurrency(selectedPackage.base_cost)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>Guest certificate fee</span>
            <span>{formatCurrency(selectedPackage.guest_certificate_fee)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>Ocean Luxe markup</span>
            <span>{formatCurrency(selectedPackage.markup_amount)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>Payment mode</span>
            <span>{selectedPackage.payment_mode === "deposit" ? "Deposit" : "Full payment"}</span>
          </div>
          <div className="border-t border-white/10 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Due now</span>
              <span className="text-2xl font-semibold">{formatCurrency(amountDueNow)}</span>
            </div>
            <p className="mt-3 text-sm text-slate-400">Booking confirmation is issued only after Stripe webhook verification and inventory lock confirmation.</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
