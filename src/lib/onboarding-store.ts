import { create } from "zustand";

interface OnboardingFormDraft {
  repoUrl: string;
  name: string;
  description: string;
  fundingGoalXLM: string;
  tierAmountXLM: string;
  tierLabel: string;
}

interface OnboardingState {
  currentStep: number;
  formDraft: OnboardingFormDraft;
  setStep: (step: number) => void;
  updateFormDraft: (draft: Partial<OnboardingFormDraft>) => void;
  resetForm: () => void;
}

const initialFormDraft: OnboardingFormDraft = {
  repoUrl: "",
  name: "",
  description: "",
  fundingGoalXLM: "",
  tierAmountXLM: "",
  tierLabel: "",
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  currentStep: 2, // Default to Step 2 (Project details)
  formDraft: initialFormDraft,
  setStep: (step) => set({ currentStep: step }),
  updateFormDraft: (draft) =>
    set((state) => ({
      formDraft: { ...state.formDraft, ...draft },
    })),
  resetForm: () => set({ currentStep: 2, formDraft: initialFormDraft }),
}));
