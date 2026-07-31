import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProjectDetailPage from "@/app/(main)/projects/[id]/page.tsx";
import * as paymentService from "@/features/payments/payment-service";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useParams: () => ({
    id: "stellar-core",
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

// Mock fetch global response for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Project Detail & Payments Flow Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default fetch mocks
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/api/projects/")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              project: {
                id: "stellar-core",
                name: "Stellar Core",
                repoUrl: "stellar/stellar-core",
                description: "Stellar Core backbone.",
                fundingGoalXLM: "5000",
                owner: {
                  githubId: "stellar",
                  walletPublicKey: "GA774A3B4C5D6E7F8G9H0I1J2K3L4M5N6O7P8Q9R0S1T2U3V4W5X6Y7Z",
                },
                tiers: [
                  { id: "coffee", amountXLM: "10.0", label: "Coffee tier" },
                  { id: "lunch", amountXLM: "50.0", label: "Lunch tier" },
                ],
                sponsorships: [],
              },
            }),
        });
      }
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
    expect(screen.getByText("500.00 XLM")).toBeInTheDocument(); // Live balance
  });

  it("should display the Confirm modal (Review state) when clicking Sponsor", async () => {
    render(<ProjectDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Stellar Core")).toBeInTheDocument();
    });

    const sponsorButton = screen.getByRole("button", { name: /Sponsor with Wallet/i });
    fireEvent.click(sponsorButton);

    // Should display review overlay modal
    expect(screen.getByText("Confirm Transaction")).toBeInTheDocument();
    expect(screen.getByText("Sponsorship Value")).toBeInTheDocument();
    expect(screen.getByText("Sign & Send Payment")).toBeInTheDocument();
  });
});
