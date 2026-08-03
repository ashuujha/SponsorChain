"use client";

import React from "react";
import Link from "next/link";
import { useUIStore } from "@/lib/ui-store";
import { GithubLogo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";

import { useWallet } from "@/features/wallet/use-wallet";

export function Header() {
  const toggleDrawer = useUIStore((state) => state.toggleDrawer);
  const wallet = useWallet();

  return (
    <header className="fixed top-0 w-full bg-background/90 backdrop-blur-md z-40 border-b border-hairline transition-colors h-[56px] flex items-center overflow-hidden">
      <div className="max-w-container-max mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 w-full flex items-center justify-between gap-2">

        {/* Left: Hamburger (mobile) or Nav links (desktop) */}
        <div className="flex items-center gap-3 lg:gap-6 shrink-0">
          <button
            className="p-2 w-9 h-9 flex items-center justify-center text-muted hover:text-foreground transition-colors lg:hidden rounded-full active:bg-foreground/10"
            onClick={toggleDrawer}
            aria-label="Toggle Navigation Menu"
          >
            <span className="material-symbols-outlined text-[22px]">menu</span>
          </button>

          <nav className="hidden lg:flex items-center gap-6">
            <Link href="/" className="font-mono text-xs text-muted hover:text-foreground uppercase tracking-[2px] transition-colors py-2">Home</Link>
            <Link href="/explore" className="font-mono text-xs text-muted hover:text-foreground uppercase tracking-[2px] transition-colors py-2">Explore</Link>
            <Link href="/activity" className="font-mono text-xs text-muted hover:text-foreground uppercase tracking-[2px] transition-colors py-2">Activity</Link>
          </nav>
        </div>

        {/* Center: GitHub + Wordmark — shrinks gracefully */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 justify-center">
          <a
            href="https://github.com/ashuujha/SponsorChain"
            target="_blank"
            rel="noreferrer"
            className="w-8 h-8 shrink-0 flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors border border-hairline rounded-full active:bg-foreground/10"
            title="SponsorChain GitHub Repository"
            aria-label="GitHub Repository"
          >
            <GithubLogo className="w-3.5 h-3.5" />
          </a>
          <Link href="/" className="flex items-center group">
            <span className="font-mono text-[10px] sm:text-xs text-foreground uppercase tracking-[2px] sm:tracking-[5px] font-normal transition-opacity group-hover:opacity-70 whitespace-nowrap">
              SPONSORCHAIN
            </span>
          </Link>
        </div>

        {/* Right: Theme Toggle + Wallet */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <ThemeToggle />
          <Link href="/list-project" className="hidden lg:inline-block">
            <Button variant="default" size="sm">List Project</Button>
          </Link>
          <Link href="/wallet">
            <Button variant="secondary" size="sm" className="px-3 sm:px-4 font-mono text-xs">
              <span className="hidden xs:inline">
                {wallet.isConnected && wallet.publicKey
                  ? `${wallet.publicKey.slice(0, 4)}...${wallet.publicKey.slice(-4)}`
                  : "Wallet"}
              </span>
              <span className="xs:hidden material-symbols-outlined text-[16px]">account_balance_wallet</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
