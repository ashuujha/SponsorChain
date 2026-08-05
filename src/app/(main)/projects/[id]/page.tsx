"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useWallet } from "@/features/wallet/use-wallet";
import { useSponsorProject } from "@/features/projects/use-sponsor-project";
import { ProjectAvatar } from "@/components/shared/project-avatar";
import {
  ProjectData,
  SponsorshipData,
} from "@/features/projects/contract-data";
import {
  fetchOnChainProject,
  fetchOnChainSponsorshipsForProject,
} from "@/lib/soroban-client";
import { EXPLORER_BASE } from "@/lib/stellar-config";
import { ArrowLeft, ArrowRight } from "lucide-react";

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
      const numericId = BigInt(isNaN(Number(idStr)) ? 0 : idStr);
      const p = await fetchOnChainProject(numericId);

      if (!p) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      const chainSponsorships = await fetchOnChainSponsorshipsForProject(numericId);
      setProject(p);
      setSponsorships(chainSponsorships);
    } catch {
      setNotFound(true);
    }
    setIsLoading(false);
  }, [idStr]);

  const onSuccessRef = useRef<(txHash: string) => void>(() => {});
  useEffect(() => {
    onSuccessRef.current = async (_txHash: string) => {
      void _txHash;
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
      project.id,
      sponsor.amount,
      wallet.balance || "0"
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4 bg-[#F5F5F5] min-h-screen text-black">
        <span className="animate-spin material-symbols-outlined text-[40px] text-black">
          progress_activity
        </span>
        <p className="text-black/60 text-xs font-mono uppercase tracking-widest">
          Reading Soroban contract state...
        </p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-md mx-auto py-32 text-center space-y-4 px-6 bg-[#F5F5F5] min-h-screen text-black">
        <span className="material-symbols-outlined text-[52px] text-black/30">search_off</span>
        <h3 className="text-3xl font-medium text-black">Project Not Found</h3>
        <p className="text-black/70 text-base">This project may have been unlisted or removed on-chain.</p>
        <Link href="/explore" className="inline-flex items-center gap-2 bg-black text-white px-7 py-3 rounded-full hover:bg-gray-800 transition-colors font-medium text-sm">
          <ArrowLeft className="w-4 h-4" />
          <span>Browse Projects</span>
        </Link>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="w-full pb-24 px-6 max-w-[88rem] mx-auto pt-28 relative bg-[#F5F5F5] min-h-screen text-black transition-colors overflow-x-hidden">
      <Link
        href="/explore"
        className="inline-flex items-center gap-2 mb-8 text-sm font-medium text-black/70 hover:text-black transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Explore</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-8 lg:gap-12 xl:gap-16 items-start">
        {/* Column 1 - Header Block */}
        <div className="order-1 flex flex-col sm:flex-row sm:items-center gap-6 border-b border-black/10 pb-8">
          <ProjectAvatar name={project.name} size="lg" />
          <div className="space-y-2 min-w-0">
            <h1 className="text-4xl md:text-5xl font-medium text-black tracking-tight break-words">
              {project.name}
            </h1>
            <a
              className="text-xs font-mono text-black/60 hover:text-black uppercase tracking-wider inline-flex items-center gap-2 max-w-full truncate"
              href={`https://github.com/${project.repoFullName}`}
              target="_blank"
              rel="noreferrer"
            >
              <span className="shrink-0 text-black/40">REPO:</span>
              <span className="text-black underline truncate">{project.repoFullName}</span>
            </a>
          </div>
        </div>

        {/* Sponsor Panel */}
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

        {/* Column 1 - Project Description */}
        <div className="order-3 lg:order-none lg:col-start-1">
          <p className="text-lg md:text-xl text-black/70 leading-relaxed max-w-3xl font-normal break-words">
            {project.description}
          </p>
        </div>

        {/* Column 1 - Spec Cells */}
        <div className="order-4 lg:order-none lg:col-start-1 grid grid-cols-1 sm:grid-cols-3 gap-6 py-8 border-y border-black/10">
          <div className="space-y-1">
            <div className="text-xs font-mono uppercase tracking-wider text-black/50">TOTAL RAISED</div>
            <div className="text-3xl font-medium text-black tracking-tight">
              {formatXlm(project.totalRaised)} XLM
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-mono uppercase tracking-wider text-black/50">SPONSORS</div>
            <div className="text-3xl font-medium text-black tracking-tight">
              {project.sponsorCount}
            </div>
          </div>

          <div className="space-y-1 min-w-0">
            <div className="text-xs font-mono uppercase tracking-wider text-black/50">OWNER WALLET</div>
            <div className="font-mono text-sm font-medium text-black truncate pt-1">
              {formatPublicKey(project.owner)}
            </div>
          </div>
        </div>

        {/* Column 1 - Sponsorship Activity */}
        <div className="order-5 lg:order-none lg:col-start-1 space-y-6 pt-4">
          <h3 className="text-xl font-medium text-black tracking-tight">
            Sponsorship Activity
          </h3>
          <div className="bg-white border border-black/10 rounded-2xl overflow-hidden shadow-xs">
            {sponsorships.length === 0 ? (
              <div className="p-10 text-center text-black/60 text-base font-normal">
                No sponsorships yet — be the first to support this repository!
              </div>
            ) : (
              <div className="divide-y divide-black/5">
                {sponsorships.map((s) => {
                  const shortSponsor = `${s.sponsor.slice(0, 6)}...${s.sponsor.slice(-6)}`;
                  return (
                    <div
                      key={s.id.toString()}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-3 hover:bg-black/5 transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-medium shrink-0 text-sm">
                          S
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-mono text-sm font-semibold text-black truncate">
                            {shortSponsor}
                          </span>
                          <span className="text-xs text-black/50 font-mono mt-0.5">
                            {new Date(Number(s.timestamp) * 1000).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/5">
                        <span className="font-medium text-base text-black">
                          {formatXlm(s.amount)} XLM
                        </span>
                        {s.txHash && (
                          <a
                            href={`${EXPLORER_BASE}/tx/${s.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-black/60 hover:text-black underline font-mono"
                          >
                            Explorer Tx &rarr;
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
    <div className="bg-[#2B2644] text-white rounded-2xl p-7 space-y-6 w-full shadow-lg border border-[#2B2644]">
      <h3 className="text-2xl font-medium tracking-tight text-white">
        Sponsor this project
      </h3>

      {sponsor.state.status === "idle" && (
        <>
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-white/70 block">AMOUNT (XLM)</label>
            <input
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-lg text-white placeholder:text-white/30 outline-none focus:border-white transition-colors"
              placeholder="0.00"
              type="number"
              value={sponsor.amount}
              onChange={(e) => sponsor.setAmount(e.target.value)}
            />
          </div>

          <button
            onClick={handleSponsorClick}
            className="w-full bg-white text-black font-medium py-3.5 px-6 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 shadow-md active:scale-98"
          >
            <span>{wallet.isConnected ? "Sponsor with Wallet" : "Connect Wallet to Sponsor"}</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </button>

          <p className="text-xs text-white/50 text-center leading-relaxed font-mono">
            Stellar Testnet // Direct XLM Transfer
          </p>

          {ownerKeyError && (
            <div className="p-4 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-white font-mono leading-relaxed break-words">
              {ownerKeyError}
            </div>
          )}
        </>
      )}

      {/* Review */}
      {sponsor.state.status === "review" && (
        <div className="space-y-6">
          <div className="p-6 bg-white/10 rounded-xl text-center space-y-1 border border-white/10">
            <span className="text-xs font-mono uppercase tracking-wider text-white/60 block">
              Sponsorship Amount
            </span>
            <span className="text-3xl font-medium text-white">
              {sponsor.amount} XLM
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs text-white/80">
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-white/50">To Project</span>
              <span className="truncate max-w-[160px] text-white font-semibold">{project.name}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-white/50">Owner Wallet</span>
              <span className="text-white font-semibold">{formatPublicKey(project.owner)}</span>
            </div>
          </div>

          <button onClick={handleConfirmSponsor} className="w-full bg-white text-black font-medium py-3.5 rounded-full hover:bg-gray-100 transition-colors">
            Sign &amp; Send Payment
          </button>
          <button
            onClick={sponsor.reset}
            className="w-full text-xs font-mono uppercase tracking-wider text-white/60 hover:text-white text-center py-2"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Pending */}
      {sponsor.state.status === "pending" && (
        <div className="py-10 flex flex-col items-center gap-4 text-center">
          <span className="animate-spin material-symbols-outlined text-[40px] text-white">
            progress_activity
          </span>
          <p className="text-sm font-medium text-white">
            {sponsor.state.txHash
              ? "Confirming on Stellar network..."
              : "Please sign in your Stellar wallet..."}
          </p>
          {sponsor.state.txHash && (
            <div className="w-full p-3 bg-white/10 rounded-xl font-mono text-xs text-white/70 truncate border border-white/10">
              Tx: {sponsor.state.txHash}
            </div>
          )}
        </div>
      )}

      {/* Success */}
      {sponsor.state.status === "success" && (
        <div className="space-y-6 text-center py-4">
          <div className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center mx-auto shadow-md">
            <span className="material-symbols-outlined text-[28px]">done</span>
          </div>
          <h4 className="text-2xl font-medium text-white">
            Sponsored {sponsor.amount} XLM!
          </h4>
          <p className="text-white/70 text-sm">
            Your contribution is confirmed live on Stellar Testnet.
          </p>
          {sponsor.state.txHash && (
            <a
              href={`${EXPLORER_BASE}/tx/${sponsor.state.txHash}`}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-xs font-mono text-white underline hover:opacity-80"
            >
              View on Explorer &rarr;
            </a>
          )}
          <button onClick={sponsor.reset} className="w-full bg-white text-black font-medium py-3 rounded-full hover:bg-gray-100 transition-colors">
            Done
          </button>
        </div>
      )}

      {/* Failed */}
      {sponsor.state.status === "failed" && (
        <div className="space-y-6">
          <div className="p-4 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs font-mono text-white leading-relaxed break-words">
            {sponsor.state.errorMessage}
          </div>
          <div className="flex gap-3">
            <button onClick={sponsor.reset} className="flex-1 bg-white/10 border border-white/20 text-white font-medium py-3 rounded-full hover:bg-white/20 transition-colors">
              Cancel
            </button>
            <button onClick={handleConfirmSponsor} className="flex-1 bg-white text-black font-medium py-3 rounded-full hover:bg-gray-100 transition-colors">
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

