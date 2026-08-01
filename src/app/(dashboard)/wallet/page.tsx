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
    <div className="flex-grow flex flex-col items-center w-full min-h-screen bg-background text-foreground transition-colors overflow-x-hidden">
      {/* Centered Onboarding Card */}
      <div className="flex-grow w-full flex items-center justify-center p-4 sm:p-6 py-12 sm:py-16">
        <div className="bg-surface border border-hairline rounded-none w-full max-w-[520px] shadow-lg overflow-hidden flex flex-col">
          {/* Main Action Container */}
          <div className="p-6 sm:p-12 flex flex-col items-center text-center">
            {/* Icon Area */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 border border-hairline flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-foreground text-[24px] sm:text-[28px]">account_balance_wallet</span>
            </div>

            {/* Headline & Subtext */}
            <h1 className="display-md text-xl sm:text-2xl md:text-3xl text-foreground mb-4 tracking-[2px] font-normal uppercase">
              Connect your Stellar wallet
            </h1>
            <p className="body-serif text-muted text-sm sm:text-base mb-8 leading-relaxed">
              Your Stellar wallet IS your identity on SponsorChain. Connect Freighter, Albedo, or any Stellar wallet to sign in and start sponsoring.
            </p>

            {/* Error notifications */}
            {(wallet.connectionError || wallet.fundingError) && (
              <div className="w-full mb-6 p-4 bg-background border border-hairline text-xs font-mono text-foreground text-left leading-relaxed break-words">
                <div>{wallet.connectionError || wallet.fundingError}</div>
              </div>
            )}

            {/* Success Friendbot Notification */}
            {wallet.hasFunded && (
              <div className="w-full mb-6 p-4 bg-background border border-hairline text-xs font-mono text-foreground text-left uppercase tracking-[1.5px] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">done</span>
                <span>Funded via Friendbot: 10,000 XLM</span>
              </div>
            )}

            {/* Primary Action Button */}
            {wallet.isInitializing ? (
              <Button disabled className="w-full min-h-[44px]">
                <span className="animate-spin material-symbols-outlined mr-2 text-[18px]">progress_activity</span>
                Verifying setup...
              </Button>
            ) : !wallet.isConnected ? (
              <Button onClick={wallet.connect} size="lg" className="w-full min-h-[44px]">
                Connect Wallet
              </Button>
            ) : wallet.isFunding ? (
              <Button disabled className="w-full min-h-[44px]">
                <span className="animate-spin material-symbols-outlined mr-2 text-[18px]">progress_activity</span>
                Funding account via Friendbot...
              </Button>
            ) : (
              <Button
                onClick={wallet.disconnect}
                variant="outline"
                size="lg"
                className="w-full min-h-[44px] border-rose-500 text-rose-500 hover:bg-rose-500/10"
              >
                Disconnect Wallet
              </Button>
            )}

            {/* Info Section */}
            <div className="mt-8 w-full bg-background border border-hairline p-4 text-left space-y-1">
              <span className="caption-uppercase text-foreground">NEW TO STELLAR?</span>
              <p className="body-serif text-muted text-xs leading-relaxed">
                We automatically fund your testnet account with 10,000 test XLM via Friendbot — no real funds needed.
              </p>
            </div>
          </div>

          {/* Hairline Divider */}
          <div className="px-6 sm:px-8 flex items-center gap-4">
            <div className="flex-1 h-[1px] bg-hairline"></div>
            <span className="caption-uppercase text-muted text-[10px] sm:text-xs">CONNECTED STATUS</span>
            <div className="flex-1 h-[1px] bg-hairline"></div>
          </div>

          {/* Connected Preview */}
          <div className="p-6 sm:p-8 pt-6">
            <div className="bg-background border border-hairline p-4 space-y-3 font-mono text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Wallet Chip */}
                <div className="border border-hairline px-3 py-2 flex items-center justify-between gap-2 min-w-0">
                  <code className="font-mono text-xs text-foreground uppercase tracking-[1.5px] font-normal truncate">
                    {wallet.isConnected && wallet.publicKey
                      ? `${wallet.publicKey.slice(0, 6)}...${wallet.publicKey.slice(-6)}`
                      : "Not connected"}
                  </code>
                  {wallet.isConnected && wallet.publicKey && (
                    <button
                      onClick={handleCopy}
                      className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center material-symbols-outlined text-muted hover:text-foreground text-[18px] cursor-pointer shrink-0 active:bg-foreground/10 rounded"
                      aria-label="Copy public key"
                    >
                      content_copy
                    </button>
                  )}
                </div>

                {/* Balance Status Chip */}
                {wallet.isConnected && wallet.balance && (
                  <div className="caption-uppercase text-xs text-foreground border border-hairline px-3 py-2 shrink-0">
                    Balance: {parseFloat(wallet.balance).toLocaleString()} XLM
                  </div>
                )}
              </div>

              {wallet.isConnected && (
                <div className="caption-uppercase text-[10px] text-muted text-center pt-1">
                  Connected — ready to sponsor and list projects
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
