"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useWallet } from "@/features/wallet/use-wallet";

export default function WalletConnectPage() {
  const router = useRouter();
  const wallet = useWallet();
  const { status: sessionStatus } = useSession();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Persist walletPublicKey onto the backend User record. Runs automatically
  // once the wallet connects and a session is available. This is a best-effort
  // background sync: it never gates the Finish setup button, which is driven
  // solely by the wallet's connected state (the single source of truth).
  const saveWalletToAccount = useCallback(async () => {
    if (!wallet.isConnected || !wallet.publicKey) return;
    if (sessionStatus !== "authenticated") return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const res = await fetch("/api/user/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ publicKey: wallet.publicKey }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (res.status === 401) {
          setSaveError("Your session has expired. Please sign in again to link your wallet.");
        } else {
          setSaveError(data?.error || "Failed to save wallet address in your account.");
        }
        return;
      }

      setSaveError(null);
    } catch (err) {
      console.error("Failed to update wallet public key:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to save wallet address in your account.");
    } finally {
      setIsSaving(false);
    }
  }, [sessionStatus, wallet.isConnected, wallet.publicKey]);

  // Sync wallet connection to backend User record
  useEffect(() => {
    if (wallet.isConnected && wallet.publicKey) {
      if (sessionStatus === "loading") {
        return; // Wait for the session to load
      }
      saveWalletToAccount();
    } else {
      // Clear save error if wallet is disconnected
      setIsSaving(false);
      setSaveError(null);
    }
  }, [wallet.isConnected, wallet.publicKey, sessionStatus, saveWalletToAccount]);

  const handleFinish = () => {
    if (wallet.isConnected && !isSaving) {
      router.push("/dashboard/maintainer");
    }
  };

  const handleCopy = () => {
    if (wallet.publicKey) {
      navigator.clipboard.writeText(wallet.publicKey);
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center w-full min-h-screen">
      {/* Top Sticky Progress Bar */}
      <div className="w-full bg-surface/80 backdrop-blur-sm sticky top-0 z-10 border-b border-outline-variant px-xl py-lg flex flex-col items-center">
        <div className="max-w-container-max w-full">
          <div className="flex justify-between items-center mb-sm">
            <h2 className="font-label-caps text-label-caps text-primary uppercase font-bold">Step 3 of 3: Connect wallet</h2>
            <span className="font-label-caps text-label-caps text-secondary font-bold">Final Step</span>
          </div>
          <div className="flex gap-sm w-full">
            <div className="flex-1 h-1 bg-primary rounded-full"></div>
            <div className="flex-1 h-1 bg-primary rounded-full"></div>
            <div className="flex-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(17,17,17,0.2)]"></div>
          </div>
        </div>
      </div>

      {/* Centered Onboarding Card */}
      <div className="flex-grow w-full flex items-center justify-center p-xl">
        <div className="bg-white border border-outline-variant rounded-xl w-full max-w-[480px] shadow-sm overflow-hidden flex flex-col">
          {/* Main Action Container */}
          <div className="p-xl flex flex-col items-center text-center">
            {/* Icon Area */}
            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mb-lg border border-outline-variant/40">
              <span className="material-symbols-outlined text-primary text-[32px]">account_balance_wallet</span>
            </div>
            {/* Headline & Subtext */}
            <h1 className="font-headline-lg text-headline-lg text-primary mb-md tracking-tight font-bold">Connect your Stellar wallet</h1>
            <p className="font-body-lg text-body-lg text-secondary mb-xl">
              We use Freighter or other Stellar wallets to securely sign transactions. No private keys are ever shared with SponsorChain.
            </p>

            {/* Error notifications */}
            {(wallet.connectionError || wallet.fundingError || saveError) && (
              <div className="w-full mb-md p-md bg-error-container text-on-error-container text-body-sm rounded-lg border border-error/15 text-left font-medium">
                <div>{wallet.connectionError || wallet.fundingError || saveError}</div>
                {saveError && !wallet.connectionError && !wallet.fundingError && (
                  <button
                    onClick={() => saveWalletToAccount()}
                    className="mt-sm text-body-sm font-bold underline underline-offset-2 cursor-pointer"
                  >
                    Retry
                  </button>
                )}
              </div>
            )}

            {/* Success Friendbot Notification */}
            {wallet.hasFunded && (
              <div className="w-full mb-md p-md bg-[#E8F5E9] text-[#1E5D2A] text-body-sm rounded-lg border border-[#2E7D32]/15 text-left font-medium flex items-center gap-xs">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>Funded via Friendbot: 10,000 XLM</span>
              </div>
            )}

            {/* Primary Action Button */}
            {wallet.isInitializing ? (
              <button
                disabled
                className="w-full bg-primary text-on-primary font-body-lg py-md px-lg rounded-full flex items-center justify-center gap-sm opacity-80 cursor-not-allowed font-semibold"
              >
                <span className="animate-spin material-symbols-outlined">progress_activity</span>
                Verifying setup...
              </button>
            ) : !wallet.isConnected ? (
              <button
                onClick={wallet.connect}
                className="w-full bg-primary text-on-primary font-body-lg py-md px-lg rounded-full flex items-center justify-center gap-sm hover:opacity-90 transition-all active:scale-[0.98] duration-200 font-semibold"
              >
                <span className="material-symbols-outlined">account_balance_wallet</span>
                Connect Wallet
              </button>
            ) : wallet.isFunding ? (
              <button
                disabled
                className="w-full bg-primary text-on-primary font-body-lg py-md px-lg rounded-full flex items-center justify-center gap-sm opacity-80 cursor-not-allowed font-semibold"
              >
                <span className="animate-spin material-symbols-outlined">progress_activity</span>
                Funding account via Friendbot...
              </button>
            ) : isSaving ? (
              <button
                disabled
                className="w-full bg-primary text-on-primary font-body-lg py-md px-lg rounded-full flex items-center justify-center gap-sm opacity-80 cursor-not-allowed font-semibold"
              >
                <span className="animate-spin material-symbols-outlined">progress_activity</span>
                Verifying setup...
              </button>
            ) : (
              <button
                onClick={wallet.disconnect}
                className="w-full bg-emerald-700 text-white font-body-lg py-md px-lg rounded-full flex items-center justify-center gap-sm font-semibold hover:bg-emerald-800 transition-colors"
              >
                <span className="material-symbols-outlined">check_circle</span>
                Disconnect Wallet
              </button>
            )}

            {/* Info Section */}
            <div className="mt-lg w-full bg-surface-container-low rounded-lg p-md flex gap-md text-left border border-outline-variant/30">
              <span className="material-symbols-outlined text-secondary text-headline-md">info</span>
              <div>
                <p className="font-body-sm text-body-sm text-secondary">
                  <span className="font-semibold text-primary">New to Stellar?</span> We will automatically fund your testnet wallet with test XLM via Friendbot — no need to buy anything.
                </p>
              </div>
            </div>
          </div>

          {/* Hairline Divider */}
          <div className="px-xl flex items-center gap-md">
            <div className="flex-1 h-[1px] bg-outline-variant"></div>
            <span className="font-label-caps text-label-caps text-outline shrink-0 font-bold">After connecting:</span>
            <div className="flex-1 h-[1px] bg-outline-variant"></div>
          </div>

          {/* Connected Preview */}
          <div className="p-xl pt-lg">
            <div className="bg-surface-container rounded-xl p-md border border-outline-variant/50">
              <div className="flex flex-col gap-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm">
                  {/* Wallet Chip */}
                  <div className="bg-white border border-outline-variant px-sm py-xs rounded-lg flex items-center justify-between sm:justify-start gap-sm overflow-hidden max-w-full">
                    <code className="font-mono-code text-mono-code text-primary font-bold truncate">
                      {wallet.isConnected && wallet.publicKey
                        ? `${wallet.publicKey.slice(0, 6)}...${wallet.publicKey.slice(-6)}`
                        : "Not connected"}
                    </code>
                    {wallet.isConnected && wallet.publicKey && (
                      <button
                        onClick={handleCopy}
                        className="material-symbols-outlined text-secondary hover:text-primary p-xs cursor-pointer flex-shrink-0"
                        aria-label="Copy public key"
                      >
                        content_copy
                      </button>
                    )}
                  </div>
                  {/* Balance Status Chip */}
                  {wallet.isConnected && wallet.balance && (
                    <div className="flex items-center gap-xs text-[12px] font-bold text-[#1E5D2A] bg-[#E8F5E9] px-sm py-xs rounded-full self-start">
                      <span className="w-2 h-2 rounded-full bg-[#2E7D32]"></span>
                      Balance: {parseFloat(wallet.balance).toLocaleString()} XLM
                    </div>
                  )}
                </div>
                {sessionStatus === "unauthenticated" ? (
                  <Link href="/signin" className="w-full">
                    <button className="w-full font-body-lg py-sm px-lg rounded-full font-semibold transition-all bg-primary [color:#ffffff] hover:opacity-90 active:scale-[0.98]">
                      Sign in to save wallet
                    </button>
                  </Link>
                ) : (
                  <button
                    onClick={handleFinish}
                    disabled={!wallet.isConnected || isSaving}
                    className={`w-full font-body-lg py-sm px-lg rounded-full font-semibold transition-all ${
                      wallet.isConnected && !isSaving
                        ? "bg-primary [color:#ffffff] hover:opacity-90 active:scale-[0.98]"
                        : "bg-primary/20 text-primary/40 cursor-not-allowed"
                    }`}
                  >
                    Finish setup
                  </button>
                )}
              </div>
            </div>
            <p className="mt-md text-center font-body-sm text-body-sm text-on-surface-variant opacity-60">
              Finish setup unlocks once your wallet is connected.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Minimal */}
      <footer className="w-full py-lg mt-auto bg-surface-container-low border-t border-outline-variant font-semibold">
        <div className="max-w-container-max mx-auto px-gutter flex flex-col md:flex-row justify-between items-center gap-md pt-md">
          <p className="font-body-sm text-body-sm text-on-surface-variant">© 2026 SponsorChain. Built on Stellar.</p>
          <div className="flex gap-lg">
            <a className="font-label-caps text-label-caps text-on-surface-variant hover:underline transition-all" href="#">Privacy Policy</a>
            <a className="font-label-caps text-label-caps text-on-surface-variant hover:underline transition-all" href="#">Terms of Service</a>
            <a className="font-label-caps text-label-caps text-on-surface-variant hover:underline transition-all" href="#">Github</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
