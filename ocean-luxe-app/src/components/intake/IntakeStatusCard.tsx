import type { Lane } from "../../hooks/useIntakeStore";

function laneLabel(lane: Lane) {
  if (lane === "family") return "Affluent Families";
  if (lane === "couples") return "Couples / VIP Leisure";
  if (lane === "corporate") return "Corporate / Conventions";
  return "International";
}

export default function IntakeStatusCard({
  step,
  stepLabel,
  lane,
  prioritiesCount,
  onReset,
}: {
  step: 1 | 2 | 3;
  stepLabel: string;
  lane: Lane;
  prioritiesCount: number;
  onReset: (() => void) | null;
}) {
  return (
    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="text-xs tracking-[0.24em] text-white/50">STATUS</div>
      <div className="mt-3 flex items-center gap-2 text-sm text-white/70">
        <span className="inline-flex size-6 items-center justify-center rounded-full border border-white/15 bg-white/5 text-xs text-white/80">
          {step}
        </span>
        {stepLabel}
      </div>
      <div className="mt-5 space-y-2 text-sm text-white/60">
        <div className="flex items-center justify-between">
          <span>Lane</span>
          <span className="text-white/80">{laneLabel(lane)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Priorities</span>
          <span className="text-white/80">{prioritiesCount}</span>
        </div>
      </div>
      {step === 3 && onReset && (
        <button
          type="button"
          onClick={onReset}
          className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white/85 transition hover:bg-white/10"
        >
          Start another request
        </button>
      )}
    </div>
  );
}
