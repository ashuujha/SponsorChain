import { useEffect, useState } from "react";
import { useWalletStore } from "./wallet-store";
import {
  fetchAccountFromHorizon,
  checkNeedsFunding,
  getNativeBalance,
  fundAccountViaFriendbot,
} from "./wallet-service";
import type { StellarWalletsKit, ISupportedWallet } from "@creit.tech/stellar-wallets-kit";

let kitInstance: StellarWalletsKit | null = null;

async function getKit() {
  if (kitInstance) return kitInstance;
  
  const {
    StellarWalletsKit: KitClass,
    WalletNetwork,
    FreighterModule,
    xBullModule,
    AlbedoModule,
    RabetModule,
    LobstrModule,
  } = await import("@creit.tech/stellar-wallets-kit");

  kitInstance = new KitClass({
    network: WalletNetwork.TESTNET,
    modules: [
      new FreighterModule(),
      new xBullModule(),
      new AlbedoModule(),
      new RabetModule(),
      new LobstrModule(),
    ],
  });

  return kitInstance;
}

export function useWallet() {
  const store = useWalletStore();
  const [isInitializing, setIsInitializing] = useState(true);

  const refreshBalance = async (address: string) => {
    try {
      const account = await fetchAccountFromHorizon(address);
      const balance = getNativeBalance(account);
      store.setBalance(balance);

      const needsFunding = checkNeedsFunding(account);
      if (needsFunding) {
        store.setFundingState({ isFunding: true, fundingError: null, hasFunded: false });
        try {
          await fundAccountViaFriendbot(address);
          const fundedAccount = await fetchAccountFromHorizon(address);
          const newBalance = getNativeBalance(fundedAccount);
          store.setBalance(newBalance);
          store.setFundingState({ isFunding: false, hasFunded: true });
        } catch (fundErr) {
          console.error("Funding failed:", fundErr);
          store.setFundingState({
            isFunding: false,
            fundingError: "Friendbot funding failed. Your account may already be funded or rate limited.",
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch balance from Horizon:", err);
    }
  };

  useEffect(() => {
    const savedAddress = localStorage.getItem("sponsorchain_wallet_pk");
    const savedNetwork = localStorage.getItem("sponsorchain_wallet_net");
    
    if (savedAddress && savedNetwork) {
      store.setConnection(savedAddress, savedNetwork);
      refreshBalance(savedAddress);
    }
    setIsInitializing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connect = async () => {
    store.setConnectionError(null);
    try {
      const kit = await getKit();
      
      await kit.openModal({
        modalTitle: "Connect a Wallet",
        onWalletSelected: async (option: ISupportedWallet) => {
          try {
            kit.setWallet(option.id);
            const { address } = await kit.getAddress();
            
            if (option.id === "freighter") {
              const { isConnected, getNetwork } = await import("@stellar/freighter-api");
              if (await isConnected()) {
                const currentNetwork = (await getNetwork()) as string | { network: string; networkPassphrase: string } | undefined;
                const networkName =
                  typeof currentNetwork === "string"
                    ? currentNetwork
                    : currentNetwork?.network || "";
                
                if (networkName && networkName.toUpperCase() !== "TESTNET") {
                  store.setConnectionError(
                    "Network mismatch detected. Please switch your Freighter wallet to Testnet."
                  );
                  return;
                }
              }
            }

            store.setConnection(address, "TESTNET");
            localStorage.setItem("sponsorchain_wallet_pk", address);
            localStorage.setItem("sponsorchain_wallet_net", "TESTNET");
            
            await refreshBalance(address);
          } catch (err: unknown) {
            console.error("Wallet selection/connection error:", err);
            const error = err as Error;
            store.setConnectionError(error.message || "Failed to connect to selected wallet.");
          }
        },
        onClosed: (err: Error | undefined) => {
          if (err) {
            store.setConnectionError(err.message || "Closed wallet connection modal.");
          }
        }
      });
    } catch (err: unknown) {
      console.error("Wallet connection initialization failed:", err);
      const error = err as Error;
      if (error.message && error.message.includes("User rejected")) {
        store.setConnectionError("Connection request rejected by the user.");
      } else {
        store.setConnectionError(error.message || "Failed to connect wallet.");
      }
    }
  };

  const disconnect = () => {
    store.disconnect();
    localStorage.removeItem("sponsorchain_wallet_pk");
    localStorage.removeItem("sponsorchain_wallet_net");
  };

  return {
    publicKey: store.publicKey,
    isConnected: store.isConnected,
    network: store.network,
    balance: store.balance,
    isFunding: store.isFunding,
    fundingError: store.fundingError,
    connectionError: store.connectionError,
    hasFunded: store.hasFunded,
    isInitializing,
    
    connect,
    disconnect,
    refreshBalance: () => store.publicKey && refreshBalance(store.publicKey),
  };
}
