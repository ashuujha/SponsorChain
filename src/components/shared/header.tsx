"use client";

import React from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useUIStore } from "@/lib/ui-store";

export function Header() {
  const { data: session, status } = useSession();
  const toggleDrawer = useUIStore((state) => state.toggleDrawer);

  return (
    <header className="fixed top-0 w-full bg-surface z-40 border-b border-outline-variant">
      <div className="max-w-container-max mx-auto px-gutter flex justify-between items-center h-16">
        <div className="flex items-center gap-sm">
          {/* Mobile menu toggle */}
          <button className="p-xs hover:bg-surface-container rounded-full transition-colors md:hidden" onClick={toggleDrawer} aria-label="Toggle Navigation Menu">
            <span className="material-symbols-outlined text-primary">menu</span>
          </button>
          
          <Link href="/" className="flex items-center gap-xs mr-md">
            <span className="material-symbols-outlined text-primary">hub</span>
            <span className="font-headline-md text-headline-md font-bold text-primary">SponsorChain</span>
          </Link>

          {/* Desktop Horizontal Navbar */}
          <nav className="hidden md:flex items-center gap-lg">
            <Link href="/explore" className="text-secondary hover:text-primary font-semibold text-body-sm transition-colors">
              Explore
            </Link>
            <Link href="/dashboard/maintainer" className="text-secondary hover:text-primary font-semibold text-body-sm transition-colors">
              Maintainers
            </Link>
            <Link href="/dashboard/sponsor" className="text-secondary hover:text-primary font-semibold text-body-sm transition-colors">
              Sponsors
            </Link>
            <Link href="/wallet" className="text-secondary hover:text-primary font-semibold text-body-sm transition-colors">
              Wallet
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-md">
          {status === "authenticated" && session?.user ? (
            <div className="flex items-center gap-md">
              <span className="hidden sm:inline text-secondary font-semibold text-body-sm">
                @{session.user.name || "user"}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="bg-surface border border-outline-variant text-primary font-label-caps text-label-caps px-md py-sm rounded-full hover:bg-surface-container transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link href="/signin">
              <button className="bg-primary text-on-primary font-label-caps text-label-caps px-md py-sm rounded-full hover:bg-neutral-800 transition-colors">
                Sign in with GitHub
              </button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
