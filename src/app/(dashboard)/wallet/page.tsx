"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useWallet } from "@/features/wallet/use-wallet";
import { EXPLORER_BASE } from "@/lib/stellar-config";

export default function WalletPage() {
  const wallet = useWallet();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!wallet.publicKey) return;
    navigator.clipboard.writeText(wallet.publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncatedKey = wallet.publicKey && wallet.publicKey.length >= 12
    ? `${wallet.publicKey.slice(0, 6)}...${wallet.publicKey.slice(-6)}`
    : "Not connected";

  const formattedBalance = wallet.balance !== null
    ? parseFloat(wallet.balance).toLocaleString()
    : "0";

  return (
    <div className="w-full pb-24 px-6 max-w-4xl mx-auto pt-28 bg-[#F5F5F5] min-h-screen text-black transition-colors overflow-x-hidden space-y-8">
      {/* Header */}
      <div className="border-b border-black/10 pb-8">
        <span className="text-black/60 text-xs font-mono uppercase tracking-widest block mb-2">
          Stellar Testnet // Wallet Manager
        </span>
        <h1 className="text-4xl md:text-5xl font-medium text-black tracking-tight">
          Connect your Stellar wallet
        </h1>
        <p className="text-black/70 text-base mt-2">
          Your Stellar wallet IS your identity on SponsorChain. Connect Freighter, Albedo, or any Stellar wallet to sign in and start sponsoring.
        </p>
      </div>

      {!wallet.isConnected ? (
        /* Disconnected State */
        <div className="bg-white border border-black/10 rounded-2xl p-10 sm:p-12 text-center space-y-6 shadow-xs max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-[#2B2644] text-white rounded-full flex items-center justify-center mx-auto shadow-md">
            <span className="material-symbols-outlined text-[32px]">account_balance_wallet</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-medium text-black">No Wallet Connected</h2>
            <p className="text-black/70 text-base max-w-md mx-auto">
              Connect your Freighter, xBull, or Albedo wallet on Stellar Testnet to list projects and sponsor open-source software.
            </p>
            <div className="text-xs font-mono text-black/50 pt-2">
              Not connected
            </div>
          </div>

          <button
            onClick={() => wallet.connect()}
            className="bg-black text-white font-medium px-8 py-3.5 rounded-full hover:bg-gray-800 transition-colors shadow-md text-sm inline-flex items-center gap-2"
          >
            <span>Connect Wallet</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      ) : (
        /* Connected State */
        <div className="space-y-8">
          <div className="bg-white border border-black/10 rounded-2xl p-8 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono font-medium text-black/80 uppercase tracking-wider">
                  Wallet Active &bull; Stellar Testnet
                </span>
              </div>

              <button
                onClick={() => wallet.disconnect()}
                className="text-xs font-mono font-medium text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 px-4 py-2 rounded-full transition-colors self-start sm:self-auto"
              >
                Disconnect Wallet
              </button>
            </div>

            {/* Public Key Display */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-black/50 block">PUBLIC KEY</label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <code className="flex-1 bg-[#F5F5F5] border border-black/10 rounded-xl px-4 py-3 font-mono text-xs text-black break-all">
                  {truncatedKey}
                </code>
                <button
                  onClick={handleCopy}
                  className="bg-black text-white font-medium text-xs px-5 py-3 rounded-xl hover:bg-gray-800 transition-colors shrink-0 flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Balance Display */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-black/5">
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase tracking-wider text-black/50 block">ACCOUNT BALANCE</span>
                <span className="text-3xl font-medium text-black tracking-tight">
                  Balance: {formattedBalance} XLM
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-mono uppercase tracking-wider text-black/50 block">NETWORK</span>
                <span className="text-lg font-mono font-medium text-black tracking-wider block pt-1">
                  Stellar Testnet
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/explore"
              className="flex-1 bg-[#2B2644] text-white rounded-2xl p-6 hover:bg-[#231e38] transition-colors shadow-sm space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">Explore Projects</span>
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
              <p className="text-xs text-white/70 font-normal">Browse and sponsor open-source repositories.</p>
            </Link>

            <Link
              href="/activity"
              className="flex-1 bg-white border border-black/10 rounded-2xl p-6 hover:border-black/30 transition-colors shadow-sm space-y-2 group text-black"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">Maintainer Dashboard</span>
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
              <p className="text-xs text-black/60 font-normal">Manage your listed repositories and activity.</p>
            </Link>
          </div>

          {wallet.publicKey && (
            <div className="text-center pt-4">
              <a
                href={`${EXPLORER_BASE}/account/${wallet.publicKey}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-black/60 hover:text-black underline inline-flex items-center gap-1.5"
              >
                <span>View Account on StellarExpert</span>
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
