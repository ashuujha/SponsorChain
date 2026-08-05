import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ListProjectPage from "@/app/(main)/list-project/page";

// Mock next-auth react hooks
vi.mock("next-auth/react", () => ({
  useSession: () => ({
    status: "authenticated",
    data: {
      user: { id: "user_123", name: "Test User" },
      githubUsername: "test-user",
    },
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

// Mock useWallet
vi.mock("@/features/wallet/use-wallet", () => ({
  useWallet: () => ({
    isConnected: true,
    publicKey: "GD6X4A3B4C5D6E7F8G9H0I1J2K3L4M5N6O7P8Q9R0S1T2U3V4W5X6Y7Z",
    connect: vi.fn(),
    disconnect: vi.fn(),
    refreshBalance: vi.fn(),
  }),
}));

// Mock wallet-session store to always appear connected
vi.mock("@/features/wallet-session/store", () => ({
  useWalletSessionStore: Object.assign(
    () => ({
      publicKey: "GD6X4A3B4C5D6E7F8G9H0I1J2K3L4M5N6O7P8Q9R0S1T2U3V4W5X6Y7Z",
      network: "TESTNET",
      connectionError: null,
      isRestoring: false,
      setSession: vi.fn(),
      clearSession: vi.fn(),
      setConnectionError: vi.fn(),
      setRestoring: vi.fn(),
    }),
    {
      getState: () => ({
        publicKey: "GD6X4A3B4C5D6E7F8G9H0I1J2K3L4M5N6O7P8Q9R0S1T2U3V4W5X6Y7Z",
      network: "TESTNET",
        connectionError: null,
        isRestoring: false,
        setSession: vi.fn(),
        clearSession: vi.fn(),
        setConnectionError: vi.fn(),
        setRestoring: vi.fn(),
      }),
      setState: vi.fn(),
      subscribe: vi.fn(),
      destroy: vi.fn(),
    }
  ),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Onboarding Flow Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/api/listing/repos")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              repos: [
                { id: 1, name: "test-repo", fullName: "user/test-repo", description: "Test Description" },
              ],
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    });
  });

  it("should render repo picker list and load user repos", async () => {
    render(<ListProjectPage />);

    // Step 1 is GitHub Connect. Click Continue to Repo Picker.
    const continueBtn = screen.getByRole("button", { name: /Continue to Repo Picker/i });
    fireEvent.click(continueBtn);

    // Wait for the repo button to render
    await waitFor(() => {
      expect(screen.getByText("Step 2: Pick a Repository")).toBeInTheDocument();
    });

    // Query repo picker button
    const repoBtn = await screen.findByRole("button", { name: /user\/test-repo/i });
    expect(repoBtn).toBeInTheDocument();

    // Click the mock repo
    fireEvent.click(repoBtn);

    // Should transition to Step 3: Project Details
    await waitFor(() => {
      expect(screen.getByText("Step 3: Project Details")).toBeInTheDocument();
    });

    // Inputs should update
    const nameInput = screen.getByPlaceholderText("e.g. Stellar SDK Core") as HTMLInputElement;
    expect(nameInput.value).toBe("test-repo");

    const descInput = screen.getByPlaceholderText(/Briefly describe your project/i) as HTMLTextAreaElement;
    expect(descInput.value).toBe("Test Description");
  });
});
