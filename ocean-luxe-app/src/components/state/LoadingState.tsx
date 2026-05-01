interface LoadingStateProps {
  title?: string;
  description?: string;
}

export default function LoadingState({
  title = "Loading Ocean Luxe inventory",
  description = "Preparing verified resort inventory and pricing.",
}: LoadingStateProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white shadow-xl shadow-black/10">
      <div className="h-3 w-28 animate-pulse rounded-full bg-white/20" />
      <div className="mt-6 h-8 w-64 animate-pulse rounded-full bg-white/15" />
      <div className="mt-3 h-4 w-full max-w-xl animate-pulse rounded-full bg-white/10" />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-44 animate-pulse rounded-2xl bg-white/10" />
        ))}
      </div>
      <p className="mt-6 text-sm text-slate-300">{title}. {description}</p>
    </div>
  );
}
