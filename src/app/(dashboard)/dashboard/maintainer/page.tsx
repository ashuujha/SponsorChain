"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLiveAccountPayments } from "@/features/payments/use-live-account-payments";

interface DBProject {
  id: string;
  name: string;
  repoUrl: string;
  description: string;
  fundingGoalXLM: string;
  owner: {
    walletPublicKey: string | null;
  };
  sponsorships: {
    txHash: string;
    sponsor: {
      githubId: string;
    };
  }[];
}

export default function MaintainerDashboard() {
  const { status: sessionStatus } = useSession();
  const router = useRouter();
  const [project, setProject] = useState<DBProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Redirect if unauthenticated
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/signin");
    }
  }, [sessionStatus, router]);

  // Load project details
  useEffect(() => {
    if (sessionStatus !== "authenticated") return;

    fetch("/api/maintainer/project")
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to load dashboard data.");
        }
        const data = await res.json();
        setProject(data.project);
      })
      .catch((err) => {
        console.error("Dashboard load error:", err);
        setError(err.message || "Failed to load dashboard.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [sessionStatus]);

  // Connect live stream
  const ownerWalletKey = project?.owner?.walletPublicKey || null;
  const livePayments = useLiveAccountPayments(ownerWalletKey);

  if (sessionStatus === "loading" || (isLoading && sessionStatus === "authenticated")) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-40 gap-md">
        <span className="animate-spin material-symbols-outlined text-[40px] text-primary">progress_activity</span>
        <p className="font-semibold text-on-surface-variant text-body-md">Retrieving dashboard telemetry...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-md">
        <span className="material-symbols-outlined text-[48px] text-error">warning</span>
        <h3 className="font-bold text-headline-md text-primary font-display">Dashboard Error</h3>
        <p className="text-on-surface-variant text-body-sm">{error}</p>
      </div>
    );
  }

  // If no project exists yet, display empty onboarding dashboard
  if (!project) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-xl min-h-[80vh] text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mb-lg border border-outline-variant/50">
          <span className="material-symbols-outlined text-primary text-[32px]">engineering</span>
        </div>
        <h2 className="font-headline-md text-headline-md text-primary font-bold font-display mb-sm">No Projects Listed</h2>
        <p className="text-on-surface-variant text-body-md mb-xl">
          You haven&apos;t listed any verified GitHub repositories for sponsorships yet. Register a project to start receiving XLM.
        </p>
        <Link
          href="/projects/create"
          className="w-full bg-primary text-on-primary py-md px-lg rounded-full font-bold text-body-lg hover:opacity-90 active:scale-95 transition-all"
        >
          Create first project
        </Link>
      </div>
    );
  }

  // Cross-reference names
  const sponsorNameMap: Record<string, string> = {};
  project.sponsorships.forEach((s) => {
    sponsorNameMap[s.txHash] = s.sponsor.githubId;
  });

  const raisedLiveVal = parseFloat(livePayments.totalRaised);
  const goalVal = parseFloat(project.fundingGoalXLM);
  const progressLive = goalVal > 0 ? Math.min(100, Math.round((raisedLiveVal / goalVal) * 100)) : 0;
  const sponsorsCount = livePayments.payments.length;
  const avgSponsorship = sponsorsCount > 0 ? (raisedLiveVal / sponsorsCount).toFixed(2) : "0.00";

  // Stream status indicator
  const streamStatusDetails = {
    connected: { color: "bg-[#2E7D32]", label: "Connected" },
    reconnecting: { color: "bg-[#EF6C00]", label: "Reconnecting" },
    disconnected: { color: "bg-[#C62828]", label: "Disconnected" },
    polling: { color: "bg-[#1565C0]", label: "Polling fallback" },
  }[livePayments.status];

  // Filter dynamic payments list
  const filteredPayments = livePayments.payments.filter((payment) => {
    const name = sponsorNameMap[payment.transaction_hash] || "Anonymous";
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.transaction_hash.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="flex-grow flex flex-col w-full min-h-screen">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-outline-variant flex items-center justify-between px-lg z-45">
        <div className="flex items-center gap-lg flex-grow">
          <div className="relative w-72 hidden sm:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-secondary-container pointer-events-none">search</span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-surface-container border-none rounded-lg text-body-sm focus:ring-1 focus:ring-primary placeholder-on-secondary-container outline-none font-semibold"
              placeholder="Search live sponsors..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <h2 className="font-bold text-body-lg text-primary leading-none">Hello, Project Owner</h2>
            <p className="text-[11px] text-secondary mt-1 flex items-center gap-xs">
              <span className={`w-1.5 h-1.5 rounded-full ${streamStatusDetails.color}`}></span>
              <span>Horizon Network • {streamStatusDetails.label}</span>
            </p>
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
            <h1 className="font-headline-lg text-headline-lg text-[#141414] font-bold font-display">{project.name}</h1>
            <p className="font-mono-code text-body-sm text-secondary">{project.repoUrl}</p>
          </div>
          <Link
            href={`/projects/${project.id}`}
            className="bg-transparent border border-outline-variant hover:bg-surface-container-low transition-colors px-lg py-sm rounded-full font-bold text-body-sm text-on-surface-variant flex items-center gap-xs"
          >
            Public Project Page
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          </Link>
        </div>

        {/* Bento Grid Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
          {/* Total Raised */}
          <div className="bg-white p-lg rounded-2xl border border-outline-variant flex flex-col justify-between h-36">
            <span className="text-secondary font-label-caps text-label-caps uppercase tracking-wider font-semibold">Total Raised</span>
            <div className="flex flex-col">
              <span className="font-headline-lg text-headline-lg text-[#2E7D32] font-bold">
                {raisedLiveVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XLM
              </span>
              <span className="text-[11px] text-secondary mt-1">Live from Horizon</span>
            </div>
          </div>

          {/* Sponsors */}
          <div className="bg-white p-lg rounded-2xl border border-outline-variant flex flex-col justify-between h-36">
            <span className="text-secondary font-label-caps text-label-caps uppercase tracking-wider font-semibold">Total Sponsors</span>
            <div className="flex flex-col">
              <span className="font-headline-lg text-headline-lg text-primary font-bold">
                {sponsorsCount}
              </span>
              <span className="text-[11px] text-secondary mt-1">Ledger addresses</span>
            </div>
          </div>

          {/* Goal Progress */}
          <div className="bg-white p-lg rounded-2xl border border-outline-variant flex flex-col justify-between h-36">
            <span className="text-secondary font-label-caps text-label-caps uppercase tracking-wider font-semibold">Goal Progress</span>
            <div className="space-y-sm">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-body-lg">{progressLive}%</span>
                <span className="text-secondary text-body-sm">Target: {parseFloat(project.fundingGoalXLM).toLocaleString()} XLM</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${progressLive}%` }}></div>
              </div>
            </div>
          </div>

          {/* Avg Sponsorship */}
          <div className="bg-white p-lg rounded-2xl border border-outline-variant flex flex-col justify-between h-36">
            <span className="text-secondary font-label-caps text-label-caps uppercase tracking-wider font-semibold">Avg. Sponsorship</span>
            <div className="flex flex-col">
              <span className="font-headline-lg text-headline-lg text-primary font-bold">
                {parseFloat(avgSponsorship).toLocaleString()} XLM
              </span>
              <span className="text-[11px] text-secondary mt-1">Computed live</span>
            </div>
          </div>
        </div>

        {/* Content Row: Sponsors Table + Project Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
          {/* Sponsors Table - 2 Columns wide */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-outline-variant overflow-hidden flex flex-col">
            <div className="p-lg border-b border-outline-variant/30 flex items-center justify-between flex-wrap gap-sm">
              <h3 className="font-headline-md text-headline-md font-bold font-display">Live Sponsors</h3>
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
            {livePayments.payments.length === 0 ? (
              <div className="p-xl text-center text-on-surface-variant text-body-sm">
                No sponsors yet — share your project to get your first one
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="p-xl text-center text-on-surface-variant text-body-sm">
                No sponsors found matching your criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/30 font-semibold text-secondary text-body-sm bg-surface-container-low">
                      <th className="p-md">Sponsor</th>
                      <th className="p-md">Amount</th>
                      <th className="p-md">Stellar Transaction</th>
                      <th className="p-md text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20 font-semibold">
                    {filteredPayments.map((payment) => {
                      const resolvedName = sponsorNameMap[payment.transaction_hash] || "Anonymous";
                      const shortHash = `${payment.transaction_hash.slice(0, 6)}...${payment.transaction_hash.slice(-6)}`;
                      
                      return (
                        <tr key={payment.id} className="hover:bg-surface-container-lowest transition-colors text-body-md">
                          <td className="p-md flex items-center gap-xs">
                            <span className="material-symbols-outlined text-neutral-400">person</span>
                            <span>{resolvedName}</span>
                          </td>
                          <td className="p-md text-[#2E7D32]">{parseFloat(payment.amount).toLocaleString()} XLM</td>
                          <td className="p-md">
                            <a
                              href={`https://stellar.expert/explorer/testnet/tx/${payment.transaction_hash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono-code text-on-surface-variant hover:text-primary flex items-center gap-xs"
                            >
                              {shortHash}
                              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                            </a>
                          </td>
                          <td className="p-md text-right text-secondary text-body-sm">
                            {new Date(payment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Project Health panel */}
          <div className="bg-white p-lg rounded-2xl border border-outline-variant space-y-lg flex flex-col justify-between shadow-sm">
            <div className="space-y-md">
              <h3 className="font-headline-md text-headline-md font-bold font-display">Project Health</h3>
              
              <div className="space-y-sm text-body-md font-semibold">
                <div className="flex justify-between border-b border-outline-variant/30 pb-xs">
                  <span className="text-secondary">Owner Wallet:</span>
                  <span className="font-mono-code">
                    {ownerWalletKey?.slice(0, 6)}...{ownerWalletKey?.slice(-6)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-outline-variant/30 pb-xs">
                  <span className="text-secondary">Status:</span>
                  <span className="text-[#2E7D32]">Active</span>
                </div>
                <div className="flex justify-between border-b border-outline-variant/30 pb-xs">
                  <span className="text-secondary">GitHub Sync:</span>
                  <span className="text-[#2E7D32]">Linked</span>
                </div>
                <div className="flex justify-between pb-xs">
                  <span className="text-secondary">Network Status:</span>
                  <span className="text-on-background uppercase text-[10px] px-xs py-0.5 bg-surface-container rounded font-bold">
                    Testnet
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-surface-container p-md rounded-xl space-y-xs">
              <div className="flex items-center gap-xs text-on-background font-semibold">
                <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
                <span>Horizon Stream Supervisor</span>
              </div>
              <p className="text-secondary text-[11px] leading-normal">
                This dashboard establishes Server-Sent Events stream to coordinate ledger transactions on-chain live.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
