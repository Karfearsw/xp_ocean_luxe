interface ErrorStateProps {
  title?: string;
  message: string;
}

export default function ErrorState({ title = "Something interrupted the experience", message }: ErrorStateProps) {
  return (
    <div className="rounded-3xl border border-rose-400/30 bg-rose-500/10 p-8 text-white">
      <p className="text-sm uppercase tracking-[0.35em] text-rose-200">Attention needed</p>
      <h2 className="mt-4 text-2xl font-semibold">{title}</h2>
      <p className="mt-3 text-slate-200">{message}</p>
    </div>
  );
}
