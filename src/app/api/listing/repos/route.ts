import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface GitHubRepoResponse {
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

export interface FilteredRepo {
  id: number;
  name: string;
  fullName: string;
  description: string;
  htmlUrl: string;
}

function isOwnNonFork(repo: GitHubRepoResponse, username: string): boolean {
  return !repo.fork && repo.owner.login.toLowerCase() === username.toLowerCase();
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Not authenticated with GitHub. Please connect your GitHub account." },
      { status: 401 }
    );
  }

  const username = (session as { githubUsername?: string }).githubUsername;
  if (!username) {
    return NextResponse.json(
      { error: "Unable to determine your GitHub username. Please re-authenticate." },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(
      "https://api.github.com/user/repos?visibility=public&affiliation=owner&per_page=100",
      {
        headers: {
          Authorization: `token ${session.accessToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "SponsorChain",
        },
      }
    );

    if (response.status === 401 || response.status === 403) {
      const rateLimitRemaining = response.headers.get("x-ratelimit-remaining");
      const rateLimitReset = response.headers.get("x-ratelimit-reset");

      if (rateLimitRemaining === "0") {
        const resetTime = rateLimitReset
          ? new Date(parseInt(rateLimitReset) * 1000).toLocaleTimeString()
          : "shortly";
        return NextResponse.json(
          {
            error: `GitHub API rate limit exceeded. Your limit will reset at ${resetTime}. Please try again.`,
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error:
            "GitHub authentication has expired or is insufficient. Please reconnect your GitHub account.",
        },
        { status: 401 }
      );
    }

    if (response.status === 304) {
      return NextResponse.json({ repos: [] });
    }

    if (!response.ok) {
      if (response.status >= 500) {
        return NextResponse.json(
          {
            error:
              "GitHub's API is currently experiencing issues. Please try again in a moment.",
          },
          { status: 502 }
        );
      }

      return NextResponse.json(
        { error: "Failed to fetch your repositories from GitHub. Please try again." },
        { status: response.status }
      );
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      return NextResponse.json({ repos: [] });
    }

    const repos = data as GitHubRepoResponse[];

    const filtered: FilteredRepo[] = repos
      .filter((repo) => isOwnNonFork(repo, username))
      .map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description || "",
        htmlUrl: repo.html_url,
      }));

    return NextResponse.json({ repos: filtered });
  } catch {
    return NextResponse.json(
      {
        error:
          "Unable to reach GitHub's servers. Please check your connection and try again.",
      },
      { status: 502 }
    );
  }
}
