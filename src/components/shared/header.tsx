"use client";

import React from "react";
import Link from "next/link";
import { useUIStore } from "@/lib/ui-store";
import { GithubLogo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";

export function Header() {
  const toggleDrawer = useUIStore((state) => state.toggleDrawer);

  return (
    <header className="fixed top-0 w-full bg-background/90 backdrop-blur-md z-40 border-b border-hairline transition-colors h-[56px] flex items-center">
      <div className="max-w-container-max mx-auto px-4 sm:px-6 lg:px-8 w-full flex justify-between items-center">
        {/* Left: Navigation / Menu Button */}
        <div className="flex items-center gap-4 lg:gap-6">
          <button
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-muted hover:text-foreground transition-colors lg:hidden rounded-full active:bg-foreground/10"
            onClick={toggleDrawer}
            aria-label="Toggle Navigation Menu"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>

          <nav className="hidden lg:flex items-center gap-6">
            <Link
              href="/"
              className="font-mono text-xs text-muted hover:text-foreground uppercase tracking-[2px] transition-colors py-2"
            >
              Home
            </Link>
            <Link
              href="/explore"
              className="font-mono text-xs text-muted hover:text-foreground uppercase tracking-[2px] transition-colors py-2"
            >
              Explore
            </Link>
            <Link
              href="/activity"
              className="font-mono text-xs text-muted hover:text-foreground uppercase tracking-[2px] transition-colors py-2"
            >
              Activity
            </Link>
          </nav>
        </div>

        {/* Center: SponsorChain Wordmark & GitHub Link */}
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="https://github.com/ashuujha/SponsorChain"
            target="_blank"
            rel="noreferrer"
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground/80 hover:text-foreground transition-colors border border-hairline rounded-full active:bg-foreground/10"
            title="SponsorChain GitHub Repository"
            aria-label="GitHub Repository"
          >
            <GithubLogo className="w-4 h-4" />
          </a>
          <Link href="/" className="flex items-center group py-2">
            <span className="font-mono text-xs sm:text-sm text-foreground uppercase tracking-[3px] sm:tracking-[6px] font-normal transition-opacity group-hover:opacity-80 truncate max-w-[140px] sm:max-w-none">
              SPONSORCHAIN
            </span>
          </Link>
        </div>

        {/* Right: Actions & Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          
          <Link href="/list-project" className="hidden lg:inline-block">
            <Button variant="default" size="sm">
              List Project
            </Button>
          </Link>
          <Link href="/wallet">
            <Button variant="secondary" size="sm">
              Wallet
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
