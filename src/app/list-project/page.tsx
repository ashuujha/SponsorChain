"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { useWallet } from "@/features/wallet/use-wallet";
import { RequireWallet } from "@/features/wallet-session";
import { RepoPicker } from "@/features/projects/repo-picker";
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
        <div className="flex-grow flex flex-col items-center justify-center p-xl text-center min-h-[60vh]">
          <div className="w-16 h-16 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto text-[#2E7D32] mb-md">
            <span className="material-symbols-outlined text-[36px]">verified</span>
          </div>
          <h2 className="font-headline-md text-primary font-bold mb-xs">Project Listed!</h2>
          <p className="text-secondary max-w-sm mb-md">
            Your project has been registered on-chain. You can now view it and
            start receiving sponsorships.
          </p>
          <button
            onClick={() => router.push(`/projects/${state.projectId}`)}
            className="bg-primary text-on-primary py-md px-xl rounded-full font-bold hover:opacity-90 active:scale-95 transition-all"
          >
            View Project Page
          </button>
        </div>
      </RequireWallet>
    );
  }

  return (
    <RequireWallet>
      <div className="flex-grow flex flex-col items-center pt-xl px-gutter pb-xl overflow-y-auto w-full">
        <div className="w-full max-w-[640px] space-y-lg">
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
      <div className="flex justify-between items-end mb-sm">
        <h2 className="font-headline-md text-on-surface font-bold">{labels[stepLabel] ?? ""}</h2>
        <span className="text-body-sm text-secondary font-medium">{progressPct}% Complete</span>
      </div>
      <div className="h-1 w-full bg-surface-container-high rounded-full overflow-hidden flex gap-xs">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-full flex-1 rounded-full ${i < current ? "bg-primary" : "bg-surface-container-high"}`}
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
    <div className="bg-white border border-outline-variant rounded-xl p-xl shadow-sm space-y-lg">
      <div className="flex flex-col items-center text-center space-y-md">
        <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant">
          <svg className="w-8 h-8 fill-on-surface" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        </div>
        <h2 className="font-headline-md text-primary font-bold">Link GitHub to Continue</h2>
        <p className="text-secondary text-body-sm max-w-[360px]">
          We need to verify that you own the repository you want to list. This is
          a one-time action for this listing — your GitHub account is not
          permanently linked.
        </p>
        <p className="text-secondary text-body-sm max-w-[360px]">
          Your wallet is your real identity. All future sponsorships will be sent
          to your connected wallet address.
        </p>
      </div>

      {ghStatus === "loading" ? (
        <div className="flex items-center gap-sm py-md justify-center">
          <div className="w-5 h-5 border-2 border-outline-variant border-t-primary rounded-full animate-spin" />
          <span className="text-secondary text-body-sm">Checking GitHub session...</span>
        </div>
      ) : ghStatus === "authenticated" && session ? (
        <div className="space-y-sm">
          <div className="flex items-center justify-between p-md bg-surface-container-low rounded-lg border border-outline-variant">
            <div className="flex items-center gap-sm">
              <div className="w-8 h-8 rounded-full bg-[#24292f] flex items-center justify-center">
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-body-sm text-primary">@{session.githubUsername}</p>
                <p className="text-secondary text-[11px]">Linked for this session</p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="text-secondary text-[11px] font-medium hover:text-primary underline"
            >
              Disconnect
            </button>
          </div>
          <button
            onClick={onContinue}
            className="w-full bg-primary text-on-primary py-md rounded-full font-semibold hover:opacity-90 active:scale-95 transition-all"
          >
            Continue to Repo Picker
          </button>
        </div>
      ) : (
        <button
          onClick={() => signIn("github", { callbackUrl: "/list-project" })}
          className="w-full bg-[#24292f] text-white flex items-center justify-center gap-sm py-md rounded-full font-semibold hover:bg-[#1b1f23] transition-all active:scale-[0.98]"
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
    <section className="bg-white border border-outline-variant rounded-xl p-lg shadow-sm">
      <h3 className="font-body-lg font-bold text-primary mb-sm">Your Repositories</h3>
      <p className="text-secondary text-body-sm mb-md">
        Select a public repository you own. Forks are not shown.
      </p>
      <RepoPicker onSelect={onSelect} />
      <div className="mt-md pt-md border-t border-outline-variant/30">
        <button
          onClick={onBack}
          className="text-secondary text-body-sm font-medium hover:text-primary underline"
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
    <section className="bg-white border border-outline-variant rounded-xl p-lg shadow-sm space-y-lg">
      <div>
        <label className="font-label-caps text-on-surface-variant uppercase tracking-wider font-semibold block mb-xs">
          Repository
        </label>
        <div className="flex items-center gap-sm p-md bg-surface-container-low rounded-lg border border-outline-variant">
          <span className="material-symbols-outlined text-secondary text-[18px]">code</span>
          <span className="font-mono-code text-body-sm text-primary">{repo.fullName}</span>
        </div>
      </div>

      <div className="flex flex-col gap-sm">
        <label className="font-label-caps text-on-surface-variant uppercase tracking-wider font-semibold">
          Project Name
        </label>
        <input
          className="w-full px-md py-md bg-[#F1F0ED] border-none rounded-lg focus:ring-1 focus:ring-primary focus:bg-white outline-none font-body-lg"
          placeholder="e.g. Stellar SDK Core"
          value={name}
          maxLength={100}
          onChange={(e) => onNameChange(e.target.value)}
        />
        <span className="text-[11px] text-secondary text-right font-mono-code">{name.length}/100</span>
      </div>

      <div className="flex flex-col gap-sm">
        <label className="font-label-caps text-on-surface-variant uppercase tracking-wider font-semibold">
          Short Description
        </label>
        <textarea
          className="w-full px-md py-md bg-[#F1F0ED] border-none rounded-lg focus:ring-1 focus:ring-primary focus:bg-white outline-none font-body-lg resize-none"
          placeholder="Briefly describe your project..."
          rows={4}
          maxLength={280}
          value={description}
          onChange={(e) => onDescChange(e.target.value)}
        />
        <span
          className={`text-[11px] text-right font-mono-code ${description.length >= 280 ? "text-error" : "text-secondary"}`}
        >
          {description.length}/280
        </span>
      </div>

      <div className="flex items-center justify-between pt-md border-t border-outline-variant/30">
        <button
          onClick={onBack}
          className="flex items-center gap-xs text-secondary hover:text-primary font-semibold text-body-sm"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back
        </button>
        <button
          onClick={onReview}
          disabled={!name.trim() || description.length < 10}
          className={`px-xl py-md rounded-full font-semibold transition-all ${
            name.trim() && description.length >= 10
              ? "bg-primary text-on-primary hover:opacity-90 active:scale-95"
              : "bg-primary/20 text-primary/40 cursor-not-allowed"
          }`}
        >
          Review &amp; Submit
        </button>
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
    <div className="space-y-lg">
      <section className="bg-white border border-outline-variant rounded-xl p-lg shadow-sm space-y-md">
        <h3 className="font-headline-md text-primary font-bold">Review Your Project Listing</h3>
        <p className="text-secondary text-body-sm">
          This is exactly what will be written on-chain. All future sponsorships
          will be sent to the wallet address shown below.
        </p>

        <div className="bg-surface-container-low rounded-lg p-md space-y-sm font-semibold">
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
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-md">
            <h4 className="font-label-caps text-label-caps text-secondary uppercase mb-xs font-bold">
              Contract Call
            </h4>
            <pre className="font-mono-code text-[10px] text-on-surface-variant whitespace-pre-wrap overflow-x-auto leading-relaxed">
              {JSON.stringify(unsignedCall.args, null, 2)}
            </pre>
          </div>
        )}
      </section>

      {(state.status === "idle" || state.status === "review") && (
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-xs text-secondary hover:text-primary font-semibold text-body-sm"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Edit Details
          </button>
          <button
            onClick={onSubmit}
            className="bg-primary text-on-primary py-md px-xl rounded-full font-bold hover:opacity-90 active:scale-95 transition-all"
          >
            Sign &amp; Submit to Network
          </button>
        </div>
      )}

      {state.status === "pending" && (
        <div className="bg-white border border-outline-variant rounded-xl p-xl shadow-sm flex flex-col items-center gap-md text-center">
          <span className="animate-spin material-symbols-outlined text-[48px] text-primary">progress_activity</span>
          <p className="font-semibold text-body-md">
            {state.txHash ? "Confirming on-chain..." : "Please sign the transaction in your wallet..."}
          </p>
          {state.txHash && (
            <div className="w-full p-sm bg-surface-container rounded-lg font-mono-code text-[11px] truncate">
              Tx Hash: {state.txHash}
            </div>
          )}
        </div>
      )}

      {state.status === "failed" && (
        <div className="bg-white border border-outline-variant rounded-xl p-lg shadow-sm space-y-md">
          <div className="p-md bg-error-container text-on-error-container text-body-sm rounded-xl border border-error/15 text-left font-medium">
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
          <div className="flex gap-md">
            <button
              onClick={onReset}
              className="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface-variant py-md rounded-full font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={onRetry}
              className="flex-1 bg-primary text-on-primary py-md rounded-full font-semibold hover:opacity-90 active:scale-95 transition-all"
            >
              Try Again
            </button>
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
    <div className="flex justify-between border-b border-outline-variant/30 pb-xs">
      <span className="text-secondary text-body-sm">{label}</span>
      <span
        className={`${mono ? "font-mono-code" : ""} ${small ? "text-[10px]" : "text-body-sm"} text-primary ${right ? "max-w-[280px] text-right leading-snug" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
