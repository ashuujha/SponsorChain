import { useEffect } from "react";
import { useWalletStore } from "./wallet-store";
import {
  fetchAccountFromHorizon,
  getNativeBalance,
} from "./wallet-service";
import type { StellarWalletsKit, ISupportedWallet } from "@creit.tech/stellar-wallets-kit";

let kitInstance: StellarWalletsKit | null = null;

export async function getKit() {
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
    network: WalletNetwork.PUBLIC,
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

  const refreshBalance = async (address: string) => {
    try {
      const account = await fetchAccountFromHorizon(address);
      const balance = getNativeBalance(account);
      store.setBalance(balance);

    } catch (err) {
      console.error("Failed to fetch balance from Horizon:", err);
    }
  };

  useEffect(() => {
    const savedAddress = localStorage.getItem("sponsorchain_wallet_pk") || store.publicKey;
    const savedNetwork = "PUBLIC";
    const savedType = localStorage.getItem("sponsorchain_wallet_type") || store.walletType;

    if (savedAddress) {
      store.setConnection(savedAddress, savedNetwork, savedType);
      
      // Attempt silent reconnection via StellarWalletsKit
      getKit()
        .then(async (kit) => {
          if (savedType) {
            try {
              kit.setWallet(savedType);
            } catch {
              // ignore module set error
            }
          }
          try {
            const res = await kit.getAddress();
            const resObj = res as { address?: string; publicKey?: string };
            const currentAddress = resObj?.address || resObj?.publicKey || savedAddress;
            store.setConnection(currentAddress, savedNetwork, savedType);
            refreshBalance(currentAddress);
          } catch (err) {
            console.warn("Silent wallet reconnection failed or access revoked:", err);
            // If wallet is truly unavailable/revoked, clear connection state
            if (!store.publicKey) {
              store.disconnect();
              localStorage.removeItem("sponsorchain_wallet_pk");
              localStorage.removeItem("sponsorchain_wallet_net");
              localStorage.removeItem("sponsorchain_wallet_type");
            } else {
              refreshBalance(savedAddress);
            }
          } finally {
            store.setIsInitializing(false);
          }
        })
        .catch(() => {
          refreshBalance(savedAddress);
          store.setIsInitializing(false);
        });
    } else {
      store.setIsInitializing(false);
    }
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
                
                if (networkName && !["PUBLIC", "MAINNET"].includes(networkName.toUpperCase())) {
                  store.setConnectionError(
                    "Network mismatch detected. Please switch your wallet to Stellar Mainnet."
                  );
                  return;
                }
              }
            }

            store.setConnection(address, "PUBLIC", option.id);
            localStorage.setItem("sponsorchain_wallet_pk", address);
            localStorage.setItem("sponsorchain_wallet_net", "PUBLIC");
            localStorage.setItem("sponsorchain_wallet_type", option.id);
            
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
    localStorage.removeItem("sponsorchain_wallet_type");
  };

  return {
    publicKey: store.publicKey,
    isConnected: store.isConnected,
    network: store.network,
    walletType: store.walletType,
    balance: store.balance,
    isFunding: store.isFunding,
    fundingError: store.fundingError,
    connectionError: store.connectionError,
    hasFunded: store.hasFunded,
    isInitializing: store.isInitializing,
    
    connect,
    disconnect,
    refreshBalance: () => store.publicKey && refreshBalance(store.publicKey),
  };
}
