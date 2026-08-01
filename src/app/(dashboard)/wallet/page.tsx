"use client";

import React from "react";
import { useWallet } from "@/features/wallet/use-wallet";
import { Button } from "@/components/ui/button";

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
      <div className="flex-grow w-full flex items-center justify-center p-6 py-12">
        <div className="bg-surface dark:bg-surface border border-border-color rounded-3xl w-full max-w-[520px] shadow-lg overflow-hidden flex flex-col">
          {/* Main Action Container */}
          <div className="p-8 sm:p-10 flex flex-col items-center text-center">
            {/* Icon Area */}
            <div className="w-16 h-16 bg-canvas-cream dark:bg-surface-container rounded-full flex items-center justify-center mb-6 border border-border-color shadow-xs">
              <span className="material-symbols-outlined text-aubergine dark:text-aubergine-mute text-[32px]">account_balance_wallet</span>
            </div>

            {/* Headline & Subtext */}
            <h1 className="text-3xl font-extrabold text-foreground mb-4 tracking-tight">
              Connect your Stellar wallet
            </h1>
            <p className="text-text-secondary text-base mb-8 leading-relaxed">
              Your Stellar wallet IS your identity on SponsorChain. Connect Freighter, Albedo, or any Stellar wallet to sign in and start sponsoring.
            </p>

            {/* Error notifications */}
            {(wallet.connectionError || wallet.fundingError) && (
              <div className="w-full mb-6 p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 text-sm rounded-2xl border border-rose-200 dark:border-rose-900 text-left font-medium">
                <div>{wallet.connectionError || wallet.fundingError}</div>
              </div>
            )}

            {/* Success Friendbot Notification */}
            {wallet.hasFunded && (
              <div className="w-full mb-6 p-4 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-sm rounded-2xl border border-emerald-500/20 text-left font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">verified</span>
                <span>Funded via Friendbot: 10,000 test XLM</span>
              </div>
            )}

            {/* Primary Action Button */}
            {wallet.isInitializing ? (
              <Button disabled className="w-full">
                <span className="animate-spin material-symbols-outlined mr-2">progress_activity</span>
                Verifying setup...
              </Button>
            ) : !wallet.isConnected ? (
              <Button onClick={wallet.connect} size="lg" className="w-full shadow-md">
                <span className="material-symbols-outlined mr-2">account_balance_wallet</span>
                Connect Wallet
              </Button>
            ) : wallet.isFunding ? (
              <Button disabled className="w-full">
                <span className="animate-spin material-symbols-outlined mr-2">progress_activity</span>
                Funding account via Friendbot...
              </Button>
            ) : (
              <Button
                onClick={wallet.disconnect}
                variant="outline"
                size="lg"
                className="w-full border-rose-500 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <span className="material-symbols-outlined mr-2">check_circle</span>
                Disconnect Wallet
              </Button>
            )}

            {/* Info Section */}
            <div className="mt-8 w-full bg-canvas-cream dark:bg-surface-container rounded-2xl p-4 flex gap-3 text-left border border-border-color">
              <span className="material-symbols-outlined text-aubergine dark:text-aubergine-mute text-[24px] shrink-0">info</span>
              <div>
                <p className="text-text-secondary text-xs leading-relaxed">
                  <strong className="text-foreground">New to Stellar?</strong> We automatically fund your testnet account with 10,000 test XLM via Friendbot — no real funds needed.
                </p>
              </div>
            </div>
          </div>

          {/* Hairline Divider */}
          <div className="px-8 flex items-center gap-4">
            <div className="flex-1 h-[1px] bg-border-color"></div>
            <span className="text-xs text-text-secondary uppercase tracking-widest shrink-0 font-bold">Connected Status</span>
            <div className="flex-1 h-[1px] bg-border-color"></div>
          </div>

          {/* Connected Preview */}
          <div className="p-8 pt-6">
            <div className="bg-canvas-cream dark:bg-surface-container rounded-2xl p-4 border border-border-color space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Wallet Chip */}
                <div className="bg-surface border border-border-color px-3 py-1.5 rounded-full flex items-center justify-between gap-2">
                  <code className="font-mono text-xs text-aubergine dark:text-aubergine-mute font-bold truncate">
                    {wallet.isConnected && wallet.publicKey
                      ? `${wallet.publicKey.slice(0, 6)}...${wallet.publicKey.slice(-6)}`
                      : "Not connected"}
                  </code>
                  {wallet.isConnected && wallet.publicKey && (
                    <button
                      onClick={handleCopy}
                      className="material-symbols-outlined text-text-secondary hover:text-foreground text-[16px] cursor-pointer"
                      aria-label="Copy public key"
                    >
                      content_copy
                    </button>
                  )}
                </div>

                {/* Balance Status Chip */}
                {wallet.isConnected && wallet.balance && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Balance: {parseFloat(wallet.balance).toLocaleString()} XLM
                  </div>
                )}
              </div>

              {wallet.isConnected && (
                <div className="flex items-center gap-1.5 text-xs text-text-secondary justify-center pt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Connected — ready to sponsor and list projects</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
