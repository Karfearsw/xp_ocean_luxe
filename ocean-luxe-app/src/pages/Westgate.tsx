import { useState } from "react";
import Field from "../components/intake/Field";
import { inputCx } from "../components/intake/constants";
import Select from "../components/ui/Select";

export default function Westgate() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    months: "",
    decisionMakers: "unsure",
    consent: false,
  });

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
      <div className="text-xs tracking-[0.28em] text-white/55">VACATION OPPORTUNITIES</div>
      <h1 className="mt-4 font-[var(--font-display)] text-4xl leading-[1.05] text-white/90 md:text-5xl">
        Invitation-only, value-first.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/65">
        Ocean Luxe Estate stays premium by keeping opportunities optional and consent-based. If you want to be considered
        for select resort opportunities that may require attending a presentation, request an invitation.
      </p>

      <div className="mt-10 grid gap-8 md:grid-cols-12">
        <div className="md:col-span-7">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
            <div className="text-xs tracking-[0.24em] text-white/50">HOW IT WORKS</div>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-white/65">
              <div className="rounded-2xl border border-white/10 bg-[#07080A]/40 px-4 py-3">
                You receive planning value first (trip design, logistics, concierge support).
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#07080A]/40 px-4 py-3">
                If you request it, we confirm fit and disclose requirements clearly.
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#07080A]/40 px-4 py-3">
                If approved, we route you into an education call and track outcomes. No bait-and-switch.
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-5">
          <div className="rounded-3xl border border-white/10 bg-[#07080A]/30 p-6 md:p-8">
            <div className="text-xs tracking-[0.24em] text-white/50">REQUEST INVITATION</div>

            {submitted ? (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/70">
                Request received. In the live system this would route into a qualification workflow.
              </div>
            ) : (
              <form
                className="mt-5 grid gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!form.consent) return;
                  localStorage.setItem("oceanLuxeWestgateRequest", JSON.stringify(form));
                  setSubmitted(true);
                }}
              >
                <Field label="Name">
                  <input
                    value={form.name}
                    onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                    className={inputCx}
                    placeholder="Your name"
                  />
                </Field>
                <Field label="Email">
                  <input
                    value={form.email}
                    onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                    className={inputCx}
                    placeholder="you@example.com"
                  />
                </Field>
                <Field label="Preferred travel months">
                  <input
                    value={form.months}
                    onChange={(e) => setForm((s) => ({ ...s, months: e.target.value }))}
                    className={inputCx}
                    placeholder="e.g., May, September"
                  />
                </Field>
                <Field label="Will all decision-makers attend if required?">
                  <Select
                    value={form.decisionMakers}
                    onChange={(value) => setForm((s) => ({ ...s, decisionMakers: value }))}
                    options={[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                      { value: "unsure", label: "Unsure" },
                    ]}
                  />
                </Field>
                <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={form.consent}
                    onChange={(e) => setForm((s) => ({ ...s, consent: e.target.checked }))}
                    className="mt-1 size-4 accent-[#D6B25A]"
                  />
                  <span>I understand this is optional and may require additional disclosures in the live system.</span>
                </label>
                <button
                  type="submit"
                  disabled={!form.consent}
                  className="mt-2 inline-flex items-center justify-center rounded-full bg-[#D6B25A] px-6 py-3 text-sm font-medium text-[#07080A] transition hover:brightness-110 disabled:opacity-60"
                >
                  Request invitation
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
