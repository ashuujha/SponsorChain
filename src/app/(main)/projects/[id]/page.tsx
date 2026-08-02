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
          const ownerKey = p.ownerWalletKey || p.owner?.walletPublicKey || "";
          let liveTotalStroops = BigInt(0);

          if (ownerKey) {
            try {
              const hRes = await fetch(
                `https://horizon-testnet.stellar.org/accounts/${ownerKey}/payments?limit=200`
              );
              if (hRes.ok) {
                const hData = await hRes.json();
                const payments = hData._embedded?.records || [];
                for (const pay of payments) {
                  if (
                    pay.type === "payment" &&
                    pay.asset_type === "native" &&
                    pay.to === ownerKey
                  ) {
                    const amountXlm = parseFloat(pay.amount || "0");
                    liveTotalStroops += BigInt(Math.floor(amountXlm * 10_000_000));
                  }
                }
              }
            } catch (hErr) {
              console.warn("Horizon live balance fetch warning:", hErr);
            }
          }

          let dbTotalStroops = BigInt(0);
          const mappedSponsorships: SponsorshipData[] = (p.sponsorships || []).map(
            (s: ApiSponsorship, idx: number) => {
              const amtNum = parseFloat(s.amountXLM || "0");
              const amtStroops = BigInt(Math.floor(amtNum * 10_000_000));
              dbTotalStroops += amtStroops;
              return {
                id: BigInt(idx),
                sponsor: s.sponsorWalletKey || s.sponsor?.walletPublicKey || "Anonymous",
                projectId: BigInt(0),
                amount: amtStroops.toString(),
                timestamp: BigInt(Math.floor(new Date(s.createdAt).getTime() / 1000)),
                txHash: s.txHash,
              };
            }
          );

          const finalTotalStroops = liveTotalStroops > dbTotalStroops ? liveTotalStroops : dbTotalStroops;

          const projectData: ProjectData = {
            id: p.id,
            owner: ownerKey,
            repoFullName: p.repoUrl,
            name: p.name,
            description: p.description,
            totalRaised: finalTotalStroops.toString(),
            sponsorCount: Math.max(p.sponsorships?.length || 0, mappedSponsorships.length),
            createdAt: BigInt(Math.floor(new Date(p.createdAt).getTime() / 1000)),
          };

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
        Math.floor(parseFloat(amountXLM) * 10_000_000)
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
    const whole = n / BigInt(10_000_000);
    const frac = n % BigInt(10_000_000);
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
      <div className="flex flex-col items-center justify-center py-40 gap-4 bg-background min-h-screen text-foreground">
        <span className="animate-spin material-symbols-outlined text-[40px] text-foreground">
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
      <div className="max-w-md mx-auto py-24 text-center space-y-4 px-4 bg-background min-h-screen text-foreground">
        <span className="material-symbols-outlined text-[48px] text-muted">search_off</span>
        <h3 className="display-md text-foreground">Project not found</h3>
        <p className="body-serif text-muted text-sm">This project may have been removed.</p>
        <Link href="/explore">
          <Button size="lg" className="min-h-[44px]">Browse Projects</Button>
        </Link>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="pb-24 px-4 sm:px-6 lg:px-8 max-w-container-max mx-auto pt-8 sm:pt-12 relative bg-background min-h-screen text-foreground transition-colors overflow-x-hidden">
      <Link
        href="/explore"
        className="bugatti-link inline-flex items-center gap-2 mb-6 sm:mb-8 text-xs min-h-[44px]"
      >
        &larr; BACK TO EXPLORE
      </Link>

      {/* Grid Layout: 1 single SponsorCard in DOM, positioned right under header on mobile, sticky sidebar on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 lg:gap-12 items-start">
        {/* Column 1 - Header Block (Order 1 on Mobile & Desktop) */}
        <div className="order-1 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 border-b border-hairline pb-6 sm:pb-8">
          <ProjectAvatar name={project.name} size="lg" />
          <div className="space-y-2 min-w-0">
            <h1 className="display-lg font-normal text-foreground uppercase break-words">
              {project.name}
            </h1>
            <a
              className="font-mono text-xs text-muted hover:text-foreground uppercase tracking-[1.5px] inline-flex items-center gap-2 max-w-full truncate"
              href={`https://github.com/${project.repoFullName}`}
              target="_blank"
              rel="noreferrer"
            >
              <span className="shrink-0">REPO:</span>
              <span className="text-foreground underline truncate">{project.repoFullName}</span>
            </a>
          </div>
        </div>

        {/* Sponsor Panel: Single DOM node! Order 2 on Mobile (right after header), Sidebar on Desktop */}
        <div className="order-2 lg:order-none lg:col-start-2 lg:row-start-1 lg:row-span-4 lg:sticky lg:top-24 w-full">
          <SponsorCard
            project={project}
            wallet={wallet}
            sponsor={sponsor}
            ownerKeyError={ownerKeyError}
            handleSponsorClick={handleSponsorClick}
            handleConfirmSponsor={handleConfirmSponsor}
            formatPublicKey={formatPublicKey}
          />
        </div>

        {/* Column 1 - Project Description (Order 3 on Mobile) */}
        <div className="order-3 lg:order-none lg:col-start-1">
          <p className="body-serif text-base sm:text-lg md:text-xl text-muted leading-relaxed max-w-3xl break-words">
            {project.description}
          </p>
        </div>

        {/* Column 1 - Spec Cells (Order 4 on Mobile) */}
        <div className="order-4 lg:order-none lg:col-start-1 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 py-6 border-y border-hairline">
          <div className="space-y-1">
            <div className="caption-uppercase text-muted text-[10px] sm:text-xs">TOTAL RAISED</div>
            <div className="display-md font-normal text-foreground">
              {formatXlm(project.totalRaised)} XLM
            </div>
          </div>

          <div className="space-y-1">
            <div className="caption-uppercase text-muted text-[10px] sm:text-xs">SPONSORS</div>
            <div className="display-md font-normal text-foreground">
              {project.sponsorCount}
            </div>
          </div>

          <div className="space-y-1 min-w-0">
            <div className="caption-uppercase text-muted text-[10px] sm:text-xs">OWNER WALLET</div>
            <div className="font-mono text-xs sm:text-sm font-normal text-foreground tracking-[1px] truncate pt-1 sm:pt-2">
              {formatPublicKey(project.owner)}
            </div>
          </div>
        </div>

        {/* Column 1 - Sponsorship Activity (Order 5 on Mobile) */}
        <div className="order-5 lg:order-none lg:col-start-1 space-y-6 pt-4">
          <h3 className="font-mono text-sm sm:text-base text-foreground uppercase tracking-[2px]">
            Sponsorships
          </h3>
          <div className="bg-surface border border-hairline rounded-none overflow-hidden">
            {sponsorships.length === 0 ? (
              <div className="p-8 sm:p-12 text-center body-serif text-muted text-sm">
                No sponsorships yet — be the first!
              </div>
            ) : (
              <div className="divide-y divide-hairline">
                {sponsorships.map((s) => {
                  const shortSponsor = `${s.sponsor.slice(0, 6)}...${s.sponsor.slice(-6)}`;
                  return (
                    <div
                      key={s.id.toString()}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-3 hover:bg-surface-container transition-colors"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 border border-hairline flex items-center justify-center font-serif text-foreground shrink-0">
                          S
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-mono text-xs text-foreground uppercase tracking-[1px] truncate">
                            {shortSponsor}
                          </span>
                          <span className="caption-uppercase text-[10px] text-muted mt-0.5">
                            {new Date(Number(s.timestamp) * 1000).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 pt-2 sm:pt-0 border-t sm:border-t-0 border-hairline">
                        <span className="font-mono text-xs sm:text-sm text-foreground uppercase tracking-[1.5px]">
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
        </div>
      </div>
    </div>
  );
}

function SponsorCard({
  project,
  wallet,
  sponsor,
  ownerKeyError,
  handleSponsorClick,
  handleConfirmSponsor,
  formatPublicKey,
}: {
  project: ProjectData;
  wallet: ReturnType<typeof useWallet>;
  sponsor: ReturnType<typeof useSponsorProject>;
  ownerKeyError: string | null;
  handleSponsorClick: () => void;
  handleConfirmSponsor: () => void;
  formatPublicKey: (k: string) => string;
}) {
  return (
    <div className="bg-surface border border-hairline rounded-none p-6 sm:p-8 space-y-6 sm:space-y-8 w-full">
      <h3 className="font-mono text-sm sm:text-base text-foreground uppercase tracking-[2px]">
        Sponsor this project
      </h3>

      {sponsor.state.status === "idle" && (
        <>
          <div className="space-y-2">
            <label className="caption-uppercase text-muted block text-xs">AMOUNT (XLM)</label>
            <input
              className="bugatti-input w-full text-base sm:text-lg min-h-[44px]"
              placeholder="0.00"
              type="number"
              value={sponsor.amount}
              onChange={(e) => sponsor.setAmount(e.target.value)}
            />
          </div>

          <Button
            onClick={handleSponsorClick}
            className="w-full min-h-[44px]"
            size="lg"
          >
            {wallet.isConnected ? "Sponsor with Wallet" : "Connect Wallet to Sponsor"}
          </Button>

          <p className="caption-uppercase text-[10px] text-muted text-center leading-relaxed">
            STELLAR TESTNET FACILITY // NO REAL FUNDS REQUIRED
          </p>

          {ownerKeyError && (
            <div className="p-4 bg-surface-container border border-hairline text-xs text-foreground font-mono leading-relaxed break-words">
              {ownerKeyError}
            </div>
          )}
        </>
      )}

      {/* Review */}
      {sponsor.state.status === "review" && (
        <div className="space-y-6">
          <div className="p-6 bg-background border border-hairline text-center space-y-2">
            <span className="caption-uppercase text-muted block uppercase">
              Sponsorship Amount
            </span>
            <span className="display-md font-normal text-foreground">
              {sponsor.amount} XLM
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs text-foreground">
            <div className="flex justify-between border-b border-hairline pb-2">
              <span className="text-muted">To Project</span>
              <span className="truncate max-w-[160px]">{project.name}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-muted">Owner Wallet</span>
              <span>{formatPublicKey(project.owner)}</span>
            </div>
          </div>

          <Button onClick={handleConfirmSponsor} className="w-full min-h-[44px]" size="lg">
            Sign &amp; Send Payment
          </Button>
          <button
            onClick={sponsor.reset}
            className="w-full font-mono text-xs uppercase tracking-[2px] text-muted hover:text-foreground text-center py-2"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Pending */}
      {sponsor.state.status === "pending" && (
        <div className="py-8 sm:py-12 flex flex-col items-center gap-4 text-center">
          <span className="animate-spin material-symbols-outlined text-[36px] sm:text-[40px] text-foreground">
            progress_activity
          </span>
          <p className="caption-uppercase text-foreground text-xs sm:text-sm">
            {sponsor.state.txHash
              ? "Confirming on-chain..."
              : "Please sign in your wallet..."}
          </p>
          {sponsor.state.txHash && (
            <div className="w-full p-3 bg-background border border-hairline font-mono text-[10px] text-muted truncate">
              TX: {sponsor.state.txHash}
            </div>
          )}
        </div>
      )}

      {/* Success */}
      {sponsor.state.status === "success" && (
        <div className="space-y-6 text-center">
          <div className="w-12 h-12 border border-foreground rounded-full flex items-center justify-center mx-auto text-foreground">
            <span className="material-symbols-outlined text-[24px]">done</span>
          </div>
          <h4 className="font-mono text-sm sm:text-base uppercase tracking-[2px] text-foreground">
            Sponsored {sponsor.amount} XLM!
          </h4>
          <p className="body-serif text-muted text-sm">
            Your contribution is live on the Stellar testnet.
          </p>
          {sponsor.state.txHash && (
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${sponsor.state.txHash}`}
              target="_blank"
              rel="noreferrer"
              className="bugatti-link inline-block min-h-[44px] leading-[44px]"
            >
              VIEW ON EXPLORER &rarr;
            </a>
          )}
          <Button onClick={sponsor.reset} className="w-full min-h-[44px]">
            Done
          </Button>
        </div>
      )}

      {/* Failed */}
      {sponsor.state.status === "failed" && (
        <div className="space-y-6">
          <div className="p-4 bg-background border border-hairline text-xs font-mono text-foreground leading-relaxed break-words">
            {sponsor.state.errorMessage}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="secondary" onClick={sponsor.reset} className="w-full sm:flex-1 min-h-[44px]">
              Cancel
            </Button>
            <Button onClick={handleConfirmSponsor} className="w-full sm:flex-1 min-h-[44px]">
              Try Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
