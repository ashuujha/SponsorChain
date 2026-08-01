"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { useWallet } from "@/features/wallet/use-wallet";
import { RequireWallet } from "@/features/wallet-session";
import { RepoPicker } from "@/features/projects/repo-picker";
import { Button } from "@/components/ui/button";
import {
  useCreateProject,
  PROJECT_REGISTRY_CONTRACT_ID,
} from "@/features/projects/use-create-project";
import type { FilteredRepo } from "@/app/api/listing/repos/route";

type ListStep =
  | { step: "github-connect" }
  | { step: "repo-picker" }
  | { step: "details"; repo: FilteredRepo; name: string; description: string }
  | { step: "review"; repo: FilteredRepo; name: string; description: string };

function stepNumber(s: ListStep): number {
  if (s.step === "github-connect") return 1;
  if (s.step === "repo-picker") return 2;
  if (s.step === "details") return 3;
  return 4;
}

export default function ListProjectPage() {
  const router = useRouter();
  const wallet = useWallet();
  const { data: session, status: ghStatus } = useSession();
  const { state, unsignedCall, buildReview, submit, reset } = useCreateProject();

  const [listStep, setListStep] = useState<ListStep>({ step: "github-connect" });

  const currentStep: ListStep =
    ghStatus === "unauthenticated" ? { step: "github-connect" } : listStep;

  const cur = stepNumber(currentStep);
  const progressPct = Math.round((cur / 4) * 100);

  if (state.status === "success" && state.projectId) {
    return (
      <RequireWallet>
        <div className="flex-grow flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-4">
            <span className="material-symbols-outlined text-[36px]">verified</span>
          </div>
          <h2 className="text-3xl font-extrabold text-foreground mb-2">Project Listed!</h2>
          <p className="text-text-secondary max-w-sm mb-6 text-base leading-relaxed">
            Your project has been registered on-chain. You can now view it and start receiving sponsorships.
          </p>
          <Button onClick={() => router.push(`/projects/${state.projectId}`)} size="lg">
            View Project Page
          </Button>
        </div>
      </RequireWallet>
    );
  }

  return (
    <RequireWallet>
      <div className="flex-grow flex flex-col items-center pt-6 px-4 sm:px-6 pb-16 overflow-y-auto w-full">
        <div className="w-full max-w-[640px] space-y-6">
          {/* Step indicator */}
          <StepBar current={cur} total={4} stepLabel={currentStep.step} progressPct={progressPct} />

          {currentStep.step === "github-connect" && (
            <GithubConnectStep
              ghStatus={ghStatus}
              session={session}
              onContinue={() => setListStep({ step: "repo-picker" })}
            />
          )}

          {currentStep.step === "repo-picker" && (
            <RepoPickerStep
              onSelect={(repo: FilteredRepo) =>
                setListStep({
                  step: "details",
                  repo,
                  name: repo.name,
                  description: repo.description.slice(0, 280),
                })
              }
              onBack={() => setListStep({ step: "github-connect" })}
            />
          )}

          {currentStep.step === "details" && (
            <DetailsStep
              repo={currentStep.repo}
              name={currentStep.name}
              description={currentStep.description}
              onNameChange={(name) =>
                setListStep({ ...currentStep, name } as typeof currentStep)
              }
              onDescChange={(description) =>
                setListStep({ ...currentStep, description } as typeof currentStep)
              }
              onBack={() => setListStep({ step: "repo-picker" })}
              onReview={() => {
                setListStep({
                  step: "review",
                  repo: currentStep.repo,
                  name: currentStep.name,
                  description: currentStep.description,
                });
                buildReview({
                  contractId: PROJECT_REGISTRY_CONTRACT_ID,
                  owner: wallet.publicKey || "",
                  repoFullName: currentStep.repo.fullName,
                  name: currentStep.name,
                  description: currentStep.description,
                });
              }}
            />
          )}

          {currentStep.step === "review" && (
            <ReviewStep
              repo={currentStep.repo}
              name={currentStep.name}
              description={currentStep.description}
              walletPublicKey={wallet.publicKey}
              unsignedCall={unsignedCall}
              state={state}
              onBack={() =>
                setListStep({
                  step: "details",
                  repo: currentStep.repo,
                  name: currentStep.name,
                  description: currentStep.description,
                })
              }
              onSubmit={() => {
                if (!wallet.publicKey) return;
                submit(
                  {
                    contractId: PROJECT_REGISTRY_CONTRACT_ID,
                    owner: wallet.publicKey,
                    repoFullName: currentStep.repo.fullName,
                    name: currentStep.name,
                    description: currentStep.description,
                  },
                  async () => {
                    const res = await fetch("/api/projects", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        owner: wallet.publicKey,
                        repoFullName: currentStep.repo.fullName,
                        name: currentStep.name,
                        description: currentStep.description,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      throw new Error(data.error || "Failed to create project listing.");
                    }
                    const returnedId = String(data.project?.id || data.id || "1");
                    return {
                      txHash: `db_${returnedId}`,
                      projectId: returnedId,
                    };
                  }
                );
              }}
              onReset={reset}
              onRetry={() => {
                if (!wallet.publicKey) return;
                submit(
                  {
                    contractId: PROJECT_REGISTRY_CONTRACT_ID,
                    owner: wallet.publicKey,
                    repoFullName: currentStep.repo.fullName,
                    name: currentStep.name,
                    description: currentStep.description,
                  },
                  async () => {
                    const res = await fetch("/api/projects", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        owner: wallet.publicKey,
                        repoFullName: currentStep.repo.fullName,
                        name: currentStep.name,
                        description: currentStep.description,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      throw new Error(data.error || "Failed to create project listing.");
                    }
                    const returnedId = String(data.project?.id || data.id || "1");
                    return {
                      txHash: `db_${returnedId}`,
                      projectId: returnedId,
                    };
                  }
                );
              }}
            />
          )}
        </div>
      </div>
    </RequireWallet>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function StepBar({
  current,
  total,
  stepLabel,
  progressPct,
}: {
  current: number;
  total: number;
  stepLabel: string;
  progressPct: number;
}) {
  const labels: Record<string, string> = {
    "github-connect": "Step 1: Link GitHub",
    "repo-picker": "Step 2: Pick a Repository",
    details: "Step 3: Project Details",
    review: "Step 4: Review & Submit",
  };
  return (
    <>
      <div className="flex justify-between items-end mb-2">
        <h2 className="text-xl font-extrabold text-foreground">{labels[stepLabel] ?? ""}</h2>
        <span className="text-sm font-bold text-aubergine dark:text-aubergine-mute">{progressPct}% Complete</span>
      </div>
      <div className="h-2 w-full bg-border-color/60 rounded-full overflow-hidden flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-full flex-1 rounded-full transition-all ${i < current ? "bg-aubergine" : "bg-border-color/60"}`}
          />
        ))}
      </div>
    </>
  );
}

function GithubConnectStep({
  ghStatus,
  session,
  onContinue,
}: {
  ghStatus: string;
  session: { githubUsername?: string } | null;
  onContinue: () => void;
}) {
  return (
    <div className="bg-surface dark:bg-surface border border-border-color rounded-2xl p-8 shadow-xs space-y-6">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-canvas-cream dark:bg-surface-container flex items-center justify-center border border-border-color">
          <svg className="w-8 h-8 fill-foreground" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        </div>
        <h2 className="text-2xl font-extrabold text-foreground">Link GitHub to Continue</h2>
        <p className="text-text-secondary text-sm max-w-[380px] leading-relaxed">
          We verify repository ownership via GitHub OAuth. Your connected wallet address remains your primary receiving identity.
        </p>
      </div>

      {ghStatus === "loading" ? (
        <div className="flex items-center gap-2 py-4 justify-center">
          <div className="w-5 h-5 border-2 border-border-color border-t-aubergine rounded-full animate-spin" />
          <span className="text-text-secondary text-sm">Checking GitHub session...</span>
        </div>
      ) : ghStatus === "authenticated" && session ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-canvas-cream dark:bg-surface-container rounded-2xl border border-border-color">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#24292f] flex items-center justify-center">
                <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">@{session.githubUsername}</p>
                <p className="text-text-secondary text-xs">Linked for this session</p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="text-text-secondary text-xs font-semibold hover:text-foreground underline"
            >
              Disconnect
            </button>
          </div>

          <Button onClick={onContinue} className="w-full">
            Continue to Repo Picker
          </Button>
        </div>
      ) : (
        <button
          onClick={() => signIn("github", { callbackUrl: "/list-project" })}
          className="w-full bg-[#24292f] text-white flex items-center justify-center gap-2 py-3.5 rounded-full font-bold text-base hover:bg-[#1b1f23] transition-all shadow-sm"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          Connect with GitHub
        </button>
      )}
    </div>
  );
}

function RepoPickerStep({
  onSelect,
  onBack,
}: {
  onSelect: (repo: FilteredRepo) => void;
  onBack: () => void;
}) {
  return (
    <section className="bg-surface dark:bg-surface border border-border-color rounded-2xl p-6 shadow-xs space-y-4">
      <h3 className="text-xl font-extrabold text-foreground">Your Repositories</h3>
      <p className="text-text-secondary text-sm">
        Select a public repository you own. Forks are excluded automatically.
      </p>
      <RepoPicker onSelect={onSelect} />
      <div className="pt-4 border-t border-border-color/60">
        <button
          onClick={onBack}
          className="text-text-secondary text-sm font-semibold slacc-link"
        >
          Back to GitHub setup
        </button>
      </div>
    </section>
  );
}

function DetailsStep({
  repo,
  name,
  description,
  onNameChange,
  onDescChange,
  onBack,
  onReview,
}: {
  repo: FilteredRepo;
  name: string;
  description: string;
  onNameChange: (v: string) => void;
  onDescChange: (v: string) => void;
  onBack: () => void;
  onReview: () => void;
}) {
  return (
    <section className="bg-surface dark:bg-surface border border-border-color rounded-2xl p-8 shadow-xs space-y-6">
      <div>
        <label className="font-bold text-xs uppercase tracking-widest text-text-secondary block mb-2">
          Repository
        </label>
        <div className="flex items-center gap-3 p-4 bg-canvas-cream dark:bg-surface-container rounded-2xl border border-border-color">
          <span className="material-symbols-outlined text-aubergine text-[20px]">code</span>
          <span className="font-mono text-sm font-bold text-foreground">{repo.fullName}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-bold text-xs uppercase tracking-widest text-text-secondary">
          Project Name
        </label>
        <input
          className="w-full px-4 py-3 bg-canvas-cream dark:bg-surface-container border border-border-color rounded-2xl focus:ring-2 focus:ring-aubergine outline-none text-base font-bold text-foreground"
          placeholder="e.g. Stellar SDK Core"
          value={name}
          maxLength={100}
          onChange={(e) => onNameChange(e.target.value)}
        />
        <span className="text-xs text-text-secondary text-right font-mono">{name.length}/100</span>
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-bold text-xs uppercase tracking-widest text-text-secondary">
          Short Description
        </label>
        <textarea
          className="w-full px-4 py-3 bg-canvas-cream dark:bg-surface-container border border-border-color rounded-2xl focus:ring-2 focus:ring-aubergine outline-none text-base text-foreground resize-none"
          placeholder="Briefly describe your project..."
          rows={4}
          maxLength={280}
          value={description}
          onChange={(e) => onDescChange(e.target.value)}
        />
        <span
          className={`text-xs text-right font-mono ${description.length >= 280 ? "text-rose-500 font-bold" : "text-text-secondary"}`}
        >
          {description.length}/280
        </span>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border-color/60">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-text-secondary hover:text-foreground font-semibold text-sm"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back
        </button>
        <Button
          onClick={onReview}
          disabled={!name.trim() || description.length < 10}
        >
          Review &amp; Submit
        </Button>
      </div>
    </section>
  );
}

function ReviewStep({
  repo,
  name,
  description,
  walletPublicKey,
  unsignedCall,
  state,
  onBack,
  onSubmit,
  onReset,
  onRetry,
}: {
  repo: FilteredRepo;
  name: string;
  description: string;
  walletPublicKey: string | null;
  unsignedCall: { args: Record<string, string> } | null;
  state: { status: string; txHash: string | null; errorType: string | null; errorMessage: string | null };
  onBack: () => void;
  onSubmit: () => void;
  onReset: () => void;
  onRetry: () => void;
}) {
  return (
    <div className="space-y-6">
      <section className="bg-surface dark:bg-surface border border-border-color rounded-2xl p-8 shadow-xs space-y-4">
        <h3 className="text-2xl font-extrabold text-foreground">Review Your Project Listing</h3>
        <p className="text-text-secondary text-sm">
          All future sponsorships will be sent to the owner wallet address shown below.
        </p>

        <div className="bg-canvas-cream dark:bg-surface-container rounded-2xl p-4 space-y-3 font-semibold border border-border-color">
          <FieldRow label="Repository" value={repo.fullName} mono />
          <FieldRow label="Project Name" value={name} />
          <FieldRow label="Description" value={description} right />
          <FieldRow
            label="Owner Wallet"
            value={
              walletPublicKey
                ? `${walletPublicKey.slice(0, 6)}...${walletPublicKey.slice(-6)}`
                : "Not connected"
            }
            mono
          />
          <FieldRow label="Contract" value="ProjectRegistry" mono small />
        </div>

        {unsignedCall && (
          <div className="bg-surface border border-border-color/60 rounded-xl p-4">
            <h4 className="font-bold text-xs text-text-secondary uppercase tracking-widest mb-1">
              Contract Call Args
            </h4>
            <pre className="font-mono text-xs text-foreground whitespace-pre-wrap overflow-x-auto leading-relaxed">
              {JSON.stringify(unsignedCall.args, null, 2)}
            </pre>
          </div>
        )}
      </section>

      {(state.status === "idle" || state.status === "review") && (
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-text-secondary hover:text-foreground font-semibold text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Edit Details
          </button>
          <Button onClick={onSubmit} size="lg">
            Sign &amp; Submit to Network
          </Button>
        </div>
      )}

      {state.status === "pending" && (
        <div className="bg-surface border border-border-color rounded-2xl p-10 shadow-xs flex flex-col items-center gap-4 text-center">
          <span className="animate-spin material-symbols-outlined text-[48px] text-aubergine dark:text-aubergine-mute">progress_activity</span>
          <p className="font-bold text-base text-foreground">
            {state.txHash ? "Confirming on-chain..." : "Please sign the transaction in your wallet..."}
          </p>
          {state.txHash && (
            <div className="w-full p-2.5 bg-canvas-cream dark:bg-surface-container rounded-xl font-mono text-xs truncate">
              Tx Hash: {state.txHash}
            </div>
          )}
        </div>
      )}

      {state.status === "failed" && (
        <div className="bg-surface border border-border-color rounded-2xl p-6 shadow-xs space-y-4">
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 text-sm rounded-xl border border-rose-200 dark:border-rose-900 font-medium leading-relaxed">
            {state.errorType === "insufficient_funds" && (
              <span><strong>Insufficient funds:</strong> Your wallet does not have enough XLM for the transaction fee.</span>
            )}
            {state.errorType === "user_rejected" && (
              <span><strong>Signature rejected:</strong> You declined the signature request in your wallet.</span>
            )}
            {state.errorType === "network_error" && (
              <span><strong>Network error:</strong> Failed to reach the Soroban RPC. Please check your connection.</span>
            )}
            {state.errorType === "unknown" && (
              <span><strong>Transaction failed:</strong> {state.errorMessage || "Unexpected error."}</span>
            )}
          </div>
          <div className="flex gap-4">
            <Button variant="secondary" onClick={onReset} className="flex-1">
              Cancel
            </Button>
            <Button onClick={onRetry} className="flex-1">
              Try Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldRow({
  label,
  value,
  mono,
  right,
  small,
}: {
  label: string;
  value: string;
  mono?: boolean;
  right?: boolean;
  small?: boolean;
}) {
  return (
    <div className="flex justify-between border-b border-border-color/40 pb-2">
      <span className="text-text-secondary text-sm">{label}</span>
      <span
        className={`${mono ? "font-mono" : ""} ${small ? "text-xs" : "text-sm"} font-bold text-foreground ${right ? "max-w-[280px] text-right leading-snug" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
