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

  const isCreateProject = pathname.includes("/projects/create");
  const isMaintainerDash = pathname.includes("/dashboard/maintainer");
  const isSponsorDash = pathname.includes("/dashboard/sponsor");

  return (
    <div className="flex min-h-screen bg-surface text-on-surface">
      {/* Sidebar Navigation - Desktop only */}
      <aside className="hidden md:flex w-64 bg-surface-container-lowest border-r border-outline-variant fixed inset-y-0 left-0 flex-col p-md gap-sm z-50">
        <Link href="/" className="flex items-center gap-sm px-sm py-md mb-lg">
          <span className="material-symbols-outlined text-primary text-headline-md">hub</span>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">SponsorChain</h1>
        </Link>
        <nav className="flex flex-col gap-xs flex-grow font-semibold">
          {/* Home */}
          <Link
            href="/"
            className="flex items-center gap-md px-md py-sm text-secondary hover:bg-surface-container-high rounded-lg transition-colors duration-200"
          >
            <span className="material-symbols-outlined">home</span>
            <span className="font-body-lg">Home</span>
          </Link>
          
          {/* Projects / Create */}
          <Link
            href="/dashboard/maintainer"
            className={`flex items-center gap-md px-md py-sm rounded-lg transition-colors duration-200 ${
              isMaintainerDash || isCreateProject
                ? "bg-secondary-container text-on-secondary-container font-semibold"
                : "text-secondary hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined">engineering</span>
            <span className="font-body-lg">Projects</span>
          </Link>

          {/* Wallet */}
          <Link
            href="/wallet"
            className={`flex items-center gap-md px-md py-sm rounded-lg transition-colors duration-200 ${
              pathname.includes("/wallet")
                ? "bg-secondary-container text-on-secondary-container font-semibold"
                : "text-secondary hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined">account_balance_wallet</span>
            <span className="font-body-lg">Wallet</span>
          </Link>

          {/* Sponsor Dashboard */}
          <Link
            href="/dashboard/sponsor"
            className={`flex items-center gap-md px-md py-sm rounded-lg transition-colors duration-200 ${
              isSponsorDash
                ? "bg-secondary-container text-on-secondary-container font-semibold"
                : "text-secondary hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-body-lg">Sponsorships</span>
          </Link>

          {/* Settings - Mock locked for demo */}
          <div className="flex items-center justify-between px-md py-sm text-secondary opacity-40 cursor-not-allowed">
            <div className="flex items-center gap-md">
              <span className="material-symbols-outlined">settings</span>
              <span className="font-body-lg">Settings</span>
            </div>
            <span className="material-symbols-outlined text-body-sm">lock</span>
          </div>
        </nav>

        {/* Maintainer Mode Indicator */}
        <div className="pt-lg border-t border-outline-variant">
          <div className="flex items-center gap-md px-sm">
            <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-on-secondary-container text-body-sm">person</span>
            </div>
            <div className="flex flex-col font-semibold">
              <span className="text-body-sm font-semibold truncate">
                {isMaintainerDash || isCreateProject ? "Maintainer Mode" : "Sponsor Mode"}
              </span>
              <span className="text-[10px] text-secondary font-mono-code uppercase tracking-wider">Stellar Testnet</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Canvas - dynamic padding left */}
      <main className="pl-0 md:pl-64 flex-grow flex flex-col min-h-screen pb-16 md:pb-0">
        {children}
      </main>

      {/* Bottom Sticky Tab Bar Navigation - Mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-outline-variant flex items-center justify-around z-50">
        <Link
          href="/dashboard/maintainer"
          className={`flex flex-col items-center justify-center w-20 h-full gap-0.5 transition-colors ${
            isMaintainerDash || isCreateProject ? "text-primary" : "text-secondary"
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">engineering</span>
          <span className="text-[10px] font-bold tracking-tight">Projects</span>
        </Link>

        <Link
          href="/wallet"
          className={`flex flex-col items-center justify-center w-20 h-full gap-0.5 transition-colors ${
            pathname.includes("/wallet") ? "text-primary" : "text-secondary"
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
          <span className="text-[10px] font-bold tracking-tight">Wallet</span>
        </Link>

        <Link
          href="/dashboard/sponsor"
          className={`flex flex-col items-center justify-center w-20 h-full gap-0.5 transition-colors ${
            isSponsorDash ? "text-primary" : "text-secondary"
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">dashboard</span>
          <span className="text-[10px] font-bold tracking-tight">Sponsor</span>
        </Link>
      </nav>
    </div>
  );
}
