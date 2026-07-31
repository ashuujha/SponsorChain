import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Simulated verification function that matches the logic inside the API route
async function verifyRepoOwnership(repoName: string, accessToken: string) {
  const match = repoName.match(/^(?:https:\/\/github\.com\/)?([^/]+)\/([^/]+)$/);
  if (!match) {
    throw new Error("Invalid repository format");
  }
  const fullName = `${match[1]}/${match[2]}`.toLowerCase();

  const response = await fetch(`https://api.github.com/repos/${fullName}`, {
    headers: {
      Authorization: `token ${accessToken}`,
    },
  });

  if (response.status === 404) {
    throw new Error("Repository not found or is private on GitHub.");
  }

  if (!response.ok) {
    throw new Error("Failed to verify repository with GitHub API.");
  }

  const repoData = await response.json();

  if (repoData.private) {
    throw new Error("Only public repositories can be listed on SponsorChain.");
  }

  const permissions = repoData.permissions;
  if (!permissions || (!permissions.admin && !permissions.push)) {
    throw new Error(
      "You must be an administrator or have write access to this repository to list it."
    );
  }

  return fullName;
}

describe("GitHub Repository Ownership Verification", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.stubGlobal("fetch", originalFetch);
  });

  it("should verify successfully for a public repository where user has admin access", async () => {
    const mockRepoData = {
      private: false,
      permissions: {
        admin: true,
        push: true,
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockRepoData,
    } as Response);

    const result = await verifyRepoOwnership("stellar/stellar-sdk", "valid_token");
    expect(result).toBe("stellar/stellar-sdk");
    expect(fetch).toHaveBeenCalledWith("https://api.github.com/repos/stellar/stellar-sdk", {
      headers: { Authorization: "token valid_token" },
    });
  });

  it("should fail when the repository is not found (returns 404)", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    await expect(
      verifyRepoOwnership("stellar/stellar-sdk", "valid_token")
    ).rejects.toThrow("Repository not found or is private on GitHub.");
  });

  it("should fail when the repository is private", async () => {
    const mockRepoData = {
      private: true,
      permissions: {
        admin: true,
        push: true,
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockRepoData,
    } as Response);

    await expect(
      verifyRepoOwnership("stellar/stellar-sdk", "valid_token")
    ).rejects.toThrow("Only public repositories can be listed on SponsorChain.");
  });

  it("should fail when the user does not have push/admin permissions", async () => {
    const mockRepoData = {
      private: false,
      permissions: {
        admin: false,
        push: false,
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockRepoData,
    } as Response);

    await expect(
      verifyRepoOwnership("stellar/stellar-sdk", "valid_token")
    ).rejects.toThrow(
      "You must be an administrator or have write access to this repository to list it."
    );
  });
});
