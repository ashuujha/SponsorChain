"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  const isWallet = pathname.includes("/wallet");
  const isCreateProject = pathname.includes("/projects/create");

  return (
    <div className="flex min-h-screen bg-surface text-on-surface">
      {/* Desktop sidebar — mirrors the header nav */}
      <aside className="hidden md:flex w-64 bg-surface-container-lowest border-r border-outline-variant fixed inset-y-0 left-0 flex-col p-md gap-sm z-50">
        <Link href="/" className="flex items-center gap-sm px-sm py-md mb-lg">
          <span className="material-symbols-outlined text-primary text-headline-md">hub</span>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">
            SponsorChain
          </h1>
        </Link>
        <nav className="flex flex-col gap-xs flex-grow font-semibold">
          <Link
            href="/"
            className="flex items-center gap-md px-md py-sm text-secondary hover:bg-surface-container-high rounded-lg transition-colors duration-200"
          >
            <span className="material-symbols-outlined">home</span>
            <span className="font-body-lg">Home</span>
          </Link>

          <Link
            href="/explore"
            className={`flex items-center gap-md px-md py-sm rounded-lg transition-colors duration-200 ${
              pathname.includes("/explore")
                ? "bg-secondary-container text-on-secondary-container font-semibold"
                : "text-secondary hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined">travel_explore</span>
            <span className="font-body-lg">Explore</span>
          </Link>

          <Link
            href="/activity"
            className={`flex items-center gap-md px-md py-sm rounded-lg transition-colors duration-200 ${
              pathname.includes("/activity")
                ? "bg-secondary-container text-on-secondary-container font-semibold"
                : "text-secondary hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined">monitoring</span>
            <span className="font-body-lg">My Activity</span>
          </Link>

          <Link
            href="/wallet"
            className={`flex items-center gap-md px-md py-sm rounded-lg transition-colors duration-200 ${
              isWallet
                ? "bg-secondary-container text-on-secondary-container font-semibold"
                : "text-secondary hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined">account_balance_wallet</span>
            <span className="font-body-lg">Wallet</span>
          </Link>

          <Link
            href="/list-project"
            className={`flex items-center gap-md px-md py-sm rounded-lg transition-colors duration-200 ${
              pathname === "/list-project" || isCreateProject
                ? "bg-secondary-container text-on-secondary-container font-semibold"
                : "text-secondary hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined">add_circle</span>
            <span className="font-body-lg">List a Project</span>
          </Link>
        </nav>

        <div className="pt-lg border-t border-outline-variant">
          <p className="text-[10px] text-secondary font-mono-code uppercase tracking-wider px-xs">
            Stellar Testnet
          </p>
        </div>
      </aside>

      <main className="pl-0 md:pl-64 flex-grow flex flex-col min-h-screen pb-16 md:pb-0">
        {children}
      </main>

      {/* Mobile bottom nav — matches desktop nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-outline-variant flex items-center justify-around z-50">
        <Link
          href="/explore"
          className={`flex flex-col items-center justify-center w-20 h-full gap-0.5 transition-colors ${
            pathname.includes("/explore") ? "text-primary" : "text-secondary"
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">travel_explore</span>
          <span className="text-[10px] font-bold tracking-tight">Explore</span>
        </Link>

        <Link
          href="/activity"
          className={`flex flex-col items-center justify-center w-20 h-full gap-0.5 transition-colors ${
            pathname.includes("/activity") ? "text-primary" : "text-secondary"
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">monitoring</span>
          <span className="text-[10px] font-bold tracking-tight">Activity</span>
        </Link>

        <Link
          href="/list-project"
          className={`flex flex-col items-center justify-center w-20 h-full gap-0.5 transition-colors ${
            pathname === "/list-project" || isCreateProject ? "text-primary" : "text-secondary"
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">add_circle</span>
          <span className="text-[10px] font-bold tracking-tight">List</span>
        </Link>

        <Link
          href="/wallet"
          className={`flex flex-col items-center justify-center w-20 h-full gap-0.5 transition-colors ${
            isWallet ? "text-primary" : "text-secondary"
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
          <span className="text-[10px] font-bold tracking-tight">Wallet</span>
        </Link>
      </nav>
    </div>
  );
}
