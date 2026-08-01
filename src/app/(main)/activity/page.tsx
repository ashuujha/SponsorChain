"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "@/features/wallet/use-wallet";
import { RequireWallet } from "@/features/wallet-session";
import { ProjectAvatar } from "@/components/shared/project-avatar";
import { Button } from "@/components/ui/button";
import {
  getProjectsByOwner,
  getSponsorshipsBySponsor,
  getProject,
  ProjectData,
  SponsorshipData,
} from "@/features/projects/contract-data";

function formatXlm(stroops: string): string {
  const n = BigInt(stroops);
  const whole = n / BigInt(10_000_0000);
  const frac = n % BigInt(10_000_0000);
  const fracStr = frac.toString().padStart(7, "0");
  const trimmed = fracStr.replace(/0+$/, "");
  return trimmed ? `${whole}.${trimmed}` : `${whole}.0`;
}

interface ApiProject {
  id: string;
  ownerWalletKey?: string;
  owner?: { walletPublicKey?: string };
  repoUrl: string;
  name: string;
  description: string;
  createdAt: string;
  sponsorships?: Array<{ id: string }>;
}

export default function ActivityPage() {
  const wallet = useWallet();
  const [listedProjects, setListedProjects] = useState<ProjectData[]>([]);
  const [sponsoredEntries, setSponsoredEntries] = useState<
    (SponsorshipData & { projectName?: string; repoFullName?: string })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!wallet.publicKey) return;
    let isMounted = true;
    async function loadActivity() {
      try {
        const res = await fetch("/api/projects");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.projects) {
            const myProjects = data.projects.filter(
              (p: ApiProject) =>
                (p.ownerWalletKey || p.owner?.walletPublicKey)?.toLowerCase() ===
                wallet.publicKey!.toLowerCase()
            );
            const mapped: ProjectData[] = myProjects.map((p: ApiProject) => ({
              id: p.id,
              owner: p.ownerWalletKey || p.owner?.walletPublicKey || "",
              repoFullName: p.repoUrl,
              name: p.name,
              description: p.description,
              totalRaised: "0",
              sponsorCount: p.sponsorships?.length || 0,
              createdAt: BigInt(Math.floor(new Date(p.createdAt).getTime() / 1000)),
            }));
            setListedProjects(mapped);
          }
        }
      } catch (err) {
        console.warn("Activity API fetch notice:", err);
      }

      // Fallback to local memory registry
      if (isMounted) {
        const listed = getProjectsByOwner(wallet.publicKey!);
        if (listed.length > 0) setListedProjects(listed);

        const sps = getSponsorshipsBySponsor(wallet.publicKey!);
        const enriched = sps.map((s) => {
          const p = getProject(s.projectId);
          return {
            ...s,
            projectName: p?.name ?? "Unknown",
            repoFullName: p?.repoFullName ?? "unknown/repo",
          };
        });
        setSponsoredEntries(enriched);
        setIsLoading(false);
      }
    }
    loadActivity();
    return () => {
      isMounted = false;
    };
  }, [wallet.publicKey]);

  return (
    <RequireWallet>
      <div className="pb-24 px-4 sm:px-6 lg:px-8 max-w-container-max mx-auto pt-12 bg-background min-h-screen text-foreground transition-colors">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-hairline pb-8">
          <div>
            <div className="caption-uppercase text-muted mb-2">USER ACCOUNT // ACTIVITY</div>
            <h1 className="display-lg text-3xl sm:text-4xl md:text-5xl font-normal text-foreground tracking-[3px] uppercase">MY ACTIVITY</h1>
            <p className="caption-uppercase text-muted text-xs mt-3 flex items-center gap-2">
              CONNECTED:{" "}
              <code className="font-mono text-xs text-foreground border border-hairline px-3 py-1 bg-surface">
                {wallet.publicKey
                  ? `${wallet.publicKey.slice(0, 8)}...${wallet.publicKey.slice(-6)}`
                  : "..."}
              </code>
            </p>
          </div>

          <Link href="/list-project">
            <Button size="sm">
              LIST NEW PROJECT
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <span className="animate-spin material-symbols-outlined text-[40px] text-foreground">
              progress_activity
            </span>
            <p className="caption-uppercase text-muted">
              READING CONTRACT STATE...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Projects I've Listed */}
            <section className="space-y-6">
              <h2 className="font-mono text-base text-foreground uppercase tracking-[2px] border-b border-hairline pb-4">
                LISTED REPOSITORIES ({listedProjects.length})
              </h2>

              {listedProjects.length === 0 ? (
                <div className="bg-surface border border-hairline rounded-none p-10 text-center space-y-4">
                  <p className="body-serif text-muted text-sm">No projects registered under this wallet identity.</p>
                  <Link href="/list-project">
                    <Button variant="secondary" size="sm">LIST FIRST PROJECT</Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-hairline">
                  {listedProjects.map((p) => (
                    <Link key={p.id.toString()} href={`/projects/${p.id}`}>
                      <div className="py-5 hover:bg-surface px-3 transition-colors flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <ProjectAvatar name={p.name} size="sm" />
                          <div className="min-w-0">
                            <h3 className="font-mono text-sm uppercase tracking-[1.5px] text-foreground truncate">{p.name}</h3>
                            <p className="font-mono text-xs text-muted truncate mt-0.5">
                              {p.repoFullName}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
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
              <h2 className="font-mono text-base text-foreground uppercase tracking-[2px] border-b border-hairline pb-4">
                SPONSORED REPOSITORIES ({sponsoredEntries.length})
              </h2>

              {sponsoredEntries.length === 0 ? (
                <div className="bg-surface border border-hairline rounded-none p-10 text-center space-y-4">
                  <p className="body-serif text-muted text-sm">No sponsorship contributions recorded yet.</p>
                  <Link href="/explore">
                    <Button variant="secondary" size="sm">EXPLORE REPOSITORIES</Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-hairline">
                  {sponsoredEntries.map((s) => (
                    <Link key={s.id.toString()} href={`/projects/${s.projectId}`}>
                      <div className="py-5 hover:bg-surface px-3 transition-colors flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <ProjectAvatar name={s.projectName || "Project"} size="sm" />
                          <div className="min-w-0">
                            <h3 className="font-mono text-sm uppercase tracking-[1.5px] text-foreground truncate">{s.projectName}</h3>
                            <p className="font-mono text-xs text-muted truncate mt-0.5">
                              {s.repoFullName}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
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
