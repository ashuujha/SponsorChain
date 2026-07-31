"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { groupSponsorshipsByProject, SponsorshipInput } from "@/features/payments/dashboard-utils";

export default function SponsorDashboard() {
  const { status: sessionStatus } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  const [sponsorships, setSponsorships] = useState<SponsorshipInput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if unauthenticated
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/signin");
    }
  }, [sessionStatus, router]);

  // Load sponsorships
  useEffect(() => {
    if (sessionStatus !== "authenticated") return;

    fetch("/api/sponsor/sponsorships")
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to load sponsorships.");
        }
        const data = await res.json();
        setSponsorships(data.sponsorships || []);
      })
      .catch((err) => {
        console.error("Sponsor dashboard load error:", err);
        setError(err.message || "Failed to load dashboard.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [sessionStatus]);

  const toggleDetails = (projectId: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  if (sessionStatus === "loading" || (isLoading && sessionStatus === "authenticated")) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-40 gap-md">
        <span className="animate-spin material-symbols-outlined text-[40px] text-primary">progress_activity</span>
        <p className="font-semibold text-on-surface-variant text-body-md">Retrieving your sponsorships...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-md">
        <span className="material-symbols-outlined text-[48px] text-error">warning</span>
        <h3 className="font-bold text-headline-md text-primary">Dashboard Error</h3>
        <p className="text-on-surface-variant text-body-sm">{error}</p>
      </div>
    );
  }

  // Group and aggregate sponsorships by project
  const groupedProjects = groupSponsorshipsByProject(sponsorships);

  // Filter grouped results
  const filteredProjects = groupedProjects.filter((project) =>
    project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.repoUrl.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Total contributed summation
  const totalContributed = groupedProjects.reduce(
    (sum, p) => sum + parseFloat(p.totalContributedXLM),
    0
  );

  return (
    <div className="flex-grow flex flex-col w-full min-h-screen">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-outline-variant flex items-center justify-between px-lg z-45">
        <div className="flex items-center gap-lg flex-grow">
          <div className="relative w-72 hidden sm:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-secondary-container pointer-events-none">search</span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-surface-container border-none rounded-lg text-body-sm focus:ring-1 focus:ring-primary placeholder-on-secondary-container outline-none font-semibold"
              placeholder="Search sponsored projects..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <h2 className="font-bold text-body-lg text-primary leading-none">Hello, Supporter</h2>
            <p className="text-[11px] text-secondary mt-1">Stellar Testnet Account active</p>
          </div>
        </div>
        <div className="flex items-center gap-md">
          <button className="p-2 text-secondary hover:text-primary transition-colors hover:bg-surface-container rounded-full" aria-label="Notifications">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <div className="h-8 w-[1px] bg-outline-variant mx-sm hidden sm:block"></div>
          <div className="w-8 h-8 rounded-full border border-outline-variant bg-surface-container flex items-center justify-center">
            <span className="material-symbols-outlined text-neutral-500">person</span>
          </div>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <div className="p-lg space-y-lg max-w-container-max w-full mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-[#141414] font-bold font-display">My Sponsorships</h1>
            <p className="text-secondary text-body-sm">Thank you for backing open source projects on Stellar.</p>
          </div>
          <Link
            href="/explore"
            className="bg-primary text-on-primary hover:opacity-90 active:scale-95 transition-all px-lg py-sm rounded-full font-bold text-body-sm flex items-center gap-xs"
          >
            <span className="material-symbols-outlined text-[16px]">search</span>
            Explore Projects
          </Link>
        </div>

        {groupedProjects.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 border border-dashed border-outline-variant rounded-2xl bg-white max-w-lg mx-auto mt-lg p-xl space-y-md">
            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto border border-outline-variant/50">
              <span className="material-symbols-outlined text-neutral-400 text-[32px]">favorite</span>
            </div>
            <h3 className="font-bold text-headline-md text-primary font-display">No sponsorships yet</h3>
            <p className="text-on-surface-variant text-body-md leading-relaxed">
              You haven&apos;t sponsored any projects on SponsorChain yet. Back your favorite verified projects with secure XLM payments.
            </p>
            <Link
              href="/explore"
              className="inline-block bg-primary text-on-primary py-md px-lg rounded-full font-bold text-body-lg hover:opacity-90 active:scale-95 transition-all"
            >
              Explore verified projects
            </Link>
          </div>
        ) : (
          <>
            {/* Bento Grid Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              {/* Total Contributed */}
              <div className="bg-white p-lg rounded-2xl border border-outline-variant flex flex-col justify-between h-36">
                <span className="text-secondary font-label-caps text-label-caps uppercase tracking-wider font-semibold">Total Contributed</span>
                <div className="flex flex-col">
                  <span className="font-headline-lg text-headline-lg text-[#2E7D32] font-bold">
                    {totalContributed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XLM
                  </span>
                  <span className="text-[11px] text-secondary mt-1">Sum of verified transactions</span>
                </div>
              </div>

              {/* Projects Supported */}
              <div className="bg-white p-lg rounded-2xl border border-outline-variant flex flex-col justify-between h-36">
                <span className="text-secondary font-label-caps text-label-caps uppercase tracking-wider font-semibold">Projects Supported</span>
                <div className="flex flex-col">
                  <span className="font-headline-lg text-headline-lg text-primary font-bold">
                    {groupedProjects.length}
                  </span>
                  <span className="text-[11px] text-secondary mt-1">Unique repositories</span>
                </div>
              </div>
            </div>

            {/* List Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md font-bold font-display">Supported Repositories</h3>
              <div className="relative w-60 sm:hidden">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-secondary-container pointer-events-none">search</span>
                <input
                  className="w-full pl-9 pr-4 py-1.5 bg-surface-container border-none rounded-lg text-body-sm outline-none font-semibold"
                  placeholder="Search..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Supported Projects List */}
            <div className="space-y-md font-semibold">
              {filteredProjects.map((project) => {
                const isExpanded = !!expandedProjects[project.projectId];
                const cleanAmount = parseFloat(project.totalContributedXLM).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                
                return (
                  <div
                    key={project.projectId}
                    className="bg-white border border-[#E7E5E1] rounded-2xl overflow-hidden transition-all duration-200"
                  >
                    {/* Project Header Row */}
                    <div
                      onClick={() => toggleDetails(project.projectId)}
                      className="p-lg flex flex-col sm:flex-row sm:items-center justify-between gap-md cursor-pointer hover:bg-surface-container-lowest transition-colors"
                    >
                      <div className="flex items-center gap-md">
                        <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant">
                          <span className="material-symbols-outlined text-primary">hub</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-body-lg text-[#141414] leading-snug">{project.projectName}</h4>
                          <span className="font-mono-code text-body-sm text-secondary block">{project.repoUrl}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-lg">
                        <div className="text-right">
                          <span className="text-[#2E7D32] font-bold text-body-lg block">{cleanAmount} XLM</span>
                          <span className="text-[11px] text-secondary">
                            Last Active: {new Date(project.mostRecentDate).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="material-symbols-outlined text-secondary transition-transform duration-200" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                          keyboard_arrow_down
                        </span>
                      </div>
                    </div>

                    {/* Expandable Transaction details */}
                    {isExpanded && (
                      <div className="bg-surface-container-lowest border-t border-outline-variant/30 p-lg space-y-md">
                        <h5 className="font-label-caps text-label-caps text-secondary uppercase font-bold">Contribution History</h5>
                        
                        <div className="space-y-sm">
                          {project.transactions.map((tx, idx) => {
                            const shortHash = `${tx.txHash.slice(0, 6)}...${tx.txHash.slice(-6)}`;
                            
                            return (
                              <div key={idx} className="flex justify-between items-center text-body-sm bg-white p-sm rounded-lg border border-outline-variant/20">
                                <div className="flex items-center gap-md">
                                  <a
                                    href={`https://stellar.expert/explorer/testnet/tx/${tx.txHash}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-mono-code text-primary hover:underline flex items-center gap-xs"
                                  >
                                    {shortHash}
                                    <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                                  </a>
                                  <span className="text-secondary text-[11px]">
                                    {new Date(tx.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <span className="font-bold text-on-background">
                                  +{parseFloat(tx.amountXLM).toLocaleString()} XLM
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
