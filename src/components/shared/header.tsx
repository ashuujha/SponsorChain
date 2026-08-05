"use client";

import React from "react";
import Link from "next/link";
import { useUIStore } from "@/lib/ui-store";
import { LogoIcon } from "./logo";
import { useWallet } from "@/features/wallet/use-wallet";

export function Header() {
  const toggleDrawer = useUIStore((state) => state.toggleDrawer);
  const wallet = useWallet();

  return (
    <header className="absolute top-0 left-0 right-0 z-30 px-6 py-5 w-full">
      <div className="max-w-[88rem] mx-auto flex items-center justify-between">

        {/* Left: Mobile Menu + LogoIcon + Wordmark */}
        <div className="flex items-center gap-3">
          <button
            className="p-2 flex items-center justify-center text-black/70 hover:text-black transition-colors lg:hidden rounded-full active:bg-black/5"
            onClick={toggleDrawer}
            aria-label="Toggle Navigation Menu"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>

          <Link href="/" className="flex items-center gap-2.5 group">
            <LogoIcon className="w-7 h-7 text-black transition-transform group-hover:scale-105" />
            <span className="text-2xl font-medium tracking-tight text-black">
              SponsorChain
            </span>
          </Link>
        </div>

        {/* Center: Navigation Links (hidden below md) */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-base text-gray-700 hover:text-black font-medium transition-colors duration-200">
            Network
          </Link>
          <Link href="/explore" className="text-base text-gray-700 hover:text-black font-medium transition-colors duration-200">
            Explore
          </Link>
          <Link href="/activity" className="text-base text-gray-700 hover:text-black font-medium transition-colors duration-200">
            Activity
          </Link>
          <Link href="/payments/status" className="text-base text-gray-700 hover:text-black font-medium transition-colors duration-200">
            Ledger
          </Link>
          <Link href="/list-project" className="text-base text-gray-700 hover:text-black font-medium transition-colors duration-200">
            List Project
          </Link>
        </nav>

        {/* Right: Black pill button */}
        <div className="flex items-center gap-3">
          <Link href="/wallet">
            <button className="bg-black text-white text-base font-medium px-7 py-2.5 rounded-full hover:bg-gray-800 transition-colors duration-200 active:scale-95">
              {wallet.isConnected && wallet.publicKey
                ? `${wallet.publicKey.slice(0, 4)}...${wallet.publicKey.slice(-4)}`
                : "Connect Wallet"}
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}

