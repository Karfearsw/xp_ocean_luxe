export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
      <div className="grid gap-12 md:grid-cols-12 md:items-end">
        <div className="md:col-span-7">
          <div className="text-xs tracking-[0.28em] text-white/55">ORLANDO • CONCIERGE OPERATING SYSTEM</div>
          <h1 className="mt-5 font-[var(--font-display)] text-4xl leading-[1.02] tracking-[-0.02em] text-[#F7F2E6] md:text-6xl">
            Effortless Orlando.
            <span className="block text-white/75">Estate-level planning, transport, and execution.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/65">
            Ocean Luxe Estate runs your trip like an operating system: itinerary engineering, reservation strategy,
            luxury transportation coordination, and concierge support before and during your stay.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="/book"
              className="inline-flex items-center justify-center rounded-full bg-[#D6B25A] px-6 py-3 text-sm font-medium text-[#07080A] transition hover:brightness-110"
            >
              Start Trip Snapshot
            </a>
            <a
              href="/packages"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white/90 transition hover:bg-white/10"
            >
              View Packages
            </a>
          </div>
        </div>

        <div className="md:col-span-5">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
            <div className="text-xs tracking-[0.24em] text-white/50">THE PROMISE</div>
            <div className="mt-4 grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-[#07080A]/40 p-4">
                <div className="text-sm font-medium text-white/90">Time back</div>
                <div className="mt-1 text-sm text-white/60">Avoid wasted vacation days with routing, timing, and pivots.</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#07080A]/40 p-4">
                <div className="text-sm font-medium text-white/90">Confidence</div>
                <div className="mt-1 text-sm text-white/60">
                  One point of contact for reservations, vendors, and transportation coordination.
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#07080A]/40 p-4">
                <div className="text-sm font-medium text-white/90">Discretion</div>
                <div className="mt-1 text-sm text-white/60">
                  Premium service standards, invitation-only opportunities, and clean execution.
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 text-xs leading-relaxed text-white/40">
            Preview scaffold: branding + funnel structure. Payments/CRM integrations are phase 2.
          </div>
        </div>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        <a
          href="/packages"
          className="group rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
        >
          <div className="text-xs tracking-[0.24em] text-white/50">FAMILIES</div>
          <div className="mt-3 font-[var(--font-display)] text-2xl text-white/90">Theme park + logistics mastery</div>
          <div className="mt-2 text-sm text-white/60">
            Trip design, dining strategy, airport transfers, large-family coordination, and in-trip support.
          </div>
          <div className="mt-5 text-sm text-[#D6B25A] transition group-hover:translate-x-0.5">View family packages →</div>
        </a>
        <a
          href="/packages"
          className="group rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
        >
          <div className="text-xs tracking-[0.24em] text-white/50">COUPLES</div>
          <div className="mt-3 font-[var(--font-display)] text-2xl text-white/90">Romance + nightlife precision</div>
          <div className="mt-2 text-sm text-white/60">
            Dining, events, photographers, celebration production, luxury transport and discreet hosting.
          </div>
          <div className="mt-5 text-sm text-[#D6B25A] transition group-hover:translate-x-0.5">View VIP leisure →</div>
        </a>
        <a
          href="/packages"
          className="group rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
        >
          <div className="text-xs tracking-[0.24em] text-white/50">CORPORATE</div>
          <div className="mt-3 font-[var(--font-display)] text-2xl text-white/90">Convention-ready execution</div>
          <div className="mt-2 text-sm text-white/60">
            Airport transfers, executive logistics, group manifests, SLAs, and recurring accounts.
          </div>
          <div className="mt-5 text-sm text-[#D6B25A] transition group-hover:translate-x-0.5">View corporate lane →</div>
        </a>
      </div>
    </div>
  );
}
