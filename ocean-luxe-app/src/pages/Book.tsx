import { useMemo, useState } from "react";
import IntakeStatusCard from "@/components/intake/IntakeStatusCard";
import TripSnapshotStep from "@/components/intake/TripSnapshotStep";
import ConciergeIntakeStep from "@/components/intake/ConciergeIntakeStep";
import { useIntakeStore } from "@/hooks/useIntakeStore";

export default function Book() {
  const { step, setStep, snapshot, setSnapshot, togglePriority, intake, setIntake, reset } = useIntakeStore();
  const [error, setError] = useState<string | null>(null);

  const stepLabel = useMemo(() => {
    if (step === 1) return "Trip Snapshot";
    if (step === 2) return "Concierge Intake";
    return "Received";
  }, [step]);

  function submitAll() {
    const payload = {
      createdAt: new Date().toISOString(),
      snapshot,
      intake,
    };
    localStorage.setItem("oceanLuxeIntake", JSON.stringify(payload));
    setStep(3);
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
      <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <div className="text-xs tracking-[0.28em] text-white/55">BOOK</div>
          <h1 className="mt-4 font-[var(--font-display)] text-4xl leading-[1.05] text-white/90 md:text-5xl">
            {step === 3 ? "Request received." : "Start with a Trip Snapshot."}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-white/65">
            This preview flow captures enough detail to route you into the right concierge lane and prepare a consult.
          </p>
        </div>

        <IntakeStatusCard
          step={step}
          stepLabel={stepLabel}
          lane={snapshot.lane}
          prioritiesCount={snapshot.priorities.length || 0}
          onReset={step === 3 ? () => reset() : null}
        />
      </div>

      {step !== 3 && (
        <div className="mt-12 rounded-3xl border border-white/10 bg-[#07080A]/30 p-6 md:p-8">
          {error && (
            <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {step === 1 && (
            <TripSnapshotStep
              snapshot={snapshot}
              onPatch={setSnapshot}
              onTogglePriority={togglePriority}
              onContinue={() => setStep(2)}
              onError={setError}
            />
          )}

          {step === 2 && (
            <ConciergeIntakeStep
              intake={intake}
              onPatch={setIntake}
              onBack={() => setStep(1)}
              onSubmit={() => submitAll()}
              onError={setError}
            />
          )}
        </div>
      )}

      {step === 3 && (
        <div className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="text-xs tracking-[0.24em] text-white/50">NEXT</div>
          <div className="mt-4 font-[var(--font-display)] text-2xl text-white/90">Book your concierge consult.</div>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">
            In the real system this step would open a live calendar and deposit checkout. For this scaffold, the request
            is saved locally.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a
              href="/packages"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10"
            >
              Review packages
            </a>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-[#D6B25A] px-6 py-3 text-sm font-medium text-[#07080A] transition hover:brightness-110"
            >
              Return home
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
