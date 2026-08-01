"use client";

import React from "react";
import Link from "next/link";
import { useUIStore } from "@/lib/ui-store";
import { BrandLogo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  const toggleDrawer = useUIStore((state) => state.toggleDrawer);

  return (
    <header className="fixed top-0 w-full bg-surface/90 backdrop-blur-md z-40 border-b border-outline-variant transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        <div className="flex items-center gap-sm">
          <button
            className="p-xs hover:bg-surface-container rounded-full transition-colors md:hidden text-foreground"
            onClick={toggleDrawer}
            aria-label="Toggle Navigation Menu"
          >
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>

          <Link href="/" className="flex items-center gap-2 mr-md group">
            <BrandLogo className="w-7 h-7 text-foreground group-hover:scale-105 transition-transform" />
            <span className="font-headline-md text-headline-md font-bold text-foreground tracking-tight">
              SponsorChain
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-lg ml-4">
            <Link
              href="/"
              className="text-secondary hover:text-foreground font-semibold text-body-sm transition-colors"
            >
              Home
            </Link>
            <Link
              href="/explore"
              className="text-secondary hover:text-foreground font-semibold text-body-sm transition-colors"
            >
              Explore
            </Link>
            <Link
              href="/activity"
              className="text-secondary hover:text-foreground font-semibold text-body-sm transition-colors"
            >
              My Activity
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-sm">
          <ThemeToggle />
          
          <Link href="/list-project">
            <button className="hidden sm:inline-flex bg-primary text-on-primary font-label-caps text-label-caps px-md py-2 rounded-full hover:opacity-90 transition-all font-semibold shadow-xs">
              List a Project
            </button>
          </Link>
          <Link href="/wallet">
            <button className="border border-outline-variant text-foreground font-label-caps text-label-caps px-md py-2 rounded-full hover:bg-surface-container transition-colors font-semibold">
              Wallet
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}
