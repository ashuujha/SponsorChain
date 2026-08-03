import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import WalletConnectPage from "@/app/(dashboard)/wallet/page";
import { useWallet } from "@/features/wallet/use-wallet";

// Mock the wallet hook
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();

vi.mock("@/features/wallet/use-wallet", () => ({
  useWallet: vi.fn(),
}));

function createMockWallet(overrides: Record<string, unknown> = {}) {
  return {
    publicKey: null,
    isConnected: false,
    network: "TESTNET",
    walletType: null as string | null,
    balance: "0.0000000",
    isFunding: false,
    fundingError: null,
    connectionError: null,
    hasFunded: false,
    isInitializing: false,
    connect: mockConnect,
    disconnect: mockDisconnect,
    refreshBalance: vi.fn(),
    ...overrides,
  };
}

describe("Wallet Connect Page - Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the connect page when wallet is not connected", () => {
    vi.mocked(useWallet).mockReturnValue(createMockWallet({
      publicKey: null,
      isConnected: false,
      walletType: null,
    }) as unknown as ReturnType<typeof useWallet>);

    render(<WalletConnectPage />);

    expect(screen.getByText("Connect your Stellar wallet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Connect Wallet/i })).toBeInTheDocument();
    expect(screen.getByText("Not connected")).toBeInTheDocument();
  });

  it("renders the connected state with public key and balance when wallet is connected", () => {
    vi.mocked(useWallet).mockReturnValue(createMockWallet({
      publicKey: "GD6X4A3B4C5D6E7F8G9H0I1J2K3L4M5N6O7P8Q9R0S1T2U3V4W5X6Y7Z",
      isConnected: true,
      walletType: "freighter",
      balance: "3998.3140000",
      hasFunded: true,
    }) as unknown as ReturnType<typeof useWallet>);

    render(<WalletConnectPage />);

    expect(screen.getByText("GD6X4A...5X6Y7Z")).toBeInTheDocument();
    expect(screen.getByText(/Balance: 3,998\.314/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Disconnect Wallet/i })).toBeInTheDocument();
  });

  it("calls wallet.connect when the Connect button is clicked", () => {
    vi.mocked(useWallet).mockReturnValue(createMockWallet({
      publicKey: null,
      isConnected: false,
      walletType: null,
    }) as unknown as ReturnType<typeof useWallet>);

    render(<WalletConnectPage />);

    const connectBtn = screen.getByRole("button", { name: /Connect Wallet/i });
    fireEvent.click(connectBtn);

    expect(mockConnect).toHaveBeenCalled();
  });

  it("calls wallet.disconnect when the Disconnect button is clicked", () => {
    vi.mocked(useWallet).mockReturnValue(createMockWallet({
      publicKey: "GD6X4A3B4C5D6E7F8G9H0I1J2K3L4M5N6O7P8Q9R0S1T2U3V4W5X6Y7Z",
      isConnected: true,
      walletType: "freighter",
      balance: "3998.3140000",
    }) as unknown as ReturnType<typeof useWallet>);

    render(<WalletConnectPage />);

    const disconnectBtn = screen.getByRole("button", { name: /Disconnect Wallet/i });
    fireEvent.click(disconnectBtn);

    expect(mockDisconnect).toHaveBeenCalled();
  });
});
