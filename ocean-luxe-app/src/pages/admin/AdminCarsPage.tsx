import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import LoadingState from "../../components/state/LoadingState";
import ErrorState from "../../components/state/ErrorState";
import { adminListCars, adminMe } from "../../lib/api-client";
import type { CarType } from "../../types";

export default function AdminCarsPage() {
  const [auth, setAuth] = useState<null | boolean>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cars, setCars] = useState<CarType[]>([]);

  useEffect(() => {
    let mounted = true;
    Promise.all([adminMe(), adminListCars()])
      .then(([me, rows]) => {
        if (!mounted) return;
        setAuth(me.authenticated);
        setCars(rows);
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
  if (loading || auth == null) return <LoadingState title="Loading cars" description="Pulling the car catalog." />;
  if (error) return <ErrorState title="Unable to load cars" message={error} />;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Admin · Cars</p>
        <h1 className="text-4xl font-semibold">Car types</h1>
        <p className="text-slate-300">Tesla delivery is Orlando-only in v1. Editing UI is coming next.</p>
        <Link to="/admin" className="inline-flex rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white/90 hover:bg-white/10">
          Back
        </Link>
      </header>

      <div className="space-y-3 rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
        {cars.map((c) => (
          <div key={c.id} className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-lg font-semibold">{c.name}</div>
              <div className="text-xs text-slate-400">{c.is_active ? "Active" : "Inactive"}</div>
            </div>
            <div className="text-sm text-slate-300">{c.category} · {c.slug}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

