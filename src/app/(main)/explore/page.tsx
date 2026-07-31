"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { fetchBatchBalances } from "@/features/wallet/wallet-service";

interface DBProject {
  id: string;
  name: string;
  repoUrl: string;
  description: string;
  fundingGoalXLM: string;
  walletPublicKey: string | null;
}

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  
  const [projects, setProjects] = useState<DBProject[]>([]);
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects from database
  useEffect(() => {
    fetch("/api/projects")
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to load projects from Postgres.");
        }
        const data = await res.json();
        setProjects(data.projects || []);
        
        // Batch fetch live balances from Horizon
        const publicKeys = (data.projects || [])
          .map((p: DBProject) => p.walletPublicKey)
          .filter(Boolean) as string[];
          
        if (publicKeys.length > 0) {
          const liveBalances = await fetchBatchBalances(publicKeys);
          setBalances(liveBalances);
        }
      })
      .catch((err) => {
        console.error("Explore load error:", err);
        setError(err.message || "Failed to load projects.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const getProgress = (raised: string, goal: string) => {
    const raisedNum = parseFloat(raised);
    const goalNum = parseFloat(goal);
    if (isNaN(raisedNum) || isNaN(goalNum) || goalNum <= 0) return 0;
    return Math.min(100, Math.round((raisedNum / goalNum) * 100));
  };

  const getRaised = (walletPublicKey: string | null) => {
    if (!walletPublicKey) return "0.00";
    const balance = balances[walletPublicKey];
    if (!balance) return "0.00";
    return parseFloat(balance).toFixed(2);
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.repoUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());

    const raisedVal = getRaised(project.walletPublicKey);
    const progress = getProgress(raisedVal, project.fundingGoalXLM);

    if (activeFilter === "All") return matchesSearch;
    if (activeFilter === "Most funded") return matchesSearch && progress >= 50;
    if (activeFilter === "Nearly funded") return matchesSearch && progress >= 90;
    if (activeFilter === "Newest") return matchesSearch;
    return matchesSearch;
  });

  return (
    <div className="pb-xl px-gutter max-w-container-max mx-auto overflow-x-hidden pt-8">
      {/* Header Section */}
      <header className="mb-xl">
        <h1 className="font-headline-lg text-headline-lg md:font-headline-lg md:text-headline-lg mb-lg font-bold">Explore Projects</h1>
        <div className="relative max-w-2xl">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input
            className="w-full h-12 pl-12 pr-4 bg-[#F1F0ED] border-none rounded-full focus:ring-2 focus:ring-primary transition-all font-body-lg text-body-lg outline-none"
            placeholder="Search projects, repositories, or developers..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      {/* Filter Row */}
      <section className="flex gap-sm mb-xl overflow-x-auto hide-scrollbar pb-xs">
        {["All", "Most funded", "Newest", "Nearly funded"].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-lg py-2 rounded-full font-semibold text-body-sm whitespace-nowrap transition-all ${
              activeFilter === filter
                ? "bg-primary text-on-primary scale-95"
                : "bg-transparent border border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
            }`}
          >
            {filter}
          </button>
        ))}
      </section>

      {error && (
        <div className="p-md bg-error-container text-on-error-container rounded-xl border border-error/15 font-medium mb-lg">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-md">
          <span className="animate-spin material-symbols-outlined text-[40px] text-primary">progress_activity</span>
          <p className="font-semibold text-on-surface-variant text-body-md">Querying Postgres & Horizon network...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-outline-variant rounded-2xl bg-white">
          <span className="material-symbols-outlined text-[48px] text-neutral-400 mb-md">inventory_2</span>
          <h3 className="font-bold text-headline-md text-primary mb-xs">No projects found</h3>
          <p className="text-on-surface-variant text-body-sm">Try tweaking your search terms or filters.</p>
        </div>
      ) : (
        /* Projects Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          {filteredProjects.map((project) => {
            const raised = getRaised(project.walletPublicKey);
            const progress = getProgress(raised, project.fundingGoalXLM);
            
            return (
              <div
                key={project.id}
                className="bg-white border border-[#E7E5E1] rounded-[16px] p-lg flex flex-col hover:shadow-[0px_4px_12px_rgba(0,0,0,0.03)] transition-shadow"
              >
                <div className="flex items-start justify-between mb-md">
                  <div className="w-10 h-10 rounded-full bg-surface-container overflow-hidden flex items-center justify-center border border-outline-variant">
                    <span className="material-symbols-outlined text-primary">hub</span>
                  </div>
                  <div className="flex items-center gap-1 px-sm py-1 bg-[#E8F5E9] rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] animate-pulse"></span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E5D2A]">Live from Horizon</span>
                  </div>
                </div>
                <div className="mb-md">
                  <h3 className="font-headline-md text-headline-md text-[#141414] font-bold truncate">{project.name}</h3>
                  <p className="font-mono-code text-body-sm text-[#6E6C68] truncate">{project.repoUrl}</p>
                </div>
                <p className="text-[#6E6C68] font-body-sm mb-lg line-clamp-2">
                  {project.description}
                </p>
                <div className="mt-auto">
                  <div className="flex justify-between items-end mb-xs">
                    <span className="font-bold font-body-sm text-near-black">
                      {parseFloat(raised).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / {parseFloat(project.fundingGoalXLM).toLocaleString()} XLM
                    </span>
                    <span className="text-label-caps text-on-surface-variant">{progress}%</span>
                  </div>
                  <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden mb-lg">
                    <div className="h-full bg-primary" style={{ width: `${progress}%` }}></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Link href={`/projects/${project.id}`}>
                      <button className="bg-primary text-on-primary px-lg py-2 rounded-full font-semibold text-body-sm hover:opacity-90 active:scale-95 transition-all">
                        View project
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
