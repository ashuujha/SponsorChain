"use client";

import React from "react";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="font-body-lg text-on-background min-h-screen flex items-center justify-center p-md dot-grid bg-[#FAFAF8]">
      <main className="w-full max-w-[420px] bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0px_4px_12px_rgba(0,0,0,0.03)] p-xl flex flex-col items-center">
        <div className="mb-lg flex items-center gap-xs">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary">hub</span>
          </div>
          <span className="font-headline-md text-headline-md font-extrabold tracking-tight text-primary">SponsorChain</span>
        </div>

        <div className="text-center mb-xl">
          <h1 className="font-headline-md text-headline-md text-primary mb-sm font-bold">Connect Your Wallet</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[280px] mx-auto">
            SponsorChain uses your Stellar wallet as your identity. No separate accounts needed.
          </p>
        </div>

        <Link href="/wallet" className="w-full">
          <button className="w-full bg-primary text-on-primary flex items-center justify-center gap-sm py-md px-lg rounded-full font-headline-md text-body-lg hover:shadow-[0px_8px_24px_rgba(0,0,0,0.12)] transition-all duration-200 active:scale-[0.98] font-semibold">
            <span className="material-symbols-outlined">account_balance_wallet</span>
            Connect Stellar Wallet
          </button>
        </Link>

        <div className="w-full flex items-center gap-md my-lg">
          <div className="h-[1px] flex-grow bg-outline-variant"></div>
          <span className="font-label-caps text-label-caps text-on-secondary-container">or</span>
          <div className="h-[1px] flex-grow bg-outline-variant"></div>
        </div>

        <Link href="/explore" className="w-full">
          <button className="w-full bg-surface-container-lowest text-primary border border-outline-variant flex items-center justify-center py-md px-lg rounded-full font-headline-md text-body-lg hover:bg-surface-container-low transition-all duration-200 active:scale-[0.98] font-semibold">
            Browse without connecting
          </button>
        </Link>

        <footer className="mt-xl text-center space-y-xs w-full">
          <p className="font-body-sm text-body-sm text-on-secondary-container">
            By connecting, you agree to our
          </p>
          <div className="flex justify-center gap-md">
            <a className="font-label-caps text-label-caps text-primary hover:underline transition-all" href="#">Terms of Service</a>
            <span className="text-outline-variant opacity-50">|</span>
            <a className="font-label-caps text-label-caps text-primary hover:underline transition-all" href="#">Privacy Policy</a>
          </div>
          <div className="pt-lg border-t border-outline-variant/30 mt-sm">
            <p className="font-label-caps text-[10px] uppercase tracking-widest text-on-primary-container opacity-40">
              © 2026 SponsorChain. Built on Stellar.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
