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
    <header className="fixed top-0 w-full bg-surface/90 backdrop-blur-md z-40 border-b border-border-color transition-colors">
      <div className="max-w-container-max mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-18 py-3">
        <div className="flex items-center gap-4">
          <button
            className="p-2 hover:bg-canvas-cream dark:hover:bg-surface-container rounded-full transition-colors md:hidden text-foreground"
            onClick={toggleDrawer}
            aria-label="Toggle Navigation Menu"
          >
            <span className="material-symbols-outlined text-[22px]">menu</span>
          </button>

          <Link href="/" className="flex items-center gap-2.5 mr-4 group">
            <BrandLogo className="w-8 h-8 group-hover:scale-105 transition-transform" />
            <span className="font-extrabold text-2xl text-aubergine dark:text-foreground tracking-tight">
              SponsorChain
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 ml-4">
            <Link
              href="/"
              className="text-foreground/80 hover:text-link-blue font-semibold text-[15px] transition-colors"
            >
              Home
            </Link>
            <Link
              href="/explore"
              className="text-foreground/80 hover:text-link-blue font-semibold text-[15px] transition-colors"
            >
              Explore
            </Link>
            <Link
              href="/activity"
              className="text-foreground/80 hover:text-link-blue font-semibold text-[15px] transition-colors"
            >
              My Activity
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          
          <Link href="/list-project" className="hidden sm:inline-block">
            <Button variant="default" size="sm">
              List a Project
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
