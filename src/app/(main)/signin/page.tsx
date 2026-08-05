"use client";

import React from "react";
import Link from "next/link";
import { LogoIcon } from "@/components/shared/logo";
import { ArrowRight } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="w-full min-h-screen bg-[#F5F5F5] flex items-center justify-center p-6 text-black transition-colors overflow-x-hidden pt-28 pb-24">
      <main className="w-full max-w-[440px] bg-white rounded-2xl border border-black/10 shadow-xs p-8 sm:p-10 flex flex-col items-center">
        <div className="mb-6 flex items-center gap-3">
          <LogoIcon className="w-8 h-8 text-black" />
          <span className="text-2xl font-medium tracking-tight text-black">SponsorChain</span>
        </div>

        <div className="text-center mb-8 space-y-2">
          <h1 className="text-3xl font-medium text-black tracking-tight">Connect Your Wallet</h1>
          <p className="text-black/70 text-sm max-w-[300px] mx-auto leading-relaxed">
            SponsorChain uses your Stellar wallet as your identity. No separate accounts needed.
          </p>
        </div>

        <Link href="/wallet" className="w-full mb-4">
          <button className="w-full bg-black text-white font-medium flex items-center justify-center gap-2 py-3.5 px-6 rounded-full hover:bg-gray-800 transition-colors text-sm shadow-sm">
            <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            <span>Connect Stellar Wallet</span>
          </button>
        </Link>

        <div className="w-full flex items-center gap-3 my-4">
          <div className="h-[1px] flex-grow bg-black/10" />
          <span className="text-xs font-mono uppercase tracking-wider text-black/40">or</span>
          <div className="h-[1px] flex-grow bg-black/10" />
        </div>

        <Link href="/explore" className="w-full mb-8">
          <button className="w-full bg-[#F5F5F5] text-black border border-black/10 flex items-center justify-center gap-2 py-3.5 px-6 rounded-full font-medium hover:bg-gray-200 transition-colors text-sm">
            <span>Browse without connecting</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </Link>

        <footer className="text-center space-y-2 w-full pt-6 border-t border-black/5">
          <p className="text-xs text-black/60">
            By connecting, you agree to our
          </p>
          <div className="flex justify-center gap-3 text-xs font-mono">
            <a className="text-black hover:underline" href="#">Terms of Service</a>
            <span className="text-black/20">|</span>
            <a className="text-black hover:underline" href="#">Privacy Policy</a>
          </div>
          <div className="pt-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-black/40">
              &copy; 2026 SponsorChain &bull; Built on Stellar Testnet
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
