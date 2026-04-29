import { ChevronRight } from "lucide-react";
import Field from "@/components/intake/Field";
import { inputCx } from "@/components/intake/constants";
import Select from "@/components/ui/Select";
import type { ConciergeIntake } from "@/hooks/useIntakeStore";

function required(value: string) {
  return value.trim().length > 0;
}

export default function ConciergeIntakeStep({
  intake,
  onPatch,
  onBack,
  onSubmit,
  onError,
}: {
  intake: ConciergeIntake;
  onPatch: (patch: Partial<ConciergeIntake>) => void;
  onBack: () => void;
  onSubmit: () => void;
  onError: (message: string | null) => void;
}) {
  function validate() {
    if (!required(intake.lodging)) return "Lodging (or status) is required.";
    if (!required(intake.diningPreferences)) return "Dining preferences are required (brief is fine).";
    return null;
  }

  return (
    <form
      className="grid gap-5 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const msg = validate();
        onError(msg);
        if (!msg) onSubmit();
      }}
    >
      <Field label="Lodging (or status)">
        <input
          value={intake.lodging}
          onChange={(e) => onPatch({ lodging: e.target.value })}
          className={inputCx}
          placeholder="e.g., Grand Floridian / Not booked yet"
        />
      </Field>
      <Field label="Flights (optional)">
        <input
          value={intake.flights}
          onChange={(e) => onPatch({ flights: e.target.value })}
          className={inputCx}
          placeholder="Arrival/departure times or flight numbers"
        />
      </Field>
      <Field label="Accessibility / mobility needs (optional)">
        <input
          value={intake.accessibility}
          onChange={(e) => onPatch({ accessibility: e.target.value })}
          className={inputCx}
          placeholder="Stroller, mobility device, etc."
        />
      </Field>
      <Field label="Celebration flags (optional)">
        <input
          value={intake.celebration}
          onChange={(e) => onPatch({ celebration: e.target.value })}
          className={inputCx}
          placeholder="Birthday, anniversary, proposal, etc."
        />
      </Field>
      <Field label="Dining preferences (brief)">
        <input
          value={intake.diningPreferences}
          onChange={(e) => onPatch({ diningPreferences: e.target.value })}
          className={inputCx}
          placeholder="Cuisine, allergies, must-have restaurants"
        />
      </Field>
      <Field label="Preferred contact channel">
        <Select
          value={intake.contactPreference}
          onChange={(value) => onPatch({ contactPreference: value as any })}
          options={[
            { value: "discord", label: "Discord" },
            { value: "sms", label: "SMS" },
            { value: "email", label: "Email" },
            { value: "whatsapp", label: "WhatsApp" },
          ]}
        />
      </Field>

      <div className="md:col-span-2 mt-2 grid gap-3">
        <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
          <input
            type="checkbox"
            checked={intake.smsConsent}
            onChange={(e) => onPatch({ smsConsent: e.target.checked })}
            className="mt-1 size-4 accent-[#D6B25A]"
          />
          <span>
            I consent to receive SMS reminders and concierge updates (optional; consent language finalized in phase 2).
          </span>
        </label>
        <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
          <input
            type="checkbox"
            checked={intake.emailConsent}
            onChange={(e) => onPatch({ emailConsent: e.target.checked })}
            className="mt-1 size-4 accent-[#D6B25A]"
          />
          <span>I consent to receive email follow-up and planning materials.</span>
        </label>
      </div>

      <div className="md:col-span-2 mt-2 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10"
        >
          Back
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full bg-[#D6B25A] px-6 py-3 text-sm font-medium text-[#07080A] transition hover:brightness-110"
        >
          Submit request <ChevronRight className="size-4" />
        </button>
      </div>
    </form>
  );
}
