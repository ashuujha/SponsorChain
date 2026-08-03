"use client";

import React from "react";
import Link from "next/link";
import { useWallet } from "@/features/wallet/use-wallet";
import { RequireWallet } from "@/features/wallet-session";
import { Button } from "@/components/ui/button";
import { useOnChainActivity } from "@/hooks/use-onchain-data";

export default function ActivityPage() {
  const wallet = useWallet();
  const { data: events, isLoading, error, refetch } = useOnChainActivity();

  return (
    <RequireWallet>
      <div className="w-full pb-24 px-4 sm:px-8 lg:px-12 xl:px-16 max-w-container-max mx-auto pt-8 sm:pt-12 bg-background min-h-screen text-foreground transition-colors overflow-x-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 sm:mb-12 border-b border-hairline pb-6 sm:pb-8">
          <div>
            <div className="caption-uppercase text-muted mb-2 text-[10px] sm:text-xs">STELLAR TESTNET // NETWORK ACTIVITY</div>
            <h1 className="display-lg font-normal text-foreground uppercase">LIVE CONTRACT EVENTS</h1>
            <p className="caption-uppercase text-muted text-xs mt-3 flex items-center gap-2 max-w-full">
              <span className="shrink-0">CONNECTED WALLET:</span>
              <code className="font-mono text-xs text-foreground border border-hairline px-2.5 py-1 bg-surface truncate max-w-[200px] sm:max-w-none">
                {wallet.publicKey
                  ? `${wallet.publicKey.slice(0, 8)}...${wallet.publicKey.slice(-6)}`
                  : "..."}
              </code>
            </p>
          </div>

          <Link href="/list-project" className="w-full sm:w-auto">
            <Button size="sm" className="w-full sm:w-auto min-h-[44px]">
              LIST NEW PROJECT
            </Button>
          </Link>
        </div>

        {error ? (
          <div className="text-center py-16 sm:py-24 border border-hairline bg-surface p-8 sm:p-12 space-y-4">
            <span className="material-symbols-outlined text-[40px] text-destructive mb-2">
              cloud_off
            </span>
            <h3 className="font-mono text-base sm:text-lg text-foreground uppercase tracking-[2px]">
              COULDN&apos;T REACH STELLAR TESTNET RPC
            </h3>
            <p className="body-serif text-muted text-sm max-w-md mx-auto">
              Failed to query Soroban getEvents from the Stellar network. Please check your connection and try again.
            </p>
            <Button onClick={() => refetch()} variant="secondary" size="sm" className="min-h-[44px]">
              RETRY QUERY
            </Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-surface border border-hairline p-6 h-24 flex items-center justify-between">
                <div className="space-y-2 w-2/3">
                  <div className="h-4 bg-hairline/40 w-1/3" />
                  <div className="h-3 bg-hairline/20 w-1/2" />
                </div>
                <div className="h-4 bg-hairline/30 w-1/6" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="bg-surface border border-hairline rounded-none p-12 text-center space-y-4">
            <span className="material-symbols-outlined text-[40px] text-muted mb-2">history</span>
            <h3 className="font-mono text-base text-foreground uppercase tracking-[2px]">NO RECENT EVENTS RECORDED</h3>
            <p className="body-serif text-muted text-sm max-w-md mx-auto">
              No on-chain contract events found on Stellar Testnet for ProjectRegistry or SponsorshipManager.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="bg-surface border border-hairline p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:border-foreground/40"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 text-[10px] font-mono uppercase tracking-[1px] border ${
                      evt.type === "project_created"
                        ? "border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                        : "border-blue-500/50 text-blue-600 dark:text-blue-400 bg-blue-500/10"
                    }`}>
                      {evt.type === "project_created" ? "PROJECT REGISTERED" : "SPONSORSHIP FUNDED"}
                    </span>
                    <span className="font-mono text-xs text-muted">
                      LEDGER #{evt.ledger}
                    </span>
                  </div>

                  <p className="font-mono text-xs text-foreground truncate max-w-xl">
                    TX: {evt.txHash}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-hairline pt-3 sm:pt-0">
                  <span className="font-mono text-[11px] text-muted">
                    {new Date(evt.ledgerClosedAt).toLocaleTimeString()}
                  </span>
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${evt.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bugatti-link text-[11px] inline-flex items-center gap-1"
                  >
                    VIEW ON EXPLORER &rarr;
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </RequireWallet>
  );
}
