"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ProjectAvatar } from "@/components/shared/project-avatar";
import { useOnChainProjects } from "@/hooks/use-onchain-data";
import { ArrowRight } from "lucide-react";

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const { data: projects, isLoading, error, refetch } = useOnChainProjects();

  const formatXlm = (stroops: string): string => {
    const n = BigInt(stroops || "0");
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
    <div className="w-full pb-24 px-6 max-w-[88rem] mx-auto overflow-x-hidden pt-28 bg-[#F5F5F5] min-h-screen text-black transition-colors">
      {/* Header */}
      <header className="mb-12 border-b border-black/10 pb-8 flex flex-col items-center text-center">
        <span className="text-black/60 text-xs font-mono uppercase tracking-widest mb-3">
          Repository Catalog // Soroban &amp; Horizon
        </span>
        <h1 className="text-4xl md:text-5xl font-medium text-black tracking-tight mb-6">
          Explore Projects
        </h1>

        {/* Search Input */}
        <div className="relative max-w-xl w-full px-2">
          <input
            className="bugatti-input w-full text-base text-center py-3 text-black placeholder:text-black/40"
            placeholder="Search repositories by name, repo, or description..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      {/* Filter Bar */}
      <section className="flex flex-wrap sm:flex-nowrap justify-center gap-3 mb-12 overflow-x-auto hide-scrollbar pb-2 px-2">
        {["All", "Most funded", "Active", "Recently listed"].map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              activeFilter === f
                ? "bg-black text-white"
                : "bg-white text-black/70 border border-black/10 hover:border-black hover:text-black shadow-xs"
            }`}
          >
            {f}
          </button>
        ))}
      </section>

      {error ? (
        <div className="text-center py-20 border border-black/10 rounded-2xl bg-white p-10 space-y-4 max-w-2xl mx-auto shadow-sm">
          <span className="material-symbols-outlined text-[44px] text-rose-500 mb-2">
            cloud_off
          </span>
          <h3 className="text-2xl font-medium text-black">
            Could not query Stellar Testnet
          </h3>
          <p className="text-black/70 text-base max-w-md mx-auto">
            Failed to fetch live contract state from Soroban RPC. Please verify network status and try again.
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 bg-black text-white text-sm font-medium px-6 py-2.5 rounded-full hover:bg-gray-800 transition-colors"
          >
            Retry Network Query
          </button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-black/10 rounded-2xl p-7 h-[280px] animate-pulse flex flex-col justify-between shadow-xs">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-black/10 rounded-xl" />
                <div className="h-5 bg-black/10 rounded-md w-3/4" />
                <div className="h-4 bg-black/10 rounded-md w-1/2" />
                <div className="h-12 bg-black/5 rounded-md w-full" />
              </div>
              <div className="h-4 bg-black/10 rounded-md w-1/3 pt-4 border-t border-black/5" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-black/10 rounded-2xl bg-white p-10 max-w-2xl mx-auto shadow-sm space-y-4">
          <span className="material-symbols-outlined text-[52px] text-black/30 mb-2">
            search_off
          </span>
          <h3 className="text-2xl font-medium text-black">
            No projects found
          </h3>
          <p className="text-black/70 text-base">
            No repositories matched your search or filters. Be the first maintainer to list your repository!
          </p>
          <Link href="/list-project" className="inline-flex items-center gap-2 bg-black text-white text-sm font-medium px-7 py-3 rounded-full hover:bg-gray-800 transition-colors">
            <span>List a Project</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((project, idx) => {
            const isFeaturedCard = idx % 3 === 1;
            return (
              <Link key={project.id.toString()} href={`/projects/${project.id}`} className="block group">
                <div className={`rounded-2xl p-7 h-full flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-1 ${
                  isFeaturedCard ? "bg-[#2B2644] text-white border border-[#2B2644]" : "bg-white text-black border border-black/10 hover:border-black/30"
                }`}>
                  <div>
                    <div className="flex items-start justify-between mb-6">
                      <ProjectAvatar name={project.name} size="md" />
                      <span className={`text-xs font-mono font-medium px-3 py-1 rounded-full border ${
                        isFeaturedCard ? "border-white/20 text-white/90 bg-white/10" : "border-black/10 text-black/70 bg-black/5"
                      }`}>
                        On-Chain
                      </span>
                    </div>

                    <div className="mb-3">
                      <h3 className={`text-xl font-medium tracking-tight truncate transition-colors ${
                        isFeaturedCard ? "group-hover:text-white/80" : "group-hover:text-black/70"
                      }`}>
                        {project.name}
                      </h3>
                      <p className={`text-xs font-mono truncate mt-1 ${isFeaturedCard ? "text-white/60" : "text-black/50"}`}>
                        {project.repoFullName}
                      </p>
                    </div>

                    <p className={`text-sm line-clamp-3 mb-6 font-normal ${isFeaturedCard ? "text-white/70" : "text-black/70"}`}>
                      {project.description}
                    </p>
                  </div>

                  <div className={`pt-4 border-t flex items-center justify-between text-xs ${
                    isFeaturedCard ? "border-white/10" : "border-black/10"
                  }`}>
                    <div>
                      <span className={`block text-[11px] font-mono ${isFeaturedCard ? "text-white/50" : "text-black/40"}`}>RAISED</span>
                      <span className="font-semibold text-sm">{formatXlm(project.totalRaised)} XLM</span>
                    </div>
                    <div className="text-right">
                      <span className={`block text-[11px] font-mono ${isFeaturedCard ? "text-white/50" : "text-black/40"}`}>SPONSORS</span>
                      <span className="font-semibold text-sm">{project.sponsorCount}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

