import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import LoadingState from "../../components/state/LoadingState";
import ErrorState from "../../components/state/ErrorState";
import { adminListResorts, adminMe } from "../../lib/api-client";
import type { Resort } from "../../types";

export default function AdminResortsPage() {
  const [auth, setAuth] = useState<null | boolean>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resorts, setResorts] = useState<Resort[]>([]);

  useEffect(() => {
    let mounted = true;
    Promise.all([adminMe(), adminListResorts()])
      .then(([me, rows]) => {
        if (!mounted) return;
        setAuth(me.authenticated);
        setResorts(rows);
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
  if (loading || auth == null) return <LoadingState title="Loading resorts" description="Pulling the resorts catalog." />;
  if (error) return <ErrorState title="Unable to load resorts" message={error} />;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Admin · Resorts</p>
        <h1 className="text-4xl font-semibold">Resorts</h1>
        <p className="text-slate-300">Publish a resort to show it on /destinations. Editing UI is coming next.</p>
        <div className="flex gap-3">
          <Link to="/admin" className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white/90 hover:bg-white/10">
            Back
          </Link>
          <Link to="/destinations" className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-medium text-slate-950 hover:bg-cyan-200">
            View public
          </Link>
        </div>
      </header>

      <div className="space-y-3 rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
        {resorts.map((r) => (
          <div key={r.id} className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-lg font-semibold">{r.name}</div>
              <div className="text-xs text-slate-400">{r.is_published ? "Published" : "Hidden"}</div>
            </div>
            <div className="text-sm text-slate-300">{r.slug}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

