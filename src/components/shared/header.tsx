"use client";

import React from "react";
import Link from "next/link";
import { useUIStore } from "@/lib/ui-store";
import { BrandLogo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  const toggleDrawer = useUIStore((state) => state.toggleDrawer);

  return (
    <header className="fixed top-0 w-full bg-surface/90 dark:bg-neutral-950/90 backdrop-blur-md z-40 border-b border-outline-variant dark:border-neutral-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        <div className="flex items-center gap-sm">
          <button
            className="p-xs hover:bg-surface-container dark:hover:bg-neutral-800 rounded-full transition-colors md:hidden"
            onClick={toggleDrawer}
            aria-label="Toggle Navigation Menu"
          >
            <span className="material-symbols-outlined text-primary dark:text-neutral-100">menu</span>
          </button>

          <Link href="/" className="flex items-center gap-2 mr-md group">
            <BrandLogo className="w-7 h-7 text-primary dark:text-neutral-100 group-hover:scale-105 transition-transform" />
            <span className="font-headline-md text-headline-md font-bold text-primary dark:text-neutral-100 tracking-tight">
              SponsorChain
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-lg ml-4">
            <Link
              href="/"
              className="text-secondary dark:text-neutral-400 hover:text-primary dark:hover:text-neutral-100 font-semibold text-body-sm transition-colors"
            >
              Home
            </Link>
            <Link
              href="/explore"
              className="text-secondary dark:text-neutral-400 hover:text-primary dark:hover:text-neutral-100 font-semibold text-body-sm transition-colors"
            >
              Explore
            </Link>
            <Link
              href="/activity"
              className="text-secondary dark:text-neutral-400 hover:text-primary dark:hover:text-neutral-100 font-semibold text-body-sm transition-colors"
            >
              My Activity
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-sm">
          <ThemeToggle />
          
          <Link href="/list-project">
            <button className="hidden sm:inline-flex bg-primary dark:bg-neutral-100 text-on-primary dark:text-neutral-900 font-label-caps text-label-caps px-md py-2 rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors font-semibold shadow-xs">
              List a Project
            </button>
          </Link>
          <Link href="/wallet">
            <button className="border border-outline-variant dark:border-neutral-700 text-primary dark:text-neutral-100 font-label-caps text-label-caps px-md py-2 rounded-full hover:bg-surface-container dark:hover:bg-neutral-800 transition-colors font-semibold">
              Wallet
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}
