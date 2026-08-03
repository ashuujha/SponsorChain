import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ListProjectPage from "@/app/list-project/page";

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    status: "authenticated",
    data: {
      githubUsername: "stellar-maintainer",
      accessToken: "gho_test_token",
    },
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const { VALID_TEST_XDR } = await vi.hoisted(async () => {
  const { Account, Asset, BASE_FEE, Networks, Operation, TransactionBuilder } = await import("stellar-sdk");
  const mockDummyAcc = new Account("GDWRICGODLLQE65PC5UHEOYOMI34DXJG2ML2VRPJQLRYYURUVIEPQ3SE", "100");
  const mockDummyTx = new TransactionBuilder(mockDummyAcc, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
    timebounds: { minTime: 0, maxTime: 1900000000 },
  })
    .addOperation(
      Operation.payment({
        destination: "GDWRICGODLLQE65PC5UHEOYOMI34DXJG2ML2VRPJQLRYYURUVIEPQ3SE",
        asset: Asset.native(),
        amount: "1",
      })
    )
    .build();
  return { VALID_TEST_XDR: mockDummyTx.toXDR() };
});

vi.mock("stellar-sdk", async (importOriginal) => {
  const actual = await importOriginal<typeof import("stellar-sdk")>();
  return {
    ...actual,
    Horizon: {
      ...actual.Horizon,
      Server: vi.fn().mockImplementation(() => ({
        submitTransaction: vi.fn().mockResolvedValue({
          hash: "c24e6504a378854497e59b207559e2f9d5045050fbe76ef77be9dfd2d346ff02",
          successful: true,
        }),
      })),
    },
  };
});

vi.mock("@/lib/soroban-client", () => ({
  checkOnChainRepoExists: vi.fn().mockResolvedValue({ exists: false }),
  fetchOnChainProjects: vi.fn().mockResolvedValue([]),
  createOnChainProject: vi.fn().mockResolvedValue({
    txHash: "c24e6504a378854497e59b207559e2f9d5045050fbe76ef77be9dfd2d346ff02",
    projectId: "0",
  }),
}));

vi.mock("@/features/wallet/use-wallet", () => ({
  useWallet: () => ({
    publicKey: "GDWRICGODLLQE65PC5UHEOYOMI34DXJG2ML2VRPJQLRYYURUVIEPQ3SE",
    isConnected: true,
    network: "TESTNET",
    balance: "10000.0000000",
    isFunding: false,
    fundingError: null,
    connectionError: null,
    hasFunded: false,
    isInitializing: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    refreshBalance: vi.fn(),
  }),
  getKit: vi.fn().mockResolvedValue({
    signTransaction: vi.fn().mockResolvedValue({ signedTxXdr: VALID_TEST_XDR }),
  }),
}));

// Mock wallet-session store to always appear connected
vi.mock("@/features/wallet-session/store", () => ({
  useWalletSessionStore: Object.assign(
    () => ({
      publicKey:
        "GDWRICGODLLQE65PC5UHEOYOMI34DXJG2ML2VRPJQLRYYURUVIEPQ3SE",
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
        publicKey:
          "GDWRICGODLLQE65PC5UHEOYOMI34DXJG2ML2VRPJQLRYYURUVIEPQ3SE",
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

// Mock repo fetch API
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockRepo: {
  id: number;
  name: string;
  fullName: string;
  description: string;
  htmlUrl: string;
} = {
  id: 12345,
  name: "js-stellar-sdk",
  fullName: "stellar/js-stellar-sdk",
  description: "JavaScript client library for communicating with a Horizon server.",
  htmlUrl: "https://github.com/stellar/js-stellar-sdk",
};

describe("List Project Flow — state transitions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockImplementation((url: string) => {
      const responseData = typeof url === "string" && url.includes("/api/listing/repos")
        ? { repos: [mockRepo] }
        : typeof url === "string" && url.includes("/accounts/")
        ? { sequence: "100", id: "GDWRICGODLLQE65PC5UHEOYOMI34DXJG2ML2VRPJQLRYYURUVIEPQ3SE" }
        : {
            hash: "c24e6504a378854497e59b207559e2f9d5045050fbe76ef77be9dfd2d346ff02",
            ledger: 1234567,
            successful: true,
          };

      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => responseData,
        text: async () => JSON.stringify(responseData),
      });
    });
  });

  it("renders GitHub connect step when authenticated", async () => {
    render(<ListProjectPage />);

    // Step 1 title should be visible
    expect(await screen.findByText("Link GitHub to Continue")).toBeInTheDocument();

    // "Continue to Repo Picker" button (already authenticated via mock)
    expect(
      screen.getByRole("button", { name: /Continue to Repo Picker/i })
    ).toBeInTheDocument();
  });

  it("transitions: github-connect → repo-picker → details → review → submit → success", async () => {
    render(<ListProjectPage />);

    // STEP 1: Click "Continue to Repo Picker"
    fireEvent.click(
      await screen.findByRole("button", { name: /Continue to Repo Picker/i })
    );

    // STEP 2: Repo picker loads, shows the mock repo
    await waitFor(() => {
      expect(screen.getByText("stellar/js-stellar-sdk")).toBeInTheDocument();
    });

    // Select the repo
    fireEvent.click(screen.getByText("stellar/js-stellar-sdk"));

    // STEP 3: Details step — name and description prefilled
    await waitFor(() => {
      expect(screen.getByText("Step 3: Project Details")).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText(
      "e.g. Stellar SDK Core"
    ) as HTMLInputElement;
    expect(nameInput.value).toBe("js-stellar-sdk");

    const descTextarea = screen.getByPlaceholderText(
      "Briefly describe your project..."
    ) as HTMLTextAreaElement;
    expect(descTextarea.value).toBe(mockRepo.description);

    // Edit the name
    fireEvent.change(nameInput, { target: { value: "My Custom SDK" } });
    expect(nameInput.value).toBe("My Custom SDK");

    // Click "Review & Submit"
    fireEvent.click(
      screen.getByRole("button", { name: /Review & Submit/i })
    );

    // STEP 4: Review step
    await waitFor(() => {
      expect(
        screen.getByText("Review Your Project Listing")
      ).toBeInTheDocument();
    });

    // Verify review data is displayed
    expect(screen.getByText("stellar/js-stellar-sdk")).toBeInTheDocument();
    expect(screen.getByText("My Custom SDK")).toBeInTheDocument();
    expect(
      screen.getByText(/GDWRIC\.\.\.EPQ3SE/)
    ).toBeInTheDocument();

    // Wait for on-chain duplicate check to finish and button to enable
    const submitBtn = screen.getByRole("button", { name: /Sign & Submit to Network/i });
    await waitFor(() => {
      expect(submitBtn).not.toBeDisabled();
    });

    // Click "Sign & Submit to Network"
    fireEvent.click(submitBtn);

    // STEP 5: Success — the mock submit resolves immediately
    await waitFor(() => {
      expect(screen.getByText("Project Listed!")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /View Project Page/i })
    ).toBeInTheDocument();
  });

  it("shows back navigation through each step", async () => {
    render(<ListProjectPage />);

    // Go to repo-picker
    fireEvent.click(
      await screen.findByRole("button", { name: /Continue to Repo Picker/i })
    );

    await waitFor(() => {
      expect(screen.getByText("stellar/js-stellar-sdk")).toBeInTheDocument();
    });

    // Back to GitHub
    fireEvent.click(screen.getByText(/Back to GitHub setup/i));
    await waitFor(() => {
      expect(screen.getByText("Link GitHub to Continue")).toBeInTheDocument();
    });
  });

  it("disables review button when description is too short", async () => {
    render(<ListProjectPage />);

    fireEvent.click(
      await screen.findByRole("button", { name: /Continue to Repo Picker/i })
    );

    await waitFor(() => {
      expect(screen.getByText("stellar/js-stellar-sdk")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("stellar/js-stellar-sdk"));

    await waitFor(() => {
      expect(screen.getByText("Step 3: Project Details")).toBeInTheDocument();
    });

    const descTextarea = screen.getByPlaceholderText(
      "Briefly describe your project..."
    ) as HTMLTextAreaElement;

    // Clear description to below 10 chars
    fireEvent.change(descTextarea, { target: { value: "Short" } });

    const reviewBtn = screen.getByRole("button", {
      name: /Review & Submit/i,
    });
    expect(reviewBtn).toBeDisabled();

    // Set valid description
    fireEvent.change(descTextarea, {
      target: { value: "A valid description for the project listing flow" },
    });
    expect(reviewBtn).not.toBeDisabled();
  });

  it("shows pending state while submitting", async () => {
    let resolveSign: (val: unknown) => void = () => {};
    const signPromise = new Promise((resolve) => {
      resolveSign = resolve;
    });

    const { getKit } = await import("@/features/wallet/use-wallet");
    vi.mocked(getKit).mockResolvedValueOnce({
      signTransaction: vi.fn().mockReturnValue(signPromise),
    } as unknown as Awaited<ReturnType<typeof getKit>>);

    render(<ListProjectPage />);

    // Navigate to review
    fireEvent.click(
      await screen.findByRole("button", { name: /Continue to Repo Picker/i })
    );
    await waitFor(() => {
      expect(screen.getByText("stellar/js-stellar-sdk")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("stellar/js-stellar-sdk"));
    await waitFor(() => {
      expect(screen.getByText("Step 3: Project Details")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /Review & Submit/i }));
    await waitFor(() => {
      expect(screen.getByText("Review Your Project Listing")).toBeInTheDocument();
    });

    // Wait for on-chain duplicate check to finish and button to enable
    const submitBtn = screen.getByRole("button", { name: /Sign & Submit to Network/i });
    await waitFor(() => {
      expect(submitBtn).not.toBeDisabled();
    });

    // Click submit
    fireEvent.click(submitBtn);

    // Should show pending message while waiting for wallet signature
    await waitFor(() => {
      expect(
        screen.getByText(/Please sign the transaction in your wallet/)
      ).toBeInTheDocument();
    });

    // Resolve signTransaction to finish test
    resolveSign({ signedTxXdr: VALID_TEST_XDR });
  });
});
