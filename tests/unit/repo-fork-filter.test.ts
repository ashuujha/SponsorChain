import { describe, it, expect } from "vitest";

/**
 * Fork-filtering logic extracted from the repos API route for isolated testing.
 *
 * Rules:
 * 1. repo.fork must be false
 * 2. repo.owner.login must === the authenticated username (case-insensitive)
 */

interface GitHubRepoResponse {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  fork: boolean;
  owner: {
    login: string;
  };
}

interface FilteredRepo {
  id: number;
  name: string;
  fullName: string;
  description: string;
  htmlUrl: string;
}

function filterAndMap(
  repos: GitHubRepoResponse[],
  username: string
): FilteredRepo[] {
  return repos
    .filter(
      (repo) =>
        !repo.fork && repo.owner.login.toLowerCase() === username.toLowerCase()
    )
    .map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description || "",
      htmlUrl: repo.html_url,
    }));
}

const SELF = "stellar-core-maintainer";

const ownedNonFork: GitHubRepoResponse = {
  id: 1,
  name: "my-project",
  full_name: "stellar-core-maintainer/my-project",
  description: "A real project",
  html_url: "https://github.com/stellar-core-maintainer/my-project",
  fork: false,
  owner: { login: "stellar-core-maintainer" },
};

const ownedFork: GitHubRepoResponse = {
  id: 2,
  name: "forked-lib",
  full_name: "stellar-core-maintainer/forked-lib",
  description: "Forked from another org",
  html_url: "https://github.com/stellar-core-maintainer/forked-lib",
  fork: true,
  owner: { login: "stellar-core-maintainer" },
};

const someoneElsesRepo: GitHubRepoResponse = {
  id: 3,
  name: "stellar-core",
  full_name: "stellar/stellar-core",
  description: "Stellar core protocol",
  html_url: "https://github.com/stellar/stellar-core",
  fork: false,
  owner: { login: "stellar" },
};

const forkFromElsewhere: GitHubRepoResponse = {
  id: 4,
  name: "contrib-fork",
  full_name: "stellar-core-maintainer/contrib-fork",
  description: "Fork of someone's tool",
  html_url: "https://github.com/stellar-core-maintainer/contrib-fork",
  fork: true,
  owner: { login: "stellar-core-maintainer" },
};

const ownedCaseInsensitive: GitHubRepoResponse = {
  id: 5,
  name: "caps-project",
  full_name: "Stellar-Core-Maintainer/caps-project",
  description: "Case-insensitive match",
  html_url: "https://github.com/Stellar-Core-Maintainer/caps-project",
  fork: false,
  owner: { login: "Stellar-Core-Maintainer" },
};

const allRepos = [
  ownedNonFork,
  ownedFork,
  someoneElsesRepo,
  forkFromElsewhere,
  ownedCaseInsensitive,
];

describe("fork-filtering logic", () => {
  it("keeps only non-fork repos owned by the authenticated user", () => {
    const result = filterAndMap(allRepos, SELF);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual([1, 5]);
  });

  it("excludes forks even when owned by the user", () => {
    const result = filterAndMap(allRepos, SELF);
    const ids = result.map((r) => r.id);
    expect(ids).not.toContain(2);
    expect(ids).not.toContain(4);
  });

  it("excludes non-fork repos owned by other users", () => {
    const result = filterAndMap(allRepos, SELF);
    const ids = result.map((r) => r.id);
    expect(ids).not.toContain(3);
  });

  it("matches owner login case-insensitively", () => {
    const result = filterAndMap(
      [ownedCaseInsensitive],
      "stellar-core-maintainer"
    );
    expect(result).toHaveLength(1);
    expect(result[0].fullName).toBe("Stellar-Core-Maintainer/caps-project");
  });

  it("returns empty array when no repos match", () => {
    const result = filterAndMap([someoneElsesRepo, ownedFork], SELF);
    expect(result).toEqual([]);
  });

  it("returns empty array for empty input", () => {
    const result = filterAndMap([], SELF);
    expect(result).toEqual([]);
  });

  it("maps repo fields correctly to the output shape", () => {
    const result = filterAndMap([ownedNonFork], SELF);
    expect(result[0]).toEqual({
      id: 1,
      name: "my-project",
      fullName: "stellar-core-maintainer/my-project",
      description: "A real project",
      htmlUrl: "https://github.com/stellar-core-maintainer/my-project",
    });
  });

  it("defaults missing descriptions to empty string", () => {
    const noDesc: GitHubRepoResponse = {
      ...ownedNonFork,
      id: 99,
      description: null,
    };
    const result = filterAndMap([noDesc], SELF);
    expect(result[0].description).toBe("");
  });
});
