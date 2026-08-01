"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useWallet } from "@/features/wallet/use-wallet";
import { useSponsorProject } from "@/features/projects/use-sponsor-project";
import { ProjectAvatar } from "@/components/shared/project-avatar";
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

  const onSuccessRef = useRef<(txHash: string) => void>(() => {});
  useEffect(() => {
    onSuccessRef.current = async (txHash: string) => {
      if (!wallet.publicKey || !project) return;
      const amountXLM = sponsor.amount;
      const amountStroops = BigInt(
        Math.floor(parseFloat(amountXLM) * 10_000_0000)
      );

      try {
        const numericId = BigInt(isNaN(Number(idStr)) ? 0 : idStr);
        mockSponsor(wallet.publicKey, numericId, amountStroops, txHash);
      } catch (e) {
        console.warn("Mock sponsor update notice:", e);
      }

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

  const formatPublicKey = (key: string): string =>
    key.length >= 12 ? `${key.slice(0, 6)}…${key.slice(-6)}` : key;

  const handleSponsorClick = async () => {
    if (!wallet.isConnected) {
      wallet.connect();
      return;
    }
    if (parseFloat(sponsor.amount) <= 0 || isNaN(parseFloat(sponsor.amount))) return;

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
    await sponsor.submit(
      wallet.publicKey,
      project.owner,
      sponsor.amount,
      wallet.balance || "0"
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-md">
        <span className="animate-spin material-symbols-outlined text-[40px] text-primary dark:text-neutral-200">
          progress_activity
        </span>
        <p className="font-semibold text-secondary dark:text-neutral-400 text-body-md">
          Reading from contract state...
        </p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-md">
        <span className="material-symbols-outlined text-[48px] text-secondary">search_off</span>
        <h3 className="font-bold text-headline-md text-foreground">Project not found</h3>
        <p className="text-secondary dark:text-neutral-400 text-body-sm">This project may have been removed.</p>
        <Link
          href="/explore"
          className="inline-block bg-primary dark:bg-neutral-100 text-on-primary dark:text-neutral-900 px-lg py-md rounded-full font-semibold"
        >
          Browse Projects
        </Link>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="pb-xl px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-8 relative">
      <Link
        href="/explore"
        className="inline-flex items-center gap-xs text-secondary dark:text-neutral-400 font-body-sm hover:text-foreground transition-colors mb-lg"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Explore
      </Link>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main column */}
        <div className="flex-grow space-y-8 max-w-4xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <ProjectAvatar name={project.name} size="lg" />
            <div className="space-y-1">
              <h2 className="font-headline-lg text-headline-lg text-foreground font-bold">
                {project.name}
              </h2>
              <a
                className="flex items-center gap-1.5 text-secondary dark:text-neutral-400 font-mono-code text-body-sm hover:text-foreground transition-colors"
                href={`https://github.com/${project.repoFullName}`}
                target="_blank"
                rel="noreferrer"
              >
                <span className="material-symbols-outlined text-[16px]">terminal</span>
                {project.repoFullName}
              </a>
            </div>
          </div>

          <p className="font-body-lg text-foreground max-w-3xl leading-relaxed">
            {project.description}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-outline-variant dark:border-neutral-800 flex flex-col justify-between h-32">
              <span className="text-secondary dark:text-neutral-400 font-label-caps text-label-caps uppercase font-semibold">
                Total Raised
              </span>
              <span className="font-headline-md text-headline-md text-emerald-600 dark:text-emerald-400 font-bold">
                {formatXlm(project.totalRaised)} XLM
              </span>
            </div>
            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-outline-variant dark:border-neutral-800 flex flex-col justify-between h-32">
              <span className="text-secondary dark:text-neutral-400 font-label-caps text-label-caps uppercase font-semibold">
                Sponsors
              </span>
              <span className="font-headline-md text-headline-md text-foreground font-bold">
                {project.sponsorCount}
              </span>
            </div>
            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-outline-variant dark:border-neutral-800 flex flex-col justify-between h-32">
              <span className="text-secondary dark:text-neutral-400 font-label-caps text-label-caps uppercase font-semibold">
                Owner
              </span>
              <span className="font-mono-code text-body-sm text-foreground font-bold truncate">
                {formatPublicKey(project.owner)}
              </span>
            </div>
          </div>

          {/* Sponsorships */}
          <section className="space-y-4 pt-4">
            <h3 className="font-headline-md text-foreground font-bold">Sponsorships</h3>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-outline-variant dark:border-neutral-800 overflow-hidden">
              {sponsorships.length === 0 ? (
                <div className="p-xl text-center text-secondary dark:text-neutral-400 text-body-sm">
                  No sponsorships yet — be the first!
                </div>
              ) : (
                <div className="divide-y divide-outline-variant/30 dark:divide-neutral-800">
                  {sponsorships.map((s) => {
                    const shortSponsor = `${s.sponsor.slice(0, 6)}...${s.sponsor.slice(-6)}`;
                    return (
                      <div
                        key={s.id.toString()}
                        className="flex items-center justify-between p-4 hover:bg-surface-container-low dark:hover:bg-neutral-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-surface-container dark:bg-neutral-800 flex items-center justify-center border border-outline-variant dark:border-neutral-700">
                            <span className="material-symbols-outlined text-secondary dark:text-neutral-400 text-[18px]">person</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground font-mono-code text-body-sm">
                              {shortSponsor}
                            </span>
                            <span className="text-secondary dark:text-neutral-400 text-body-sm">
                              {new Date(Number(s.timestamp) * 1000).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {formatXlm(s.amount)} XLM
                          </span>
                          {s.txHash && (
                            <a
                              href={`https://stellar.expert/explorer/testnet/tx/${s.txHash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-mono-code text-secondary dark:text-neutral-400 hover:text-foreground"
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

        {/* Sponsor panel (right column on desktop, stacks below on mobile) */}
        <div className="lg:w-80 shrink-0">
          <div className="lg:sticky lg:top-24 space-y-6">
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-outline-variant dark:border-neutral-800 space-y-6 shadow-sm">
              <h3 className="font-headline-md text-foreground font-bold">
                Sponsor this project
              </h3>

              {sponsor.state.status === "idle" && (
                <>
                  <div className="relative">
                    <input
                      className="w-full bg-surface-container dark:bg-neutral-800 text-foreground border border-transparent dark:border-neutral-700 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary font-body-lg outline-none"
                      placeholder="0.00"
                      type="number"
                      value={sponsor.amount}
                      onChange={(e) => sponsor.setAmount(e.target.value)}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono-code text-secondary dark:text-neutral-400">
                      XLM
                    </span>
                  </div>
                  <button
                    onClick={handleSponsorClick}
                    className="w-full bg-primary dark:bg-neutral-100 text-on-primary dark:text-neutral-900 py-3.5 rounded-full font-bold text-body-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span className="material-symbols-outlined">electric_bolt</span>
                    {wallet.isConnected ? "Sponsor with Wallet" : "Connect Wallet to Sponsor"}
                  </button>
                  <p className="text-secondary dark:text-neutral-400 text-[11px] text-center">
                    SponsorChain runs on Stellar Testnet. No real funds required.
                  </p>
                  {ownerKeyError && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 leading-snug flex gap-2">
                      <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">warning</span>
                      <span>{ownerKeyError}</span>
                    </div>
                  )}
                </>
              )}

              {/* Review */}
              {sponsor.state.status === "review" && (
                <div className="space-y-6">
                  <div className="p-4 bg-surface-container dark:bg-neutral-800 rounded-xl text-center space-y-1">
                    <span className="text-secondary dark:text-neutral-400 text-body-sm font-semibold uppercase block">
                      Sponsorship Amount
                    </span>
                    <span className="font-headline-lg text-emerald-600 dark:text-emerald-400 font-bold">
                      {sponsor.amount} XLM
                    </span>
                  </div>
                  <div className="space-y-3 text-body-sm font-semibold">
                    <div className="flex justify-between border-b border-outline-variant/30 dark:border-neutral-800 pb-2">
                      <span className="text-secondary dark:text-neutral-400">To Project</span>
                      <span className="text-foreground">{project.name}</span>
                    </div>
                    <div className="flex justify-between pb-2">
                      <span className="text-secondary dark:text-neutral-400">Owner Wallet</span>
                      <span className="font-mono-code text-foreground">
                        {formatPublicKey(project.owner)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleConfirmSponsor}
                    className="w-full bg-primary dark:bg-neutral-100 text-on-primary dark:text-neutral-900 py-3.5 rounded-full font-bold hover:opacity-90 active:scale-95 transition-all"
                  >
                    Sign &amp; Send Payment
                  </button>
                  <button
                    onClick={sponsor.reset}
                    className="w-full text-secondary dark:text-neutral-400 text-body-sm font-medium hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Pending */}
              {sponsor.state.status === "pending" && (
                <div className="py-10 flex flex-col items-center gap-4 text-center">
                  <span className="animate-spin material-symbols-outlined text-[48px] text-primary dark:text-neutral-100">
                    progress_activity
                  </span>
                  <p className="font-semibold text-body-md text-foreground">
                    {sponsor.state.txHash
                      ? "Confirming on-chain..."
                      : "Please sign in your wallet..."}
                  </p>
                  {sponsor.state.txHash && (
                    <div className="w-full p-2 bg-surface-container dark:bg-neutral-800 text-foreground rounded-lg font-mono-code text-[11px] truncate">
                      TX: {sponsor.state.txHash}
                    </div>
                  )}
                </div>
              )}

              {/* Success */}
              {sponsor.state.status === "success" && (
                <div className="space-y-6 text-center">
                  <div className="w-16 h-16 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                    <span className="material-symbols-outlined text-[36px]">verified</span>
                  </div>
                  <h4 className="font-bold text-body-lg text-foreground">
                    Sponsored {sponsor.amount} XLM!
                  </h4>
                  <p className="text-secondary dark:text-neutral-400 text-body-sm">
                    Your contribution is live on the Stellar testnet.
                  </p>
                  {sponsor.state.txHash && (
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${sponsor.state.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 bg-surface-container dark:bg-neutral-800 px-4 py-2 rounded-full font-mono-code text-body-sm text-foreground hover:bg-surface-container-high dark:hover:bg-neutral-700"
                    >
                      View on Explorer
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    </a>
                  )}
                  <button
                    onClick={sponsor.reset}
                    className="w-full bg-primary dark:bg-neutral-100 text-on-primary dark:text-neutral-900 py-3.5 rounded-full font-bold"
                  >
                    Done
                  </button>
                </div>
              )}

              {/* Failed */}
              {sponsor.state.status === "failed" && (
                <div className="space-y-6">
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-body-sm rounded-xl border border-rose-200 dark:border-rose-900 font-medium leading-relaxed">
                    {sponsor.state.errorMessage}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={sponsor.reset} className="flex-1 bg-surface-container dark:bg-neutral-800 text-foreground py-3 rounded-full font-semibold">
                      Cancel
                    </button>
                    <button onClick={handleConfirmSponsor} className="flex-1 bg-primary dark:bg-neutral-100 text-on-primary dark:text-neutral-900 py-3 rounded-full font-semibold">
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
