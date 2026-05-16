import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import LoadingState from "../components/state/LoadingState";
import EmptyState from "../components/state/EmptyState";
import ErrorState from "../components/state/ErrorState";
import { fetchResorts } from "../lib/api-client";
import type { Resort } from "../types";

export default function ResortsPage() {
  const [resorts, setResorts] = useState<Resort[]>([]);
  const [destination, setDestination] = useState<string>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchResorts()
      .then((data) => {
        if (!isMounted) return;
        setResorts(data);
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
  }, []);

  const destinations = useMemo(() => ["All", ...Array.from(new Set(resorts.map((resort) => resort.destination)))], [resorts]);
  const filtered = destination === "All" ? resorts : resorts.filter((resort) => resort.destination === destination);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!filtered.length) {
    return <EmptyState title="No resorts are available yet" description="Inventory will appear here as soon as active destinations are published." actionLabel="Back to home" actionHref="/" />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Verified inventory</p>
          <h1 className="mt-3 text-4xl font-semibold">Public resort listing</h1>
          <p className="mt-3 max-w-2xl text-slate-300">Browse destinations, compare package structures, and move into guest checkout without waiting for manual follow-up.</p>
        </div>
        <label className="flex flex-col gap-2 text-sm text-slate-300">
          Destination
          <select
            className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
          >
            {destinations.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((resort) => (
          <article key={resort.id} className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 shadow-xl shadow-black/10">
            <img src={resort.hero_image_url ?? resort.gallery_images[0]} alt={resort.name} className="h-56 w-full object-cover" />
            <div className="space-y-4 p-6">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">{resort.destination}</p>
                <h2 className="mt-2 text-2xl font-semibold">{resort.name}</h2>
                <p className="mt-2 text-sm text-slate-300">{resort.city}, {resort.state}</p>
              </div>
              <p className="text-slate-300">{resort.description}</p>
              <div className="flex flex-wrap gap-2 text-xs text-cyan-100">
                {resort.amenities.slice(0, 4).map((amenity) => (
                  <span key={amenity} className="rounded-full border border-cyan-200/20 bg-cyan-400/10 px-3 py-1">{amenity}</span>
                ))}
              </div>
              <Link to={`/resorts/${resort.slug}`} className="inline-flex rounded-full bg-cyan-300 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-200">
                View availability
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
