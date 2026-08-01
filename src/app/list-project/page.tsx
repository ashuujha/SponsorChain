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
        <div className="flex-grow flex flex-col items-center justify-center p-6 sm:p-8 text-center min-h-[60vh] bg-background text-foreground transition-colors overflow-x-hidden">
          <div className="w-12 h-12 border border-foreground rounded-full flex items-center justify-center mx-auto text-foreground mb-6">
            <span className="material-symbols-outlined text-[24px]">done</span>
          </div>
          <h2 className="display-md text-foreground mb-2">Project Listed!</h2>
          <p className="body-serif text-muted max-w-sm mb-8 text-sm sm:text-base">
            Your project has been registered on-chain. You can now view it and start receiving sponsorships.
          </p>
          <Button onClick={() => router.push(`/projects/${state.projectId}`)} size="lg" className="min-h-[44px] w-full sm:w-auto">
            View Project Page
          </Button>
        </div>
      </RequireWallet>
    );
  }

  return (
    <RequireWallet>
      <div className="flex-grow flex flex-col items-center pt-8 sm:pt-12 px-4 sm:px-6 pb-24 overflow-y-auto w-full bg-background min-h-screen text-foreground transition-colors overflow-x-hidden">
        <div className="w-full max-w-[640px] space-y-6 sm:space-y-8">
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
        <h2 className="font-mono text-xs sm:text-base uppercase tracking-[1.5px] sm:tracking-[2px] text-foreground truncate pr-2">{labels[stepLabel] ?? ""}</h2>
        <span className="caption-uppercase text-[10px] sm:text-xs text-muted shrink-0">{progressPct}% Complete</span>
      </div>
      <div className="h-1 w-full bg-hairline rounded-none overflow-hidden flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-full flex-1 transition-all ${i < current ? "bg-foreground" : "bg-hairline"}`}
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
    <div className="bg-surface border border-hairline rounded-none p-6 sm:p-8 space-y-6">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-12 h-12 border border-hairline flex items-center justify-center">
          <svg className="w-6 h-6 fill-foreground" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        </div>
        <h2 className="display-md text-foreground">Link GitHub to Continue</h2>
        <p className="body-serif text-muted text-sm max-w-[380px] leading-relaxed">
          We verify repository ownership via GitHub OAuth. Your connected wallet address remains your receiving identity.
        </p>
      </div>

      {ghStatus === "loading" ? (
        <div className="flex items-center gap-2 py-4 justify-center">
          <div className="w-4 h-4 border border-foreground border-t-transparent rounded-full animate-spin" />
          <span className="caption-uppercase text-muted">Checking GitHub session...</span>
        </div>
      ) : ghStatus === "authenticated" && session ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-background border border-hairline gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border border-hairline flex items-center justify-center font-serif text-foreground shrink-0">
                GH
              </div>
              <div className="min-w-0">
                <p className="font-mono text-xs text-foreground uppercase tracking-[1.5px] truncate">@{session.githubUsername}</p>
                <p className="caption-uppercase text-[10px] text-muted">Linked for this session</p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="caption-uppercase text-muted hover:text-foreground underline text-xs min-h-[44px]"
            >
              Disconnect
            </button>
          </div>

          <Button onClick={onContinue} className="w-full min-h-[44px]">
            Continue to Repo Picker
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => signIn("github", { callbackUrl: "/list-project" })}
          className="w-full min-h-[44px]"
          size="lg"
        >
          Connect with GitHub
        </Button>
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
    <section className="bg-surface border border-hairline rounded-none p-6 sm:p-8 space-y-4">
      <h3 className="font-mono text-sm sm:text-base text-foreground uppercase tracking-[2px]">Your Repositories</h3>
      <p className="body-serif text-muted text-sm">
        Select a public repository you own. Forks are not shown.
      </p>
      <RepoPicker onSelect={onSelect} />
      <div className="pt-4 border-t border-hairline">
        <button
          onClick={onBack}
          className="bugatti-link min-h-[44px] inline-flex items-center"
        >
          &larr; Back to GitHub setup
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
    <section className="bg-surface border border-hairline rounded-none p-6 sm:p-8 space-y-6">
      <div>
        <label className="caption-uppercase text-muted block mb-2 text-xs">
          Repository
        </label>
        <div className="flex items-center gap-3 p-4 bg-background border border-hairline min-w-0">
          <span className="material-symbols-outlined text-foreground text-[18px] shrink-0">code</span>
          <span className="font-mono text-xs sm:text-sm text-foreground uppercase tracking-[1.5px] truncate">{repo.fullName}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="caption-uppercase text-muted block text-xs">
          Project Name
        </label>
        <input
          className="bugatti-input w-full text-sm sm:text-base min-h-[44px]"
          placeholder="e.g. Stellar SDK Core"
          value={name}
          maxLength={100}
          onChange={(e) => onNameChange(e.target.value)}
        />
        <span className="caption-uppercase text-[10px] text-muted text-right">{name.length}/100</span>
      </div>

      <div className="flex flex-col gap-2">
        <label className="caption-uppercase text-muted block text-xs">
          Short Description
        </label>
        <textarea
          className="w-full p-3 bg-transparent border border-hairline text-foreground font-serif text-sm sm:text-base focus:border-foreground outline-none resize-none"
          placeholder="Briefly describe your project..."
          rows={4}
          maxLength={280}
          value={description}
          onChange={(e) => onDescChange(e.target.value)}
        />
        <span
          className={`caption-uppercase text-[10px] text-right ${description.length >= 280 ? "text-rose-400 font-bold" : "text-muted"}`}
        >
          {description.length}/280
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-hairline">
        <button
          onClick={onBack}
          className="bugatti-link min-h-[44px] inline-flex items-center"
        >
          &larr; Back
        </button>
        <Button
          onClick={onReview}
          disabled={!name.trim() || description.length < 10}
          className="w-full sm:w-auto min-h-[44px]"
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
      <section className="bg-surface border border-hairline rounded-none p-6 sm:p-8 space-y-4">
        <h3 className="font-mono text-sm sm:text-base text-foreground uppercase tracking-[2px]">Review Your Project Listing</h3>
        <p className="body-serif text-muted text-sm">
          All future sponsorships will be sent to the owner wallet address shown below.
        </p>

        <div className="bg-background border border-hairline p-4 space-y-3 font-mono text-xs overflow-hidden">
          <FieldRow label="Repository" value={repo.fullName} mono />
          <FieldRow label="Project Name" value={name} />
          <FieldRow label="Description" value={description} right />
          <FieldRow
            label="Owner / Receiving Wallet"
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
          <div className="bg-background border border-hairline p-4 overflow-hidden">
            <h4 className="caption-uppercase text-muted mb-1 font-bold">
              Contract Call
            </h4>
            <pre className="font-mono text-xs text-foreground whitespace-pre-wrap overflow-x-auto leading-relaxed max-w-full">
              {JSON.stringify(unsignedCall.args, null, 2)}
            </pre>
          </div>
        )}
      </section>

      {(state.status === "idle" || state.status === "review") && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={onBack}
            className="bugatti-link min-h-[44px] inline-flex items-center"
          >
            &larr; Edit Details
          </button>
          <Button onClick={onSubmit} size="lg" className="w-full sm:w-auto min-h-[44px]">
            Sign &amp; Submit to Network
          </Button>
        </div>
      )}

      {state.status === "pending" && (
        <div className="bg-surface border border-hairline p-8 sm:p-10 flex flex-col items-center gap-4 text-center">
          <span className="animate-spin material-symbols-outlined text-[36px] sm:text-[40px] text-foreground">progress_activity</span>
          <p className="caption-uppercase text-foreground text-xs sm:text-sm">
            {state.txHash ? "Confirming on-chain..." : "Please sign the transaction in your wallet..."}
          </p>
          {state.txHash && (
            <div className="w-full p-3 bg-background border border-hairline font-mono text-xs text-muted truncate">
              Tx Hash: {state.txHash}
            </div>
          )}
        </div>
      )}

      {state.status === "failed" && (
        <div className="bg-surface border border-hairline p-6 space-y-4">
          <div className="p-4 bg-background border border-hairline text-xs font-mono text-foreground leading-relaxed break-words">
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
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="secondary" onClick={onReset} className="w-full sm:flex-1 min-h-[44px]">
              Cancel
            </Button>
            <Button onClick={onRetry} className="w-full sm:flex-1 min-h-[44px]">
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
    <div className="flex justify-between border-b border-hairline pb-2 gap-2">
      <span className="caption-uppercase text-muted shrink-0 text-[10px] sm:text-xs">{label}</span>
      <span
        className={`${mono ? "font-mono" : ""} ${small ? "text-[10px]" : "text-xs"} uppercase tracking-[1px] sm:tracking-[1.5px] text-foreground truncate ${right ? "max-w-[200px] sm:max-w-[280px] text-right leading-snug" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
