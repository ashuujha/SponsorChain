"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useWallet } from "@/features/wallet/use-wallet";
import { useSponsorProject } from "@/features/projects/use-sponsor-project";
import {
  getProject,
  getSponsorshipsForProject,
  mockSponsor,
  ProjectData,
  SponsorshipData,
} from "@/features/projects/contract-data";

interface ApiSponsorship {
  sponsorWalletKey?: string;
  sponsor?: { walletPublicKey?: string };
  amountXLM?: string;
  createdAt: string;
  txHash: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const idStr = (params.id as string) || "0";

  const wallet = useWallet();

  const [project, setProject] = useState<ProjectData | null>(null);
  const [sponsorships, setSponsorships] = useState<SponsorshipData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  // Set when the project's owner key fails StrKey validation — shown before
  // the user even enters the review step so they get a clear error message.
  const [ownerKeyError, setOwnerKeyError] = useState<string | null>(null);

  const loadProject = useCallback(async () => {
    setIsLoading(true);
    setNotFound(false);

    try {
      const res = await fetch(`/api/projects/${idStr}`);
      if (res.ok) {
        const data = await res.json();
        const p = data.project;
        if (p) {
          // Compute Live Total Raised via Horizon payments query
          let liveTotalStroops = BigInt(0);
          try {
            const hRes = await fetch(
              `https://horizon-testnet.stellar.org/accounts/${p.ownerWalletKey}/payments?limit=200`
            );
            if (hRes.ok) {
              const hData = await hRes.json();
              const payments = hData._embedded?.records || [];
              for (const pay of payments) {
                if (
                  pay.type === "payment" &&
                  pay.asset_type === "native" &&
                  pay.to === p.ownerWalletKey
                ) {
                  const amountXlm = parseFloat(pay.amount || "0");
                  liveTotalStroops += BigInt(Math.floor(amountXlm * 10_000_0000));
                }
              }
            }
          } catch (hErr) {
            console.warn("Horizon live balance fetch warning:", hErr);
          }

          const projectData: ProjectData = {
            id: p.id,
            owner: p.ownerWalletKey || p.owner?.walletPublicKey || "",
            repoFullName: p.repoUrl,
            name: p.name,
            description: p.description,
            totalRaised: liveTotalStroops.toString(),
            sponsorCount: p.sponsorships?.length || 0,
            createdAt: BigInt(Math.floor(new Date(p.createdAt).getTime() / 1000)),
          };

          const mappedSponsorships: SponsorshipData[] = (p.sponsorships || []).map(
            (s: ApiSponsorship, idx: number) => ({
              id: BigInt(idx),
              sponsor: s.sponsorWalletKey || s.sponsor?.walletPublicKey || "Anonymous",
              projectId: BigInt(0),
              amount: (
                BigInt(Math.floor(parseFloat(s.amountXLM || "0") * 10_000_0000))
              ).toString(),
              timestamp: BigInt(Math.floor(new Date(s.createdAt).getTime() / 1000)),
              txHash: s.txHash,
            })
          );

          setProject(projectData);
          setSponsorships(mappedSponsorships);
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Failed to fetch project from DB, trying mock registry:", err);
    }

    // Fallback to mock registry if DB query failed
    try {
      const numericId = BigInt(isNaN(Number(idStr)) ? 0 : idStr);
      const p = getProject(numericId);
      if (!p) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }
      setProject(p);
      setSponsorships(getSponsorshipsForProject(numericId));
    } catch {
      setNotFound(true);
    }
    setIsLoading(false);
  }, [idStr]);

  // onSuccess ref — always points to the latest project/publicKey/loadProject
  const onSuccessRef = useRef<(txHash: string) => void>(() => {});
  useEffect(() => {
    onSuccessRef.current = async (txHash: string) => {
      if (!wallet.publicKey || !project) return;
      const amountXLM = sponsor.amount;
      const amountStroops = BigInt(
        Math.floor(parseFloat(amountXLM) * 10_000_0000)
      );

      // 1. Write to in-memory fallback
      try {
        const numericId = BigInt(isNaN(Number(idStr)) ? 0 : idStr);
        mockSponsor(wallet.publicKey, numericId, amountStroops, txHash);
      } catch (e) {
        console.warn("Mock sponsor update notice:", e);
      }

      // 2. Persist to PostgreSQL via /api/sponsorships
      try {
        await fetch("/api/sponsorships", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: project.id,
            sponsorWalletKey: wallet.publicKey,
            amountXLM,
            txHash,
          }),
        });
      } catch (apiErr) {
        console.error("Failed to post sponsorship to DB:", apiErr);
      }

      loadProject();
    };
  });

  // useSponsorProject receives a stable wrapper that always calls the latest ref.
  const sponsor = useSponsorProject((txHash) => onSuccessRef.current(txHash));

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const formatXlm = (stroops: string): string => {
    const n = BigInt(stroops);
    const whole = n / BigInt(10_000_0000);
    const frac = n % BigInt(10_000_0000);
    const fracStr = frac.toString().padStart(7, "0");
    const trimmed = fracStr.replace(/0+$/, "");
    return trimmed ? `${whole}.${trimmed}` : `${whole}.0`;
  };

  /**
   * DISPLAY ONLY — never use this value in transactions.
   * Transactions always use the raw project.owner string directly.
   */
  const formatPublicKey = (key: string): string =>
    key.length >= 12 ? `${key.slice(0, 6)}…${key.slice(-6)}` : key;

  const handleSponsorClick = async () => {
    if (!wallet.isConnected) {
      wallet.connect();
      return;
    }
    if (parseFloat(sponsor.amount) <= 0 || isNaN(parseFloat(sponsor.amount))) return;

    // ── Client-side StrKey guard ──────────────────────────────────────────
    // Validate the destination key NOW, before building any transaction.
    // This gives a clear, actionable error instead of a cryptic SDK failure.
    if (project) {
      const { StrKey } = await import("stellar-sdk");
      if (!StrKey.isValidEd25519PublicKey(project.owner)) {
        setOwnerKeyError(
          "This project's maintainer hasn't connected a valid Stellar wallet yet. " +
          "The owner address on record is not a valid Stellar public key. " +
          "Sponsorship cannot proceed until the maintainer updates their wallet."
        );
        return;
      }
    }
    setOwnerKeyError(null);
    sponsor.startReview();
  };

  const handleConfirmSponsor = async () => {
    if (!wallet.publicKey || !project) return;
    // submit() triggers: build XDR → wallet signing popup → submit to Horizon.
    // On success, onSuccessRef.current() handles mockSponsor + loadProject.
    await sponsor.submit(
      wallet.publicKey,
      project.owner,
      sponsor.amount
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-md">
        <span className="animate-spin material-symbols-outlined text-[40px] text-primary">
          progress_activity
        </span>
        <p className="font-semibold text-on-surface-variant text-body-md">
          Reading from contract state...
        </p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-md">
        <span className="material-symbols-outlined text-[48px] text-secondary">search_off</span>
        <h3 className="font-bold text-headline-md text-primary">Project not found</h3>
        <p className="text-on-surface-variant text-body-sm">This project may have been removed.</p>
        <Link
          href="/explore"
          className="inline-block bg-primary text-on-primary px-lg py-md rounded-full font-semibold"
        >
          Browse Projects
        </Link>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="pb-xl px-gutter max-w-container-max mx-auto pt-8 relative">
      <Link
        href="/explore"
        className="inline-flex items-center gap-xs text-on-surface-variant font-body-sm hover:text-primary transition-colors mb-lg"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Explore
      </Link>

      <div className="flex flex-col lg:flex-row gap-xl">
        {/* Main column */}
        <div className="flex-grow space-y-xl max-w-4xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center gap-lg">
            <div className="w-24 h-24 rounded-2xl bg-surface-container-high flex items-center justify-center overflow-hidden border border-outline-variant">
              <span className="material-symbols-outlined text-[48px] text-neutral-500">hub</span>
            </div>
            <div className="space-y-xs">
              <h2 className="font-headline-lg text-headline-lg text-on-background font-bold">
                {project.name}
              </h2>
              <a
                className="flex items-center gap-xs text-on-surface-variant font-mono-code text-body-sm hover:text-primary"
                href={`https://github.com/${project.repoFullName}`}
                target="_blank"
                rel="noreferrer"
              >
                <span className="material-symbols-outlined text-[16px]">terminal</span>
                {project.repoFullName}
              </a>
            </div>
          </div>

          <p className="font-body-lg text-on-surface max-w-3xl leading-relaxed">
            {project.description}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            <div className="bg-white p-md rounded-2xl border border-outline-variant flex flex-col justify-between h-32">
              <span className="text-on-surface-variant font-label-caps text-label-caps uppercase font-semibold">
                Total Raised
              </span>
              <span className="font-headline-md text-headline-md text-[#2E7D32] font-bold">
                {formatXlm(project.totalRaised)} XLM
              </span>
            </div>
            <div className="bg-white p-md rounded-2xl border border-outline-variant flex flex-col justify-between h-32">
              <span className="text-on-surface-variant font-label-caps text-label-caps uppercase font-semibold">
                Sponsors
              </span>
              <span className="font-headline-md text-headline-md text-primary font-bold">
                {project.sponsorCount}
              </span>
            </div>
            <div className="bg-white p-md rounded-2xl border border-outline-variant flex flex-col justify-between h-32">
              <span className="text-on-surface-variant font-label-caps text-label-caps uppercase font-semibold">
                Owner
              </span>
              <span className="font-mono-code text-body-sm text-primary font-bold truncate">
                {formatPublicKey(project.owner)}
              </span>
            </div>
          </div>

          {/* Sponsorships */}
          <section className="space-y-lg">
            <h3 className="font-headline-md text-on-background font-bold">Sponsorships</h3>
            <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden">
              {sponsorships.length === 0 ? (
                <div className="p-xl text-center text-on-surface-variant text-body-sm">
                  No sponsorships yet — be the first!
                </div>
              ) : (
                <div className="divide-y divide-outline-variant/30">
                  {sponsorships.map((s) => {
                    const shortSponsor = `${s.sponsor.slice(0, 6)}...${s.sponsor.slice(-6)}`;
                    return (
                      <div
                        key={s.id.toString()}
                        className="flex items-center justify-between p-md hover:bg-surface-container-low transition-colors"
                      >
                        <div className="flex items-center gap-md">
                          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant">
                            <span className="material-symbols-outlined text-neutral-400">person</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-on-background font-mono-code text-body-sm">
                              {shortSponsor}
                            </span>
                            <span className="text-on-surface-variant text-body-sm">
                              {new Date(Number(s.timestamp) * 1000).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-xs">
                          <span className="font-bold text-[#2E7D32]">
                            {formatXlm(s.amount)} XLM
                          </span>
                          {s.txHash && (
                            <a
                              href={`https://stellar.expert/explorer/testnet/tx/${s.txHash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-xs text-[10px] font-mono-code text-primary hover:underline"
                            >
                              {s.txHash.slice(0, 8)}…
                              <span className="material-symbols-outlined text-[11px]">open_in_new</span>
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sponsor panel (right column) */}
        <div className="lg:w-80 shrink-0">
          <div className="sticky top-24 space-y-lg">
            <div className="bg-white p-lg rounded-2xl border border-outline-variant space-y-lg shadow-sm">
              <h3 className="font-headline-md text-on-background font-bold">
                Sponsor this project
              </h3>

              {sponsor.state.status === "idle" && (
                <>
                  <div className="relative">
                    <input
                      className="w-full bg-surface-container border-none rounded-xl py-md px-md focus:ring-1 focus:ring-primary font-body-lg outline-none"
                      placeholder="0.00"
                      type="number"
                      value={sponsor.amount}
                      onChange={(e) => sponsor.setAmount(e.target.value)}
                    />
                    <span className="absolute right-md top-1/2 -translate-y-1/2 font-mono-code text-on-surface-variant">
                      XLM
                    </span>
                  </div>
                  <button
                    onClick={handleSponsorClick}
                    className="w-full bg-primary text-on-primary py-md rounded-full font-bold text-body-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-sm"
                  >
                    <span className="material-symbols-outlined">electric_bolt</span>
                    {wallet.isConnected ? "Sponsor with Wallet" : "Connect Wallet to Sponsor"}
                  </button>
                  <p className="text-on-surface-variant text-[11px] text-center">
                    SponsorChain runs on Stellar Testnet. No real funds required.
                  </p>
                  {ownerKeyError && (
                    <div className="p-sm bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 leading-snug flex gap-xs">
                      <span className="material-symbols-outlined text-[14px] shrink-0 mt-0.5">warning</span>
                      <span>{ownerKeyError}</span>
                    </div>
                  )}
                </>
              )}

              {/* Review */}
              {sponsor.state.status === "review" && (
                <div className="space-y-lg">
                  <div className="p-lg bg-surface-container rounded-xl text-center space-y-xs">
                    <span className="text-on-surface-variant text-body-sm font-semibold uppercase block">
                      Sponsorship Amount
                    </span>
                    <span className="font-headline-lg text-primary font-bold">
                      {sponsor.amount} XLM
                    </span>
                  </div>
                  <div className="space-y-md text-body-sm font-semibold">
                    <div className="flex justify-between border-b border-outline-variant/30 pb-xs">
                      <span className="text-secondary">To Project</span>
                      <span className="text-primary">{project.name}</span>
                    </div>
                    <div className="flex justify-between pb-xs">
                      <span className="text-secondary">Owner Wallet</span>
                      <span className="font-mono-code text-primary">
                        {formatPublicKey(project.owner)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleConfirmSponsor}
                    className="w-full bg-primary text-on-primary py-md rounded-full font-bold hover:opacity-90 active:scale-95 transition-all"
                  >
                    Sign &amp; Send Payment
                  </button>
                  <button
                    onClick={sponsor.reset}
                    className="w-full text-secondary text-body-sm font-medium hover:text-primary"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Pending */}
              {sponsor.state.status === "pending" && (
                <div className="py-xl flex flex-col items-center gap-md text-center">
                  <span className="animate-spin material-symbols-outlined text-[48px] text-primary">
                    progress_activity
                  </span>
                  <p className="font-semibold text-body-md">
                    {sponsor.state.txHash
                      ? "Confirming on-chain..."
                      : "Please sign in your wallet..."}
                  </p>
                  {sponsor.state.txHash && (
                    <div className="w-full p-sm bg-surface-container rounded-lg font-mono-code text-[11px] truncate">
                      TX: {sponsor.state.txHash}
                    </div>
                  )}
                </div>
              )}

              {/* Success */}
              {sponsor.state.status === "success" && (
                <div className="space-y-lg text-center">
                  <div className="w-16 h-16 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto text-[#2E7D32]">
                    <span className="material-symbols-outlined text-[36px]">verified</span>
                  </div>
                  <h4 className="font-bold text-body-lg">
                    Sponsored {sponsor.amount} XLM!
                  </h4>
                  <p className="text-secondary text-body-sm">
                    Your contribution is live on the Stellar testnet.
                  </p>
                  {sponsor.state.txHash && (
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${sponsor.state.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-xs bg-surface-container px-md py-xs rounded-full font-mono-code text-body-sm text-primary hover:bg-surface-container-high"
                    >
                      View on Explorer
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    </a>
                  )}
                  <button
                    onClick={sponsor.reset}
                    className="w-full bg-primary text-on-primary py-md rounded-full font-bold"
                  >
                    Done
                  </button>
                </div>
              )}

              {/* Failed */}
              {sponsor.state.status === "failed" && (
                <div className="space-y-lg">
                  <div className="p-md bg-error-container text-on-error-container text-body-sm rounded-xl border border-error/15 font-medium">
                    {sponsor.state.errorType === "insufficient_funds" && (
                      <span><strong>Insufficient funds:</strong> Your wallet does not hold enough XLM to complete this transaction.</span>
                    )}
                    {sponsor.state.errorType === "user_rejected" && (
                      <span><strong>Signature rejected:</strong> You declined the signature request.</span>
                    )}
                    {sponsor.state.errorType === "network_error" && (
                      <span><strong>Network error:</strong> Failed to reach the Stellar network.</span>
                    )}
                    {sponsor.state.errorType === "unknown" && (
                      <span><strong>Transaction failed:</strong> {sponsor.state.errorMessage || "Unexpected error."}</span>
                    )}
                  </div>
                  <div className="flex gap-md">
                    <button onClick={sponsor.reset} className="flex-1 bg-surface-container py-md rounded-full font-semibold">
                      Cancel
                    </button>
                    <button onClick={handleConfirmSponsor} className="flex-1 bg-primary text-on-primary py-md rounded-full font-semibold">
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
