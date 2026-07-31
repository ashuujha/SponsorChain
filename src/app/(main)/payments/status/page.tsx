"use client";

import React, { useState } from "react";
import Link from "next/link";

type TxState = "review" | "pending" | "success" | "failed";

export default function PaymentStatusPage() {
  const [state, setState] = useState<TxState>("review");

  return (
    <div className="pb-xl px-gutter max-w-container-max mx-auto pt-8 flex-grow flex flex-col items-center justify-center">
      {/* Interactive Controls for Demonstration */}
      <div className="mb-lg bg-surface-container-low border border-outline-variant p-sm rounded-xl flex gap-xs items-center shadow-sm">
        <span className="text-body-sm font-semibold text-secondary mr-sm px-xs">Demo States:</span>
        {(["review", "pending", "success", "failed"] as TxState[]).map((s) => (
          <button
            key={s}
            onClick={() => setState(s)}
            className={`px-sm py-[2px] rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
              state === s
                ? "bg-primary text-on-primary"
                : "bg-white border border-outline-variant text-secondary hover:bg-surface-container-high"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Main Status Modal Card */}
      <div className="bg-white border border-outline-variant rounded-2xl w-full max-w-[440px] shadow-[0px_4px_12px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden transition-all duration-300">
        
        {/* 1. Review state */}
        {state === "review" && (
          <>
            <div className="p-lg border-b border-outline-variant/30">
              <h2 className="font-headline-md text-headline-md text-on-background font-bold">Confirm your sponsorship</h2>
            </div>
            <div className="p-lg space-y-md">
              <div className="flex justify-between items-center">
                <span className="text-body-sm text-on-surface-variant">Project name</span>
                <span className="text-body-sm font-semibold text-primary">Stellar SDK Core</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-body-sm text-on-surface-variant">Amount in XLM</span>
                <span className="text-body-sm font-bold text-primary">500.00 XLM</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-body-sm text-on-surface-variant">Network fee</span>
                <span className="text-body-sm text-on-surface-variant font-mono">0.00001 XLM</span>
              </div>
              <div className="flex justify-between items-center pt-sm border-t border-outline-variant/20">
                <span className="text-body-sm text-on-surface-variant">Recipient wallet</span>
                <div className="bg-surface-container px-md py-xs rounded-full flex items-center gap-xs">
                  <span className="font-mono-code text-mono-code text-secondary font-bold">GBCV...4K2L</span>
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </div>
              </div>
            </div>
            <div className="p-lg flex flex-col items-center gap-md border-t border-outline-variant/30">
              <button
                onClick={() => setState("pending")}
                className="w-full bg-primary text-on-primary font-bold py-md rounded-full active:scale-95 transition-all"
              >
                Sign & Send with Wallet
              </button>
              <Link href="/explore" className="text-body-sm text-on-surface-variant hover:text-on-background transition-colors font-medium">
                Cancel
              </Link>
            </div>
          </>
        )}

        {/* 2. Pending state */}
        {state === "pending" && (
          <>
            <div className="p-lg border-b border-outline-variant/30">
              <h2 className="font-headline-md text-headline-md text-on-background font-bold">Waiting for confirmation...</h2>
            </div>
            <div className="p-xl flex flex-col items-center justify-center space-y-lg text-center">
              <div className="w-16 h-16 border-2 border-outline-variant border-t-primary rounded-full animate-spin"></div>
              <div>
                <p className="text-body-sm text-on-surface-variant max-w-[280px] mx-auto">
                  Your transaction is being submitted to the Stellar Network. This usually takes 3-5 seconds.
                </p>
              </div>
              <div className="bg-surface-container px-md py-xs rounded-full inline-flex items-center gap-xs">
                <span className="font-mono-code text-mono-code text-secondary">TX: a7b1...f92e</span>
              </div>
            </div>
            <div className="p-lg mt-auto border-t border-outline-variant/20">
              <button
                disabled
                className="w-full bg-primary/10 text-primary/50 font-bold py-md rounded-full cursor-not-allowed"
              >
                Processing...
              </button>
            </div>
          </>
        )}

        {/* 3. Success state */}
        {state === "success" && (
          <>
            <div className="p-lg border-b border-outline-variant/30 text-center">
              <h2 className="font-headline-md text-headline-md text-on-background font-bold">Sponsorship sent!</h2>
            </div>
            <div className="p-xl flex flex-col items-center justify-center space-y-lg text-center">
              <div className="w-16 h-16 rounded-full border-2 border-emerald-500 flex items-center justify-center text-emerald-500">
                <span className="material-symbols-outlined text-4xl">check</span>
              </div>
              <div>
                <p className="text-body-sm text-on-surface-variant max-w-[280px] mx-auto">
                  Successfully sent <span className="font-semibold text-on-background">500 XLM</span> to support the Stellar SDK Core project.
                </p>
              </div>
              <a
                className="bg-surface-container px-md py-xs rounded-full inline-flex items-center gap-xs hover:bg-surface-container-high transition-colors"
                href="https://stellar.expert/explorer/testnet/tx/a7b1897d81a95e7c8e9f92e54a6b2ea1"
                target="_blank"
                rel="noreferrer"
              >
                <span className="font-mono-code text-mono-code text-secondary">TX: a7b1...f92e</span>
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                <span className="text-body-sm ml-1 text-primary font-medium">View on Explorer</span>
              </a>
            </div>
            <div className="p-lg flex flex-col gap-sm border-t border-outline-variant/20">
              <Link href="/dashboard/sponsor" className="w-full">
                <button className="w-full bg-primary text-on-primary font-bold py-md rounded-full active:scale-95 transition-all">
                  Done
                </button>
              </Link>
              <button
                onClick={() => setState("review")}
                className="w-full border border-outline-variant text-on-background font-bold py-md rounded-full hover:bg-surface-container-low transition-colors"
              >
                Sponsor again
              </button>
            </div>
          </>
        )}

        {/* 4. Failed state */}
        {state === "failed" && (
          <>
            <div className="p-lg border-b border-outline-variant/30 text-center">
              <h2 className="font-headline-md text-headline-md text-on-background font-bold text-error">Transaction failed</h2>
            </div>
            <div className="p-xl flex flex-col items-center justify-center space-y-lg text-center">
              <div className="w-16 h-16 rounded-full border-2 border-error flex items-center justify-center text-error">
                <span className="material-symbols-outlined text-4xl">warning</span>
              </div>
              <div>
                <p className="text-body-sm text-on-surface-variant max-w-[280px] mx-auto">
                  The transaction could not be completed due to insufficient XLM balance for network fees.
                </p>
              </div>
              <div className="bg-error-container text-on-error-container px-md py-xs rounded-lg text-body-sm font-semibold border border-error/20">
                Error Code: op_underfunded
              </div>
            </div>
            <div className="p-lg flex flex-col items-center gap-md border-t border-outline-variant/20">
              <button
                onClick={() => setState("review")}
                className="w-full bg-primary text-on-primary font-bold py-md rounded-full active:scale-95 transition-all"
              >
                Try again
              </button>
              <Link href="/explore" className="text-body-sm text-on-surface-variant hover:text-on-background transition-colors font-medium">
                Cancel
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
