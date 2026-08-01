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
        <div className="flex-grow flex flex-col items-center justify-center p-8 text-center min-h-[60vh] bg-black text-white">
          <div className="w-12 h-12 border border-white rounded-full flex items-center justify-center mx-auto text-white mb-6">
            <span className="material-symbols-outlined text-[24px]">done</span>
          </div>
          <h2 className="display-md text-3xl text-white mb-2">PROJECT LISTED</h2>
          <p className="body-serif text-muted max-w-sm mb-8">
            Your project has been registered on-chain. You can now view it and start receiving sponsorships.
          </p>
          <Button onClick={() => router.push(`/projects/${state.projectId}`)} size="lg">
            VIEW PROJECT PAGE
          </Button>
        </div>
      </RequireWallet>
    );
  }

  return (
    <RequireWallet>
      <div className="flex-grow flex flex-col items-center pt-12 px-4 sm:px-6 pb-24 overflow-y-auto w-full bg-black min-h-screen text-white">
        <div className="w-full max-w-[640px] space-y-8">
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
    "github-connect": "STEP 1: LINK GITHUB",
    "repo-picker": "STEP 2: PICK REPOSITORY",
    details: "STEP 3: PROJECT DETAILS",
    review: "STEP 4: REVIEW & SUBMIT",
  };
  return (
    <>
      <div className="flex justify-between items-end mb-2">
        <h2 className="font-mono text-base uppercase tracking-[2px] text-white">{labels[stepLabel] ?? ""}</h2>
        <span className="caption-uppercase text-muted">{progressPct}% COMPLETE</span>
      </div>
      <div className="h-1 w-full bg-hairline rounded-none overflow-hidden flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-full flex-1 transition-all ${i < current ? "bg-white" : "bg-hairline"}`}
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
    <div className="bg-surface-card border border-hairline rounded-none p-8 space-y-6">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-12 h-12 border border-hairline flex items-center justify-center">
          <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        </div>
        <h2 className="display-md text-2xl text-white">LINK GITHUB ACCOUNT</h2>
        <p className="body-serif text-muted text-sm max-w-[380px] leading-relaxed">
          We verify repository ownership via GitHub OAuth. Your connected wallet address remains your receiving identity.
        </p>
      </div>

      {ghStatus === "loading" ? (
        <div className="flex items-center gap-2 py-4 justify-center">
          <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
          <span className="caption-uppercase text-muted">CHECKING GITHUB SESSION...</span>
        </div>
      ) : ghStatus === "authenticated" && session ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-black border border-hairline">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border border-hairline flex items-center justify-center font-serif text-white">
                GH
              </div>
              <div>
                <p className="font-mono text-xs text-white uppercase tracking-[1.5px]">@{session.githubUsername}</p>
                <p className="caption-uppercase text-[10px] text-muted">LINKED FOR THIS SESSION</p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="caption-uppercase text-muted hover:text-white underline"
            >
              DISCONNECT
            </button>
          </div>

          <Button onClick={onContinue} className="w-full">
            CONTINUE TO REPO PICKER
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => signIn("github", { callbackUrl: "/list-project" })}
          className="w-full"
          size="lg"
        >
          CONNECT WITH GITHUB
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
    <section className="bg-surface-card border border-hairline rounded-none p-8 space-y-4">
      <h3 className="font-mono text-base text-white uppercase tracking-[2px]">YOUR REPOSITORIES</h3>
      <p className="body-serif text-muted text-sm">
        Select a public repository you own. Forks are excluded automatically.
      </p>
      <RepoPicker onSelect={onSelect} />
      <div className="pt-4 border-t border-hairline">
        <button
          onClick={onBack}
          className="bugatti-link"
        >
          &larr; BACK TO GITHUB SETUP
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
    <section className="bg-surface-card border border-hairline rounded-none p-8 space-y-6">
      <div>
        <label className="caption-uppercase text-muted block mb-2">
          REPOSITORY
        </label>
        <div className="flex items-center gap-3 p-4 bg-black border border-hairline">
          <span className="material-symbols-outlined text-white text-[18px]">code</span>
          <span className="font-mono text-sm text-white uppercase tracking-[1.5px]">{repo.fullName}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="caption-uppercase text-muted block">
          PROJECT NAME
        </label>
        <input
          className="bugatti-input w-full text-base"
          placeholder="E.G. STELLAR SDK CORE"
          value={name}
          maxLength={100}
          onChange={(e) => onNameChange(e.target.value)}
        />
        <span className="caption-uppercase text-[10px] text-muted text-right">{name.length}/100</span>
      </div>

      <div className="flex flex-col gap-2">
        <label className="caption-uppercase text-muted block">
          SHORT DESCRIPTION
        </label>
        <textarea
          className="w-full p-3 bg-transparent border border-[#3a3a3a] text-white font-serif text-base focus:border-white outline-none resize-none"
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

      <div className="flex items-center justify-between pt-4 border-t border-hairline">
        <button
          onClick={onBack}
          className="bugatti-link"
        >
          &larr; BACK
        </button>
        <Button
          onClick={onReview}
          disabled={!name.trim() || description.length < 10}
        >
          REVIEW &amp; SUBMIT
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
      <section className="bg-surface-card border border-hairline rounded-none p-8 space-y-4">
        <h3 className="font-mono text-base text-white uppercase tracking-[2px]">REVIEW PROJECT LISTING</h3>
        <p className="body-serif text-muted text-sm">
          All future sponsorships will be sent to the owner wallet address shown below.
        </p>

        <div className="bg-black border border-hairline p-4 space-y-3 font-mono text-xs">
          <FieldRow label="REPOSITORY" value={repo.fullName} mono />
          <FieldRow label="PROJECT NAME" value={name} />
          <FieldRow label="DESCRIPTION" value={description} right />
          <FieldRow
            label="OWNER WALLET"
            value={
              walletPublicKey
                ? `${walletPublicKey.slice(0, 6)}...${walletPublicKey.slice(-6)}`
                : "Not connected"
            }
            mono
          />
          <FieldRow label="CONTRACT" value="ProjectRegistry" mono small />
        </div>

        {unsignedCall && (
          <div className="bg-black border border-hairline p-4">
            <h4 className="caption-uppercase text-muted mb-1">
              CONTRACT CALL ARGS
            </h4>
            <pre className="font-mono text-xs text-white whitespace-pre-wrap overflow-x-auto leading-relaxed">
              {JSON.stringify(unsignedCall.args, null, 2)}
            </pre>
          </div>
        )}
      </section>

      {(state.status === "idle" || state.status === "review") && (
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="bugatti-link"
          >
            &larr; EDIT DETAILS
          </button>
          <Button onClick={onSubmit} size="lg">
            SIGN &amp; SUBMIT TO NETWORK
          </Button>
        </div>
      )}

      {state.status === "pending" && (
        <div className="bg-surface-card border border-hairline p-10 flex flex-col items-center gap-4 text-center">
          <span className="animate-spin material-symbols-outlined text-[40px] text-white">progress_activity</span>
          <p className="caption-uppercase text-white">
            {state.txHash ? "CONFIRMING ON-CHAIN..." : "PLEASE SIGN TRANSACTION..."}
          </p>
          {state.txHash && (
            <div className="w-full p-3 bg-black border border-hairline font-mono text-xs text-muted truncate">
              TX HASH: {state.txHash}
            </div>
          )}
        </div>
      )}

      {state.status === "failed" && (
        <div className="bg-surface-card border border-hairline p-6 space-y-4">
          <div className="p-4 bg-black border border-hairline-strong text-xs font-mono text-white leading-relaxed">
            {state.errorType === "insufficient_funds" && (
              <span><strong>INSUFFICIENT FUNDS:</strong> Your wallet does not have enough XLM for the fee.</span>
            )}
            {state.errorType === "user_rejected" && (
              <span><strong>SIGNATURE REJECTED:</strong> You declined the signature request in your wallet.</span>
            )}
            {state.errorType === "network_error" && (
              <span><strong>NETWORK ERROR:</strong> Failed to reach Soroban RPC. Check your connection.</span>
            )}
            {state.errorType === "unknown" && (
              <span><strong>TRANSACTION FAILED:</strong> {state.errorMessage || "Unexpected error."}</span>
            )}
          </div>
          <div className="flex gap-4">
            <Button variant="secondary" onClick={onReset} className="flex-1">
              CANCEL
            </Button>
            <Button onClick={onRetry} className="flex-1">
              RETRY
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
    <div className="flex justify-between border-b border-hairline pb-2">
      <span className="caption-uppercase text-muted">{label}</span>
      <span
        className={`${mono ? "font-mono" : ""} ${small ? "text-[10px]" : "text-xs"} uppercase tracking-[1.5px] text-white ${right ? "max-w-[280px] text-right leading-snug" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
