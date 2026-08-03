"use client";

import { useWallet } from "@/features/wallet/use-wallet";

export function useWalletSession() {
  const wallet = useWallet();

  return {
    publicKey: wallet.publicKey,
    isConnected: wallet.isConnected,
    network: wallet.network,
    connectionError: wallet.connectionError,
    isInitializing: wallet.isInitializing,
    connect: wallet.connect,
    disconnect: wallet.disconnect,
  };
}
