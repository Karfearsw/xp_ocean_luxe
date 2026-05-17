import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import ErrorState from "../../components/state/ErrorState";
import LoadingState from "../../components/state/LoadingState";
import { adminListConcierge, adminMe } from "../../lib/api-client";
import type { ConciergeService } from "../../types";

export default function AdminConciergePage() {
  const [auth, setAuth] = useState<null | boolean>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<ConciergeService[]>([]);

  useEffect(() => {
    let mounted = true;
    Promise.all([adminMe(), adminListConcierge()])
      .then(([me, rows]) => {
        if (!mounted) return;
        setAuth(me.authenticated);
        setServices(rows);
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
  if (loading || auth == null) return <LoadingState title="Loading concierge services" description="Pulling concierge offerings." />;
  if (error) return <ErrorState title="Unable to load concierge services" message={error} />;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Admin · Concierge</p>
        <h1 className="text-4xl font-semibold">Concierge services</h1>
        <p className="text-slate-300">These services show for Orlando-supported destinations in the booking stepper.</p>
        <Link to="/admin" className="inline-flex rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white/90 hover:bg-white/10">
          Back
        </Link>
      </header>

      <div className="space-y-3 rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
        {services.map((s) => (
          <div key={s.id} className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-lg font-semibold">{s.name}</div>
              <div className="text-xs text-slate-400">{s.is_orlando_only ? "Orlando only" : "Multi-market"}</div>
            </div>
            <div className="text-sm text-slate-300">{s.slug}</div>
            {s.description ? <div className="text-sm text-slate-400">{s.description}</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

