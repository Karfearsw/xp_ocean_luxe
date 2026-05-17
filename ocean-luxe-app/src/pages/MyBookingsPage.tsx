import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { customerLogout, fetchCustomerBookings, type CustomerBookingRow } from "../lib/api-client";
import { formatCurrency, formatDateRange } from "../lib/formatters";

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<CustomerBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    fetchCustomerBookings()
      .then((data) => {
        if (!mounted) return;
        setBookings(data.bookings);
      })
      .catch((reason) => {
        if (!mounted) return;
        const status = reason && typeof reason === "object" && "status" in reason ? (reason as { status?: number }).status : null;
        if (status === 401) {
          navigate("/account/login", { replace: true });
          return;
        }
        setError(reason instanceof Error ? reason.message : "Unable to load bookings.");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [navigate]);

  async function onLogout() {
    try {
      await customerLogout();
    } finally {
      navigate("/account/login", { replace: true });
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/10 md:p-12">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">My account</p>
          <h1 className="mt-4 text-4xl font-semibold">My bookings</h1>
          <p className="mt-4 text-slate-300">Your confirmed and in-progress Ocean Luxe reservations.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/book" className="rounded-full bg-cyan-300 px-6 py-3 font-medium text-slate-950 transition hover:bg-cyan-200">
            Book again
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-full border border-white/15 px-6 py-3 font-medium text-white transition hover:bg-white/8"
          >
            Log out
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-sm text-slate-300">Loading bookings…</div>
      ) : null}

      {error ? (
        <div className="rounded-[2rem] border border-amber-300/30 bg-amber-400/10 p-8 text-sm text-amber-100">{error}</div>
      ) : null}

      {!loading && !error && bookings.length === 0 ? (
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-sm text-slate-300">
          No bookings found yet.{" "}
          <Link to="/book" className="font-semibold text-cyan-200 hover:text-cyan-100">
            Start a new booking
          </Link>
          .
        </div>
      ) : null}

      {!loading && !error && bookings.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {bookings.map((booking) => (
            <div key={booking.id} className="rounded-[2rem] border border-white/10 bg-slate-950/40 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Booking</p>
                  <p className="mt-2 text-lg font-semibold text-white">{booking.resort_name ?? "Ocean Luxe stay"}</p>
                  <p className="mt-1 text-sm text-slate-300">{booking.package_name ?? "Package pending"}</p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200">
                  {booking.booking_status}
                </div>
              </div>

              <div className="mt-5 grid gap-3 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Dates</span>
                  <span className="text-right text-white">
                    {formatDateRange(booking.check_in_date, booking.check_out_date)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total</span>
                  <span className="text-white">{formatCurrency(Number(booking.total_price) || 0)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Payment</span>
                  <span>{booking.payment_status}</span>
                </div>
              </div>

              <div className="mt-5">
                <Link
                  to={`/booking/confirmed/${encodeURIComponent(booking.id)}`}
                  className="inline-flex rounded-full border border-white/15 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/8"
                >
                  View confirmation
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

