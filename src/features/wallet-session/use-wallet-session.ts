"use client";

import { useCallback, useEffect, useRef } from "react";
import { useWalletSessionStore } from "./store";
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

async function checkFreighterTestnet(): Promise<string | null> {
  try {
    const { isConnected, getNetwork } = await import("@stellar/freighter-api");
    const connected = await isConnected();
    if (!connected) return null;

    const currentNetwork = (await getNetwork()) as
      | string
      | { network: string; networkPassphrase: string }
      | undefined;

    const networkName =
      typeof currentNetwork === "string"
        ? currentNetwork
        : currentNetwork?.network || "";

    if (networkName.toUpperCase() !== "TESTNET") {
      return `Network mismatch detected (current: ${networkName || "unknown"}). Please switch your Freighter wallet to Testnet.`;
    }

    return null;
  } catch {
    return null;
  }
}

export function useWalletSession() {
  const store = useWalletSessionStore();
  const restoredRef = useRef(false);

  const isConnected = store.publicKey !== null;
  const isInitializing = store.isRestoring;

  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    if (store.publicKey) {
      store.setRestoring(true);

      checkFreighterTestnet()
        .then((networkError) => {
          if (networkError) {
            store.clearSession();
            store.setConnectionError(networkError);
          } else {
            store.setRestoring(false);
          }
        })
        .catch(() => {
          store.setRestoring(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connect = useCallback(async () => {
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
              const networkError = await checkFreighterTestnet();
              if (networkError) {
                store.setConnectionError(networkError);
                return;
              }
            }

            store.setSession(address, "TESTNET");
          } catch (err: unknown) {
            const error = err as Error;
            store.setConnectionError(
              error.message || "Failed to connect to selected wallet."
            );
          }
        },
        onClosed: (err: Error | undefined) => {
          if (err) {
            store.setConnectionError(
              err.message || "Wallet connection modal was closed."
            );
          }
        },
      });
    } catch (err: unknown) {
      const error = err as Error;
      if (error.message?.includes("User rejected")) {
        store.setConnectionError("Connection request rejected by the user.");
      } else {
        store.setConnectionError(
          error.message || "Failed to connect wallet."
        );
      }
    }
  }, [store]);

  const disconnect = useCallback(() => {
    store.clearSession();
  }, [store]);

  return {
    publicKey: store.publicKey,
    isConnected,
    network: store.network,
    connectionError: store.connectionError,
    isInitializing,
    connect,
    disconnect,
  };
}
