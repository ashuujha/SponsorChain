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
    <div className="pb-24 px-4 sm:px-6 lg:px-8 max-w-container-max mx-auto overflow-x-hidden pt-12 bg-black min-h-screen text-white">
      <header className="mb-12 border-b border-hairline pb-8 flex flex-col items-center text-center">
        <div className="caption-uppercase text-muted mb-2">CATALOG // REPOSITORIES</div>
        <h1 className="display-lg text-3xl sm:text-4xl md:text-5xl font-normal text-white tracking-[3px] uppercase mb-6">
          EXPLORE PROJECTS
        </h1>

        {/* Bugatti Underline Text Input */}
        <div className="relative max-w-2xl w-full">
          <input
            className="bugatti-input w-full text-base text-center"
            placeholder="SEARCH REPOSITORIES BY NAME, REPO, OR DESCRIPTION..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      {/* Bugatti Monospace Filter Bar */}
      <section className="flex justify-center gap-3 mb-12 overflow-x-auto hide-scrollbar pb-2">
        {["All", "Most funded", "Active", "Recently listed"].map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-6 py-2 rounded-full font-mono text-xs uppercase tracking-[2px] transition-all ${
              activeFilter === f
                ? "bg-white text-black font-semibold"
                : "bg-transparent border border-hairline text-muted hover:border-white hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </section>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <span className="animate-spin material-symbols-outlined text-[36px] text-white">
            progress_activity
          </span>
          <p className="caption-uppercase text-muted">
            READING CONTRACT STATE...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 border border-hairline bg-surface-card p-12">
          <span className="material-symbols-outlined text-[48px] text-muted mb-4">
            search_off
          </span>
          <h3 className="font-mono text-lg text-white uppercase tracking-[2px] mb-2">
            NO PROJECTS FOUND
          </h3>
          <p className="body-serif text-muted text-sm mb-4">
            Try adjusting your search terms or register a new project.
          </p>
          <Link href="/list-project" className="bugatti-link">
            LIST A PROJECT &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((project) => (
            <Link key={project.id.toString()} href={`/projects/${project.id}`}>
              <div className="bg-surface-card border border-hairline rounded-none p-6 h-full flex flex-col hover:border-white/60 transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-6">
                  <ProjectAvatar name={project.name} size="md" />
                  <div className="caption-uppercase text-xs text-white border border-hairline-strong px-2.5 py-1">
                    ON-CHAIN
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="font-mono text-base text-white uppercase tracking-[1.5px] truncate group-hover:text-muted transition-colors">
                    {project.name}
                  </h3>
                  <p className="font-mono text-xs text-muted truncate mt-1">
                    {project.repoFullName}
                  </p>
                </div>

                <p className="body-serif-sm text-muted mb-8 line-clamp-3 leading-relaxed">
                  {project.description}
                </p>

                <div className="mt-auto pt-4 border-t border-hairline space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="font-mono text-xs text-white uppercase tracking-[1.5px]">
                      {formatXlm(project.totalRaised)} XLM RAISED
                    </span>
                  </div>
                  <div className="caption-uppercase text-[10px] text-muted">
                    {project.sponsorCount} SPONSOR{project.sponsorCount !== 1 ? "S" : ""}
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
