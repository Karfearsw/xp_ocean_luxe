import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import LoadingState from "../components/state/LoadingState";
import ErrorState from "../components/state/ErrorState";
import EmptyState from "../components/state/EmptyState";
import { fetchResortBySlug } from "../lib/api-client";
import { formatCurrency } from "../lib/formatters";
import type { Resort, ResortPackage } from "../types";

export default function ResortDetailPage() {
  const { slug = "" } = useParams();
  const [resort, setResort] = useState<Resort | null>(null);
  const [packages, setPackages] = useState<ResortPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchResortBySlug(slug)
      .then((data) => {
        if (!isMounted) return;
        setResort(data.resort);
        setPackages(data.packages.filter((entry) => entry.active));
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
  }, [slug]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!resort) return <EmptyState title="Resort unavailable" description="This resort is not currently published for public booking." actionLabel="Browse resorts" actionHref="/resorts" />;

  return (
    <div className="space-y-10">
      <section className="grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">{resort.destination}</p>
            <h1 className="mt-3 text-4xl font-semibold md:text-5xl">{resort.name}</h1>
            <p className="mt-3 max-w-3xl text-slate-300">{resort.description}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {resort.gallery_images.map((image, index) => (
              <img key={`${image}-${index}`} src={image} alt={`${resort.name} gallery ${index + 1}`} className="h-56 w-full rounded-[1.5rem] object-cover" />
            ))}
          </div>
        </div>
        <aside className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">Stay overview</h2>
          <p className="mt-3 text-slate-300">{resort.address_line1}, {resort.city}, {resort.state} {resort.zip}</p>
          <div className="mt-6 flex flex-wrap gap-2 text-sm text-cyan-100">
            {resort.amenities.map((amenity) => (
              <span key={amenity} className="rounded-full border border-cyan-200/20 bg-cyan-400/10 px-3 py-1">{amenity}</span>
            ))}
          </div>
        </aside>
      </section>

      <section className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Packages</p>
          <h2 className="mt-3 text-3xl font-semibold">Transparent pricing and verified availability</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {packages.map((pkg) => (
            <article key={pkg.id} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold">{pkg.package_name}</h3>
                  <p className="mt-2 text-sm text-slate-300">{pkg.nights} nights · {pkg.refundable ? "Refundable" : "Final sale"}</p>
                </div>
                <span className="rounded-full border border-cyan-200/20 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-100">
                  {pkg.payment_mode === "deposit" ? `Deposit ${formatCurrency(pkg.deposit_amount ?? 0)}` : "Pay in full"}
                </span>
              </div>
              <p className="mt-4 text-slate-200">{pkg.check_in_rules}</p>
              <p className="mt-2 text-sm text-slate-400">{pkg.check_out_rules}</p>
              <div className="mt-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Public price</p>
                  <p className="mt-2 text-3xl font-semibold">{formatCurrency(pkg.public_price)}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    Base {formatCurrency(pkg.base_cost)} + certificate {formatCurrency(pkg.guest_certificate_fee)} + markup {formatCurrency(pkg.markup_amount)}
                  </p>
                </div>
                <Link to={`/book/${resort.slug}/${pkg.id}`} className="rounded-full bg-cyan-300 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-200">
                  Reserve now
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
