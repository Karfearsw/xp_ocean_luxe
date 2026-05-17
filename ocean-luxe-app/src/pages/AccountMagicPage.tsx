import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { consumeCustomerMagicLink } from "../lib/api-client";

export default function AccountMagicPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!token) {
      setError("Missing token.");
      return;
    }
    consumeCustomerMagicLink(token)
      .then((result) => {
        if (!mounted) return;
        navigate(result.redirectPath || "/account/bookings", { replace: true });
      })
      .catch((reason) => {
        if (!mounted) return;
        setError(reason instanceof Error ? reason.message : "Unable to sign in.");
      });
    return () => {
      mounted = false;
    };
  }, [navigate, token]);

  return (
    <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/10 md:p-12">
      <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Signing you in</p>
      <h1 className="mt-4 text-3xl font-semibold">Opening your bookings…</h1>
      {error ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-amber-300/30 bg-amber-400/10 p-5 text-sm text-amber-100">{error}</div>
          <Link to="/account/login" className="inline-flex rounded-full bg-cyan-300 px-6 py-3 font-medium text-slate-950 transition hover:bg-cyan-200">
            Request a new link
          </Link>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">Please wait…</div>
      )}
    </div>
  );
}

