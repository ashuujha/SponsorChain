import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Session } from "next-auth";

interface GitHubRepoItem {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  private: boolean;
  permissions?: {
    admin: boolean;
    push: boolean;
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const customSession = session as Session | null;

  if (!customSession || !customSession.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = customSession.accessToken;

  try {
    const response = await fetch("https://api.github.com/user/repos?visibility=public&affiliation=owner,organization_member&per_page=100", {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "SponsorChain",
      },
    });

    if (response.status === 403) {
      const rateLimitRemaining = response.headers.get("x-ratelimit-remaining");
      if (rateLimitRemaining === "0") {
        return NextResponse.json(
          { error: "GitHub API rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }
    }

    if (!response.ok) {
      if (response.status >= 500) {
        return NextResponse.json(
          { error: "GitHub API is currently unavailable. Please try again later." },
          { status: 502 }
        );
      }
      return NextResponse.json(
        { error: "Failed to fetch repositories from GitHub." },
        { status: response.status }
      );
    }

    const reposData = await response.json();

    if (!Array.isArray(reposData)) {
      return NextResponse.json({ repos: [] });
    }

    const typedReposData = reposData as GitHubRepoItem[];

    // Filter to only include repos where user has admin or push (write) permissions, and is public
    const repos = typedReposData
      .filter((repo) => {
        const hasAccess = repo.permissions?.admin || repo.permissions?.push;
        const isPublic = !repo.private;
        return hasAccess && isPublic;
      })
      .map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description || "",
        htmlUrl: repo.html_url,
      }));

    return NextResponse.json({ repos });
  } catch (error) {
    console.error("Error fetching GitHub repos:", error);
    return NextResponse.json(
      { error: "GitHub API is currently unavailable. Please try again later." },
      { status: 502 }
    );
  }
}
