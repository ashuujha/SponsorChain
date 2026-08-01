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
    <div className="pb-16 px-4 sm:px-6 lg:px-8 max-w-container-max mx-auto overflow-x-hidden pt-6">
      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground tracking-tight mb-4">
          Explore Projects
        </h1>
        <p className="text-text-secondary text-base mb-6 max-w-xl">
          Discover open-source software repositories verified on GitHub and directly support maintainers over Stellar.
        </p>

        {/* Slacc Pill Search Input */}
        <div className="relative max-w-2xl">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
            search
          </span>
          <input
            className="w-full h-12 pl-12 pr-4 bg-canvas-cream dark:bg-surface-container border border-border-color rounded-full focus:ring-2 focus:ring-aubergine outline-none text-base text-foreground transition-all shadow-xs"
            placeholder="Search projects by name, repo, or description..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      {/* Slacc Pill Filter Bar */}
      <section className="flex gap-2.5 mb-10 overflow-x-auto hide-scrollbar pb-2">
        {["All", "Most funded", "Active", "Recently listed"].map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
              activeFilter === f
                ? "bg-aubergine text-white shadow-xs"
                : "bg-canvas-lavender dark:bg-surface-container text-ink dark:text-foreground hover:bg-canvas-cream dark:hover:bg-surface-hover"
            }`}
          >
            {f}
          </button>
        ))}
      </section>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <span className="animate-spin material-symbols-outlined text-[40px] text-aubergine dark:text-aubergine-mute">
            progress_activity
          </span>
          <p className="font-semibold text-text-secondary text-base">
            Querying contract state...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border-color rounded-3xl bg-canvas-cream/50 dark:bg-surface-container/50">
          <span className="material-symbols-outlined text-[48px] text-aubergine/40 dark:text-aubergine-mute/40 mb-3">
            inventory_2
          </span>
          <h3 className="font-bold text-xl text-foreground mb-1">
            No projects found
          </h3>
          <p className="text-text-secondary text-sm">
            Try tweaking your search terms or be the first to{" "}
            <Link href="/list-project" className="slacc-link font-semibold">
              list a project
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((project) => (
            <Link key={project.id.toString()} href={`/projects/${project.id}`}>
              <div className="bg-surface dark:bg-surface border border-border-color rounded-2xl p-6 h-full flex flex-col hover:border-aubergine/40 hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <ProjectAvatar name={project.name} size="md" />
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                      On-Chain
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <h3 className="text-xl text-foreground font-bold truncate group-hover:text-link-blue transition-colors">
                    {project.name}
                  </h3>
                  <p className="font-mono text-xs text-text-secondary truncate mt-0.5">
                    {project.repoFullName}
                  </p>
                </div>

                <p className="text-text-secondary text-sm mb-6 line-clamp-2 leading-relaxed">
                  {project.description}
                </p>

                <div className="mt-auto pt-4 border-t border-border-color/60 space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="font-extrabold text-sm text-aubergine dark:text-aubergine-mute">
                      {formatXlm(project.totalRaised)} XLM raised
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-text-secondary text-xs">
                    <span className="material-symbols-outlined text-[16px]">group</span>
                    <span className="font-medium">
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
