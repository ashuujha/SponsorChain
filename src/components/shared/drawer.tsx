"use client";

import React from "react";
import Link from "next/link";
import { useUIStore } from "@/lib/ui-store";
import { BrandLogo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";

export function Drawer() {
  const isDrawerOpen = useUIStore((state) => state.isDrawerOpen);
  const setDrawerOpen = useUIStore((state) => state.setDrawerOpen);

  if (!isDrawerOpen) return null;

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        className="fixed inset-0 bg-aubergine/40 backdrop-blur-xs transition-opacity"
        onClick={closeDrawer}
      />

      <div className="fixed inset-y-0 left-0 w-4/5 max-w-xs bg-surface border-r border-border-color shadow-2xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-6 border-b border-border-color">
            <Link href="/" onClick={closeDrawer} className="flex items-center gap-2">
              <BrandLogo className="w-7 h-7" />
              <span className="font-extrabold text-xl text-aubergine dark:text-foreground">
                SponsorChain
              </span>
            </Link>
            <button
              onClick={closeDrawer}
              className="p-1 hover:bg-canvas-cream dark:hover:bg-surface-container rounded-full text-foreground"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <nav className="flex flex-col gap-4 py-6">
            <Link
              href="/"
              onClick={closeDrawer}
              className="font-bold text-lg text-foreground hover:text-link-blue py-2 px-3 rounded-lg hover:bg-canvas-cream dark:hover:bg-surface-container transition-colors"
            >
              Home
            </Link>
            <Link
              href="/explore"
              onClick={closeDrawer}
              className="font-bold text-lg text-foreground hover:text-link-blue py-2 px-3 rounded-lg hover:bg-canvas-cream dark:hover:bg-surface-container transition-colors"
            >
              Explore Projects
            </Link>
            <Link
              href="/activity"
              onClick={closeDrawer}
              className="font-bold text-lg text-foreground hover:text-link-blue py-2 px-3 rounded-lg hover:bg-canvas-cream dark:hover:bg-surface-container transition-colors"
            >
              My Activity
            </Link>
            <Link
              href="/wallet"
              onClick={closeDrawer}
              className="font-bold text-lg text-foreground hover:text-link-blue py-2 px-3 rounded-lg hover:bg-canvas-cream dark:hover:bg-surface-container transition-colors"
            >
              Wallet Dashboard
            </Link>
          </nav>
        </div>

        <div className="flex flex-col gap-4 pt-6 border-t border-border-color">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-text-secondary">Theme</span>
            <ThemeToggle />
          </div>

          <Link href="/list-project" onClick={closeDrawer} className="w-full">
            <Button variant="default" className="w-full">
              List a Project
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export const NavigationDrawer = Drawer;
