"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "@/features/wallet/use-wallet";
import { RequireWallet } from "@/features/wallet-session";
import { ProjectAvatar } from "@/components/shared/project-avatar";
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
      <div className="pb-xl px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md mb-xl">
          <div>
            <h1 className="font-headline-lg text-headline-lg font-bold text-foreground">My Activity</h1>
            <p className="text-secondary dark:text-neutral-400 text-body-sm mt-xs flex items-center gap-2">
              Connected as{" "}
              <code className="font-mono-code text-body-sm bg-surface-container dark:bg-neutral-800 text-foreground px-2 py-0.5 rounded-md border border-outline-variant/60 dark:border-neutral-700">
                {wallet.publicKey
                  ? `${wallet.publicKey.slice(0, 8)}...${wallet.publicKey.slice(-6)}`
                  : "..."}
              </code>
            </p>
          </div>
          <Link
            href="/list-project"
            className="bg-primary dark:bg-neutral-100 text-on-primary dark:text-neutral-900 hover:opacity-90 active:scale-95 transition-all px-lg py-2.5 rounded-full font-bold text-body-sm flex items-center gap-xs shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            List New Project
          </Link>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-md">
            <span className="animate-spin material-symbols-outlined text-[40px] text-primary dark:text-neutral-200">
              progress_activity
            </span>
            <p className="font-semibold text-secondary dark:text-neutral-400 text-body-md">
              Reading contract state...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Projects I've Listed */}
            <section className="space-y-4">
              <h2 className="font-headline-md font-bold text-foreground mb-lg flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary dark:text-neutral-200">engineering</span>
                Projects I&apos;ve Listed
              </h2>

              {listedProjects.length === 0 ? (
                <div className="bg-white dark:bg-neutral-900 border border-outline-variant dark:border-neutral-800 rounded-2xl p-xl text-center space-y-sm">
                  <span className="material-symbols-outlined text-[40px] text-neutral-400">folder_off</span>
                  <p className="text-secondary dark:text-neutral-400 font-medium">No projects listed yet</p>
                  <Link
                    href="/list-project"
                    className="inline-block bg-primary dark:bg-neutral-100 text-on-primary dark:text-neutral-900 py-2 px-lg rounded-full text-body-sm font-semibold"
                  >
                    List your first project
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {listedProjects.map((p) => (
                    <Link key={p.id.toString()} href={`/projects/${p.id}`}>
                      <div className="bg-white dark:bg-neutral-900 border border-outline-variant dark:border-neutral-800 rounded-2xl p-4 hover:shadow-sm dark:hover:border-neutral-700 transition-all flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <ProjectAvatar name={p.name} size="sm" />
                          <div className="min-w-0">
                            <h3 className="font-bold text-foreground truncate">{p.name}</h3>
                            <p className="font-mono-code text-secondary dark:text-neutral-400 text-body-sm truncate">
                              {p.repoFullName}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                            {formatXlm(p.totalRaised)} XLM
                          </span>
                          <span className="text-secondary dark:text-neutral-400 text-[11px]">
                            {p.sponsorCount} sponsor{p.sponsorCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Projects I've Sponsored */}
            <section className="space-y-4">
              <h2 className="font-headline-md font-bold text-foreground mb-lg flex items-center gap-sm">
                <span className="material-symbols-outlined text-rose-500">favorite</span>
                Projects I&apos;ve Sponsored
              </h2>

              {sponsoredEntries.length === 0 ? (
                <div className="bg-white dark:bg-neutral-900 border border-outline-variant dark:border-neutral-800 rounded-2xl p-xl text-center space-y-sm">
                  <span className="material-symbols-outlined text-[40px] text-neutral-400">volunteer_activism</span>
                  <p className="text-secondary dark:text-neutral-400 font-medium">No sponsorships yet</p>
                  <Link
                    href="/explore"
                    className="inline-block bg-primary dark:bg-neutral-100 text-on-primary dark:text-neutral-900 py-2 px-lg rounded-full text-body-sm font-semibold"
                  >
                    Explore projects to sponsor
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {sponsoredEntries.map((s) => (
                    <Link key={s.id.toString()} href={`/projects/${s.projectId}`}>
                      <div className="bg-white dark:bg-neutral-900 border border-outline-variant dark:border-neutral-800 rounded-2xl p-4 hover:shadow-sm dark:hover:border-neutral-700 transition-all flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <ProjectAvatar name={s.projectName || "Project"} size="sm" />
                          <div className="min-w-0">
                            <h3 className="font-bold text-foreground truncate">{s.projectName}</h3>
                            <p className="font-mono-code text-secondary dark:text-neutral-400 text-body-sm truncate">
                              {s.repoFullName}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                            +{formatXlm(s.amount)} XLM
                          </span>
                          <span className="text-secondary dark:text-neutral-400 text-[11px]">
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
