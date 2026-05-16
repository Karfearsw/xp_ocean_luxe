import { Check, ChevronRight } from "lucide-react";
import Field from "./Field";
import { inputCx, priorityOptions } from "./constants";
import Select from "../ui/Select";
import type { Lane, TripSnapshot } from "../../hooks/useIntakeStore";

function laneLabel(lane: Lane) {
  if (lane === "family") return "Affluent Families";
  if (lane === "couples") return "Couples / VIP Leisure";
  if (lane === "corporate") return "Corporate / Conventions";
  return "International";
}

function required(value: string) {
  return value.trim().length > 0;
}

export default function TripSnapshotStep({
  snapshot,
  onPatch,
  onTogglePriority,
  onContinue,
  onError,
}: {
  snapshot: TripSnapshot;
  onPatch: (patch: Partial<TripSnapshot>) => void;
  onTogglePriority: (value: string) => void;
  onContinue: () => void;
  onError: (message: string | null) => void;
}) {
  function validate() {
    if (!required(snapshot.firstName)) return "First name is required.";
    if (!required(snapshot.lastName)) return "Last name is required.";
    if (!required(snapshot.email)) return "Email is required.";
    if (!required(snapshot.travelDates)) return "Travel dates are required (approx is fine).";
    if (!required(snapshot.partySize)) return "Party size is required.";
    return null;
  }

  return (
    <form
      className="grid gap-5 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const msg = validate();
        onError(msg);
        if (!msg) onContinue();
      }}
    >
      <Field label="First name">
        <input
          value={snapshot.firstName}
          onChange={(e) => onPatch({ firstName: e.target.value })}
          className={inputCx}
          placeholder="Karfear"
        />
      </Field>
      <Field label="Last name">
        <input
          value={snapshot.lastName}
          onChange={(e) => onPatch({ lastName: e.target.value })}
          className={inputCx}
          placeholder="Lab"
        />
      </Field>
      <Field label="Email">
        <input
          value={snapshot.email}
          onChange={(e) => onPatch({ email: e.target.value })}
          className={inputCx}
          placeholder="you@example.com"
        />
      </Field>
      <Field label="Phone (optional)">
        <input
          value={snapshot.phone}
          onChange={(e) => onPatch({ phone: e.target.value })}
          className={inputCx}
          placeholder="+1 (___) ___-____"
        />
      </Field>
      <Field label="Travel dates (approx ok)">
        <input
          value={snapshot.travelDates}
          onChange={(e) => onPatch({ travelDates: e.target.value })}
          className={inputCx}
          placeholder="e.g., Jun 10–15"
        />
      </Field>
      <Field label="Party size">
        <input
          value={snapshot.partySize}
          onChange={(e) => onPatch({ partySize: e.target.value })}
          className={inputCx}
          placeholder="e.g., 2 adults + 2 kids"
        />
      </Field>

      <div className="md:col-span-2">
        <div className="text-xs tracking-[0.24em] text-white/50">LANE</div>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          {(["family", "couples", "corporate", "international"] as const).map((lane) => (
            <button
              key={lane}
              type="button"
              onClick={() => onPatch({ lane })}
              className={[
                "rounded-2xl border px-4 py-3 text-left text-sm transition",
                snapshot.lane === lane
                  ? "border-[#D6B25A]/60 bg-[#D6B25A]/10 text-white"
                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
              ].join(" ")}
            >
              <div className="font-medium">{laneLabel(lane)}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="md:col-span-2">
        <div className="text-xs tracking-[0.24em] text-white/50">TOP PRIORITIES</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {priorityOptions.map((p) => {
            const active = snapshot.priorities.includes(p);
            return (
              <button
                key={p}
                type="button"
                onClick={() => onTogglePriority(p)}
                className={[
                  "rounded-full border px-4 py-2 text-sm transition",
                  active
                    ? "border-[#D6B25A]/60 bg-[#D6B25A]/10 text-white"
                    : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
                ].join(" ")}
              >
                {active && <Check className="mr-2 inline size-4 text-[#D6B25A]" />}
                {p}
              </button>
            );
          })}
        </div>
      </div>

      <Field label="Budget band (optional)" className="md:col-span-1">
        <Select
          value={snapshot.budgetBand}
          onChange={(value) => onPatch({ budgetBand: value })}
          placeholder="Select"
          options={[
            { value: "$2k–$5k", label: "$2k–$5k" },
            { value: "$5k–$10k", label: "$5k–$10k" },
            { value: "$10k–$25k", label: "$10k–$25k" },
            { value: "$25k+", label: "$25k+" },
          ]}
        />
      </Field>
      <Field label="What would make this trip feel effortless?" className="md:col-span-1">
        <input
          value={snapshot.effortlessDefinition}
          onChange={(e) => onPatch({ effortlessDefinition: e.target.value })}
          className={inputCx}
          placeholder="Stress removed, timing handled, and one point of contact."
        />
      </Field>

      <div className="md:col-span-2 mt-2 flex items-center justify-end">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full bg-[#D6B25A] px-6 py-3 text-sm font-medium text-[#07080A] transition hover:brightness-110"
        >
          Continue <ChevronRight className="size-4" />
        </button>
      </div>
    </form>
  );
}
