import { Outlet, NavLink } from "react-router-dom";
import { ArrowUpRight, Crown, PhoneCall } from "lucide-react";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/packages", label: "Packages" },
  { to: "/book", label: "Book" },
  { to: "/westgate", label: "Opportunities" },
  { to: "/partners", label: "Partners" },
];

function cxNav(isActive: boolean) {
  return [
    "text-sm tracking-wide transition-colors",
    isActive ? "text-[#F3E7C6]" : "text-white/70 hover:text-white",
  ].join(" ");
}

export default function SiteLayout() {
  return (
    <div className="min-h-dvh bg-[#07080A] text-[#F5F1E7]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(900px_600px_at_20%_10%,rgba(210,175,92,0.14),transparent_60%),radial-gradient(900px_600px_at_80%_20%,rgba(197,221,255,0.08),transparent_60%),radial-gradient(1200px_700px_at_50%_100%,rgba(255,255,255,0.05),transparent_60%)]" />
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#07080A]/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4">
          <NavLink to="/" className="group inline-flex items-center gap-2">
            <span className="inline-flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/5">
              <Crown className="size-4 text-[#D6B25A]" />
            </span>
            <span className="leading-tight">
              <span className="block font-[var(--font-display)] text-sm tracking-[0.2em] text-white/85">
                OCEAN LUXE ESTATE
              </span>
              <span className="block text-[11px] tracking-wide text-white/55">Orlando Concierge + Experiences</span>
            </span>
          </NavLink>

          <nav className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => cxNav(isActive)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <NavLink
              to="/book"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/90 transition hover:bg-white/10"
            >
              <PhoneCall className="size-4 text-[#D6B25A]" />
              Book Consult
              <ArrowUpRight className="size-4 text-white/70" />
            </NavLink>
          </div>
        </div>
      </header>

      <main className="relative">
        <Outlet />
      </main>

      <footer className="relative border-t border-white/10">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:grid-cols-3">
          <div>
            <div className="font-[var(--font-display)] text-sm tracking-[0.22em] text-white/85">
              Ocean Luxe Estate
            </div>
            <div className="mt-2 text-sm leading-relaxed text-white/60">
              Luxury concierge operations for Orlando: trip design, transportation coordination, curated experiences, and
              in-trip support.
            </div>
          </div>
          <div className="text-sm text-white/60">
            <div className="text-xs tracking-[0.24em] text-white/50">MVP LINKS</div>
            <div className="mt-3 flex flex-col gap-2">
              <NavLink to="/packages" className="text-white/70 hover:text-white">
                Packages
              </NavLink>
              <NavLink to="/book" className="text-white/70 hover:text-white">
                Trip Snapshot + Intake
              </NavLink>
              <NavLink to="/westgate" className="text-white/70 hover:text-white">
                Invitation-Only Opportunities
              </NavLink>
            </div>
          </div>
          <div className="text-sm text-white/60">
            <div className="text-xs tracking-[0.24em] text-white/50">NOTES</div>
            <div className="mt-3 leading-relaxed">
              This preview is a scaffold UI. It demonstrates the structure, intake flows, and brand direction.
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-white/45">
          Powered by Karfear Lab
        </div>
      </footer>
    </div>
  );
}

