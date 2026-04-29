import { useState } from "react";
import Field from "@/components/intake/Field";
import { inputCx } from "@/components/intake/constants";

export default function Partners() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    business: "",
    category: "transport",
    email: "",
    phone: "",
    notes: "",
  });

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
      <div className="text-xs tracking-[0.28em] text-white/55">PARTNERS</div>
      <h1 className="mt-4 font-[var(--font-display)] text-4xl leading-[1.05] text-white/90 md:text-5xl">
        We build with operators who execute.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/65">
        Ocean Luxe Estate is a concierge operating system. Partners get qualified clients, clean communication, and
        performance-based tiers.
      </p>

      <div className="mt-10 grid gap-8 md:grid-cols-12">
        <div className="md:col-span-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
            <div className="text-xs tracking-[0.24em] text-white/50">PARTNER TIERS</div>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-white/65">
              <div className="rounded-2xl border border-white/10 bg-[#07080A]/40 px-4 py-3">
                Preferred: meets SLA + insurance + consistent execution.
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#07080A]/40 px-4 py-3">
                Elite: top reliability and premium guest handling.
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#07080A]/40 px-4 py-3">
                Certified Backup: overflow-ready, baseline compliance.
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-6">
          <div className="rounded-3xl border border-white/10 bg-[#07080A]/30 p-6 md:p-8">
            <div className="text-xs tracking-[0.24em] text-white/50">PARTNER INQUIRY</div>

            {submitted ? (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/70">
                Inquiry received. In the live system this would route into onboarding and SLA verification.
              </div>
            ) : (
              <form
                className="mt-5 grid gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  localStorage.setItem("oceanLuxePartnerInquiry", JSON.stringify(form));
                  setSubmitted(true);
                }}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Name">
                    <input
                      value={form.name}
                      onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                      className={inputCx}
                      placeholder="Your name"
                    />
                  </Field>
                  <Field label="Business">
                    <input
                      value={form.business}
                      onChange={(e) => setForm((s) => ({ ...s, business: e.target.value }))}
                      className={inputCx}
                      placeholder="Company / brand"
                    />
                  </Field>
                </div>
                <Field label="Category">
                  <select
                    value={form.category}
                    onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
                    className={inputCx}
                  >
                    <option value="transport">Transportation</option>
                    <option value="photography">Photography</option>
                    <option value="dining">Dining / reservations</option>
                    <option value="events">Celebrations / events</option>
                    <option value="yacht">Day-charter / water experiences</option>
                    <option value="villa">Villa / property manager</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Email">
                    <input
                      value={form.email}
                      onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                      className={inputCx}
                      placeholder="you@example.com"
                    />
                  </Field>
                  <Field label="Phone (optional)">
                    <input
                      value={form.phone}
                      onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                      className={inputCx}
                      placeholder="+1 (___) ___-____"
                    />
                  </Field>
                </div>
                <Field label="Notes">
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
                    className={[inputCx, "min-h-28 resize-none"].join(" ")}
                    placeholder="Service area, fleet, capacity, licensing/insurance status, etc."
                  />
                </Field>
                <button
                  type="submit"
                  className="mt-2 inline-flex items-center justify-center rounded-full bg-[#D6B25A] px-6 py-3 text-sm font-medium text-[#07080A] transition hover:brightness-110"
                >
                  Send inquiry
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

