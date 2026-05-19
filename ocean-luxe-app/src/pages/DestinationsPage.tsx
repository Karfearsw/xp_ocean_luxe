import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import LoadingState from "../components/state/LoadingState";
import ErrorState from "../components/state/ErrorState";
import EmptyState from "../components/state/EmptyState";
import { fetchDestinations, type DestinationsResponse } from "../lib/api-client";
import { fromRateCopy } from "../lib/resort-pricing-copy";

type RegionBlock = DestinationsResponse["regions"][number];
type ResortCard = RegionBlock["resorts"][number];

function tagList(resort: ResortCard) {
  const tags: string[] = [];
  if (resort.has_water_park) tags.push("Water park");
  if (resort.has_beach_access) tags.push("Beach access");
  if (resort.is_ranch) tags.push("Ranch");
  if (resort.is_orlando_concierge_supported) tags.push("Orlando concierge");
  return tags.slice(0, 3);
}

function priceLine(resort: ResortCard) {
  const copy = fromRateCopy({
    from_rate_reference: resort.from_rate_reference ?? null,
    from_rate_currency: resort.from_rate_currency ?? null,
  });
  return (
    <span title={copy.tooltip ?? undefined}>
      {copy.label}
    </span>
  );
}

export default function DestinationsPage() {
  const [regions, setRegions] = useState<DestinationsResponse["regions"]>([]);
  const [filter, setFilter] = useState<string>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchDestinations()
      .then((data) => {
        if (!mounted) return;
        setRegions(data.regions);
      })
      .catch((reason: Error) => {
        if (!mounted) return;
        setError(reason.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const regionOptions = useMemo(() => ["All", ...regions.map((r) => r.region)], [regions]);
  const displayed = filter === "All" ? regions : regions.filter((r) => r.region === filter);

  if (loading) return <LoadingState title="Loading destinations" description="Pulling verified inventory and room types." />;
  if (error) return <ErrorState title="Unable to load destinations" message={error} />;
  if (!displayed.length) return <EmptyState title="No destinations yet" description="Inventory will appear as soon as resorts are published." actionLabel="Back home" actionHref="/" />;

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Destinations</p>
        <h1 className="text-4xl font-semibold md:text-5xl">Curated resort regions</h1>
        <p className="max-w-3xl text-slate-300">
          Book Westgate-backed resort stays, layer in Tesla rentals, and add Orlando concierge support when the destination qualifies.
        </p>
        <div className="flex flex-col gap-2 text-sm text-slate-300 sm:max-w-sm">
          Region
          <select
            className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {regionOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="space-y-12">
        {displayed.map((block) => (
          <section key={block.region} className="space-y-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs tracking-[0.28em] text-white/55">{block.region.toUpperCase()}</p>
                <h2 className="mt-2 text-2xl font-semibold md:text-3xl">{block.region}</h2>
              </div>
              <Link to={`/book?region=${encodeURIComponent(block.region)}`} className="text-sm text-cyan-200 hover:text-cyan-100">
                Check dates →
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {block.resorts.map((resort) => (
                <article key={resort.id} className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 shadow-xl shadow-black/10">
                  {resort.hero_image_url ? (
                    <img src={resort.hero_image_url} alt={resort.name} className="h-52 w-full object-cover" />
                  ) : (
                    <div className="h-52 w-full bg-slate-900/50" />
                  )}
                  <div className="space-y-4 p-6">
                    <div>
                      <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">{resort.city}{resort.state ? `, ${resort.state}` : ""}</p>
                      <h3 className="mt-2 text-2xl font-semibold">{resort.name}</h3>
                      <p className="mt-2 text-sm text-slate-300">
                        {priceLine(resort)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-cyan-100">
                      {tagList(resort).map((tag) => (
                        <span key={tag} className="rounded-full border border-cyan-200/20 bg-cyan-400/10 px-3 py-1">
                          {tag}
                        </span>
                      ))}
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
          </section>
        ))}
      </div>
    </div>
  );
}
