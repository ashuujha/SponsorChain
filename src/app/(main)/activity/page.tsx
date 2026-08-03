"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "@/features/wallet/use-wallet";
import { RequireWallet } from "@/features/wallet-session";
import { ProjectAvatar } from "@/components/shared/project-avatar";
import { Button } from "@/components/ui/button";
import {
  getProject,
  ProjectData,
  SponsorshipData,
} from "@/features/projects/contract-data";
import {
  fetchOnChainProjectsByOwner,
  fetchOnChainSponsorshipsBySponsor,
} from "@/lib/soroban-client";

function formatXlm(stroops: string): string {
  const n = BigInt(stroops);
  const whole = n / BigInt(10_000_0000);
  const frac = n % BigInt(10_000_0000);
  const fracStr = frac.toString().padStart(7, "0");
  const trimmed = fracStr.replace(/0+$/, "");
  return trimmed ? `${whole}.${trimmed}` : `${whole}.0`;
}


export default function ActivityPage() {
  const wallet = useWallet();
  const [listedProjects, setListedProjects] = useState<ProjectData[]>([]);
  const [sponsoredEntries, setSponsoredEntries] = useState<
    (SponsorshipData & { projectName?: string; repoFullName?: string })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadActivity = async () => {
    if (!wallet.publicKey) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const listed = await fetchOnChainProjectsByOwner(wallet.publicKey);
      const sps = await fetchOnChainSponsorshipsBySponsor(wallet.publicKey);

      const enriched = sps.map((s) => {
        const p = getProject(s.projectId);
        return {
          ...s,
          projectName: p?.name ?? "Unknown",
          repoFullName: p?.repoFullName ?? "unknown/repo",
        };
      });

      setListedProjects(listed);
      setSponsoredEntries(enriched);
    } catch (err) {
      console.error("Activity page fetch error:", err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActivity();
    const interval = setInterval(loadActivity, 15000);
    return () => clearInterval(interval);
  }, [wallet.publicKey]);

  return (
    <RequireWallet>
      <div className="w-full pb-24 px-4 sm:px-8 lg:px-12 xl:px-16 max-w-container-max mx-auto pt-8 sm:pt-12 bg-background min-h-screen text-foreground transition-colors overflow-x-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 sm:mb-12 border-b border-hairline pb-6 sm:pb-8">
          <div>
            <div className="caption-uppercase text-muted mb-2 text-[10px] sm:text-xs">USER ACCOUNT // ACTIVITY</div>
            <h1 className="display-lg font-normal text-foreground uppercase">MY ACTIVITY</h1>
            <p className="caption-uppercase text-muted text-xs mt-3 flex items-center gap-2 max-w-full">
              <span className="shrink-0">CONNECTED:</span>
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

        {hasError ? (
          <div className="text-center py-16 sm:py-24 border border-hairline bg-surface p-8 sm:p-12 space-y-4">
            <span className="material-symbols-outlined text-[40px] text-destructive mb-2">
              cloud_off
            </span>
            <h3 className="font-mono text-base sm:text-lg text-foreground uppercase tracking-[2px]">
              COULDN&apos;T REACH STELLAR TESTNET
            </h3>
            <p className="body-serif text-muted text-sm max-w-md mx-auto">
              Failed to load activity logs from Stellar Testnet RPC. Please verify network connectivity and try again.
            </p>
            <Button onClick={loadActivity} variant="secondary" size="sm" className="min-h-[44px]">
              RETRY QUERY
            </Button>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 animate-pulse">
            <div className="space-y-6">
              <div className="h-6 bg-hairline/40 w-1/3" />
              <div className="bg-surface border border-hairline p-6 h-36" />
            </div>
            <div className="space-y-6">
              <div className="h-6 bg-hairline/40 w-1/3" />
              <div className="bg-surface border border-hairline p-6 h-36" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Projects I've Listed */}
            <section className="space-y-6">
              <h2 className="font-mono text-sm sm:text-base text-foreground uppercase tracking-[2px] border-b border-hairline pb-4">
                LISTED REPOSITORIES ({listedProjects.length})
              </h2>

              {listedProjects.length === 0 ? (
                <div className="bg-surface border border-hairline rounded-none p-8 sm:p-10 text-center space-y-4">
                  <p className="body-serif text-muted text-sm">No projects registered under this wallet identity.</p>
                  <Link href="/list-project" className="inline-block">
                    <Button variant="secondary" size="sm" className="min-h-[44px]">LIST FIRST PROJECT</Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-hairline">
                  {listedProjects.map((p) => (
                    <Link key={p.id.toString()} href={`/projects/${p.id}`} className="block group">
                      <div className="py-4 sm:py-5 hover:bg-surface px-3 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                          <ProjectAvatar name={p.name} size="sm" />
                          <div className="min-w-0">
                            <h3 className="font-mono text-sm uppercase tracking-[1.5px] text-foreground truncate group-hover:text-muted transition-colors">{p.name}</h3>
                            <p className="font-mono text-xs text-muted truncate mt-0.5">
                              {p.repoFullName}
                            </p>
                          </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-hairline pt-2 sm:pt-0 shrink-0">
                          <span className="font-mono text-xs text-foreground uppercase tracking-[1.5px] block">
                            {formatXlm(p.totalRaised)} XLM
                          </span>
                          <span className="caption-uppercase text-[10px] text-muted">
                            {p.sponsorCount} SPONSOR{p.sponsorCount !== 1 ? "S" : ""}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Projects I've Sponsored */}
            <section className="space-y-6">
              <h2 className="font-mono text-sm sm:text-base text-foreground uppercase tracking-[2px] border-b border-hairline pb-4">
                SPONSORED REPOSITORIES ({sponsoredEntries.length})
              </h2>

              {sponsoredEntries.length === 0 ? (
                <div className="bg-surface border border-hairline rounded-none p-8 sm:p-10 text-center space-y-4">
                  <p className="body-serif text-muted text-sm">No sponsorship contributions recorded yet.</p>
                  <Link href="/explore" className="inline-block">
                    <Button variant="secondary" size="sm" className="min-h-[44px]">EXPLORE REPOSITORIES</Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-hairline">
                  {sponsoredEntries.map((s) => (
                    <Link key={s.id.toString()} href={`/projects/${s.projectId}`} className="block group">
                      <div className="py-4 sm:py-5 hover:bg-surface px-3 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                          <ProjectAvatar name={s.projectName || "Project"} size="sm" />
                          <div className="min-w-0">
                            <h3 className="font-mono text-sm uppercase tracking-[1.5px] text-foreground truncate group-hover:text-muted transition-colors">{s.projectName}</h3>
                            <p className="font-mono text-xs text-muted truncate mt-0.5">
                              {s.repoFullName}
                            </p>
                          </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-hairline pt-2 sm:pt-0 shrink-0">
                          <span className="font-mono text-xs text-foreground uppercase tracking-[1.5px] block">
                            +{formatXlm(s.amount)} XLM
                          </span>
                          <span className="caption-uppercase text-[10px] text-muted">
                            {new Date(Number(s.timestamp) * 1000).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </RequireWallet>
  );
}
