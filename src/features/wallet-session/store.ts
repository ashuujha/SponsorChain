import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WalletSessionState {
  publicKey: string | null;
  network: "TESTNET" | null;
  connectionError: string | null;
  isRestoring: boolean;

  setSession: (publicKey: string, network: "TESTNET") => void;
  clearSession: () => void;
  setConnectionError: (error: string | null) => void;
  setRestoring: (restoring: boolean) => void;
}

export const useWalletSessionStore = create<WalletSessionState>()(
  persist(
    (set) => ({
      publicKey: null,
      network: null,
      connectionError: null,
      isRestoring: false,

      setSession: (publicKey, network) =>
        set({ publicKey, network, connectionError: null, isRestoring: false }),

      clearSession: () =>
        set({
          publicKey: null,
          network: null,
          connectionError: null,
          isRestoring: false,
        }),

      setConnectionError: (connectionError) => set({ connectionError, isRestoring: false }),

      setRestoring: (isRestoring) => set({ isRestoring }),
    }),
    {
      name: "sponsorchain-wallet-session",
      partialize: (state) => ({
        publicKey: state.publicKey,
        network: state.network,
      }),
    }
  )
);
