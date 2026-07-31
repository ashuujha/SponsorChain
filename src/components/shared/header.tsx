"use client";

import React from "react";
import Link from "next/link";
import { useUIStore } from "@/lib/ui-store";

export function Header() {
  const toggleDrawer = useUIStore((state) => state.toggleDrawer);

  return (
    <header className="fixed top-0 w-full bg-surface z-40 border-b border-outline-variant">
      <div className="max-w-container-max mx-auto px-gutter flex justify-between items-center h-16">
        <div className="flex items-center gap-sm">
          <button
            className="p-xs hover:bg-surface-container rounded-full transition-colors md:hidden"
            onClick={toggleDrawer}
            aria-label="Toggle Navigation Menu"
          >
            <span className="material-symbols-outlined text-primary">menu</span>
          </button>

          <Link href="/" className="flex items-center gap-xs mr-md">
            <span className="material-symbols-outlined text-primary">hub</span>
            <span className="font-headline-md text-headline-md font-bold text-primary">
              SponsorChain
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-lg">
            <Link
              href="/"
              className="text-secondary hover:text-primary font-semibold text-body-sm transition-colors"
            >
              Home
            </Link>
            <Link
              href="/explore"
              className="text-secondary hover:text-primary font-semibold text-body-sm transition-colors"
            >
              Explore
            </Link>
            <Link
              href="/activity"
              className="text-secondary hover:text-primary font-semibold text-body-sm transition-colors"
            >
              My Activity
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-sm">
          <Link href="/list-project">
            <button className="hidden sm:inline-flex bg-primary text-on-primary font-label-caps text-label-caps px-md py-sm rounded-full hover:bg-neutral-800 transition-colors font-semibold">
              List a Project
            </button>
          </Link>
          <Link href="/wallet">
            <button className="border border-outline-variant text-primary font-label-caps text-label-caps px-md py-sm rounded-full hover:bg-surface-container transition-colors font-semibold">
              Wallet
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}
