import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { projectSchema } from "@/lib/validations/project";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { Session } from "next-auth";

interface GitHubRepoResponse {
  private: boolean;
  permissions?: {
    admin: boolean;
    push: boolean;
  };
}

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        owner: {
          select: {
            walletPublicKey: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedProjects = projects.map((p) => ({
      id: p.id,
      name: p.name,
      repoUrl: p.repoUrl,
      description: p.description,
      fundingGoalXLM: p.fundingGoalXLM.toString(),
      walletPublicKey: p.owner.walletPublicKey,
    }));

    return NextResponse.json({ projects: formattedProjects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const customSession = session as Session | null;

  if (!customSession || !customSession.accessToken || !customSession.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = customSession.accessToken;
  const userId = customSession.user.id;

  try {
    const body = await request.json();
    const result = projectSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const validatedData = result.data;

    // Normalize repo URL to owner/repo
    const match = validatedData.repoUrl.match(/^(?:https:\/\/github\.com\/)?([^/]+)\/([^/]+)$/);
    if (!match) {
      return NextResponse.json(
        { error: "Invalid repository format. Must be owner/repo or https://github.com/owner/repo" },
        { status: 400 }
      );
    }

    const owner = match[1];
    const repo = match[2];
    const fullName = `${owner}/${repo}`.toLowerCase();

    // 1. Verify repository ownership & public access on GitHub
    const githubResponse = await fetch(`https://api.github.com/repos/${fullName}`, {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "SponsorChain",
      },
    });

    if (githubResponse.status === 404) {
      return NextResponse.json(
        { error: `Repository '${fullName}' not found or is private on GitHub.` },
        { status: 404 }
      );
    }

    if (!githubResponse.ok) {
      return NextResponse.json(
        { error: "Failed to verify repository with GitHub API." },
        { status: githubResponse.status }
      );
    }

    const repoData = (await githubResponse.json()) as GitHubRepoResponse;

    // Make sure it is public
    if (repoData.private) {
      return NextResponse.json(
        { error: "Only public repositories can be listed on SponsorChain." },
        { status: 400 }
      );
    }

    // Verify user is an administrator or has push permissions
    const permissions = repoData.permissions;
    if (!permissions || (!permissions.admin && !permissions.push)) {
      return NextResponse.json(
        { error: "You must be an administrator or have write access to this repository to list it." },
        { status: 403 }
      );
    }

    // 2. Check if project already exists in Database
    const existingProject = await prisma.project.findUnique({
      where: { repoUrl: fullName },
    });

    if (existingProject) {
      return NextResponse.json(
        { error: "This repository has already been listed on SponsorChain." },
        { status: 409 }
      );
    }

    // 3. Create Project and Tier inside a transaction
    const newProject = await prisma.project.create({
      data: {
        ownerId: userId,
        repoUrl: fullName,
        name: validatedData.name,
        description: validatedData.description,
        fundingGoalXLM: new Prisma.Decimal(validatedData.fundingGoalXLM),
        tiers: {
          create: {
            amountXLM: new Prisma.Decimal(validatedData.tierAmountXLM),
            label: validatedData.tierLabel,
          },
        },
      },
      include: {
        tiers: true,
      },
    });

    return NextResponse.json({ project: newProject }, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
