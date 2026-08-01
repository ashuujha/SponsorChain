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
      <div className="flex flex-col items-center justify-center py-20 gap-md">
        <span className="animate-spin material-symbols-outlined text-[40px] text-primary">
          progress_activity
        </span>
        <p className="font-semibold text-on-surface-variant text-body-md">
          Checking wallet session...
        </p>
      </div>
    );
  }

  if (!isConnected) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="flex-grow flex flex-col items-center justify-center p-xl text-center min-h-[60vh]">
        <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-md border border-outline-variant">
          <span className="material-symbols-outlined text-secondary text-[32px]">
            account_balance_wallet
          </span>
        </div>
        <h2 className="font-headline-md text-primary font-bold mb-xs">
          Connect Your Wallet
        </h2>
        <p className="text-secondary max-w-sm mb-lg">
          You need a connected Stellar wallet to access this page. Connect
          your Freighter or Albedo wallet to continue.
        </p>
        <button
          onClick={redirectToConnect}
          className="bg-primary text-on-primary py-md px-xl rounded-full font-bold hover:opacity-90 active:scale-95 transition-all shadow-md"
        >
          Go to Wallet Setup
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
