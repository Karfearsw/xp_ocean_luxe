import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import ErrorState from "../../components/state/ErrorState";
import { adminLogin } from "../../lib/api-client";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await adminLogin(password);
      navigate("/admin");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Admin</p>
        <h1 className="mt-3 text-4xl font-semibold">Sign in</h1>
        <p className="mt-3 text-slate-300">This area is restricted to Ocean Luxe staff.</p>
      </div>

      {error ? <ErrorState title="Unable to sign in" message={error} /> : null}

      <form onSubmit={handleSubmit} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 space-y-4">
        <label className="block space-y-2 text-sm text-slate-300">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={!password || loading}
          className="w-full rounded-full bg-cyan-300 px-6 py-3 font-medium text-slate-950 transition hover:bg-cyan-200 disabled:opacity-60"
        >
          {loading ? "Signing in" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

