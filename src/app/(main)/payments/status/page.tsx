"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@/features/wallet/use-wallet";
import { RequireWallet } from "@/features/wallet-session";
import { Button } from "@/components/ui/button";
import {
  fetchHorizonAccountTransactions,
  HorizonTransactionRecord,
} from "@/features/payments/payment-service";
import { REGISTRY_CONTRACT_ID } from "@/features/projects/contract-data";

export default function TransactionsPage() {
  const wallet = useWallet();
  const [scope, setScope] = useState<"wallet" | "contract">("wallet");
  const [transactions, setTransactions] = useState<HorizonTransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const targetAddress =
    scope === "wallet" ? wallet.publicKey : REGISTRY_CONTRACT_ID;

  const loadTransactions = async () => {
    if (!targetAddress) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const txs = await fetchHorizonAccountTransactions(targetAddress, 25);
      setTransactions(txs);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
    const interval = setInterval(loadTransactions, 15000);
    return () => clearInterval(interval);
  }, [targetAddress, scope]);

  return (
    <RequireWallet>
      <div className="w-full pb-24 px-4 sm:px-8 lg:px-12 xl:px-16 max-w-container-max mx-auto pt-8 sm:pt-12 bg-background min-h-screen text-foreground transition-colors overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 sm:mb-12 border-b border-hairline pb-6 sm:pb-8">
          <div>
            <div className="caption-uppercase text-muted mb-2 text-[10px] sm:text-xs">
              STELLAR TESTNET // LEDGER TRANSACTIONS
            </div>
            <h1 className="display-lg font-normal text-foreground uppercase">
              TRANSACTION LOG
            </h1>
            <p className="caption-uppercase text-muted text-xs mt-3 flex items-center gap-2 max-w-full">
              <span className="shrink-0">TARGET ADDRESS:</span>
              <code className="font-mono text-xs text-foreground border border-hairline px-2.5 py-1 bg-surface truncate max-w-[220px] sm:max-w-none">
                {targetAddress
                  ? `${targetAddress.slice(0, 8)}...${targetAddress.slice(-6)}`
                  : "..."}
              </code>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadTransactions}
              className="min-h-[44px] inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              REFRESH
            </Button>
          </div>
        </div>

        {/* Scope Toggle */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setScope("wallet")}
            className={`px-5 py-2.5 min-h-[44px] rounded-full font-mono text-xs uppercase tracking-[1.5px] transition-all ${
              scope === "wallet"
                ? "bg-foreground text-background font-semibold"
                : "bg-transparent border border-hairline text-muted hover:border-foreground hover:text-foreground"
            }`}
          >
            MY WALLET TRANSACTIONS
          </button>
          <button
            onClick={() => setScope("contract")}
            className={`px-5 py-2.5 min-h-[44px] rounded-full font-mono text-xs uppercase tracking-[1.5px] transition-all ${
              scope === "contract"
                ? "bg-foreground text-background font-semibold"
                : "bg-transparent border border-hairline text-muted hover:border-foreground hover:text-foreground"
            }`}
          >
            ALL PLATFORM TRANSACTIONS
          </button>
        </div>

        {/* Content */}
        {hasError ? (
          <div className="text-center py-16 sm:py-24 border border-hairline bg-surface p-8 sm:p-12 space-y-4">
            <span className="material-symbols-outlined text-[40px] text-destructive mb-2">
              cloud_off
            </span>
            <h3 className="font-mono text-base sm:text-lg text-foreground uppercase tracking-[2px]">
              COULDN&apos;T REACH STELLAR TESTNET
            </h3>
            <p className="body-serif text-muted text-sm max-w-md mx-auto">
              Failed to fetch live transaction history from Horizon API. Please check network status and retry.
            </p>
            <Button onClick={loadTransactions} variant="secondary" size="sm" className="min-h-[44px]">
              RETRY FETCH
            </Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-surface border border-hairline p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 h-24"
              >
                <div className="space-y-2 w-full sm:w-1/2">
                  <div className="h-4 bg-hairline/40 w-3/4" />
                  <div className="h-3 bg-hairline/20 w-1/2" />
                </div>
                <div className="h-8 bg-hairline/40 w-28 rounded-full" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-surface border border-hairline p-12 text-center space-y-4">
            <span className="material-symbols-outlined text-[40px] text-muted">
              receipt_long
            </span>
            <h3 className="font-mono text-base text-foreground uppercase tracking-[1.5px]">
              NO TRANSACTIONS RECORDED
            </h3>
            <p className="body-serif text-muted text-sm">
              No on-chain transaction records found for this address on Stellar Testnet yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-surface border border-hairline p-5 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-foreground/60 transition-all"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-3">
                    <span
                      className={`caption-uppercase text-[10px] px-2.5 py-0.5 border ${
                        tx.successful
                          ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                          : "border-destructive/40 text-destructive bg-destructive/10"
                      }`}
                    >
                      {tx.successful ? "SUCCESS" : "FAILED"}
                    </span>
                    <span className="font-mono text-xs text-muted">
                      LEDGER #{tx.ledger}
                    </span>
                  </div>

                  <p className="font-mono text-xs text-foreground truncate max-w-full">
                    HASH: <code className="text-foreground">{tx.hash}</code>
                  </p>

                  <p className="caption-uppercase text-[10px] text-muted">
                    DATE: {new Date(tx.createdAt).toLocaleString()} &bull; FEE: {tx.feeCharged} STROOPS
                  </p>
                </div>

                <div className="shrink-0 pt-2 md:pt-0 w-full md:w-auto text-left md:text-right">
                  <a
                    href={tx.stellarExpertUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bugatti-link text-xs min-h-[44px] inline-flex items-center gap-1.5"
                  >
                    VIEW ON STELLAR EXPERT &rarr;
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
