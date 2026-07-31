import { create } from "zustand";

interface WalletState {
  publicKey: string | null;
  isConnected: boolean;
  network: string | null;
  balance: string | null;
  isFunding: boolean;
  fundingError: string | null;
  connectionError: string | null;
  hasFunded: boolean;
  
  setConnection: (publicKey: string, network: string) => void;
  setBalance: (balance: string | null) => void;
  setFundingState: (states: Partial<Pick<WalletState, "isFunding" | "fundingError" | "hasFunded">>) => void;
  setConnectionError: (error: string | null) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  publicKey: null,
  isConnected: false,
  network: null,
  balance: null,
  isFunding: false,
  fundingError: null,
  connectionError: null,
  hasFunded: false,

  setConnection: (publicKey, network) =>
    set({
      publicKey,
      network,
      isConnected: true,
      connectionError: null,
    }),

  setBalance: (balance) => set({ balance }),

  setFundingState: (states) => set((state) => ({ ...state, ...states })),

  setConnectionError: (connectionError) => set({ connectionError }),

  disconnect: () =>
    set({
      publicKey: null,
      isConnected: false,
      network: null,
      balance: null,
      isFunding: false,
      fundingError: null,
      connectionError: null,
      hasFunded: false,
    }),
}));
