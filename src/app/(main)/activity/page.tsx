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
      setActionError(err instanceof Error ? err.message : "Failed to unlist project on-chain");
    } finally {
      setUnlistingId(null);
    }
  };

  return (
    <RequireWallet>
      <div className="w-full pb-24 px-4 sm:px-8 lg:px-12 xl:px-16 max-w-container-max mx-auto pt-8 sm:pt-12 bg-background min-h-screen text-foreground transition-colors overflow-x-hidden space-y-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-hairline pb-6 sm:pb-8">
          <div>
            <div className="caption-uppercase text-muted mb-2 text-[10px] sm:text-xs">STELLAR TESTNET // MAINTAINER DASHBOARD</div>
            <h1 className="display-lg font-normal text-foreground uppercase">MY REPOSITORIES & ACTIVITY</h1>
            <p className="caption-uppercase text-muted text-xs mt-3 flex items-center gap-2 max-w-full">
              <span className="shrink-0">CONNECTED WALLET:</span>
              <code className="font-mono text-xs text-foreground border border-hairline px-2.5 py-1 bg-surface truncate max-w-[200px] sm:max-w-none">
                {wallet.publicKey
                  ? `${wallet.publicKey.slice(0, 8)}...${wallet.publicKey.slice(-6)}`
                  : "..."}
              </code>
            </p>
          </div>

          <Link href="/list-project" className="w-full sm:w-auto">
            <Button size="sm" className="w-full sm:w-auto min-h-[44px]">
              LIST NEW PROJECT
            </Button>
          </Link>
        </div>

        {actionError && (
          <div className="p-4 border border-destructive/50 bg-destructive/10 text-destructive font-mono text-xs flex justify-between items-center">
            <span>{actionError}</span>
            <button onClick={() => setActionError(null)} className="underline text-[10px] uppercase">DISMISS</button>
          </div>
        )}

        {/* My Registered Projects Section */}
        <section className="space-y-6">
          <div className="flex justify-between items-center border-b border-hairline pb-4">
            <h2 className="font-mono text-sm sm:text-base text-foreground uppercase tracking-[2px]">
              MY REGISTERED PROJECTS ({myProjects.filter(p => p.active !== false).length})
            </h2>
            <Button onClick={loadMyProjects} variant="outline" size="sm" className="text-xs">
              REFRESH
            </Button>
          </div>

          {projectsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
              <div className="bg-surface border border-hairline p-6 h-32" />
              <div className="bg-surface border border-hairline p-6 h-32" />
            </div>
          ) : myProjects.filter(p => p.active !== false).length === 0 ? (
            <div className="bg-surface border border-hairline p-8 text-center space-y-3">
              <p className="body-serif text-muted text-sm">No active registered projects owned by this wallet.</p>
              <Link href="/list-project" className="inline-block">
                <Button variant="secondary" size="sm">LIST A PROJECT &rarr;</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myProjects.filter(p => p.active !== false).map((p) => (
                <div key={p.id.toString()} className="bg-surface border border-hairline p-6 flex flex-col justify-between space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <ProjectAvatar name={p.name} size="sm" />
                      <div className="min-w-0">
                        <h3 className="font-mono text-sm uppercase tracking-[1.5px] text-foreground truncate">{p.name}</h3>
                        <p className="font-mono text-xs text-muted truncate">{p.repoFullName}</p>
                      </div>
                    </div>
                    <span className="caption-uppercase text-[10px] border border-emerald-500/40 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 shrink-0">
                      ON-CHAIN
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-hairline pt-4 font-mono text-xs">
                    <div>
                      <span className="text-muted block text-[10px]">TOTAL RAISED</span>
                      <span className="text-foreground">{formatXlm(p.totalRaised)} XLM</span>
                    </div>

                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={unlistingId === p.id}
                      onClick={() => handleUnlist(p.id)}
                      className="min-h-[38px] text-xs font-mono tracking-[1px]"
                    >
                      {unlistingId === p.id ? "UNLISTING ON-CHAIN..." : "UNLIST PROJECT"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Live Contract Events Stream */}
        <section className="space-y-6">
          <div className="flex justify-between items-center border-b border-hairline pb-4">
            <h2 className="font-mono text-sm sm:text-base text-foreground uppercase tracking-[2px]">
              LIVE CONTRACT EVENTS STREAM
            </h2>
          </div>

          {eventsError ? (
            <div className="text-center py-12 border border-hairline bg-surface p-8 space-y-4">
              <span className="material-symbols-outlined text-[36px] text-destructive mb-2">cloud_off</span>
              <h3 className="font-mono text-sm text-foreground uppercase tracking-[2px]">COULDN&apos;T REACH STELLAR TESTNET RPC</h3>
              <Button onClick={() => refetchEvents()} variant="secondary" size="sm">RETRY QUERY</Button>
            </div>
          ) : eventsLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-surface border border-hairline p-5 h-20" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="bg-surface border border-hairline p-8 text-center">
              <p className="body-serif text-muted text-sm">No contract events recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((evt) => (
                <div key={evt.id} className="bg-surface border border-hairline p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 text-[10px] font-mono uppercase tracking-[1px] border ${
                        evt.type === "project_created"
                          ? "border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                          : evt.type === "sponsor_funded"
                          ? "border-blue-500/50 text-blue-600 dark:text-blue-400 bg-blue-500/10"
                          : "border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                      }`}>
                        {evt.type === "project_created" ? "PROJECT REGISTERED" : evt.type === "sponsor_funded" ? "SPONSORSHIP FUNDED" : "PROJECT UNLISTED"}
                      </span>
                      <span className="font-mono text-xs text-muted">LEDGER #{evt.ledger}</span>
                    </div>
                    <p className="font-mono text-xs text-foreground truncate max-w-xl">TX: {evt.txHash}</p>
                  </div>

                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${evt.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bugatti-link text-[11px] shrink-0"
                  >
                    VIEW ON EXPLORER &rarr;
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
