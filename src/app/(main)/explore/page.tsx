"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  getAllProjects,
  ProjectData,
} from "@/features/projects/contract-data";
import { ProjectAvatar } from "@/components/shared/project-avatar";


export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setProjects(getAllProjects());
    setIsLoading(false);
  }, []);

  const formatXlm = (stroops: string): string => {
    const n = BigInt(stroops);
    const whole = n / BigInt(10_000_000);
    const frac = n % BigInt(10_000_000);
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
    <div className="w-full pb-24 px-4 sm:px-8 lg:px-12 xl:px-16 max-w-container-max mx-auto overflow-x-hidden pt-8 sm:pt-12 bg-background min-h-screen text-foreground transition-colors">
      <header className="mb-8 sm:mb-12 border-b border-hairline pb-6 sm:pb-8 flex flex-col items-center text-center">
        <div className="caption-uppercase text-muted mb-2 text-[10px] sm:text-xs">CATALOG // REPOSITORIES</div>
        <h1 className="display-lg font-normal text-foreground uppercase mb-4 sm:mb-6">
          EXPLORE PROJECTS
        </h1>

        {/* Underline Text Input */}
        <div className="relative max-w-2xl w-full px-2">
          <input
            className="bugatti-input w-full text-sm sm:text-base text-center min-h-[44px]"
            placeholder="SEARCH REPOSITORIES BY NAME, REPO, OR DESCRIPTION..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      {/* Filter Bar */}
      <section className="flex flex-wrap sm:flex-nowrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-12 overflow-x-auto hide-scrollbar pb-2 px-2">
        {["All", "Most funded", "Active", "Recently listed"].map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 sm:px-6 py-2.5 min-h-[44px] rounded-full font-mono text-[11px] sm:text-xs uppercase tracking-[1.5px] sm:tracking-[2px] transition-all whitespace-nowrap ${
              activeFilter === f
                ? "bg-foreground text-background font-semibold"
                : "bg-transparent border border-hairline text-muted hover:border-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </section>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <span className="animate-spin material-symbols-outlined text-[36px] text-foreground">
            progress_activity
          </span>
          <p className="caption-uppercase text-muted">
            READING CONTRACT STATE...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 sm:py-24 border border-hairline bg-surface p-8 sm:p-12">
          <span className="material-symbols-outlined text-[40px] sm:text-[48px] text-muted mb-4">
            search_off
          </span>
          <h3 className="font-mono text-base sm:text-lg text-foreground uppercase tracking-[2px] mb-2">
            NO PROJECTS FOUND
          </h3>
          <p className="body-serif text-muted text-sm mb-6">
            Try adjusting your search terms or register a new project.
          </p>
          <Link href="/list-project" className="bugatti-link text-xs min-h-[44px] inline-flex items-center">
            LIST A PROJECT &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {filtered.map((project) => (
            <Link key={project.id.toString()} href={`/projects/${project.id}`} className="block group">
              <div className="bg-surface border border-hairline rounded-none p-6 h-full flex flex-col hover:border-foreground/60 transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-6">
                  <ProjectAvatar name={project.name} size="md" />
                  <div className="caption-uppercase text-[10px] text-foreground border border-hairline px-2 py-0.5">
                    ON-CHAIN
                  </div>
                </div>

                <div className="mb-3">
                  <h3 className="font-mono text-sm sm:text-base text-foreground uppercase tracking-[1.5px] truncate group-hover:text-muted transition-colors">
                    {project.name}
                  </h3>
                  <p className="font-mono text-xs text-muted truncate mt-1">
                    {project.repoFullName}
                  </p>
                </div>

                <p className="body-serif-sm text-muted text-xs sm:text-sm mb-6 line-clamp-3 leading-relaxed">
                  {project.description}
                </p>

                <div className="mt-auto pt-4 border-t border-hairline space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="font-mono text-xs text-foreground uppercase tracking-[1.5px]">
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
