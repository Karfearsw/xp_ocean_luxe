import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { requestCustomerMagicLink } from "../lib/api-client";

export default function AccountLoginPage() {
  const [params] = useSearchParams();
  const booking = params.get("booking");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const redirectPath = useMemo(() => "/account/bookings", []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      await requestCustomerMagicLink(email, redirectPath);
      setStatus("sent");
    } catch (reason) {
      setStatus("error");
      setError(reason instanceof Error ? reason.message : "Unable to send sign-in link.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/10 md:p-12">
      <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Account access</p>
      <h1 className="mt-4 text-4xl font-semibold">Sign in with a magic link</h1>
      <p className="mt-4 text-slate-300">Enter the email address you used at checkout. We’ll email a secure sign-in link.</p>
      {booking ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-4 text-sm text-slate-300">
          Booking reference: <span className="font-semibold text-white">{booking}</span>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm text-slate-200">
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            placeholder="you@example.com"
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none ring-0 transition focus:border-cyan-300/60"
          />
        </label>

        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex rounded-full bg-cyan-300 px-6 py-3 font-medium text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "sending" ? "Sending…" : "Email me a sign-in link"}
        </button>
      </form>

      {status === "sent" ? (
        <div className="mt-6 rounded-2xl border border-cyan-300/30 bg-cyan-400/10 p-5 text-sm text-cyan-100">
          If an Ocean Luxe account exists for <span className="font-semibold text-white">{email}</span>, a sign-in link is on the way.
        </div>
      ) : null}

      {status === "error" && error ? (
        <div className="mt-6 rounded-2xl border border-amber-300/30 bg-amber-400/10 p-5 text-sm text-amber-100">{error}</div>
      ) : null}

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/book" className="rounded-full border border-white/15 px-6 py-3 font-medium text-white transition hover:bg-white/8">
          Book another trip
        </Link>
        <Link to="/policies" className="rounded-full border border-white/15 px-6 py-3 font-medium text-white transition hover:bg-white/8">
          Review booking terms
        </Link>
      </div>
    </div>
  );
}

