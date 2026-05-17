import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import LoadingState from "../components/state/LoadingState";
import ErrorState from "../components/state/ErrorState";
import EmptyState from "../components/state/EmptyState";
import { fetchResortPublicDetail } from "../lib/api-client";
import { formatCurrency } from "../lib/formatters";
import type { ResortPublicDetailResponse } from "../lib/api-client";

export default function ResortPublicPage() {
  const { slug = "" } = useParams();
  const [data, setData] = useState<ResortPublicDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchResortPublicDetail(slug)
      .then((payload) => {
        if (!mounted) return;
        setData(payload);
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
  }, [slug]);

  const resort = data?.resort ?? null;
  const roomTypes = useMemo(() => (data?.room_types ?? []).filter((rt) => rt.is_active !== false), [data?.room_types]);
  const packages = useMemo(() => (data?.packages ?? []).filter((p) => p.active !== false), [data?.packages]);

  if (loading) return <LoadingState title="Loading resort" description="Pulling room types, packages, and verified inventory." />;
  if (error) return <ErrorState title="Unable to load resort" message={error} />;
  if (!resort) return <EmptyState title="Resort unavailable" description="This resort is not currently published for public booking." actionLabel="Browse destinations" actionHref="/destinations" />;

  return (
    <div className="space-y-10">
      <header className="grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">{resort.destination}</p>
          <h1 className="text-4xl font-semibold md:text-5xl">{resort.name}</h1>
          <p className="max-w-3xl text-slate-300">{resort.description_short ?? resort.description}</p>
          <div className="flex flex-wrap gap-3">
            <Link to={`/book?resort=${encodeURIComponent(resort.slug)}`} className="rounded-full bg-cyan-300 px-6 py-3 font-medium text-slate-950 transition hover:bg-cyan-200">
              Check dates & book
            </Link>
            <Link to="/destinations" className="rounded-full border border-white/15 px-6 py-3 font-medium text-white/90 hover:bg-white/10">
              Back to destinations
            </Link>
          </div>
        </div>
        <aside className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">At a glance</h2>
          <p className="mt-3 text-slate-300">
            {resort.city}{resort.state ? `, ${resort.state}` : ""} · {resort.region ?? "Region"}
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-cyan-100">
            {resort.has_water_park ? <span className="rounded-full border border-cyan-200/20 bg-cyan-400/10 px-3 py-1">Water park</span> : null}
            {resort.has_beach_access ? <span className="rounded-full border border-cyan-200/20 bg-cyan-400/10 px-3 py-1">Beach access</span> : null}
            {resort.is_ranch ? <span className="rounded-full border border-cyan-200/20 bg-cyan-400/10 px-3 py-1">Ranch</span> : null}
            {resort.is_orlando_concierge_supported ? <span className="rounded-full border border-cyan-200/20 bg-cyan-400/10 px-3 py-1">Orlando concierge</span> : null}
          </div>
          <p className="mt-6 text-sm text-slate-400">
            Pricing is shown clearly before payment. Some resorts may charge refundable security deposits or nightly resort fees at check-in.
          </p>
        </aside>
      </header>

      {resort.gallery_images?.length ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resort.gallery_images.slice(0, 6).map((image) => (
            <img key={image} src={image} alt={resort.name} className="h-56 w-full rounded-[1.5rem] object-cover" />
          ))}
        </section>
      ) : null}

      <section className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Room types</p>
          <h2 className="mt-3 text-3xl font-semibold">Choose the right unit size</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {roomTypes.map((rt) => (
            <article key={rt.id} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold">{rt.name}</h3>
                  <p className="mt-2 text-sm text-slate-300">Sleeps up to {rt.max_occupancy}</p>
                </div>
                <span className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-1 text-xs text-slate-300">
                  {rt.kitchen_type ?? "Kitchen details"}
                </span>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-slate-300">
                {rt.bed_config ? <div>Bed config: {rt.bed_config}</div> : null}
                {rt.bath_features ? <div>Bath: {rt.bath_features}</div> : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Packages</p>
          <h2 className="mt-3 text-3xl font-semibold">Transparent pricing and deposit options</h2>
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
              <div className="mt-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Public price</p>
                  <p className="mt-2 text-3xl font-semibold">{formatCurrency(pkg.public_price)}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    Base {formatCurrency(pkg.base_cost)} + certificate {formatCurrency(pkg.guest_certificate_fee)} + markup {formatCurrency(pkg.markup_amount)}
                  </p>
                </div>
                <Link to={`/book?resort=${encodeURIComponent(resort.slug)}&package=${encodeURIComponent(pkg.id)}`} className="rounded-full bg-cyan-300 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-200">
                  Check dates
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-white/10 bg-slate-950/40 p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Compliance</p>
        <h2 className="mt-3 text-2xl font-semibold">Guest ID & payment policy</h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300">
          Primary guest must be 21+ and will present a valid photo ID and major credit card matching their name for any security deposit at check-in.
          Ocean Luxe is an independent booking agency and not affiliated with the resort brand.
        </p>
      </section>
    </div>
  );
}

