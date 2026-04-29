const lanes = [
  {
    title: "Affluent Families",
    label: "FAMILY LANE",
    items: [
      "Disney/Universal strategy and day-by-day routing",
      "Dining reservation plan + contingency pivots",
      "Airport transfers + large-vehicle coordination",
      "Family logistics: strollers, rest windows, kid-friendly pacing",
    ],
  },
  {
    title: "Couples / VIP Leisure",
    label: "VIP LEISURE",
    items: [
      "Luxury dining series + event access planning",
      "Celebration production (anniversary, proposal, honeymoon)",
      "Photographer coordination + curated locations",
      "Nightlife logistics + discreet transportation",
    ],
  },
  {
    title: "Corporate / Conventions",
    label: "CORPORATE",
    items: [
      "Airport transfers + executive handling",
      "Group manifests + dispatch coordination",
      "Invoicing/SLA-ready process (phase 2)",
      "On-call concierge support windows",
    ],
  },
];

export default function Packages() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
      <div className="text-xs tracking-[0.28em] text-white/55">PACKAGES</div>
      <h1 className="mt-4 font-[var(--font-display)] text-4xl leading-[1.05] text-white/90 md:text-5xl">
        Choose your lane. We run the execution.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/65">
        Ocean Luxe Estate is sold as outcomes: time back, stress removed, and premium coordination. Packages are designed
        to be customized after your consult.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {lanes.map((lane) => (
          <div key={lane.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-xs tracking-[0.24em] text-white/50">{lane.label}</div>
            <div className="mt-3 font-[var(--font-display)] text-2xl text-white/90">{lane.title}</div>
            <ul className="mt-5 space-y-3 text-sm leading-relaxed text-white/60">
              {lane.items.map((i) => (
                <li key={i} className="rounded-2xl border border-white/10 bg-[#07080A]/40 px-4 py-3">
                  {i}
                </li>
              ))}
            </ul>
            <a
              href="/book"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#D6B25A] px-5 py-3 text-sm font-medium text-[#07080A] transition hover:brightness-110"
            >
              Start Trip Snapshot
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

