import { Link, NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/destinations", label: "Destinations" },
  { to: "/book", label: "Book" },
  { to: "/concierge-orlando", label: "Concierge" },
  { to: "/account/bookings", label: "My bookings" },
  { to: "/policies", label: "Policies" },
];

export default function SiteLayout() {
  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#07111f]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/xp-ocean-logo.png"
              alt="XP Ocean Luxe"
              className="h-14 w-14 rounded-full border border-amber-300/20 bg-black/40 object-cover p-1 shadow-lg shadow-amber-500/10"
            />
            <div className="hidden sm:block">
              <p className="text-lg font-semibold tracking-[0.28em] text-amber-200">XP OCEAN LUXE</p>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Orlando Concierge + Experiences</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-3 text-sm text-slate-200 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 transition ${isActive ? "bg-white/12 text-white" : "hover:bg-white/8"}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <Link
            to="/book"
            className="rounded-full bg-amber-300 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-amber-200"
          >
            Check availability
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8 md:py-12">
        <Outlet />
      </main>
    </div>
  );
}
