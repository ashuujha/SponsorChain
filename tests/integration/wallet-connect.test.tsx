import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import WalletConnectPage from "@/app/(dashboard)/wallet/page.tsx";

const mockRouterPush = vi.fn();

vi.mock("next-auth/react", () => ({
  useSession: () => ({ status: sessionStatus, data: { user: { id: "user_1" } } }),
}));

let sessionStatus: "loading" | "authenticated" | "unauthenticated" = "authenticated";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

// Wallet is connected + funded (the passing state: address/balance render)
vi.mock("@/features/wallet/use-wallet", () => ({
  useWallet: () => ({
    publicKey: "GD6X4A3B4C5D6E7F8G9H0I1J2K3L4M5N6O7P8Q9R0S1T2U3V4W5X6Y7Z",
    isConnected: true,
    network: "TESTNET",
    balance: "3998.3140000",
    isFunding: false,
    fundingError: null,
    connectionError: null,
    hasFunded: true,
    isInitializing: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    refreshBalance: vi.fn(),
  }),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Wallet Connect Screen - connection state desync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStatus = "authenticated";
    mockRouterPush.mockReset();
    mockFetch.mockReset();
  });

  it("unlocks Finish setup from the connected wallet state (single source of truth)", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<WalletConnectPage />);

    // Address + live balance render from the store's connected state
    expect(screen.getByText(/GD6X4A/)).toBeInTheDocument();
    expect(screen.getByText(/Balance: 3,998/)).toBeInTheDocument();

    // Finish setup is enabled once the wallet is connected
    const finish = screen.getByRole("button", { name: "Finish setup" });
    await waitFor(() => expect(finish).toBeEnabled());
  });

  it("does not permanently stick on a failed wallet-save round-trip (no latched 'Unauthorized')", async () => {
    // Server save fails with the API's 401 "Unauthorized" body
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: "Unauthorized" }),
    });

    render(<WalletConnectPage />);

    const finish = screen.getByRole("button", { name: "Finish setup" });

    // The button must NOT be gated on the server-save flag: it stays enabled
    await waitFor(() => expect(finish).toBeEnabled());

    // A real, actionable error is surfaced with a Retry option - not the raw "Unauthorized"
    await waitFor(() => {
      expect(screen.getByText(/session has expired/i)).toBeInTheDocument();
    });
    expect(screen.queryByText("Unauthorized")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();

    // Retry recovers once the server accepts the write
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => {
      expect(screen.queryByText(/session has expired/i)).not.toBeInTheDocument();
    });
    expect(finish).toBeEnabled();
  });

  it("redirects to the maintainer dashboard when Finish setup is pressed while connected", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<WalletConnectPage />);

    const finish = screen.getByRole("button", { name: "Finish setup" });
    await waitFor(() => expect(finish).toBeEnabled());
    fireEvent.click(finish);
    expect(mockRouterPush).toHaveBeenCalledWith("/dashboard/maintainer");
  });

  it("prompts an unauthenticated user to sign in instead of blocking on 'Unauthorized'", async () => {
    sessionStatus = "unauthenticated";
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: "Unauthorized" }),
    });

    render(<WalletConnectPage />);

    expect(screen.getByRole("link", { name: /Sign in to save wallet/i })).toBeInTheDocument();
    expect(screen.queryByText("Unauthorized")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Finish setup" })).not.toBeInTheDocument();
  });
});
