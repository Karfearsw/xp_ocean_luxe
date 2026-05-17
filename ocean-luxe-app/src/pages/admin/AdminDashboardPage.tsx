import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import LoadingState from "../../components/state/LoadingState";
import ErrorState from "../../components/state/ErrorState";
import { adminListCars, adminListConcierge, adminListResorts, adminMe } from "../../lib/api-client";
import type { CarType, ConciergeService, Resort } from "../../types";

export default function AdminDashboardPage() {
  const [auth, setAuth] = useState<null | boolean>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resorts, setResorts] = useState<Resort[]>([]);
  const [cars, setCars] = useState<CarType[]>([]);
  const [concierge, setConcierge] = useState<ConciergeService[]>([]);

  useEffect(() => {
    let mounted = true;
    Promise.all([adminMe(), adminListResorts(), adminListCars(), adminListConcierge()])
      .then(([me, resortsData, carsData, conciergeData]) => {
        if (!mounted) return;
        setAuth(me.authenticated);
        setResorts(resortsData);
        setCars(carsData);
        setConcierge(conciergeData);
      })
      .catch((reason: Error) => {
        if (!mounted) return;
        setError(reason.message);
        setAuth(false);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (auth === false) return <Navigate to="/admin/login" replace />;
  if (loading || auth == null) return <LoadingState title="Loading admin dashboard" description="Validating session and pulling catalog." />;
  if (error) return <ErrorState title="Admin dashboard error" message={error} />;

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Admin</p>
        <h1 className="text-4xl font-semibold md:text-5xl">Catalog & bookings</h1>
        <p className="max-w-3xl text-slate-300">
          Use this dashboard to publish resorts, manage room types, pricing, cars, and Orlando concierge bundles.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
          <div className="text-xs tracking-[0.24em] text-white/50">RESORTS</div>
          <div className="mt-2 text-3xl font-semibold">{resorts.length}</div>
          <p className="mt-2 text-sm text-slate-300">Publish a resort to make it visible on /destinations.</p>
          <Link to="/admin/resorts" className="mt-5 inline-flex rounded-full bg-cyan-300 px-5 py-3 text-sm font-medium text-slate-950 hover:bg-cyan-200">
            Manage resorts
          </Link>
        </div>
        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
          <div className="text-xs tracking-[0.24em] text-white/50">CARS</div>
          <div className="mt-2 text-3xl font-semibold">{cars.length}</div>
          <p className="mt-2 text-sm text-slate-300">Tesla delivery is Orlando-only in v1.</p>
          <Link to="/admin/cars" className="mt-5 inline-flex rounded-full bg-cyan-300 px-5 py-3 text-sm font-medium text-slate-950 hover:bg-cyan-200">
            Manage cars
          </Link>
        </div>
        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
          <div className="text-xs tracking-[0.24em] text-white/50">CONCIERGE</div>
          <div className="mt-2 text-3xl font-semibold">{concierge.length}</div>
          <p className="mt-2 text-sm text-slate-300">Configure airport meet & greet, pre-stock, and planning.</p>
          <Link to="/admin/concierge" className="mt-5 inline-flex rounded-full bg-cyan-300 px-5 py-3 text-sm font-medium text-slate-950 hover:bg-cyan-200">
            Manage concierge
          </Link>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/40 p-6 md:p-8">
        <div className="text-xs tracking-[0.24em] text-white/50">NEXT</div>
        <div className="mt-2 text-2xl font-semibold">Bookings management</div>
        <p className="mt-3 text-sm text-slate-300">
          Booking list/detail pages are available via API now. Next iteration wires an admin UI for bookings, provider confirmation numbers, and itinerary emails.
        </p>
      </div>
    </div>
  );
}

