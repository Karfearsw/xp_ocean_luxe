import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { trustHighlights } from "../content/trust-copy";
import { fetchDestinations, type DestinationsResponse } from "../lib/api-client";
import { fromRateCopy } from "../lib/resort-pricing-copy";

export default function Home() {
  const [destinations, setDestinations] = useState<DestinationsResponse["regions"]>([]);

  useEffect(() => {
    let mounted = true;
    fetchDestinations()
      .then((data) => {
        if (!mounted) return;
        setDestinations(data.regions);
      })
      .catch(() => {
        if (!mounted) return;
        setDestinations([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const featured = useMemo(() => {
    const flattened = destinations.flatMap((block) =>
      block.resorts.map((r) => ({
        region: block.region,
        ...r,
      }))
    );
    return flattened.slice(0, 6);
  }, [destinations]);

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
            Curated Westgate resort stays + Tesla rentals + VIP concierge, booked through Ocean Luxe.
          </h1>
          <p className="max-w-2xl text-lg text-slate-300">
            Pick your destination, lock in dates, and tailor your trip with Orlando-only Tesla delivery and concierge handling. Transparent pricing, verified inventory, and a clean checkout.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/destinations" className="rounded-full bg-cyan-300 px-6 py-3 font-medium text-slate-950 transition hover:bg-cyan-200">
              Browse destinations
            </Link>
            <Link to="/book" className="rounded-full border border-white/15 px-6 py-3 font-medium text-white transition hover:bg-white/8">
              Check availability
            </Link>
            <Link to="/concierge-orlando" className="rounded-full border border-white/15 px-6 py-3 font-medium text-white transition hover:bg-white/8">
              Concierge in Orlando
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

      <section className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Featured</p>
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Destinations that book fast</h2>
            <p className="mt-3 max-w-3xl text-slate-300">
              Inventory is limited and curated. Start with these flagship options and expand the trip with add-ons when Orlando is selected.
            </p>
          </div>
          <Link to="/destinations" className="text-sm text-cyan-200 hover:text-cyan-100">
            Browse all destinations →
          </Link>
        </div>

        {featured.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {featured.map((resort) => (
              <article key={resort.id} className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5">
                {resort.hero_image_url ? (
                  <img src={resort.hero_image_url} alt={resort.name} className="h-52 w-full object-cover" />
                ) : (
                  <div className="h-52 w-full bg-slate-900/50" />
                )}
                <div className="space-y-4 p-6">
                  <div>
                    <p className="text-xs tracking-[0.28em] text-white/55">{resort.region}</p>
                    <h3 className="mt-2 text-2xl font-semibold">{resort.name}</h3>
                    <p className="mt-2 text-sm text-slate-300">
                      {resort.city}{resort.state ? `, ${resort.state}` : ""} ·{" "}
                      {(() => {
                        const copy = fromRateCopy({
                          from_rate_reference: resort.from_rate_reference ?? null,
                          from_rate_currency: resort.from_rate_currency ?? null,
                        });
                        return (
                          <span title={copy.tooltip ?? undefined}>
                            {copy.label}
                          </span>
                        );
                      })()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link to={`/resort/${resort.slug}`} className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-cyan-200">
                      View resort
                    </Link>
                    <Link to={`/book?resort=${encodeURIComponent(resort.slug)}`} className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white/90 hover:bg-white/10">
                      Check dates
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 text-slate-300">
            Featured destinations load once inventory is published.
          </div>
        )}
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          { title: "Pick resort & dates", body: "Browse destinations, select a resort, and run availability checks against verified inventory blocks." },
          { title: "Add transport + concierge", body: "Orlando stays can add Tesla delivery and concierge handling. Other markets remain stay-only for now." },
          { title: "Confirm & pay", body: "Deposit or full payment is shown clearly before checkout. Payments are verified by Stripe webhooks before confirmation." },
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
