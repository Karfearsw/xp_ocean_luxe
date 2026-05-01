import { policySections } from "@/content/policies";

export default function PoliciesPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Policies</p>
        <h1 className="mt-3 text-4xl font-semibold">Booking terms and transparent pricing</h1>
        <p className="mt-3 max-w-2xl text-slate-300">Use this page to understand how Ocean Luxe handles payments, availability confirmation, and policy communication across every package.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {policySections.map((section) => (
          <article key={section.title} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-semibold">{section.title}</h2>
            <p className="mt-3 text-slate-300">{section.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
