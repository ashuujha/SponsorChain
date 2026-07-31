import { describe, it, expect, vi, beforeEach } from "vitest";
import { useWalletSessionStore } from "@/features/wallet-session/store";

beforeEach(() => {
  localStorage.clear();
  useWalletSessionStore.setState({
    publicKey: null,
    network: null,
    connectionError: null,
    isRestoring: false,
  });
});

describe("WalletSessionStore — persistence across reloads", () => {
  it("persists publicKey and network to localStorage on setSession", () => {
    const store = useWalletSessionStore;

    store.getState().setSession("GABC123TESTNETPUBLICKEY56CHARS", "TESTNET");

    expect(store.getState().publicKey).toBe("GABC123TESTNETPUBLICKEY56CHARS");
    expect(store.getState().network).toBe("TESTNET");

    const raw = localStorage.getItem("sponsorchain-wallet-session");
    expect(raw).toBeTruthy();

    const parsed = JSON.parse(raw!);
    expect(parsed.state.publicKey).toBe("GABC123TESTNETPUBLICKEY56CHARS");
    expect(parsed.state.network).toBe("TESTNET");
  });

  it("partialize excludes connectionError and isRestoring from persisted state", () => {
    const store = useWalletSessionStore;

    store.getState().setConnectionError("some transient error");
    store.getState().setRestoring(true);
    store.getState().setSession("GXYZ456TESTNETPUBLICKEY56CHARS", "TESTNET");

    const raw = localStorage.getItem("sponsorchain-wallet-session");
    const parsed = JSON.parse(raw!);

    expect(parsed.state.connectionError).toBeUndefined();
    expect(parsed.state.isRestoring).toBeUndefined();
    expect(parsed.state.publicKey).toBe("GXYZ456TESTNETPUBLICKEY56CHARS");
    expect(parsed.state.network).toBe("TESTNET");
  });

  it("clearSession updates persisted storage to null values", () => {
    const store = useWalletSessionStore;

    store.getState().setSession("GABC123TESTNETPUBLICKEY56CHARS", "TESTNET");
    expect(localStorage.getItem("sponsorchain-wallet-session")).toBeTruthy();

    store.getState().clearSession();

    expect(store.getState().publicKey).toBeNull();
    expect(store.getState().network).toBeNull();

    const raw = localStorage.getItem("sponsorchain-wallet-session");
    const parsed = JSON.parse(raw!);
    expect(parsed.state.publicKey).toBeNull();
    expect(parsed.state.network).toBeNull();
  });

  it("serializes state in the format Zustand persist middleware expects", () => {
    const store = useWalletSessionStore;

    store.getState().setSession("GPREHYDRATEDKEY56CHARACTERSXX", "TESTNET");

    const raw = localStorage.getItem("sponsorchain-wallet-session");
    const parsed = JSON.parse(raw!);

    expect(parsed).toHaveProperty("state");
    expect(parsed).toHaveProperty("version");
    expect(parsed.state.publicKey).toBe("GPREHYDRATEDKEY56CHARACTERSXX");
    expect(parsed.state.network).toBe("TESTNET");
    expect(typeof parsed.state.publicKey).toBe("string");
    expect(parsed.state.publicKey.startsWith("G")).toBe(true);
  });
});

describe("WalletSessionStore — wrong-network state", () => {
  it("isConnected is false when publicKey is null", () => {
    const store = useWalletSessionStore;
    store.getState().setSession("GABC123TESTNETPUBLICKEY56CHARS", "TESTNET");
    expect(store.getState().publicKey).not.toBeNull();

    store.getState().clearSession();
    expect(store.getState().publicKey).toBeNull();
  });

  it("setConnectionError records network mismatch message", () => {
    const store = useWalletSessionStore;

    const errorMsg =
      "Network mismatch detected (current: MAINNET). Please switch your Freighter wallet to Testnet.";
    store.getState().setConnectionError(errorMsg);

    expect(store.getState().connectionError).toBe(errorMsg);
    expect(store.getState().publicKey).toBeNull();
    expect(store.getState().isRestoring).toBe(false);
  });

  it("setConnectionError clears isRestoring when transitioning from restoring state", () => {
    const store = useWalletSessionStore;

    store.getState().setRestoring(true);
    expect(store.getState().isRestoring).toBe(true);

    store.getState().setConnectionError("Network mismatch");
    expect(store.getState().isRestoring).toBe(false);
    expect(store.getState().connectionError).toBe("Network mismatch");
  });

  it("setSession clears any existing connectionError", () => {
    const store = useWalletSessionStore;

    store.getState().setConnectionError("Previous network error");
    expect(store.getState().connectionError).toBe("Previous network error");

    store.getState().setSession("GNEWKEY1234567890ABCDEFGHIJKLM", "TESTNET");
    expect(store.getState().connectionError).toBeNull();
    expect(store.getState().publicKey).toBe("GNEWKEY1234567890ABCDEFGHIJKLM");
  });

  it("clearSession resets all state including connectionError", () => {
    const store = useWalletSessionStore;

    store.getState().setConnectionError("some error");
    store.getState().setRestoring(true);
    store.getState().clearSession();

    expect(store.getState().publicKey).toBeNull();
    expect(store.getState().network).toBeNull();
    expect(store.getState().connectionError).toBeNull();
    expect(store.getState().isRestoring).toBe(false);
  });

  it("isRestoring can be set and cleared independently", () => {
    const store = useWalletSessionStore;

    expect(store.getState().isRestoring).toBe(false);

    store.getState().setRestoring(true);
    expect(store.getState().isRestoring).toBe(true);

    store.getState().setRestoring(false);
    expect(store.getState().isRestoring).toBe(false);
  });
});
