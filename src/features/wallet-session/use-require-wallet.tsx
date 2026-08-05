"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/features/wallet/use-wallet";

export function useRequireWallet() {
  const router = useRouter();
  const { publicKey, isConnected, isInitializing } = useWallet();

  const redirectToConnect = React.useCallback(() => {
    router.push("/wallet");
  }, [router]);

  return {
    publicKey,
    isConnected: isConnected && !isInitializing,
    isLoading: isInitializing,
    redirectToConnect,
  };
}

export function RequireWallet({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { isConnected, isLoading, redirectToConnect } = useRequireWallet();

  if (isLoading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-24 gap-3 text-center min-h-[60vh]">
        <span className="animate-spin material-symbols-outlined text-[36px] text-black/60">
          progress_activity
        </span>
        <p className="font-medium text-black/70 text-sm">
          Checking wallet session...
        </p>
      </div>
    );
  }

  if (!isConnected) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="flex-grow flex flex-col items-center justify-center px-6 py-20 text-center min-h-[60vh]">
        <div className="bg-white border border-black/10 rounded-2xl p-8 sm:p-10 max-w-md w-full shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-[#2B2644] text-white flex items-center justify-center mb-6 shadow-md">
            <span className="material-symbols-outlined text-[32px]">
              account_balance_wallet
            </span>
          </div>
          <h2 className="text-2xl font-medium text-black tracking-tight mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-black/70 text-sm max-w-sm mb-8 leading-relaxed">
            You need a connected Stellar wallet to access this page. Connect
            your Freighter, xBull, or Albedo wallet to continue.
          </p>
          <button
            onClick={redirectToConnect}
            className="bg-black text-white px-8 py-3.5 rounded-full font-medium text-sm hover:bg-gray-800 active:scale-95 transition-all shadow-md inline-flex items-center gap-2"
          >
            <span>Connect Wallet</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
