import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import LoadingState from "../../components/state/LoadingState";
import ErrorState from "../../components/state/ErrorState";
import { adminGetResort, adminMe, adminUpdateResort } from "../../lib/api-client";
import type { Resort } from "../../types";

function toOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed.length) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

export default function AdminResortEditPage() {
  const { id = "" } = useParams();
  const [auth, setAuth] = useState<null | boolean>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resort, setResort] = useState<Resort | null>(null);

  const [form, setForm] = useState({
    name: "",
    property_name: "",
    destination: "",
    brand: "",
    region: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
    description_short: "",
    description_long: "",
    official_url: "",
    is_published: false,
    min_checkin_age_default: "21",
    min_checkin_age_override: "",
    from_rate_reference: "",
    from_rate_currency: "USD",
    from_rate_source: "",
    reference_notes: "",
  });

  useEffect(() => {
    let mounted = true;
    Promise.all([adminMe(), adminGetResort(id)])
      .then(([me, row]) => {
        if (!mounted) return;
        setAuth(me.authenticated);
        setResort(row);
        setForm({
          name: row.name ?? "",
          property_name: row.property_name ?? "",
          destination: row.destination ?? "",
          brand: row.brand ?? "",
          region: row.region ?? "",
          address_line1: row.address_line1 ?? "",
          address_line2: row.address_line2 ?? "",
          city: row.city ?? "",
          state: row.state ?? "",
          zip: row.zip ?? "",
          country: row.country ?? "US",
          description_short: row.description_short ?? "",
          description_long: row.description_long ?? "",
          official_url: row.official_url ?? "",
          is_published: row.is_published === true,
          min_checkin_age_default: String(row.min_checkin_age_default ?? 21),
          min_checkin_age_override: row.min_checkin_age_override != null ? String(row.min_checkin_age_override) : "",
          from_rate_reference: row.from_rate_reference != null ? String(row.from_rate_reference) : "",
          from_rate_currency: row.from_rate_currency ?? "USD",
          from_rate_source: row.from_rate_source ?? "",
          reference_notes: row.reference_notes ?? "",
        });
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
  }, [id]);

  const minAgeDefaultParsed = useMemo(() => {
    const num = Number(form.min_checkin_age_default);
    return Number.isFinite(num) && num > 0 ? num : 21;
  }, [form.min_checkin_age_default]);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!resort) return;
    setSaving(true);
    setError(null);
    try {
      const patch: Partial<Resort> & { reference_notes?: string | null } = {
        name: form.name,
        property_name: form.property_name.trim().length ? form.property_name.trim() : null,
        destination: form.destination,
        brand: form.brand,
        region: form.region,
        address_line1: form.address_line1,
        address_line2: form.address_line2.trim().length ? form.address_line2.trim() : null,
        city: form.city,
        state: form.state.trim().length ? form.state.trim() : null,
        zip: form.zip.trim().length ? form.zip.trim() : null,
        country: form.country,
        description_short: form.description_short.trim().length ? form.description_short.trim() : null,
        description_long: form.description_long.trim().length ? form.description_long.trim() : null,
        official_url: form.official_url.trim().length ? form.official_url.trim() : null,
        is_published: form.is_published,
        min_checkin_age_default: minAgeDefaultParsed,
        min_checkin_age_override: toOptionalNumber(form.min_checkin_age_override),
        from_rate_reference: toOptionalNumber(form.from_rate_reference),
        from_rate_currency: form.from_rate_currency.trim().length ? form.from_rate_currency.trim() : "USD",
        from_rate_source: form.from_rate_source.trim().length ? form.from_rate_source.trim() : null,
        reference_notes: form.reference_notes.trim().length ? form.reference_notes.trim() : null,
      };
      const saved = await adminUpdateResort(resort.id, patch);
      setResort(saved);
      setForm((current) => ({
        ...current,
        is_published: saved.is_published === true,
        min_checkin_age_default: String(saved.min_checkin_age_default ?? current.min_checkin_age_default),
        min_checkin_age_override: saved.min_checkin_age_override != null ? String(saved.min_checkin_age_override) : "",
        from_rate_reference: saved.from_rate_reference != null ? String(saved.from_rate_reference) : "",
        from_rate_currency: saved.from_rate_currency ?? current.from_rate_currency,
        from_rate_source: saved.from_rate_source ?? "",
      }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save resort.");
    } finally {
      setSaving(false);
    }
  }

  if (auth === false) return <Navigate to="/admin/login" replace />;
  if (loading || auth == null) return <LoadingState title="Loading resort" description="Preparing resort editor." />;
  if (error && !resort) return <ErrorState title="Unable to load resort" message={error} />;
  if (!resort) return <ErrorState title="Resort unavailable" message="Resort not found." />;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Admin · Resort</p>
        <h1 className="text-4xl font-semibold">{resort.name}</h1>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/resorts" className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white/90 hover:bg-white/10">
            Back
          </Link>
          <Link to={`/resort/${encodeURIComponent(resort.slug)}`} className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-medium text-slate-950 hover:bg-cyan-200">
            View public
          </Link>
        </div>
      </header>

      {error ? <ErrorState title="Save failed" message={error} /> : null}

      <form onSubmit={handleSave} className="space-y-6 rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            Listing name
            <input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            Real property name
            <input value={form.property_name} onChange={(e) => setForm((s) => ({ ...s, property_name: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <label className="space-y-2 text-sm text-slate-300">
            Destination label
            <input value={form.destination} onChange={(e) => setForm((s) => ({ ...s, destination: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            Region
            <input value={form.region} onChange={(e) => setForm((s) => ({ ...s, region: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            Brand
            <input value={form.brand} onChange={(e) => setForm((s) => ({ ...s, brand: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            Address line 1
            <input value={form.address_line1} onChange={(e) => setForm((s) => ({ ...s, address_line1: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            Address line 2
            <input value={form.address_line2} onChange={(e) => setForm((s) => ({ ...s, address_line2: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-4">
          <label className="space-y-2 text-sm text-slate-300">
            City
            <input value={form.city} onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            State
            <input value={form.state} onChange={(e) => setForm((s) => ({ ...s, state: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            Postal code
            <input value={form.zip} onChange={(e) => setForm((s) => ({ ...s, zip: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            Country
            <input value={form.country} onChange={(e) => setForm((s) => ({ ...s, country: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
          </label>
        </div>

        <label className="block space-y-2 text-sm text-slate-300">
          Short description
          <textarea value={form.description_short} onChange={(e) => setForm((s) => ({ ...s, description_short: e.target.value }))} rows={3} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
        </label>

        <label className="block space-y-2 text-sm text-slate-300">
          Long description
          <textarea value={form.description_long} onChange={(e) => setForm((s) => ({ ...s, description_long: e.target.value }))} rows={5} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
        </label>

        <label className="block space-y-2 text-sm text-slate-300">
          Official reference URL
          <input value={form.official_url} onChange={(e) => setForm((s) => ({ ...s, official_url: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
        </label>

        <div className="grid gap-5 md:grid-cols-3">
          <label className="space-y-2 text-sm text-slate-300">
            From-rate reference
            <input value={form.from_rate_reference} onChange={(e) => setForm((s) => ({ ...s, from_rate_reference: e.target.value }))} inputMode="decimal" className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            From-rate source
            <input value={form.from_rate_source} onChange={(e) => setForm((s) => ({ ...s, from_rate_source: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            Currency
            <input value={form.from_rate_currency} onChange={(e) => setForm((s) => ({ ...s, from_rate_currency: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            Default min check-in age
            <input value={form.min_checkin_age_default} onChange={(e) => setForm((s) => ({ ...s, min_checkin_age_default: e.target.value }))} inputMode="numeric" className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            Override min check-in age
            <input value={form.min_checkin_age_override} onChange={(e) => setForm((s) => ({ ...s, min_checkin_age_override: e.target.value }))} inputMode="numeric" className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
          </label>
        </div>

        <label className="block space-y-2 text-sm text-slate-300">
          Reference notes
          <textarea value={form.reference_notes} onChange={(e) => setForm((s) => ({ ...s, reference_notes: e.target.value }))} rows={3} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
        </label>

        <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
          <input type="checkbox" checked={form.is_published} onChange={(e) => setForm((s) => ({ ...s, is_published: e.target.checked }))} className="mt-1 size-4 accent-cyan-300" />
          <span>Published (shows on /destinations and public booking search)</span>
        </label>

        <div className="flex items-center justify-end gap-3">
          <button type="submit" disabled={saving} className="rounded-full bg-cyan-300 px-6 py-3 font-medium text-slate-950 transition hover:bg-cyan-200 disabled:opacity-60">
            {saving ? "Saving" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
