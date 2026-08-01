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
    <div className="flex-grow flex flex-col items-center w-full min-h-screen bg-black text-white">
      {/* Centered Onboarding Card */}
      <div className="flex-grow w-full flex items-center justify-center p-6 py-16">
        <div className="bg-surface-card border border-hairline rounded-none w-full max-w-[520px] shadow-lg overflow-hidden flex flex-col">
          {/* Main Action Container */}
          <div className="p-8 sm:p-12 flex flex-col items-center text-center">
            {/* Icon Area */}
            <div className="w-14 h-14 border border-hairline flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-white text-[28px]">account_balance_wallet</span>
            </div>

            {/* Headline & Subtext */}
            <h1 className="display-md text-2xl sm:text-3xl text-white mb-4 tracking-[2px] font-normal">
              CONNECT STELLAR WALLET
            </h1>
            <p className="body-serif text-muted text-base mb-8 leading-relaxed">
              Your Stellar wallet IS your identity on SponsorChain. Connect Freighter, Albedo, or any Stellar wallet to sign in and start sponsoring.
            </p>

            {/* Error notifications */}
            {(wallet.connectionError || wallet.fundingError) && (
              <div className="w-full mb-6 p-4 bg-black border border-hairline-strong text-xs font-mono text-white text-left leading-relaxed">
                <div>{wallet.connectionError || wallet.fundingError}</div>
              </div>
            )}

            {/* Success Friendbot Notification */}
            {wallet.hasFunded && (
              <div className="w-full mb-6 p-4 bg-black border border-white text-xs font-mono text-white text-left uppercase tracking-[1.5px] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">done</span>
                <span>FUNDED VIA FRIENDBOT: 10,000 TEST XLM</span>
              </div>
            )}

            {/* Primary Action Button */}
            {wallet.isInitializing ? (
              <Button disabled className="w-full">
                <span className="animate-spin material-symbols-outlined mr-2 text-[18px]">progress_activity</span>
                VERIFYING SETUP...
              </Button>
            ) : !wallet.isConnected ? (
              <Button onClick={wallet.connect} size="lg" className="w-full">
                CONNECT WALLET
              </Button>
            ) : wallet.isFunding ? (
              <Button disabled className="w-full">
                <span className="animate-spin material-symbols-outlined mr-2 text-[18px]">progress_activity</span>
                FUNDING ACCOUNT VIA FRIENDBOT...
              </Button>
            ) : (
              <Button
                onClick={wallet.disconnect}
                variant="outline"
                size="lg"
                className="w-full border-rose-500 text-rose-400 hover:bg-rose-950/30"
              >
                DISCONNECT WALLET
              </Button>
            )}

            {/* Info Section */}
            <div className="mt-8 w-full bg-black border border-hairline p-4 text-left space-y-1">
              <span className="caption-uppercase text-white">NEW TO STELLAR?</span>
              <p className="body-serif text-muted text-xs leading-relaxed">
                We automatically fund your testnet account with 10,000 test XLM via Friendbot — no real funds needed.
              </p>
            </div>
          </div>

          {/* Hairline Divider */}
          <div className="px-8 flex items-center gap-4">
            <div className="flex-1 h-[1px] bg-hairline"></div>
            <span className="caption-uppercase text-muted">CONNECTED STATUS</span>
            <div className="flex-1 h-[1px] bg-hairline"></div>
          </div>

          {/* Connected Preview */}
          <div className="p-8 pt-6">
            <div className="bg-black border border-hairline p-4 space-y-3 font-mono text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Wallet Chip */}
                <div className="border border-hairline px-3 py-1.5 flex items-center justify-between gap-2">
                  <code className="font-mono text-xs text-white uppercase tracking-[1.5px] font-normal truncate">
                    {wallet.isConnected && wallet.publicKey
                      ? `${wallet.publicKey.slice(0, 6)}...${wallet.publicKey.slice(-6)}`
                      : "NOT CONNECTED"}
                  </code>
                  {wallet.isConnected && wallet.publicKey && (
                    <button
                      onClick={handleCopy}
                      className="material-symbols-outlined text-muted hover:text-white text-[16px] cursor-pointer"
                      aria-label="Copy public key"
                    >
                      content_copy
                    </button>
                  )}
                </div>

                {/* Balance Status Chip */}
                {wallet.isConnected && wallet.balance && (
                  <div className="caption-uppercase text-xs text-white border border-hairline px-3 py-1.5">
                    BALANCE: {parseFloat(wallet.balance).toLocaleString()} XLM
                  </div>
                )}
              </div>

              {wallet.isConnected && (
                <div className="caption-uppercase text-[10px] text-muted text-center pt-1">
                  CONNECTED // READY TO SPONSOR AND LIST REPOSITORIES
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
