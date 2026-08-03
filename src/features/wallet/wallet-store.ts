import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WalletState {
  publicKey: string | null;
  isConnected: boolean;
  network: string | null;
  walletType: string | null;
  balance: string | null;
  isFunding: boolean;
  fundingError: string | null;
  connectionError: string | null;
  hasFunded: boolean;
  isInitializing: boolean;
  
  setConnection: (publicKey: string, network: string, walletType?: string | null) => void;
  setBalance: (balance: string | null) => void;
  setFundingState: (states: Partial<Pick<WalletState, "isFunding" | "fundingError" | "hasFunded">>) => void;
  setConnectionError: (error: string | null) => void;
  setIsInitializing: (isInitializing: boolean) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      publicKey: null,
      isConnected: false,
      network: null,
      walletType: null,
      balance: null,
      isFunding: false,
      fundingError: null,
      connectionError: null,
      hasFunded: false,
      isInitializing: true,

      setConnection: (publicKey, network, walletType = null) =>
        set({
          publicKey,
          network,
          walletType,
          isConnected: true,
          connectionError: null,
          isInitializing: false,
        }),

      setBalance: (balance) => set({ balance }),

      setFundingState: (states) => set((state) => ({ ...state, ...states })),

      setConnectionError: (connectionError) => set({ connectionError, isInitializing: false }),

      setIsInitializing: (isInitializing) => set({ isInitializing }),

      disconnect: () =>
        set({
          publicKey: null,
          isConnected: false,
          network: null,
          walletType: null,
          balance: null,
          isFunding: false,
          fundingError: null,
          connectionError: null,
          hasFunded: false,
          isInitializing: false,
        }),
    }),
    {
      name: "sponsorchain_wallet_state",
      partialize: (state) => ({
        publicKey: state.publicKey,
        network: state.network,
        walletType: state.walletType,
        isConnected: state.isConnected,
      }),
    }
  )
);
