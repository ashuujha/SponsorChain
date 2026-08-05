import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type GitHubRepository = {
  full_name?: string;
  name?: string;
  owner?: { login?: string };
  permissions?: { admin?: boolean };
};

/**
 * Validates the exact repository immediately before the user signs the
 * ProjectRegistry transaction. No result is persisted off-chain.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const accessToken = (session as { accessToken?: string } | null)?.accessToken;
  const githubUsername = (session as { githubUsername?: string } | null)?.githubUsername;

  if (!accessToken || !githubUsername) {
    return NextResponse.json(
      { error: "GitHub authentication is required to register a repository." },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid validation request." }, { status: 400 });
  }

  const fullName =
    typeof body === "object" && body !== null && "fullName" in body
      ? (body as { fullName?: unknown }).fullName
      : undefined;
  if (typeof fullName !== "string" || !/^[^/]+\/[^/]+$/.test(fullName)) {
    return NextResponse.json(
      { error: "A valid GitHub repository owner/name is required." },
      { status: 400 }
    );
  }

  const [requestedOwner, requestedName] = fullName.split("/");

  try {
    const response = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(requestedOwner)}/${encodeURIComponent(requestedName)}`,
      {
        cache: "no-store",
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "SponsorChain",
        },
      }
    );

    if (response.status === 404) {
      return NextResponse.json({ error: "GitHub repository does not exist." }, { status: 404 });
    }
    if (!response.ok) {
      return NextResponse.json(
        { error: "GitHub could not validate repository access. Please try again." },
        { status: response.status >= 500 ? 502 : 403 }
      );
    }

    const repository = (await response.json()) as GitHubRepository;
    const repositoryOwner = repository.owner?.login || "";
    const repositoryName = repository.name || "";
    const isExactRepository =
      repository.full_name?.toLowerCase() === fullName.toLowerCase() &&
      repositoryOwner.toLowerCase() === requestedOwner.toLowerCase() &&
      repositoryName.toLowerCase() === requestedName.toLowerCase();
    const hasAdminPermission = repository.permissions?.admin === true;
    const isGitHubOwner = repositoryOwner.toLowerCase() === githubUsername.toLowerCase();

    if (!isExactRepository || (!hasAdminPermission && !isGitHubOwner)) {
      return NextResponse.json(
        { error: "The authenticated GitHub user is not an owner or admin of this repository." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      valid: true,
      repositoryOwner,
      repositoryName,
      fullName: repository.full_name || fullName,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to reach GitHub to validate repository ownership." },
      { status: 502 }
    );
  }
}
