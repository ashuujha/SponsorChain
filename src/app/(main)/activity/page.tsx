"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useWallet } from "@/features/wallet/use-wallet";
import { RequireWallet } from "@/features/wallet-session";
import { Button } from "@/components/ui/button";
import { ProjectAvatar } from "@/components/shared/project-avatar";
import { useOnChainActivity } from "@/hooks/use-onchain-data";
import {
  fetchOnChainProjectsByOwner,
  unlistOnChainProject,
} from "@/lib/soroban-client";
import { ProjectData } from "@/features/projects/contract-data";
import { ArrowRight } from "lucide-react";

function formatXlm(stroops: string): string {
  const n = BigInt(stroops || "0");
  const whole = n / BigInt(10_000_000);
  const frac = n % BigInt(10_000_000);
  const fracStr = frac.toString().padStart(7, "0");
  const trimmed = fracStr.replace(/0+$/, "");
  return trimmed ? `${whole}.${trimmed}` : `${whole}.0`;
}

export default function ActivityPage() {
  const wallet = useWallet();
  const { data: events, isLoading: eventsLoading, error: eventsError, refetch: refetchEvents } = useOnChainActivity();

  const [myProjects, setMyProjects] = useState<ProjectData[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [unlistingId, setUnlistingId] = useState<bigint | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadMyProjects = useCallback(async () => {
    if (!wallet.publicKey) return;
    setProjectsLoading(true);
    try {
      const projects = await fetchOnChainProjectsByOwner(wallet.publicKey);
      setMyProjects(projects);
    } catch (err) {
      console.error("Failed to load maintainer projects:", err);
    } finally {
      setProjectsLoading(false);
    }
  }, [wallet.publicKey]);

  useEffect(() => {
    loadMyProjects();
  }, [loadMyProjects]);

  const formatActionError = (err: unknown): string => {
    const rawMessage = err instanceof Error ? err.message : String(err || "");
    if (rawMessage.includes("trying to invoke non-existent contract function")) {
      return "The contract deployed at this address does not support unlisting. Please refresh your browser to use the updated Stellar Testnet contract.";
    }
    if (rawMessage.includes("UnauthorizedMaintainer") || rawMessage.includes("Error(Contract, #7)")) {
      return "Unauthorized: Only the registered maintainer wallet can unlist this repository.";
    }
    if (rawMessage.includes("ProjectInactive") || rawMessage.includes("Error(Contract, #6)")) {
      return "This project has already been unlisted.";
    }
    if (rawMessage.includes("User declined") || rawMessage.includes("rejected")) {
      return "Transaction was cancelled in wallet.";
    }
    const diagnosticMatch = rawMessage.match(/data:\["([^"]+)"/);
    if (diagnosticMatch && diagnosticMatch[1]) {
      return `Unlist transaction failed: ${diagnosticMatch[1]}`;
    }
    return rawMessage.length > 180 ? `${rawMessage.slice(0, 180)}...` : rawMessage;
  };

  const handleUnlist = async (projectId: bigint) => {
    if (!wallet.publicKey) return;
    setUnlistingId(projectId);
    setActionError(null);
    try {
      const { getKit } = await import("@/features/wallet/use-wallet");
      const kit = await getKit();
      await unlistOnChainProject({
        projectId,
        callerPublicKey: wallet.publicKey,
        kit,
      });
      await loadMyProjects();
      refetchEvents();
    } catch (err) {
      console.error("Unlist error:", err);
      setActionError(formatActionError(err));
    } finally {
      setUnlistingId(null);
    }
  };

  return (
    <RequireWallet>
      <div className="w-full pb-24 px-6 max-w-[88rem] mx-auto pt-28 bg-[#F5F5F5] min-h-screen text-black transition-colors overflow-x-hidden space-y-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-black/10 pb-8">
          <div>
            <span className="text-black/60 text-xs font-mono uppercase tracking-widest block mb-2">
              Stellar Testnet // Maintainer Dashboard
            </span>
            <h1 className="text-4xl md:text-5xl font-medium text-black tracking-tight">
              My Repositories &amp; Activity
            </h1>
            <div className="text-xs text-black/70 mt-3 flex items-center gap-2 max-w-full font-mono">
              <span className="shrink-0 text-black/40">CONNECTED WALLET:</span>
              <code className="text-black bg-white border border-black/10 px-3 py-1 rounded-full truncate max-w-[220px] sm:max-w-none">
                {wallet.publicKey
                  ? `${wallet.publicKey.slice(0, 8)}...${wallet.publicKey.slice(-6)}`
                  : "..."}
              </code>
            </div>
          </div>

          <Link href="/list-project" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto bg-black text-white font-medium px-7 py-3 rounded-full hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-sm shadow-sm">
              <span>List New Project</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>

        {actionError && (
          <div className="p-4 border border-rose-500/30 bg-rose-500/10 text-rose-700 font-mono text-xs rounded-xl flex justify-between items-center">
            <span>{actionError}</span>
            <button onClick={() => setActionError(null)} className="underline text-[10px] uppercase font-bold">Dismiss</button>
          </div>
        )}

        {/* My Registered Projects Section */}
        <section className="space-y-6">
          <div className="flex justify-between items-center border-b border-black/10 pb-4">
            <h2 className="text-2xl font-medium text-black tracking-tight">
              My Registered Projects ({myProjects.filter(p => p.active !== false).length})
            </h2>
            <button
              onClick={loadMyProjects}
              className="text-xs font-mono font-medium text-black/70 hover:text-black bg-white border border-black/10 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              Refresh
            </button>
          </div>

          {projectsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
              <div className="bg-white border border-black/10 rounded-2xl p-6 h-36" />
              <div className="bg-white border border-black/10 rounded-2xl p-6 h-36" />
            </div>
          ) : myProjects.filter(p => p.active !== false).length === 0 ? (
            <div className="bg-white border border-black/10 rounded-2xl p-10 text-center space-y-4 shadow-xs">
              <p className="text-black/70 text-base font-normal">No active registered projects owned by this wallet.</p>
              <Link href="/list-project" className="inline-flex items-center gap-2 bg-black text-white text-sm font-medium px-6 py-2.5 rounded-full hover:bg-gray-800 transition-colors">
                <span>List a Project</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myProjects.filter(p => p.active !== false).map((p) => (
                <div key={p.id.toString()} className="bg-white border border-black/10 rounded-2xl p-7 flex flex-col justify-between space-y-6 shadow-xs">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <ProjectAvatar name={p.name} size="sm" />
                      <div className="min-w-0">
                        <h3 className="text-lg font-medium text-black truncate">{p.name}</h3>
                        <p className="text-xs font-mono text-black/50 truncate">{p.repoFullName}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-medium border border-emerald-500/30 text-emerald-700 bg-emerald-500/10 px-3 py-1 rounded-full shrink-0">
                      On-Chain
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-black/5 pt-4 text-xs font-mono">
                    <div>
                      <span className="text-black/40 block text-[10px]">TOTAL RAISED</span>
                      <span className="text-black font-semibold text-sm">{formatXlm(p.totalRaised)} XLM</span>
                    </div>

                    <button
                      disabled={unlistingId === p.id}
                      onClick={() => handleUnlist(p.id)}
                      className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-full transition-colors"
                    >
                      {unlistingId === p.id ? "Unlisting On-Chain..." : "Unlist Project"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Live Contract Events Stream */}
        <section className="space-y-6">
          <div className="flex justify-between items-center border-b border-black/10 pb-4">
            <h2 className="text-2xl font-medium text-black tracking-tight">
              Live Contract Events Stream
            </h2>
          </div>

          {eventsError ? (
            <div className="text-center py-12 border border-black/10 rounded-2xl bg-white p-8 space-y-4 shadow-xs">
              <span className="material-symbols-outlined text-[36px] text-rose-500 mb-2">cloud_off</span>
              <h3 className="text-lg font-medium text-black">Could not reach Stellar Testnet RPC</h3>
              <Button onClick={() => refetchEvents()} variant="secondary" size="sm">Retry Query</Button>
            </div>
          ) : eventsLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-black/10 rounded-2xl p-5 h-20" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="bg-white border border-black/10 rounded-2xl p-10 text-center shadow-xs">
              <p className="text-black/60 text-base font-normal">No contract events recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((evt) => (
                <div key={evt.id} className="bg-white border border-black/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 text-xs font-mono font-medium rounded-full border ${
                        evt.type === "project_created"
                          ? "border-emerald-500/30 text-emerald-700 bg-emerald-500/10"
                          : evt.type === "sponsor_funded"
                          ? "border-blue-500/30 text-blue-700 bg-blue-500/10"
                          : "border-amber-500/30 text-amber-700 bg-amber-500/10"
                      }`}>
                        {evt.type === "project_created" ? "PROJECT REGISTERED" : evt.type === "sponsor_funded" ? "SPONSORSHIP FUNDED" : "PROJECT UNLISTED"}
                      </span>
                      <span className="font-mono text-xs text-black/50">Ledger #{evt.ledger}</span>
                    </div>
                    <p className="font-mono text-xs text-black/70 truncate max-w-xl">Tx: {evt.txHash}</p>
                  </div>

                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${evt.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-black/60 hover:text-black underline shrink-0"
                  >
                    View on Explorer &rarr;
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </RequireWallet>
  );
}

