import { useState } from "react";
import { Link } from "react-router-dom";

export default function ConciergeOrlandoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    airport: "MCO",
    arrivalTime: "",
    flightNumber: "",
    partySize: 2,
    vehicleCategory: "economy",
    welcomeSign: "",
    flowers: false,
    grocery: false,
    dining: false,
    parkPlanning: false,
    notes: "",
  });

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <header className="space-y-4">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Concierge · Orlando</p>
        <h1 className="text-4xl font-semibold md:text-5xl">Orlando arrivals, handled.</h1>
        <p className="max-w-3xl text-slate-300">
          Full concierge service is currently available only for Orlando/Kissimmee stays. Share your arrival details and we’ll route you into meet & greet, vehicle delivery, and VIP support options.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/destinations" className="rounded-full border border-white/15 px-6 py-3 font-medium text-white/90 hover:bg-white/10">
            Browse destinations
          </Link>
          <Link to="/book" className="rounded-full bg-cyan-300 px-6 py-3 font-medium text-slate-950 transition hover:bg-cyan-200">
            Check availability
          </Link>
        </div>
      </header>

      <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 md:p-8">
        {submitted ? (
          <div className="space-y-4">
            <div className="text-xs tracking-[0.24em] text-white/50">RECEIVED</div>
            <div className="text-2xl font-semibold">Concierge request saved.</div>
            <p className="text-sm text-slate-300">
              For this MVP scaffold the request is saved locally. Next iteration routes this into CRM tasks and dispatch workflows.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white/90 hover:bg-white/10"
              >
                Submit another
              </button>
              <Link to="/" className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-medium text-slate-950 transition hover:bg-cyan-200">
                Return home
              </Link>
            </div>
          </div>
        ) : (
          <form
            className="grid gap-5 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              localStorage.setItem("oceanLuxeConciergeOrlando", JSON.stringify({ createdAt: new Date().toISOString(), ...form }));
              setSubmitted(true);
            }}
          >
            <label className="space-y-2 text-sm text-slate-300">
              Airport
              <select
                value={form.airport}
                onChange={(e) => setForm((s) => ({ ...s, airport: e.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none"
              >
                <option value="MCO">MCO</option>
                <option value="SFB">SFB</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              Arrival time
              <input
                type="time"
                value={form.arrivalTime}
                onChange={(e) => setForm((s) => ({ ...s, arrivalTime: e.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              Flight number
              <input
                value={form.flightNumber}
                onChange={(e) => setForm((s) => ({ ...s, flightNumber: e.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none"
                placeholder="e.g., DL 1234"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              Party size
              <input
                type="number"
                min={1}
                value={form.partySize}
                onChange={(e) => setForm((s) => ({ ...s, partySize: Number(e.target.value) }))}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
              Vehicle category
              <select
                value={form.vehicleCategory}
                onChange={(e) => setForm((s) => ({ ...s, vehicleCategory: e.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none"
              >
                <option value="economy">Basic Cheap Car</option>
                <option value="tesla-self-drive">Tesla self-drive</option>
                <option value="tesla-driver">Meet & greet + private driver</option>
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
              Welcome sign text (optional)
              <input
                value={form.welcomeSign}
                onChange={(e) => setForm((s) => ({ ...s, welcomeSign: e.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none"
                placeholder="OCEAN LUXE – Guest Name"
              />
            </label>
            <div className="md:col-span-2 grid gap-3 rounded-3xl border border-white/10 bg-slate-950/40 p-5 text-sm text-slate-300">
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={form.flowers} onChange={(e) => setForm((s) => ({ ...s, flowers: e.target.checked }))} className="size-4 accent-cyan-300" />
                Flowers / welcome touch
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={form.grocery} onChange={(e) => setForm((s) => ({ ...s, grocery: e.target.checked }))} className="size-4 accent-cyan-300" />
                Grocery pre-stock
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={form.dining} onChange={(e) => setForm((s) => ({ ...s, dining: e.target.checked }))} className="size-4 accent-cyan-300" />
                Dining reservations
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={form.parkPlanning} onChange={(e) => setForm((s) => ({ ...s, parkPlanning: e.target.checked }))} className="size-4 accent-cyan-300" />
                Park planning session
              </label>
            </div>
            <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
              Notes (optional)
              <textarea
                value={form.notes}
                onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
                className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none"
                placeholder="Special occasion, accessibility needs, preferences…"
              />
            </label>
            <div className="md:col-span-2 flex items-center justify-between gap-4 pt-2">
              <p className="text-xs text-slate-400">
                Orlando concierge services are subject to confirmation and availability. Tesla delivery is Orlando-only in v1.
              </p>
              <button type="submit" className="rounded-full bg-cyan-300 px-6 py-3 font-medium text-slate-950 transition hover:bg-cyan-200">
                Submit request
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
