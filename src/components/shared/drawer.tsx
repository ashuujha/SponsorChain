"use client";

import React from "react";
import Link from "next/link";
import { useUIStore } from "@/lib/ui-store";
import { GithubLogo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";

export function Drawer() {
  const isDrawerOpen = useUIStore((state) => state.isDrawerOpen);
  const setDrawerOpen = useUIStore((state) => state.setDrawerOpen);

  if (!isDrawerOpen) return null;

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-xs transition-opacity"
        onClick={closeDrawer}
      />

      <div className="fixed inset-y-0 left-0 w-4/5 max-w-xs bg-background border-r border-hairline p-6 flex flex-col justify-between overflow-y-auto shadow-2xl">
        <div>
          <div className="flex items-center justify-between pb-6 border-b border-hairline">
            <a
              href="https://github.com/ashuujha/SponsorChain"
              target="_blank"
              rel="noreferrer"
              onClick={closeDrawer}
              className="flex items-center gap-2 p-1"
            >
              <GithubLogo className="w-5 h-5 text-foreground" />
              <span className="font-mono text-xs text-foreground uppercase tracking-[3px]">
                SPONSORCHAIN
              </span>
            </a>
            <button
              onClick={closeDrawer}
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-muted hover:text-foreground active:bg-foreground/10 rounded-full"
              aria-label="Close menu"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <nav className="flex flex-col gap-2 py-6">
            <Link
              href="/"
              onClick={closeDrawer}
              className="font-mono text-sm uppercase tracking-[2px] text-foreground hover:text-muted transition-colors min-h-[44px] flex items-center px-3 rounded-none active:bg-foreground/10"
            >
              Home
            </Link>
            <Link
              href="/explore"
              onClick={closeDrawer}
              className="font-mono text-sm uppercase tracking-[2px] text-foreground hover:text-muted transition-colors min-h-[44px] flex items-center px-3 rounded-none active:bg-foreground/10"
            >
              Explore Projects
            </Link>
            <Link
              href="/activity"
              onClick={closeDrawer}
              className="font-mono text-sm uppercase tracking-[2px] text-foreground hover:text-muted transition-colors min-h-[44px] flex items-center px-3 rounded-none active:bg-foreground/10"
            >
              My Activity
            </Link>
            <Link
              href="/wallet"
              onClick={closeDrawer}
              className="font-mono text-sm uppercase tracking-[2px] text-foreground hover:text-muted transition-colors min-h-[44px] flex items-center px-3 rounded-none active:bg-foreground/10"
            >
              Wallet Dashboard
            </Link>
          </nav>
        </div>

        <div className="flex flex-col gap-4 pt-6 border-t border-hairline">
          <div className="flex items-center justify-between px-3">
            <span className="font-mono text-xs uppercase tracking-[2px] text-muted">Theme</span>
            <ThemeToggle />
          </div>

          <Link href="/list-project" onClick={closeDrawer} className="w-full">
            <Button variant="default" className="w-full min-h-[44px]">
              List Project
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export const NavigationDrawer = Drawer;
