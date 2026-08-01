"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  getAllProjects,
  ProjectData,
} from "@/features/projects/contract-data";
import { ProjectAvatar } from "@/components/shared/project-avatar";

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

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadProjects() {
      try {
        const res = await fetch("/api/projects");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.projects && data.projects.length > 0) {
            const mapped: ProjectData[] = data.projects.map((p: ApiProject) => ({
              id: p.id,
              owner: p.ownerWalletKey || p.owner?.walletPublicKey || "",
              repoFullName: p.repoUrl,
              name: p.name,
              description: p.description,
              totalRaised: "0",
              sponsorCount: p.sponsorships?.length || 0,
              createdAt: BigInt(Math.floor(new Date(p.createdAt).getTime() / 1000)),
            }));
            setProjects(mapped);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Failed to fetch projects from API, falling back to seed:", err);
      }
      if (isMounted) {
        setProjects(getAllProjects());
        setIsLoading(false);
      }
    }
    loadProjects();
    return () => {
      isMounted = false;
    };
  }, []);

  const formatXlm = (stroops: string): string => {
    const n = BigInt(stroops);
    const whole = n / BigInt(10_000_0000);
    const frac = n % BigInt(10_000_0000);
    const fracStr = frac.toString().padStart(7, "0");
    const trimmed = fracStr.replace(/0+$/, "");
    return trimmed ? `${whole}.${trimmed}` : `${whole}.0`;
  };

  const filtered = projects.filter((p) => {
    const matches =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.repoFullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matches) return false;
    if (activeFilter === "All") return true;
    if (activeFilter === "Most funded") return p.sponsorCount > 0;
    if (activeFilter === "Recently listed") return true;
    if (activeFilter === "Active") return p.sponsorCount >= 1;
    return true;
  });

  return (
    <div className="pb-xl px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-x-hidden pt-8">
      <header className="mb-xl">
        <h1 className="font-headline-lg text-headline-lg mb-lg font-bold text-foreground">
          Explore Projects
        </h1>
        <div className="relative max-w-2xl">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary dark:text-neutral-400">
            search
          </span>
          <input
            className="w-full h-12 pl-12 pr-4 bg-[#F1F0ED] dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-full focus:ring-2 focus:ring-primary dark:focus:ring-neutral-400 outline-none font-body-lg text-foreground transition-colors"
            placeholder="Search projects, repositories..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <section className="flex gap-sm mb-xl overflow-x-auto hide-scrollbar pb-xs">
        {["All", "Most funded", "Active", "Recently listed"].map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-lg py-2 rounded-full font-semibold text-body-sm whitespace-nowrap transition-all ${
              activeFilter === f
                ? "bg-primary dark:bg-neutral-100 text-on-primary dark:text-neutral-900 shadow-xs"
                : "bg-transparent border border-outline-variant dark:border-neutral-800 text-secondary dark:text-neutral-300 hover:bg-surface-container dark:hover:bg-neutral-800"
            }`}
          >
            {f}
          </button>
        ))}
      </section>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-md">
          <span className="animate-spin material-symbols-outlined text-[40px] text-primary dark:text-neutral-200">
            progress_activity
          </span>
          <p className="font-semibold text-secondary dark:text-neutral-400 text-body-md">
            Querying contract state...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-outline-variant dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900">
          <span className="material-symbols-outlined text-[48px] text-neutral-400 mb-md">
            inventory_2
          </span>
          <h3 className="font-bold text-headline-md text-foreground mb-xs">
            No projects found
          </h3>
          <p className="text-secondary dark:text-neutral-400 text-body-sm">
            Try tweaking your search terms or be the first one to{" "}
            <Link href="/list-project" className="text-primary dark:text-neutral-200 underline font-semibold">
              list a project
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((project) => (
            <Link key={project.id.toString()} href={`/projects/${project.id}`}>
              <div className="bg-white dark:bg-neutral-900 border border-[#E7E5E1] dark:border-neutral-800 rounded-2xl p-6 h-full flex flex-col hover:shadow-md dark:hover:border-neutral-700 transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <ProjectAvatar name={project.name} size="md" />
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      On-Chain
                    </span>
                  </div>
                </div>
                <div className="mb-3">
                  <h3 className="font-headline-md text-headline-md text-foreground font-bold truncate group-hover:text-primary dark:group-hover:text-neutral-100 transition-colors">
                    {project.name}
                  </h3>
                  <p className="font-mono-code text-body-sm text-secondary dark:text-neutral-400 truncate mt-0.5">
                    {project.repoFullName}
                  </p>
                </div>
                <p className="text-secondary dark:text-neutral-400 font-body-sm mb-6 line-clamp-2 leading-relaxed">
                  {project.description}
                </p>
                <div className="mt-auto pt-4 border-t border-outline-variant/50 dark:border-neutral-800/80 space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="font-bold font-body-sm text-emerald-600 dark:text-emerald-400">
                      {formatXlm(project.totalRaised)} XLM raised
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-secondary dark:text-neutral-400 text-[11px]">
                    <span className="material-symbols-outlined text-[14px]">people</span>
                    <span className="font-semibold">
                      {project.sponsorCount} sponsor{project.sponsorCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
