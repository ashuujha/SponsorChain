"use client";

import React, { useState } from "react";
import { useWallet } from "@/features/wallet/use-wallet";
import { RequireWallet } from "@/features/wallet-session";
import { Button } from "@/components/ui/button";
import { useOnChainTransactions } from "@/hooks/use-onchain-data";
import { REGISTRY_CONTRACT_ID } from "@/features/projects/contract-data";

export default function TransactionsPage() {
  const wallet = useWallet();
  const [scope, setScope] = useState<"wallet" | "contract">("wallet");

  const targetAddress =
    (scope === "wallet" ? wallet.publicKey : REGISTRY_CONTRACT_ID) || undefined;

  const { data: transactions, isLoading, error, refetch } = useOnChainTransactions(targetAddress);

  return (
    <RequireWallet>
      <div className="w-full pb-24 px-6 max-w-[88rem] mx-auto pt-28 bg-[#F5F5F5] min-h-screen text-black transition-colors overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12 border-b border-black/10 pb-8">
          <div>
            <span className="text-black/60 text-xs font-mono uppercase tracking-widest block mb-2">
              Stellar Testnet // Ledger Transactions
            </span>
            <h1 className="text-4xl md:text-5xl font-medium text-black tracking-tight">
              Transaction Log
            </h1>
            <div className="text-xs text-black/70 mt-3 flex items-center gap-2 max-w-full font-mono">
              <span className="shrink-0 text-black/40">TARGET ADDRESS:</span>
              <code className="text-black bg-white border border-black/10 px-3 py-1 rounded-full truncate max-w-[240px] sm:max-w-none">
                {targetAddress
                  ? `${targetAddress.slice(0, 8)}...${targetAddress.slice(-6)}`
                  : "..."}
              </code>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="text-xs font-mono font-medium text-black/80 hover:text-black bg-white border border-black/10 px-5 py-2.5 rounded-full hover:bg-gray-100 transition-colors inline-flex items-center gap-2 shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Scope Toggle */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setScope("wallet")}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
              scope === "wallet"
                ? "bg-black text-white"
                : "bg-white text-black/70 border border-black/10 hover:border-black hover:text-black shadow-xs"
            }`}
          >
            My Wallet Transactions
          </button>
          <button
            onClick={() => setScope("contract")}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
              scope === "contract"
                ? "bg-black text-white"
                : "bg-white text-black/70 border border-black/10 hover:border-black hover:text-black shadow-xs"
            }`}
          >
            All Platform Transactions
          </button>
        </div>

        {/* Content */}
        {error ? (
          <div className="text-center py-20 border border-black/10 rounded-2xl bg-white p-10 space-y-4 max-w-2xl mx-auto shadow-xs">
            <span className="material-symbols-outlined text-[44px] text-rose-500 mb-2">
              cloud_off
            </span>
            <h3 className="text-2xl font-medium text-black">
              Could not reach Stellar Testnet
            </h3>
            <p className="text-black/70 text-base max-w-md mx-auto">
              Failed to fetch live transaction history from Horizon API. Please verify network status and retry.
            </p>
            <Button onClick={() => refetch()} variant="secondary" size="sm">
              Retry Fetch
            </Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-white border border-black/10 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 h-24 shadow-xs"
              >
                <div className="space-y-2 w-full sm:w-1/2">
                  <div className="h-5 bg-black/10 rounded-md w-3/4" />
                  <div className="h-4 bg-black/5 rounded-md w-1/2" />
                </div>
                <div className="h-8 bg-black/10 rounded-full w-28" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-white border border-black/10 rounded-2xl p-12 text-center space-y-4 max-w-2xl mx-auto shadow-xs">
            <span className="material-symbols-outlined text-[48px] text-black/30">
              receipt_long
            </span>
            <h3 className="text-2xl font-medium text-black">
              No transactions recorded
            </h3>
            <p className="text-black/70 text-base">
              No on-chain transaction records found for this address on Stellar Testnet yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-white border border-black/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs hover:border-black/30 transition-all"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-mono font-medium px-3 py-1 rounded-full border ${
                        tx.successful
                          ? "border-emerald-500/30 text-emerald-700 bg-emerald-500/10"
                          : "border-rose-500/30 text-rose-700 bg-rose-500/10"
                      }`}
                    >
                      {tx.successful ? "SUCCESS" : "FAILED"}
                    </span>
                    <span className="font-mono text-xs text-black/50">
                      Ledger #{tx.ledger}
                    </span>
                  </div>

                  <p className="font-mono text-xs text-black/80 truncate max-w-md">
                    Hash: {tx.hash}
                  </p>

                  <p className="font-mono text-[11px] text-black/50">
                    Fee: {(Number(tx.feeCharged) / 10_000_000).toFixed(7)} XLM • Time: {new Date(tx.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  <a
                    href={tx.stellarExpertUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-black/70 hover:text-black underline inline-flex items-center gap-1.5"
                  >
                    View on StellarExpert &rarr;
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

