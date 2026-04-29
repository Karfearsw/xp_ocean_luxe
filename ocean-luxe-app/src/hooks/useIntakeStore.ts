import { create } from "zustand";

export type Lane = "family" | "couples" | "corporate" | "international";

export type TripSnapshot = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  travelDates: string;
  partySize: string;
  lane: Lane;
  priorities: string[];
  budgetBand: string;
  effortlessDefinition: string;
};

export type ConciergeIntake = {
  lodging: string;
  flights: string;
  accessibility: string;
  diningPreferences: string;
  celebration: string;
  contactPreference: "discord" | "sms" | "email" | "whatsapp";
  smsConsent: boolean;
  emailConsent: boolean;
};

type IntakeState = {
  step: 1 | 2 | 3;
  snapshot: TripSnapshot;
  intake: ConciergeIntake;
  setStep: (step: IntakeState["step"]) => void;
  setSnapshot: (patch: Partial<TripSnapshot>) => void;
  togglePriority: (value: string) => void;
  setIntake: (patch: Partial<ConciergeIntake>) => void;
  reset: () => void;
};

const initialSnapshot: TripSnapshot = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  travelDates: "",
  partySize: "",
  lane: "family",
  priorities: [],
  budgetBand: "",
  effortlessDefinition: "",
};

const initialIntake: ConciergeIntake = {
  lodging: "",
  flights: "",
  accessibility: "",
  diningPreferences: "",
  celebration: "",
  contactPreference: "discord",
  smsConsent: false,
  emailConsent: true,
};

export const useIntakeStore = create<IntakeState>((set) => ({
  step: 1,
  snapshot: initialSnapshot,
  intake: initialIntake,
  setStep: (step) => set({ step }),
  setSnapshot: (patch) => set((s) => ({ snapshot: { ...s.snapshot, ...patch } })),
  togglePriority: (value) =>
    set((s) => {
      const exists = s.snapshot.priorities.includes(value);
      return {
        snapshot: {
          ...s.snapshot,
          priorities: exists
            ? s.snapshot.priorities.filter((p) => p !== value)
            : [...s.snapshot.priorities, value],
        },
      };
    }),
  setIntake: (patch) => set((s) => ({ intake: { ...s.intake, ...patch } })),
  reset: () => set({ step: 1, snapshot: initialSnapshot, intake: initialIntake }),
}));

