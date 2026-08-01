"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useWallet } from "@/features/wallet/use-wallet";
import { useSponsorProject } from "@/features/projects/use-sponsor-project";
import { ProjectAvatar } from "@/components/shared/project-avatar";
import { Button } from "@/components/ui/button";
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
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <span className="animate-spin material-symbols-outlined text-[40px] text-aubergine dark:text-aubergine-mute">
          progress_activity
        </span>
        <p className="font-semibold text-text-secondary text-base">
          Reading from contract state...
        </p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <span className="material-symbols-outlined text-[48px] text-text-secondary">search_off</span>
        <h3 className="font-bold text-2xl text-foreground">Project not found</h3>
        <p className="text-text-secondary text-sm">This project may have been removed.</p>
        <Link href="/explore">
          <Button size="lg">Browse Projects</Button>
        </Link>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="pb-16 px-4 sm:px-6 lg:px-8 max-w-container-max mx-auto pt-6 relative">
      <Link
        href="/explore"
        className="inline-flex items-center gap-1.5 text-text-secondary hover:text-link-blue font-semibold text-sm transition-colors mb-6"
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
              <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                {project.name}
              </h1>
              <a
                className="inline-flex items-center gap-1.5 slacc-link font-mono text-sm"
                href={`https://github.com/${project.repoFullName}`}
                target="_blank"
                rel="noreferrer"
              >
                <span className="material-symbols-outlined text-[16px]">terminal</span>
                {project.repoFullName}
              </a>
            </div>
          </div>

          <p className="text-lg text-foreground leading-relaxed max-w-3xl">
            {project.description}
          </p>

          {/* Slacc Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface dark:bg-surface p-6 rounded-2xl border border-border-color flex flex-col justify-between h-36 shadow-xs">
              <span className="text-text-secondary font-bold text-xs uppercase tracking-widest">
                Total Raised
              </span>
              <span className="display-stat text-4xl font-extrabold">
                {formatXlm(project.totalRaised)} XLM
              </span>
            </div>

            <div className="bg-surface dark:bg-surface p-6 rounded-2xl border border-border-color flex flex-col justify-between h-36 shadow-xs">
              <span className="text-text-secondary font-bold text-xs uppercase tracking-widest">
                Sponsors
              </span>
              <span className="display-stat text-4xl font-extrabold">
                {project.sponsorCount}
              </span>
            </div>

            <div className="bg-surface dark:bg-surface p-6 rounded-2xl border border-border-color flex flex-col justify-between h-36 shadow-xs">
              <span className="text-text-secondary font-bold text-xs uppercase tracking-widest">
                Owner
              </span>
              <span className="font-mono text-sm font-bold text-foreground truncate">
                {formatPublicKey(project.owner)}
              </span>
            </div>
          </div>

          {/* Sponsorships */}
          <section className="space-y-4 pt-4">
            <h3 className="text-2xl font-extrabold text-foreground">Sponsorship Activity</h3>
            <div className="bg-surface dark:bg-surface rounded-2xl border border-border-color overflow-hidden shadow-xs">
              {sponsorships.length === 0 ? (
                <div className="p-10 text-center text-text-secondary text-sm">
                  No sponsorships yet — be the first to support this repository!
                </div>
              ) : (
                <div className="divide-y divide-border-color/60">
                  {sponsorships.map((s) => {
                    const shortSponsor = `${s.sponsor.slice(0, 6)}...${s.sponsor.slice(-6)}`;
                    return (
                      <div
                        key={s.id.toString()}
                        className="flex items-center justify-between p-4 hover:bg-canvas-cream/50 dark:hover:bg-surface-container/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-canvas-lavender dark:bg-surface-container flex items-center justify-center border border-border-color/40">
                            <span className="material-symbols-outlined text-aubergine dark:text-aubergine-mute text-[20px]">person</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground font-mono text-sm">
                              {shortSponsor}
                            </span>
                            <span className="text-text-secondary text-xs">
                              {new Date(Number(s.timestamp) * 1000).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span className="font-extrabold text-aubergine dark:text-aubergine-mute text-base">
                            {formatXlm(s.amount)} XLM
                          </span>
                          {s.txHash && (
                            <a
                              href={`https://stellar.expert/explorer/testnet/tx/${s.txHash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-mono slacc-link"
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

        {/* Sponsor panel */}
        <div className="lg:w-84 shrink-0">
          <div className="lg:sticky lg:top-24 space-y-6">
            <div className="bg-surface dark:bg-surface p-6 rounded-2xl border border-border-color space-y-6 shadow-md">
              <h3 className="text-xl font-extrabold text-foreground">
                Sponsor this project
              </h3>

              {sponsor.state.status === "idle" && (
                <>
                  <div className="relative">
                    <input
                      className="w-full bg-canvas-cream dark:bg-surface-container text-foreground border border-border-color rounded-2xl py-3.5 px-4 focus:ring-2 focus:ring-aubergine text-lg font-bold outline-none"
                      placeholder="0.00"
                      type="number"
                      value={sponsor.amount}
                      onChange={(e) => sponsor.setAmount(e.target.value)}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono font-bold text-text-secondary text-sm">
                      XLM
                    </span>
                  </div>

                  <Button
                    onClick={handleSponsorClick}
                    className="w-full shadow-md"
                  >
                    <span className="material-symbols-outlined mr-1">bolt</span>
                    {wallet.isConnected ? "Sponsor with Wallet" : "Connect Wallet to Sponsor"}
                  </Button>

                  <p className="text-text-secondary text-xs text-center leading-relaxed">
                    SponsorChain runs on Stellar Testnet. No real funds required.
                  </p>

                  {ownerKeyError && (
                    <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-900 dark:text-amber-300 leading-snug flex gap-2">
                      <span className="material-symbols-outlined text-[18px] shrink-0">warning</span>
                      <span>{ownerKeyError}</span>
                    </div>
                  )}
                </>
              )}

              {/* Review */}
              {sponsor.state.status === "review" && (
                <div className="space-y-6">
                  <div className="p-4 bg-canvas-cream dark:bg-surface-container rounded-2xl text-center space-y-1 border border-border-color">
                    <span className="text-text-secondary text-xs font-bold uppercase tracking-widest block">
                      Sponsorship Amount
                    </span>
                    <span className="display-stat text-3xl font-extrabold">
                      {sponsor.amount} XLM
                    </span>
                  </div>

                  <div className="space-y-3 text-sm font-semibold">
                    <div className="flex justify-between border-b border-border-color/60 pb-2">
                      <span className="text-text-secondary">To Project</span>
                      <span className="text-foreground">{project.name}</span>
                    </div>
                    <div className="flex justify-between pb-2">
                      <span className="text-text-secondary">Owner Wallet</span>
                      <span className="font-mono text-foreground">
                        {formatPublicKey(project.owner)}
                      </span>
                    </div>
                  </div>

                  <Button onClick={handleConfirmSponsor} className="w-full shadow-md">
                    Sign &amp; Send Payment
                  </Button>
                  <button
                    onClick={sponsor.reset}
                    className="w-full text-text-secondary text-sm font-medium hover:text-foreground text-center"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Pending */}
              {sponsor.state.status === "pending" && (
                <div className="py-10 flex flex-col items-center gap-4 text-center">
                  <span className="animate-spin material-symbols-outlined text-[48px] text-aubergine dark:text-aubergine-mute">
                    progress_activity
                  </span>
                  <p className="font-bold text-base text-foreground">
                    {sponsor.state.txHash
                      ? "Confirming on-chain..."
                      : "Please sign in your wallet..."}
                  </p>
                  {sponsor.state.txHash && (
                    <div className="w-full p-2.5 bg-canvas-cream dark:bg-surface-container text-foreground rounded-xl font-mono text-xs truncate">
                      TX: {sponsor.state.txHash}
                    </div>
                  )}
                </div>
              )}

              {/* Success */}
              {sponsor.state.status === "success" && (
                <div className="space-y-6 text-center">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                    <span className="material-symbols-outlined text-[36px]">verified</span>
                  </div>
                  <h4 className="font-extrabold text-xl text-foreground">
                    Sponsored {sponsor.amount} XLM!
                  </h4>
                  <p className="text-text-secondary text-sm">
                    Your contribution is live on the Stellar testnet.
                  </p>
                  {sponsor.state.txHash && (
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${sponsor.state.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 bg-canvas-cream dark:bg-surface-container px-4 py-2 rounded-full font-mono text-xs text-foreground hover:bg-canvas-lavender"
                    >
                      View on Explorer
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    </a>
                  )}
                  <Button onClick={sponsor.reset} className="w-full">
                    Done
                  </Button>
                </div>
              )}

              {/* Failed */}
              {sponsor.state.status === "failed" && (
                <div className="space-y-6">
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 text-sm rounded-2xl border border-rose-200 dark:border-rose-900 font-medium leading-relaxed">
                    {sponsor.state.errorMessage}
                  </div>
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={sponsor.reset} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={handleConfirmSponsor} className="flex-1">
                      Try Again
                    </Button>
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
