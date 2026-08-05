"use client";

import React, { useState, useEffect } from "react";
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
import { checkOnChainRepoExists } from "@/lib/soroban-client";
import type { FilteredRepo } from "@/app/api/listing/repos/route";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

async function validateRepositoryBeforeSigning(fullName: string): Promise<void> {
  const response = await fetch("/api/listing/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullName }),
    cache: "no-store",
  });
  const body = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    throw new Error(body.error || "GitHub repository validation failed.");
  }
}

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
        <div className="flex-grow flex flex-col items-center justify-center p-8 text-center min-h-[70vh] bg-[#F5F5F5] text-black transition-colors overflow-x-hidden pt-28">
          <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
            <Check className="w-8 h-8" />
          </div>
          <h2 className="text-3xl md:text-4xl font-medium text-black mb-3 tracking-tight">Project Listed!</h2>
          <p className="text-black/70 max-w-md mb-8 text-base leading-relaxed">
            Your repository has been successfully registered on Stellar Testnet. You can now start receiving direct XLM sponsorships.
          </p>
          <button
            onClick={() => router.push(`/projects/${state.projectId}`)}
            className="bg-black text-white font-medium px-8 py-3.5 rounded-full hover:bg-gray-800 transition-colors shadow-md text-sm inline-flex items-center gap-2"
          >
            <span>View Project Page</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </RequireWallet>
    );
  }

  return (
    <RequireWallet>
      <div className="flex-grow flex flex-col items-center pt-28 px-6 pb-24 w-full bg-[#F5F5F5] min-h-screen text-black transition-colors overflow-x-hidden">
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
                    await validateRepositoryBeforeSigning(currentStep.repo.fullName);
                    const { getKit } = await import("@/features/wallet/use-wallet");
                    const kit = await getKit();
                    const { createOnChainProject } = await import("@/lib/soroban-client");

                    return await createOnChainProject({
                      ownerPublicKey: wallet.publicKey!,
                      repoFullName: currentStep.repo.fullName,
                      name: currentStep.name,
                      description: currentStep.description,
                      kit,
                    });
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
                    await validateRepositoryBeforeSigning(currentStep.repo.fullName);
                    const { getKit } = await import("@/features/wallet/use-wallet");
                    const kit = await getKit();
                    const { createOnChainProject } = await import("@/lib/soroban-client");

                    return await createOnChainProject({
                      ownerPublicKey: wallet.publicKey!,
                      repoFullName: currentStep.repo.fullName,
                      name: currentStep.name,
                      description: currentStep.description,
                      kit,
                    });
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
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <h2 className="text-lg font-medium text-black tracking-tight truncate pr-2">{labels[stepLabel] ?? ""}</h2>
        <span className="text-xs font-mono uppercase tracking-wider text-black/50 shrink-0">{progressPct}% Complete</span>
      </div>
      <div className="h-1.5 w-full bg-black/10 rounded-full overflow-hidden flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-full flex-1 transition-all rounded-full ${i < current ? "bg-black" : "bg-black/10"}`}
          />
        ))}
      </div>
    </div>
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
    <div className="bg-white border border-black/10 rounded-2xl p-8 space-y-6 shadow-xs">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-14 h-14 bg-[#2B2644] text-white rounded-full flex items-center justify-center shadow-md">
          <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        </div>
        <h2 className="text-2xl font-medium text-black tracking-tight">Link GitHub to Continue</h2>
        <p className="text-black/70 text-sm max-w-[380px] leading-relaxed">
          We verify repository ownership via GitHub OAuth. Your connected Stellar wallet address remains your receiving identity.
        </p>
      </div>

      {ghStatus === "loading" ? (
        <div className="flex items-center gap-2 py-4 justify-center">
          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-black/60">Checking GitHub session...</span>
        </div>
      ) : ghStatus === "authenticated" && session ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[#F5F5F5] border border-black/10 rounded-xl gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs shrink-0">
                GH
              </div>
              <div className="min-w-0">
                <p className="font-mono text-sm font-semibold text-black truncate">@{session.githubUsername}</p>
                <p className="text-xs text-black/50 font-mono">Linked for this session</p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="text-xs font-mono text-rose-600 hover:underline"
            >
              Disconnect
            </button>
          </div>

          <button
            onClick={onContinue}
            className="w-full bg-black text-white font-medium py-3.5 px-6 rounded-full hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-md text-sm"
          >
            <span>Continue to Repo Picker</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => signIn("github", { callbackUrl: "/list-project" })}
          className="w-full bg-black text-white font-medium py-3.5 px-6 rounded-full hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-md text-sm"
        >
          <span>Connect with GitHub</span>
          <ArrowRight className="w-4 h-4" />
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
    <section className="bg-white border border-black/10 rounded-2xl p-8 space-y-6 shadow-xs">
      <div>
        <h3 className="text-2xl font-medium text-black tracking-tight">Your Repositories</h3>
        <p className="text-black/70 text-sm mt-1">
          Select a public repository you own to register on SponsorChain.
        </p>
      </div>
      <RepoPicker onSelect={onSelect} />
      <div className="pt-4 border-t border-black/10">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-black/70 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to GitHub setup</span>
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
    <section className="bg-white border border-black/10 rounded-2xl p-8 space-y-6 shadow-xs">
      <div>
        <label className="text-xs font-mono uppercase tracking-wider text-black/50 block mb-2">
          SELECTED REPOSITORY
        </label>
        <div className="flex items-center gap-3 p-4 bg-[#F5F5F5] border border-black/10 rounded-xl min-w-0">
          <span className="material-symbols-outlined text-black text-[20px] shrink-0">code</span>
          <span className="font-mono text-sm font-semibold text-black truncate">{repo.fullName}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-mono uppercase tracking-wider text-black/50 block">
          PROJECT DISPLAY NAME
        </label>
        <input
          className="w-full bg-[#F5F5F5] border border-black/10 rounded-xl px-4 py-3 text-base text-black placeholder:text-black/30 outline-none focus:border-black transition-colors"
          placeholder="e.g. Stellar SDK Core"
          value={name}
          maxLength={100}
          onChange={(e) => onNameChange(e.target.value)}
        />
        <span className="text-[10px] font-mono text-black/40 text-right">{name.length}/100</span>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-mono uppercase tracking-wider text-black/50 block">
          SHORT DESCRIPTION
        </label>
        <textarea
          className="w-full p-4 bg-[#F5F5F5] border border-black/10 rounded-xl text-black text-sm placeholder:text-black/30 focus:border-black outline-none resize-none transition-colors"
          placeholder="Briefly describe your project..."
          rows={4}
          maxLength={280}
          value={description}
          onChange={(e) => onDescChange(e.target.value)}
        />
        <span
          className={`text-[10px] font-mono text-right ${description.length >= 280 ? "text-rose-500 font-bold" : "text-black/40"}`}
        >
          {description.length}/280
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-black/10">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-black/70 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <button
          onClick={onReview}
          disabled={!name.trim() || description.length < 10}
          className="w-full sm:w-auto bg-black text-white font-medium py-3.5 px-8 rounded-full hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 text-sm shadow-md"
        >
          <span>Review &amp; Submit</span>
          <ArrowRight className="w-4 h-4" />
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
  const [checkingRepo, setCheckingRepo] = useState(true);
  const [repoExists, setRepoExists] = useState(false);
  const [repoCheckError, setRepoCheckError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function verifyRepo() {
      setCheckingRepo(true);
      setRepoCheckError(null);
      try {
        const result = await checkOnChainRepoExists(repo.fullName);
        if (isMounted) {
          setRepoExists(result.exists);
        }
      } catch (err) {
        if (isMounted) {
          setRepoCheckError(
            err instanceof Error
              ? err.message
              : "Could not verify the live ProjectRegistry."
          );
        }
      } finally {
        if (isMounted) {
          setCheckingRepo(false);
        }
      }
    }
    verifyRepo();
    return () => {
      isMounted = false;
    };
  }, [repo.fullName]);

  return (
    <div className="space-y-6">
      <section className="bg-white border border-black/10 rounded-2xl p-8 space-y-6 shadow-xs">
        <div>
          <h3 className="text-2xl font-medium text-black tracking-tight">Review Your Project Listing</h3>
          <p className="text-black/70 text-sm mt-1">
            All future XLM sponsorships will be transferred directly to your connected receiving wallet.
          </p>
        </div>

        {checkingRepo ? (
          <div className="p-4 bg-[#F5F5F5] border border-black/10 rounded-xl flex items-center justify-center gap-3">
            <span className="animate-spin material-symbols-outlined text-[20px] text-black">progress_activity</span>
            <span className="text-xs font-mono text-black/60">Checking on-chain ProjectRegistry...</span>
          </div>
        ) : repoExists ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-mono text-rose-700 space-y-1">
            <div className="font-bold uppercase tracking-wider">Repository Already Listed On-Chain</div>
            <p className="text-rose-600">
              The GitHub repository <code className="text-black font-semibold">{repo.fullName}</code> has already been registered on-chain.
            </p>
          </div>
        ) : repoCheckError ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-mono text-rose-700 space-y-1">
            <div className="font-bold uppercase tracking-wider">ProjectRegistry Check Failed</div>
            <p className="text-rose-600">{repoCheckError}</p>
          </div>
        ) : null}

        <div className="bg-[#F5F5F5] border border-black/10 rounded-xl p-5 space-y-3 font-mono text-xs overflow-hidden">
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
          <div className="bg-[#F5F5F5] border border-black/10 rounded-xl p-5 overflow-hidden">
            <h4 className="text-xs font-mono uppercase tracking-wider text-black/50 mb-2 font-semibold">
              Contract Payload
            </h4>
            <pre className="font-mono text-xs text-black whitespace-pre-wrap overflow-x-auto leading-relaxed max-w-full">
              {JSON.stringify(unsignedCall.args, null, 2)}
            </pre>
          </div>
        )}
      </section>

      {(state.status === "idle" || state.status === "review") && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-black/70 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Edit Details</span>
          </button>
          <button
            onClick={onSubmit}
            disabled={checkingRepo || repoExists || Boolean(repoCheckError)}
            className="w-full sm:w-auto bg-black text-white font-medium py-3.5 px-8 rounded-full hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 text-sm shadow-md"
          >
            <span>{repoExists ? "Already Listed On-Chain" : "Sign & Submit to Network"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {state.status === "pending" && (
        <div className="bg-white border border-black/10 rounded-2xl p-10 flex flex-col items-center gap-4 text-center shadow-xs">
          <span className="animate-spin material-symbols-outlined text-[40px] text-black">progress_activity</span>
          <p className="text-sm font-medium text-black">
            {state.txHash ? "Confirming on Stellar network..." : "Please sign the transaction in your wallet..."}
          </p>
          {state.txHash && (
            <div className="w-full p-3 bg-[#F5F5F5] border border-black/10 rounded-xl font-mono text-xs text-black/70 truncate">
              Tx Hash: {state.txHash}
            </div>
          )}
        </div>
      )}

      {state.status === "failed" && (
        <div className="bg-white border border-black/10 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-mono text-rose-700 leading-relaxed break-words">
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
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onReset} className="flex-1">
              Cancel
            </Button>
            <button onClick={onRetry} className="flex-1 bg-black text-white font-medium py-3 rounded-full hover:bg-gray-800 transition-colors text-sm">
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
    <div className="flex justify-between border-b border-black/5 pb-2 gap-2">
      <span className="text-black/50 text-xs font-mono shrink-0">{label}</span>
      <span
        className={`${mono ? "font-mono font-medium" : "font-sans"} ${small ? "text-[11px]" : "text-xs"} text-black truncate ${right ? "max-w-[200px] sm:max-w-[280px] text-right leading-snug" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
