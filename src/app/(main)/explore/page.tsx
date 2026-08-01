"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  getAllProjects,
  ProjectData,
} from "@/features/projects/contract-data";

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
            const mapped: ProjectData[] = data.projects.map((p: any) => ({
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
    return trimmed
      ? `${whole}.${trimmed}`
      : `${whole}.0`;
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
    <div className="pb-xl px-gutter max-w-container-max mx-auto overflow-x-hidden pt-8">
      <header className="mb-xl">
        <h1 className="font-headline-lg text-headline-lg mb-lg font-bold">
          Explore Projects
        </h1>
        <div className="relative max-w-2xl">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            className="w-full h-12 pl-12 pr-4 bg-[#F1F0ED] border-none rounded-full focus:ring-2 focus:ring-primary outline-none font-body-lg"
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
                ? "bg-primary text-on-primary"
                : "bg-transparent border border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
            }`}
          >
            {f}
          </button>
        ))}
      </section>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-md">
          <span className="animate-spin material-symbols-outlined text-[40px] text-primary">
            progress_activity
          </span>
          <p className="font-semibold text-on-surface-variant text-body-md">
            Querying contract state...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-outline-variant rounded-2xl bg-white">
          <span className="material-symbols-outlined text-[48px] text-neutral-400 mb-md">
            inventory_2
          </span>
          <h3 className="font-bold text-headline-md text-primary mb-xs">
            No projects found
          </h3>
          <p className="text-on-surface-variant text-body-sm">
            Try tweaking your search terms or be the first one to{" "}
            <Link href="/list-project" className="text-primary underline font-semibold">
              list a project
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          {filtered.map((project) => (
            <Link key={project.id.toString()} href={`/projects/${project.id}`}>
              <div className="bg-white border border-[#E7E5E1] rounded-[16px] p-lg h-full flex flex-col hover:shadow-[0px_4px_12px_rgba(0,0,0,0.03)] transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-md">
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant">
                    <span className="material-symbols-outlined text-primary">hub</span>
                  </div>
                  <div className="flex items-center gap-1 px-sm py-1 bg-[#E8F5E9] rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E5D2A]">
                      On-Chain
                    </span>
                  </div>
                </div>
                <div className="mb-md">
                  <h3 className="font-headline-md text-headline-md text-[#141414] font-bold truncate">
                    {project.name}
                  </h3>
                  <p className="font-mono-code text-body-sm text-[#6E6C68] truncate">
                    {project.repoFullName}
                  </p>
                </div>
                <p className="text-[#6E6C68] font-body-sm mb-lg line-clamp-2">
                  {project.description}
                </p>
                <div className="mt-auto space-y-sm">
                  <div className="flex justify-between items-end">
                    <span className="font-bold font-body-sm text-near-black">
                      {formatXlm(project.totalRaised)} XLM raised
                    </span>
                  </div>
                  <div className="flex items-center gap-sm text-secondary text-[11px]">
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
