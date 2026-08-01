"use client";

import React from "react";
import { useWallet } from "@/features/wallet/use-wallet";

export default function WalletConnectPage() {
  const wallet = useWallet();

  const handleCopy = () => {
    if (wallet.publicKey) {
      navigator.clipboard.writeText(wallet.publicKey);
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center w-full min-h-screen">
      {/* Centered Onboarding Card */}
      <div className="flex-grow w-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="bg-white dark:bg-neutral-900 border border-outline-variant dark:border-neutral-800 rounded-2xl w-full max-w-[480px] shadow-sm overflow-hidden flex flex-col">
          {/* Main Action Container */}
          <div className="p-xl flex flex-col items-center text-center">
            {/* Icon Area */}
            <div className="w-16 h-16 bg-surface-container dark:bg-neutral-800 rounded-full flex items-center justify-center mb-lg border border-outline-variant/40 dark:border-neutral-700">
              <span className="material-symbols-outlined text-primary dark:text-neutral-100 text-[32px]">account_balance_wallet</span>
            </div>
            {/* Headline & Subtext */}
            <h1 className="font-headline-lg text-headline-lg text-foreground mb-md tracking-tight font-bold">Connect your Stellar wallet</h1>
            <p className="font-body-lg text-body-lg text-secondary dark:text-neutral-400 mb-xl leading-relaxed">
              Your Stellar wallet IS your identity on SponsorChain. Connect Freighter, Albedo, or any Stellar wallet to sign in and start sponsoring.
            </p>

            {/* Error notifications */}
            {(wallet.connectionError || wallet.fundingError) && (
              <div className="w-full mb-md p-md bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-body-sm rounded-xl border border-rose-200 dark:border-rose-900 text-left font-medium">
                <div>{wallet.connectionError || wallet.fundingError}</div>
              </div>
            )}

            {/* Success Friendbot Notification */}
            {wallet.hasFunded && (
              <div className="w-full mb-md p-md bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-body-sm rounded-xl border border-emerald-500/20 text-left font-medium flex items-center gap-xs">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>Funded via Friendbot: 10,000 XLM</span>
              </div>
            )}

            {/* Primary Action Button */}
            {wallet.isInitializing ? (
              <button
                disabled
                className="w-full bg-primary dark:bg-neutral-100 text-on-primary dark:text-neutral-900 font-body-lg py-md px-lg rounded-full flex items-center justify-center gap-sm opacity-80 cursor-not-allowed font-semibold"
              >
                <span className="animate-spin material-symbols-outlined">progress_activity</span>
                Verifying setup...
              </button>
            ) : !wallet.isConnected ? (
              <button
                onClick={wallet.connect}
                className="w-full bg-primary dark:bg-neutral-100 text-on-primary dark:text-neutral-900 font-body-lg py-md px-lg rounded-full flex items-center justify-center gap-sm hover:opacity-90 transition-all active:scale-[0.98] duration-200 font-semibold shadow-sm"
              >
                <span className="material-symbols-outlined">account_balance_wallet</span>
                Connect Wallet
              </button>
            ) : wallet.isFunding ? (
              <button
                disabled
                className="w-full bg-primary dark:bg-neutral-100 text-on-primary dark:text-neutral-900 font-body-lg py-md px-lg rounded-full flex items-center justify-center gap-sm opacity-80 cursor-not-allowed font-semibold"
              >
                <span className="animate-spin material-symbols-outlined">progress_activity</span>
                Funding account via Friendbot...
              </button>
            ) : (
              <button
                onClick={wallet.disconnect}
                className="w-full bg-emerald-600 dark:bg-emerald-500 text-white font-body-lg py-md px-lg rounded-full flex items-center justify-center gap-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined">check_circle</span>
                Disconnect Wallet
              </button>
            )}

            {/* Info Section */}
            <div className="mt-lg w-full bg-surface-container-low dark:bg-neutral-800/80 rounded-xl p-md flex gap-md text-left border border-outline-variant/30 dark:border-neutral-700">
              <span className="material-symbols-outlined text-secondary dark:text-neutral-400 text-headline-md">info</span>
              <div>
                <p className="font-body-sm text-body-sm text-secondary dark:text-neutral-400">
                  <span className="font-semibold text-foreground">New to Stellar?</span> We will automatically fund your testnet wallet with test XLM via Friendbot — no need to buy anything.
                </p>
              </div>
            </div>
          </div>

          {/* Hairline Divider */}
          <div className="px-xl flex items-center gap-md">
            <div className="flex-1 h-[1px] bg-outline-variant dark:bg-neutral-800"></div>
            <span className="font-label-caps text-label-caps text-secondary dark:text-neutral-400 shrink-0 font-bold">After connecting:</span>
            <div className="flex-1 h-[1px] bg-outline-variant dark:bg-neutral-800"></div>
          </div>

          {/* Connected Preview */}
          <div className="p-xl pt-lg">
            <div className="bg-surface-container dark:bg-neutral-800/60 rounded-xl p-md border border-outline-variant/50 dark:border-neutral-700">
              <div className="flex flex-col gap-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm">
                  {/* Wallet Chip */}
                  <div className="bg-white dark:bg-neutral-900 border border-outline-variant dark:border-neutral-700 px-sm py-xs rounded-lg flex items-center justify-between sm:justify-start gap-sm overflow-hidden max-w-full">
                    <code className="font-mono-code text-mono-code text-foreground font-bold truncate">
                      {wallet.isConnected && wallet.publicKey
                        ? `${wallet.publicKey.slice(0, 6)}...${wallet.publicKey.slice(-6)}`
                        : "Not connected"}
                    </code>
                    {wallet.isConnected && wallet.publicKey && (
                      <button
                        onClick={handleCopy}
                        className="material-symbols-outlined text-secondary dark:text-neutral-400 hover:text-foreground p-xs cursor-pointer flex-shrink-0"
                        aria-label="Copy public key"
                      >
                        content_copy
                      </button>
                    )}
                  </div>
                  {/* Balance Status Chip */}
                  {wallet.isConnected && wallet.balance && (
                    <div className="flex items-center gap-xs text-[12px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-500/20 px-sm py-xs rounded-full self-start">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Balance: {parseFloat(wallet.balance).toLocaleString()} XLM
                    </div>
                  )}
                </div>
                {wallet.isConnected && (
                  <div className="flex items-center gap-xs text-[11px] text-secondary dark:text-neutral-400 justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Connected — ready to sponsor and list projects</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
