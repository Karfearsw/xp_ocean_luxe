interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export default function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 p-8 text-center text-white">
      <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Ocean Luxe</p>
      <h2 className="mt-4 text-2xl font-semibold">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-slate-300">{description}</p>
      {actionLabel && actionHref ? (
        <a
          className="mt-6 inline-flex rounded-full bg-cyan-300 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-200"
          href={actionHref}
        >
          {actionLabel}
        </a>
      ) : null}
    </div>
  );
}
