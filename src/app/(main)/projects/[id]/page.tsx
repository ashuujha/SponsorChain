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
      <div className="flex flex-col items-center justify-center py-40 gap-4 bg-black min-h-screen">
        <span className="animate-spin material-symbols-outlined text-[40px] text-white">
          progress_activity
        </span>
        <p className="caption-uppercase text-muted">
          READING CONTRACT STATE...
        </p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4 bg-black min-h-screen text-white">
        <span className="material-symbols-outlined text-[48px] text-muted">search_off</span>
        <h3 className="display-md text-2xl text-white">PROJECT NOT FOUND</h3>
        <p className="body-serif text-muted text-sm">This project may have been removed.</p>
        <Link href="/explore">
          <Button size="lg">EXPLORE PROJECTS</Button>
        </Link>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="pb-24 px-4 sm:px-6 lg:px-8 max-w-container-max mx-auto pt-12 relative bg-black min-h-screen text-white">
      <Link
        href="/explore"
        className="bugatti-link inline-flex items-center gap-2 mb-8"
      >
        &larr; BACK TO EXPLORE
      </Link>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Main column */}
        <div className="flex-grow space-y-12 max-w-4xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 border-b border-hairline pb-8">
            <ProjectAvatar name={project.name} size="lg" />
            <div className="space-y-2">
              <h1 className="display-lg text-3xl sm:text-4xl md:text-5xl font-normal text-white tracking-[3px] uppercase">
                {project.name}
              </h1>
              <a
                className="font-mono text-xs text-muted hover:text-white uppercase tracking-[2px] inline-flex items-center gap-2"
                href={`https://github.com/${project.repoFullName}`}
                target="_blank"
                rel="noreferrer"
              >
                <span>REPOSITORY:</span>
                <span className="text-white underline">{project.repoFullName}</span>
              </a>
            </div>
          </div>

          <p className="body-serif text-lg md:text-xl text-body leading-relaxed max-w-3xl">
            {project.description}
          </p>

          {/* Bugatti Vehicle Spec Cells */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-6 border-y border-hairline">
            <div className="space-y-1">
              <div className="caption-uppercase text-muted">TOTAL RAISED</div>
              <div className="display-md text-3xl font-normal text-white tracking-[2px]">
                {formatXlm(project.totalRaised)} XLM
              </div>
            </div>

            <div className="space-y-1">
              <div className="caption-uppercase text-muted">SPONSORS</div>
              <div className="display-md text-3xl font-normal text-white tracking-[2px]">
                {project.sponsorCount}
              </div>
            </div>

            <div className="space-y-1">
              <div className="caption-uppercase text-muted">OWNER WALLET</div>
              <div className="font-mono text-sm font-normal text-white tracking-[1.5px] truncate pt-2">
                {formatPublicKey(project.owner)}
              </div>
            </div>
          </div>

          {/* Sponsorship Activity */}
          <section className="space-y-6 pt-4">
            <h3 className="font-mono text-base text-white uppercase tracking-[2px]">
              SPONSORSHIP TRANSACTIONS
            </h3>
            <div className="bg-surface-card border border-hairline rounded-none overflow-hidden">
              {sponsorships.length === 0 ? (
                <div className="p-12 text-center body-serif text-muted text-sm">
                  No sponsorships recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-hairline">
                  {sponsorships.map((s) => {
                    const shortSponsor = `${s.sponsor.slice(0, 6)}...${s.sponsor.slice(-6)}`;
                    return (
                      <div
                        key={s.id.toString()}
                        className="flex items-center justify-between p-5 hover:bg-surface-elevated transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-9 h-9 border border-hairline flex items-center justify-center font-serif text-white">
                            S
                          </div>
                          <div className="flex flex-col">
                            <span className="font-mono text-xs text-white uppercase tracking-[1.5px]">
                              {shortSponsor}
                            </span>
                            <span className="caption-uppercase text-[10px] text-muted mt-0.5">
                              {new Date(Number(s.timestamp) * 1000).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span className="font-mono text-sm text-white uppercase tracking-[1.5px]">
                            {formatXlm(s.amount)} XLM
                          </span>
                          {s.txHash && (
                            <a
                              href={`https://stellar.expert/explorer/testnet/tx/${s.txHash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="bugatti-link text-[10px]"
                            >
                              EXPLORER TX &rarr;
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
        <div className="lg:w-88 shrink-0">
          <div className="lg:sticky lg:top-24 space-y-6">
            <div className="bg-surface-card border border-hairline rounded-none p-8 space-y-8">
              <h3 className="font-mono text-base text-white uppercase tracking-[2px]">
                SPONSOR REPOSITORY
              </h3>

              {sponsor.state.status === "idle" && (
                <>
                  <div className="space-y-2">
                    <label className="caption-uppercase text-muted block">AMOUNT (XLM)</label>
                    <input
                      className="bugatti-input w-full text-lg"
                      placeholder="0.00"
                      type="number"
                      value={sponsor.amount}
                      onChange={(e) => sponsor.setAmount(e.target.value)}
                    />
                  </div>

                  <Button
                    onClick={handleSponsorClick}
                    className="w-full"
                    size="lg"
                  >
                    {wallet.isConnected ? "SPONSOR WITH WALLET" : "CONNECT WALLET"}
                  </Button>

                  <p className="caption-uppercase text-[10px] text-muted text-center leading-relaxed">
                    STELLAR TESTNET FACILITY // NO REAL FUNDS REQUIRED
                  </p>

                  {ownerKeyError && (
                    <div className="p-4 bg-surface-elevated border border-hairline-strong text-xs text-white font-mono leading-relaxed">
                      {ownerKeyError}
                    </div>
                  )}
                </>
              )}

              {/* Review */}
              {sponsor.state.status === "review" && (
                <div className="space-y-6">
                  <div className="p-6 bg-black border border-hairline text-center space-y-2">
                    <span className="caption-uppercase text-muted block">
                      SPONSORSHIP AMOUNT
                    </span>
                    <span className="display-md text-3xl font-normal text-white tracking-[2px]">
                      {sponsor.amount} XLM
                    </span>
                  </div>

                  <div className="space-y-3 font-mono text-xs text-white">
                    <div className="flex justify-between border-b border-hairline pb-2">
                      <span className="text-muted">REPOS</span>
                      <span>{project.name}</span>
                    </div>
                    <div className="flex justify-between pb-2">
                      <span className="text-muted">OWNER WALLET</span>
                      <span>{formatPublicKey(project.owner)}</span>
                    </div>
                  </div>

                  <Button onClick={handleConfirmSponsor} className="w-full" size="lg">
                    SIGN &amp; SUBMIT PAYMENT
                  </Button>
                  <button
                    onClick={sponsor.reset}
                    className="w-full font-mono text-xs uppercase tracking-[2px] text-muted hover:text-white text-center"
                  >
                    CANCEL
                  </button>
                </div>
              )}

              {/* Pending */}
              {sponsor.state.status === "pending" && (
                <div className="py-12 flex flex-col items-center gap-4 text-center">
                  <span className="animate-spin material-symbols-outlined text-[40px] text-white">
                    progress_activity
                  </span>
                  <p className="caption-uppercase text-white">
                    {sponsor.state.txHash
                      ? "CONFIRMING ON-CHAIN..."
                      : "PLEASE SIGN TRANSACTION..."}
                  </p>
                  {sponsor.state.txHash && (
                    <div className="w-full p-3 bg-black border border-hairline font-mono text-[10px] text-muted truncate">
                      TX: {sponsor.state.txHash}
                    </div>
                  )}
                </div>
              )}

              {/* Success */}
              {sponsor.state.status === "success" && (
                <div className="space-y-6 text-center">
                  <div className="w-12 h-12 border border-white rounded-full flex items-center justify-center mx-auto text-white">
                    <span className="material-symbols-outlined text-[24px]">done</span>
                  </div>
                  <h4 className="font-mono text-base uppercase tracking-[2px] text-white">
                    SPONSORED {sponsor.amount} XLM
                  </h4>
                  <p className="body-serif text-muted text-sm">
                    Transaction verified on the Stellar testnet ledger.
                  </p>
                  {sponsor.state.txHash && (
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${sponsor.state.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bugatti-link inline-block"
                    >
                      VIEW ON EXPLORER &rarr;
                    </a>
                  )}
                  <Button onClick={sponsor.reset} className="w-full">
                    DONE
                  </Button>
                </div>
              )}

              {/* Failed */}
              {sponsor.state.status === "failed" && (
                <div className="space-y-6">
                  <div className="p-4 bg-black border border-hairline-strong text-xs font-mono text-white leading-relaxed">
                    {sponsor.state.errorMessage}
                  </div>
                  <div className="flex gap-4">
                    <Button variant="secondary" onClick={sponsor.reset} className="flex-1">
                      CANCEL
                    </Button>
                    <Button onClick={handleConfirmSponsor} className="flex-1">
                      RETRY
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
