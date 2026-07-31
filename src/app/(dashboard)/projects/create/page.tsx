"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useOnboardingStore } from "@/lib/onboarding-store";
import { projectSchema } from "@/lib/validations/project";

interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  description: string;
  htmlUrl: string;
}

export default function CreateProjectPage() {
  const { status } = useSession();
  const router = useRouter();
  const { currentStep, setStep, formDraft, updateFormDraft } = useOnboardingStore();

  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoError, setRepoError] = useState<string | null>(null);
  
  // Validation and submit states
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch repositories from server API
  useEffect(() => {
    if (status === "authenticated") {
      setLoadingRepos(true);
      setRepoError(null);
      fetch("/api/user/repos")
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Failed to fetch repositories.");
          }
          return res.json();
        })
        .then((data) => {
          setRepos(data.repos || []);
        })
        .catch((err) => {
          setRepoError(err.message);
        })
        .finally(() => {
          setLoadingRepos(false);
        });
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-2 border-outline-variant border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-xl text-center">
        <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-md border border-outline-variant">
          <span className="material-symbols-outlined text-secondary text-[32px]">lock</span>
        </div>
        <h2 className="font-headline-md text-primary font-bold mb-xs">Authentication Required</h2>
        <p className="text-secondary max-w-sm mb-lg">You must sign in with GitHub to access the maintainer onboarding portal.</p>
        <Link href="/signin">
          <button className="bg-primary text-on-primary py-md px-xl rounded-full font-bold hover:opacity-90 active:scale-95 transition-all shadow-md">
            Sign In with GitHub
          </button>
        </Link>
      </div>
    );
  }

  const handleRepoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedFullName = e.target.value;
    const selectedRepo = repos.find((r) => r.fullName === selectedFullName);
    
    if (selectedRepo) {
      updateFormDraft({
        repoUrl: selectedRepo.fullName,
        name: selectedRepo.name,
        description: selectedRepo.description.slice(0, 280),
      });
      // Clear specific field errors
      setFieldErrors((prev) => ({ ...prev, repoUrl: "", name: "", description: "" }));
    } else {
      updateFormDraft({ repoUrl: "", name: "", description: "" });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    // Zod Client Validation
    const validation = projectSchema.safeParse(formDraft);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setFieldErrors(errors);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formDraft),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || "Failed to list project. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Success, move to Step 3: Wallet Connect setup
      setStep(3);
      router.push("/wallet");
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center pt-xl px-gutter pb-xl overflow-y-auto w-full">
      {/* Step Indicator */}
      <div className="w-full max-w-[640px] mb-lg">
        <div className="flex justify-between items-end mb-sm">
          <h2 className="font-headline-md text-on-surface font-bold">Step {currentStep} of 3: Project details</h2>
          <span className="text-body-sm text-secondary font-medium">66% Complete</span>
        </div>
        <div className="h-1 w-full bg-surface-container-high rounded-full overflow-hidden flex gap-xs">
          <div className="h-full w-1/3 bg-primary rounded-full"></div>
          <div className="h-full w-1/3 bg-primary rounded-full"></div>
          <div className="h-full w-1/3 bg-surface-container-high rounded-full"></div>
        </div>
      </div>

      {/* Form Card */}
      <section className="w-full max-w-[640px] bg-white border border-outline-variant rounded-xl p-lg shadow-sm">
        
        {submitError && (
          <div className="mb-md p-md bg-error-container text-on-error-container text-body-sm rounded-lg border border-error/20 font-medium">
            {submitError}
          </div>
        )}

        <form className="flex flex-col gap-lg" onSubmit={handleFormSubmit}>
          {/* Repo Picker */}
          <div className="flex flex-col gap-sm">
            <label className="font-label-caps text-on-surface-variant uppercase tracking-wider font-semibold">Source Repository</label>
            <div className="relative">
              {loadingRepos ? (
                <div className="w-full px-md py-md bg-[#F1F0ED] rounded-lg text-secondary flex items-center gap-sm">
                  <div className="w-4 h-4 border border-outline border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading your repositories...</span>
                </div>
              ) : repoError ? (
                <div className="w-full px-md py-md bg-error-container text-on-error-container rounded-lg border border-error/15 text-body-sm font-medium">
                  {repoError}
                </div>
              ) : repos.length === 0 ? (
                <div className="w-full px-md py-md bg-surface-container-low text-on-surface-variant rounded-lg border border-outline-variant text-body-sm font-medium">
                  No public repositories found where you are owner or member.
                </div>
              ) : (
                <select
                  value={formDraft.repoUrl}
                  onChange={handleRepoChange}
                  className="w-full px-md py-md bg-[#F1F0ED] border-none rounded-lg focus:ring-1 focus:ring-primary focus:bg-white transition-all outline-none font-body-lg appearance-none cursor-pointer"
                >
                  <option value="">Select a repository you own...</option>
                  {repos.map((repo) => (
                    <option key={repo.id} value={repo.fullName}>
                      {repo.fullName}
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            {fieldErrors.repoUrl && (
              <span className="text-error text-[11px] font-medium mt-xs">{fieldErrors.repoUrl}</span>
            )}

            {/* Selected Repo Chip */}
            {formDraft.repoUrl && (
              <div className="flex items-center gap-sm mt-xs">
                <div className="inline-flex items-center gap-xs px-sm py-xs bg-surface-container-high rounded-full border border-outline-variant">
                  <span className="material-symbols-outlined text-[16px]">code</span>
                  <span className="font-mono-code text-body-sm">{formDraft.repoUrl}</span>
                </div>
                <div className="inline-flex items-center gap-xs px-sm py-xs bg-[#E8F5E9] text-[#2E7D32] rounded-full text-[11px] font-bold uppercase tracking-tighter">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  verified owner
                </div>
              </div>
            )}
          </div>

          {/* Project Name */}
          <div className="flex flex-col gap-sm">
            <label className="font-label-caps text-on-surface-variant uppercase tracking-wider font-semibold">Project Name</label>
            <input
              className="w-full px-md py-md bg-[#F1F0ED] border-none rounded-lg focus:ring-1 focus:ring-primary focus:bg-white transition-all outline-none font-body-lg"
              type="text"
              placeholder="e.g. Stellar SDK Core"
              value={formDraft.name}
              onChange={(e) => updateFormDraft({ name: e.target.value })}
            />
            {fieldErrors.name && (
              <span className="text-error text-[11px] font-medium">{fieldErrors.name}</span>
            )}
          </div>

          {/* Short Description */}
          <div className="flex flex-col gap-sm relative">
            <label className="font-label-caps text-on-surface-variant uppercase tracking-wider font-semibold">Short Description</label>
            <textarea
              className="w-full px-md py-md bg-[#F1F0ED] border-none rounded-lg focus:ring-1 focus:ring-primary focus:bg-white transition-all outline-none font-body-lg resize-none"
              placeholder="Briefly describe what your project does and why people should sponsor it..."
              rows={4}
              maxLength={280}
              value={formDraft.description}
              onChange={(e) => updateFormDraft({ description: e.target.value })}
            />
            <div className="flex justify-between mt-xs">
              {fieldErrors.description ? (
                <span className="text-error text-[11px] font-medium">{fieldErrors.description}</span>
              ) : (
                <span></span>
              )}
              <div className={`text-[11px] font-mono-code ${formDraft.description.length >= 280 ? "text-error" : "text-secondary"}`}>
                {formDraft.description.length} / 280
              </div>
            </div>
          </div>

          <div className="h-px bg-outline-variant opacity-50 my-xs"></div>

          {/* Funding Goal */}
          <div className="flex flex-col gap-sm">
            <label className="font-label-caps text-on-surface-variant uppercase tracking-wider font-semibold">Total Funding Goal</label>
            <div className="relative">
              <input
                className="w-full pl-md pr-xl py-md bg-[#F1F0ED] border-none rounded-lg focus:ring-1 focus:ring-primary focus:bg-white transition-all outline-none font-mono-code text-headline-md"
                placeholder="0.00"
                type="number"
                value={formDraft.fundingGoalXLM}
                onChange={(e) => updateFormDraft({ fundingGoalXLM: e.target.value })}
              />
              <div className="absolute right-md top-1/2 -translate-y-1/2 font-bold text-secondary-container bg-primary px-sm py-xs rounded text-[12px] pointer-events-none text-white">XLM</div>
            </div>
            {fieldErrors.fundingGoalXLM && (
              <span className="text-error text-[11px] font-medium">{fieldErrors.fundingGoalXLM}</span>
            )}
            <p className="text-body-sm text-secondary">Estimated monthly goal for infrastructure and maintenance.</p>
          </div>

          {/* Sponsorship Tiers */}
          <div className="flex flex-col gap-sm">
            <div className="flex justify-between items-center">
              <label className="font-label-caps text-on-surface-variant uppercase tracking-wider font-semibold">Sponsorship Tiers</label>
              <span className="text-[11px] text-secondary font-medium">1 tier active</span>
            </div>
            {/* Tier Card */}
            <div className="p-md bg-surface border border-outline-variant rounded-lg flex flex-col gap-md">
              <div className="flex gap-md">
                <div className="w-1/3 flex flex-col gap-xs">
                  <span className="text-[11px] font-bold text-secondary uppercase">Amount</span>
                  <div className="relative">
                    <input
                      className="w-full px-sm py-sm bg-surface-container-high border-none rounded focus:ring-1 focus:ring-primary outline-none font-mono-code"
                      type="number"
                      placeholder="0.00"
                      value={formDraft.tierAmountXLM}
                      onChange={(e) => updateFormDraft({ tierAmountXLM: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex-grow flex flex-col gap-xs">
                  <span className="text-[11px] font-bold text-secondary uppercase">Tier Label</span>
                  <input
                    className="w-full px-sm py-sm bg-surface-container-high border-none rounded focus:ring-1 focus:ring-primary outline-none text-body-sm"
                    placeholder="e.g., Coffee-sized sponsorship"
                    type="text"
                    value={formDraft.tierLabel}
                    onChange={(e) => updateFormDraft({ tierLabel: e.target.value })}
                  />
                </div>
              </div>
              {(fieldErrors.tierAmountXLM || fieldErrors.tierLabel) && (
                <div className="flex flex-col gap-xs mt-xs">
                  {fieldErrors.tierAmountXLM && (
                    <span className="text-error text-[11px] font-medium">{fieldErrors.tierAmountXLM}</span>
                  )}
                  {fieldErrors.tierLabel && (
                    <span className="text-error text-[11px] font-medium">{fieldErrors.tierLabel}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-lg border-t border-outline-variant mt-sm">
            <Link href="/" className="px-lg py-sm text-secondary hover:text-primary font-semibold transition-colors flex items-center gap-sm">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back
            </Link>
            <button
              className="px-xl py-md bg-primary text-on-primary rounded-full font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-md flex items-center justify-center"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-sm"></div>
                  <span>Listing Project...</span>
                </>
              ) : (
                <span>Continue to wallet setup</span>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Footer Meta */}
      <footer className="w-full max-w-container-max mt-xl pt-xl flex flex-col md:flex-row justify-between items-center gap-md opacity-50 border-t border-outline-variant/30 font-semibold">
        <p className="font-label-caps text-label-caps tracking-widest text-primary">© 2026 SponsorChain. Built on Stellar.</p>
        <div className="flex gap-lg">
          <a className="font-label-caps text-label-caps hover:underline" href="#">Privacy Policy</a>
          <a className="font-label-caps text-label-caps hover:underline" href="#">Terms of Service</a>
          <a className="font-label-caps text-label-caps hover:underline" href="#">Github</a>
        </div>
      </footer>
    </div>
  );
}
