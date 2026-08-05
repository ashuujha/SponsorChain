"use client";

import React from "react";
import Link from "next/link";
import { useUIStore } from "@/lib/ui-store";
import { LogoIcon } from "./logo";

export function Drawer() {
  const isDrawerOpen = useUIStore((state) => state.isDrawerOpen);
  const setDrawerOpen = useUIStore((state) => state.setDrawerOpen);

  if (!isDrawerOpen) return null;

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={closeDrawer}
      />

      <div className="fixed inset-y-0 left-0 w-4/5 max-w-xs bg-[#F5F5F5] p-6 flex flex-col justify-between overflow-y-auto shadow-2xl z-50 border-r border-black/10">
        <div>
          <div className="flex items-center justify-between pb-6 border-b border-black/10">
            <Link
              href="/"
              onClick={closeDrawer}
              className="flex items-center gap-2.5 p-1"
            >
              <LogoIcon className="w-6 h-6 text-black" />
              <span className="text-xl font-medium tracking-tight text-black">
                SponsorChain
              </span>
            </Link>
            <button
              onClick={closeDrawer}
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-black/70 hover:text-black active:bg-black/5 rounded-full"
              aria-label="Close menu"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>

          <nav className="flex flex-col gap-2 py-6">
            <Link
              href="/"
              onClick={closeDrawer}
              className="text-lg font-medium text-black hover:text-black/70 transition-colors min-h-[44px] flex items-center px-3 rounded-lg active:bg-black/5"
            >
              Network
            </Link>
            <Link
              href="/explore"
              onClick={closeDrawer}
              className="text-lg font-medium text-black hover:text-black/70 transition-colors min-h-[44px] flex items-center px-3 rounded-lg active:bg-black/5"
            >
              Explore Projects
            </Link>
            <Link
              href="/activity"
              onClick={closeDrawer}
              className="text-lg font-medium text-black hover:text-black/70 transition-colors min-h-[44px] flex items-center px-3 rounded-lg active:bg-black/5"
            >
              My Activity
            </Link>
            <Link
              href="/payments/status"
              onClick={closeDrawer}
              className="text-lg font-medium text-black hover:text-black/70 transition-colors min-h-[44px] flex items-center px-3 rounded-lg active:bg-black/5"
            >
              Ledger Transactions
            </Link>
            <Link
              href="/wallet"
              onClick={closeDrawer}
              className="text-lg font-medium text-black hover:text-black/70 transition-colors min-h-[44px] flex items-center px-3 rounded-lg active:bg-black/5"
            >
              Wallet Dashboard
            </Link>
          </nav>
        </div>

        <div className="flex flex-col gap-4 pt-6 border-t border-black/10">
          <Link href="/list-project" onClick={closeDrawer} className="w-full">
            <button className="w-full bg-black text-white font-medium py-3 rounded-full hover:bg-gray-800 transition-colors">
              List Project
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export const NavigationDrawer = Drawer;

