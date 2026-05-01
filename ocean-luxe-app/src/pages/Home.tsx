import { Link } from "react-router-dom";
import { trustHighlights } from "@/content/trust-copy";

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="grid gap-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(103,232,249,0.22),_transparent_38%),linear-gradient(135deg,_rgba(15,23,42,1),_rgba(2,6,23,0.92))] p-8 shadow-2xl shadow-cyan-950/20 md:grid-cols-[1.2fr_0.8fr] md:p-12">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <img
              src="/xp-ocean-logo.png"
              alt="XP Ocean Luxe"
              className="h-20 w-20 rounded-full border border-amber-300/20 bg-black/40 object-cover p-1 shadow-lg shadow-amber-500/10"
            />
            <p className="text-sm uppercase tracking-[0.4em] text-amber-200">Hosted by XP Ocean Luxe</p>
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
            Secure premium resort inventory with transparent pricing and concierge-level support.
          </h1>
          <p className="max-w-2xl text-lg text-slate-300">
            Browse curated stays, view availability, and reserve with confidence. Every booking is verified, every payment is protected, and every stay is managed with Ocean Luxe care.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/resorts" className="rounded-full bg-cyan-300 px-6 py-3 font-medium text-slate-950 transition hover:bg-cyan-200">
              Book your stay
            </Link>
            <Link to="/policies" className="rounded-full border border-white/15 px-6 py-3 font-medium text-white transition hover:bg-white/8">
              Transparent pricing
            </Link>
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Why guests convert</p>
          <div className="mt-6 space-y-4">
            {trustHighlights.map((highlight) => (
              <div key={highlight} className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-slate-200">
                {highlight}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          { title: "View availability", body: "Destination-led inventory pages surface active packages and verified dates without exposing protected admin data." },
          { title: "Reserve now", body: "Guest checkout keeps the path simple while Stripe-backed payments confirm the booking after webhook verification." },
          { title: "Secure your dates", body: "Every package displays whether you pay in full or by deposit before the final review step." },
        ].map((item) => (
          <article key={item.title} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">{item.title}</h2>
            <p className="mt-3 text-slate-300">{item.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
