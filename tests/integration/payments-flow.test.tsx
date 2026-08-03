import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProjectDetailPage from "@/app/(main)/projects/[id]/page";
const mockProjectId = "0";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useParams: () => ({
    id: mockProjectId,
  }),
}));

// Mock useWallet
const mockConnect = vi.fn();
vi.mock("@/features/wallet/use-wallet", () => ({
  useWallet: () => ({
    isConnected: true,
    publicKey: "GD6X4A3B4C5D6E7F8G9H0I1J2K3L4M5N6O7P8Q9R0S1T2U3V4W5X6Y7Z",
    connect: mockConnect,
    disconnect: vi.fn(),
    refreshBalance: vi.fn(),
  }),
}));

// Mock useLiveAccountPayments
vi.mock("@/features/payments/use-live-account-payments", () => ({
  useLiveAccountPayments: () => ({
    status: "connected",
    payments: [],
    totalRaised: "500.0000000",
    refresh: vi.fn(),
  }),
}));

// Mock fetchOnChainProject for deterministic test isolation
vi.mock("@/lib/soroban-client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/soroban-client")>();
  return {
    ...original,
    fetchOnChainProject: vi.fn().mockResolvedValue({
      id: BigInt(0),
      owner: "GDWRICGODLLQE65PC5UHEOYOMI34DXJG2ML2VRPJQLRYYURUVIEPQ3SE",
      repoFullName: "stellar/stellar-core",
      name: "Stellar Core",
      description: "Stellar Core backbone.",
      totalRaised: "0",
      sponsorCount: 0,
      createdAt: BigInt(1785784403),
      active: true,
    }),
  };
});

// Mock fetch global response for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Project Detail & Payments Flow Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockFetch.mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    });
  });

  it("should render project details and allow starting the sponsor flow", async () => {
    render(<ProjectDetailPage />);

    // Wait for project metadata to load
    await waitFor(() => {
      expect(screen.getByText("Stellar Core")).toBeInTheDocument();
    });

    expect(screen.getByText("stellar/stellar-core")).toBeInTheDocument();
  });

  it("should display the Confirm modal (Review state) when clicking Sponsor", async () => {
    render(<ProjectDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Stellar Core")).toBeInTheDocument();
    });

    // Input sponsor amount
    const amountInput = screen.getByPlaceholderText("0.00") as HTMLInputElement;
    fireEvent.change(amountInput, { target: { value: "100" } });

    const sponsorButton = screen.getByRole("button", { name: /Sponsor with Wallet/i });
    fireEvent.click(sponsorButton);

    // Should display review section (after async StrKey check resolves)
    await waitFor(() => {
      expect(screen.getByText("Sponsorship Amount")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Sign & Send Payment/i })).toBeInTheDocument();
    });
  });
});
