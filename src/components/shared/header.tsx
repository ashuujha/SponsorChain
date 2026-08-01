"use client";

import React from "react";
import Link from "next/link";
import { useUIStore } from "@/lib/ui-store";
import { BrandLogo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";

export function Header() {
  const toggleDrawer = useUIStore((state) => state.toggleDrawer);

  return (
    <header className="fixed top-0 w-full bg-black/90 backdrop-blur-md z-40 border-b border-hairline transition-colors h-[56px] flex items-center">
      <div className="max-w-container-max mx-auto px-4 sm:px-6 lg:px-8 w-full flex justify-between items-center">
        {/* Left: Navigation / Menu */}
        <div className="flex items-center gap-6">
          <button
            className="p-1 hover:text-white transition-colors md:hidden text-muted"
            onClick={toggleDrawer}
            aria-label="Toggle Navigation Menu"
          >
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/explore"
              className="font-mono text-xs text-muted hover:text-white uppercase tracking-[2px] transition-colors"
            >
              Explore
            </Link>
            <Link
              href="/activity"
              className="font-mono text-xs text-muted hover:text-white uppercase tracking-[2px] transition-colors"
            >
              Activity
            </Link>
          </nav>
        </div>

        {/* Center: Bugatti Display Wordmark */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <BrandLogo className="w-5 h-5 hidden sm:block" />
          <span className="font-mono text-xs sm:text-sm text-white uppercase tracking-[6px] font-normal transition-opacity group-hover:opacity-80">
            SPONSORCHAIN
          </span>
        </Link>

        {/* Right: Actions & Theme Toggle */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          
          <Link href="/list-project" className="hidden sm:inline-block">
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
