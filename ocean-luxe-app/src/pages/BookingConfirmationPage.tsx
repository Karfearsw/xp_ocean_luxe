import { Link, useParams } from "react-router-dom";

export default function BookingConfirmationPage() {
  const { bookingReference = "pending" } = useParams();

  return (
    <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/10 md:p-12">
      <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">You're booked</p>
      <h1 className="mt-4 text-4xl font-semibold">Your reservation is now in the Ocean Luxe workflow.</h1>
      <p className="mt-4 text-slate-300">
        Reference <span className="font-semibold text-white">{bookingReference}</span>. A confirmation email is sent after payment verification and booking finalization complete.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/resorts" className="rounded-full bg-cyan-300 px-6 py-3 font-medium text-slate-950 transition hover:bg-cyan-200">
          Browse more resorts
        </Link>
        <Link to="/policies" className="rounded-full border border-white/15 px-6 py-3 font-medium text-white transition hover:bg-white/8">
          Review booking terms
        </Link>
      </div>
    </div>
  );
}
