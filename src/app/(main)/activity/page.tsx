"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "@/features/wallet/use-wallet";
import { RequireWallet } from "@/features/wallet-session";
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
              (p: any) =>
                (p.ownerWalletKey || p.owner?.walletPublicKey)?.toLowerCase() ===
                wallet.publicKey!.toLowerCase()
            );
            const mapped: ProjectData[] = myProjects.map((p: any) => ({
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
      <div className="pb-xl px-gutter max-w-container-max mx-auto pt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md mb-xl">
          <div>
            <h1 className="font-headline-lg text-headline-lg font-bold">My Activity</h1>
            <p className="text-secondary text-body-sm mt-xs">
              Connected as{" "}
              <code className="font-mono-code text-body-sm bg-surface-container px-sm py-0.5 rounded">
                {wallet.publicKey
                  ? `${wallet.publicKey.slice(0, 8)}...${wallet.publicKey.slice(-6)}`
                  : "..."}
              </code>
            </p>
          </div>
          <Link
            href="/list-project"
            className="bg-primary text-on-primary hover:opacity-90 active:scale-95 transition-all px-lg py-sm rounded-full font-bold text-body-sm flex items-center gap-xs"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            List New Project
          </Link>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-md">
            <span className="animate-spin material-symbols-outlined text-[40px] text-primary">
              progress_activity
            </span>
            <p className="font-semibold text-on-surface-variant text-body-md">
              Reading contract state...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
            {/* Projects I've Listed */}
            <section>
              <h2 className="font-headline-md font-bold text-primary mb-lg flex items-center gap-sm">
                <span className="material-symbols-outlined">engineering</span>
                Projects I&apos;ve Listed
              </h2>

              {listedProjects.length === 0 ? (
                <div className="bg-white border border-outline-variant rounded-2xl p-xl text-center space-y-sm">
                  <span className="material-symbols-outlined text-[40px] text-neutral-400">folder_off</span>
                  <p className="text-secondary font-medium">No projects listed yet</p>
                  <Link
                    href="/list-project"
                    className="inline-block bg-primary text-on-primary py-sm px-lg rounded-full text-body-sm font-semibold"
                  >
                    List your first project
                  </Link>
                </div>
              ) : (
                <div className="space-y-sm">
                  {listedProjects.map((p) => (
                    <Link key={p.id.toString()} href={`/projects/${p.id}`}>
                      <div className="bg-white border border-outline-variant rounded-xl p-md hover:shadow-sm transition-shadow flex items-center justify-between">
                        <div className="min-w-0">
                          <h3 className="font-bold text-primary truncate">{p.name}</h3>
                          <p className="font-mono-code text-secondary text-body-sm truncate">
                            {p.repoFullName}
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-md">
                          <span className="font-bold text-[#2E7D32] block">
                            {formatXlm(p.totalRaised)} XLM
                          </span>
                          <span className="text-secondary text-[11px]">
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
            <section>
              <h2 className="font-headline-md font-bold text-primary mb-lg flex items-center gap-sm">
                <span className="material-symbols-outlined">favorite</span>
                Projects I&apos;ve Sponsored
              </h2>

              {sponsoredEntries.length === 0 ? (
                <div className="bg-white border border-outline-variant rounded-2xl p-xl text-center space-y-sm">
                  <span className="material-symbols-outlined text-[40px] text-neutral-400">volunteer_activism</span>
                  <p className="text-secondary font-medium">No sponsorships yet</p>
                  <Link
                    href="/explore"
                    className="inline-block bg-primary text-on-primary py-sm px-lg rounded-full text-body-sm font-semibold"
                  >
                    Explore projects to sponsor
                  </Link>
                </div>
              ) : (
                <div className="space-y-sm">
                  {sponsoredEntries.map((s) => (
                    <Link key={s.id.toString()} href={`/projects/${s.projectId}`}>
                      <div className="bg-white border border-outline-variant rounded-xl p-md hover:shadow-sm transition-shadow flex items-center justify-between">
                        <div className="min-w-0">
                          <h3 className="font-bold text-primary truncate">{s.projectName}</h3>
                          <p className="font-mono-code text-secondary text-body-sm truncate">
                            {s.repoFullName}
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-md">
                          <span className="font-bold text-[#2E7D32] block">
                            +{formatXlm(s.amount)} XLM
                          </span>
                          <span className="text-secondary text-[11px]">
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
