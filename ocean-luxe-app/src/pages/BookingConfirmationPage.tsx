import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchBookingSummary, type BookingSummaryResponse } from "../lib/api-client";
import { formatCurrency, formatDateRange } from "../lib/formatters";

export default function BookingConfirmationPage() {
  const { bookingReference = "pending" } = useParams();
  const [summary, setSummary] = useState<BookingSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    fetchBookingSummary(bookingReference)
      .then((data) => {
        if (!mounted) return;
        setSummary(data);
      })
      .catch((reason) => {
        if (!mounted) return;
        setSummary(null);
        setError(reason instanceof Error ? reason.message : "Unable to load booking summary.");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [bookingReference]);

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/10 md:p-12">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Reservation received</p>
        <h1 className="mt-4 text-4xl font-semibold">Your booking is now in the Ocean Luxe workflow.</h1>
        <p className="mt-4 text-slate-300">
          Reference <span className="font-semibold text-white">{bookingReference}</span>. A confirmation email is sent after payment verification and booking finalization complete.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/destinations" className="rounded-full bg-cyan-300 px-6 py-3 font-medium text-slate-950 transition hover:bg-cyan-200">
            Browse destinations
          </Link>
          <Link to="/book" className="rounded-full border border-white/15 px-6 py-3 font-medium text-white transition hover:bg-white/8">
            Book another trip
          </Link>
          <Link to="/policies" className="rounded-full border border-white/15 px-6 py-3 font-medium text-white transition hover:bg-white/8">
            Review booking terms
          </Link>
        </div>
      </section>

      <aside className="space-y-6 rounded-[2rem] border border-white/10 bg-slate-950/50 p-8 md:p-10">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Summary</p>
          <h2 className="mt-3 text-2xl font-semibold">What happens next</h2>
          <p className="mt-3 text-sm text-slate-300">
            Ocean Luxe verifies payment, locks inventory, and confirms any add-ons. You’ll receive a final confirmation when processing completes.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
            Loading booking details…
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-amber-300/30 bg-amber-400/10 p-5 text-sm text-amber-100">
            {error}
          </div>
        ) : null}

        {summary ? (
          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>Resort</span>
              <span className="text-right text-white">{summary.booking.resort_name ?? "Pending assignment"}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>Dates</span>
              <span className="text-right text-white">
                {formatDateRange(summary.booking.check_in_date, summary.booking.check_out_date)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>Nights</span>
              <span className="text-white">{summary.booking.nights}</span>
            </div>
            {summary.booking.car_name ? (
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Car add-on</span>
                <span className="text-right text-white">{summary.booking.car_name}</span>
              </div>
            ) : null}
            {summary.concierge_services.length ? (
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Concierge add-ons</span>
                  <span className="text-white">{summary.concierge_services.length}</span>
                </div>
                <div className="space-y-1 text-xs text-slate-400">
                  {summary.concierge_services.map((service) => (
                    <div key={service.concierge_service_id} className="flex items-center justify-between">
                      <span>{service.service_name}</span>
                      <span>{formatCurrency(Number(service.base_fee) || 0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="border-t border-white/10 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Due now</span>
                <span className="text-2xl font-semibold text-white">{formatCurrency(Number(summary.booking.due_now) || 0)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-slate-300">
                <span>Total trip</span>
                <span className="text-right text-white">{formatCurrency(Number(summary.booking.total_price) || 0)}</span>
              </div>
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
          <h3 className="text-lg font-semibold">Create your account</h3>
          <p className="mt-2 text-sm text-slate-300">
            Save your booking history, manage add-ons, and get faster checkout next time.
          </p>
          <Link
            to={`/account/login?booking=${encodeURIComponent(bookingReference)}`}
            className="mt-4 inline-flex rounded-full bg-amber-300 px-6 py-3 font-medium text-slate-950 transition hover:bg-amber-200"
          >
            Access my bookings
          </Link>
        </div>
      </aside>
    </div>
  );
}
