import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CreateProjectPage from "@/app/(dashboard)/projects/create/page.tsx";

// Mock next-auth react hooks
vi.mock("next-auth/react", () => ({
  useSession: () => ({
    status: "authenticated",
    data: {
      user: { id: "user_123", name: "Test User" },
    },
  }),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Onboarding Flow Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/api/user/repos")) {
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
    render(<CreateProjectPage />);

    // Wait for the repo select input to render
    await waitFor(() => {
      expect(screen.getByText("Step 2 of 3: Project details")).toBeInTheDocument();
    });

    // Query select combobox
    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();

    // Select the mock repo
    fireEvent.change(select, { target: { value: "user/test-repo" } });

    // Inputs should update (query by placeholder)
    const nameInput = screen.getByPlaceholderText("e.g. Stellar SDK Core") as HTMLInputElement;
    expect(nameInput.value).toBe("test-repo");

    const descInput = screen.getByPlaceholderText(/Briefly describe what your project does/i) as HTMLTextAreaElement;
    expect(descInput.value).toBe("Test Description");
  });
});
