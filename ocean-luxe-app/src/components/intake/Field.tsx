export default function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={["block", className].filter(Boolean).join(" ")}>
      <div className="text-xs tracking-[0.24em] text-white/50">{label}</div>
      {children}
    </label>
  );
}

