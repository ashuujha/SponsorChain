import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { StrKey } from "stellar-sdk";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        owner: true,
        tiers: true,
        sponsorships: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. NextAuth Session Check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required. Please link your GitHub account first." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { owner, repoFullName, name, description, fundingGoalXLM } = body;

    // 2. Validate input presence
    if (!owner || !repoFullName || !name || !description) {
      return NextResponse.json(
        { error: "Missing required fields: owner, repoFullName, name, description." },
        { status: 400 }
      );
    }

    // 3. StrKey Validation
    if (!StrKey.isValidEd25519PublicKey(owner)) {
      return NextResponse.json(
        {
          error:
            `Invalid maintainer wallet public key format. ` +
            `Expected a 56-character Stellar StrKey starting with 'G'. Received: '${owner}'.`,
        },
        { status: 400 }
      );
    }

    // 4. Find or Create User record for maintainer
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { walletPublicKey: owner },
          session.githubUsername ? { githubUsername: session.githubUsername } : {},
        ].filter(Boolean) as Array<{ walletPublicKey?: string; githubUsername?: string }>,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletPublicKey: owner,
          githubUsername: session.githubUsername || null,
          role: "MAINTAINER",
        },
      });
    } else if (!user.walletPublicKey) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { walletPublicKey: owner },
      });
    }

    // 5. Create Project in PostgreSQL
    const project = await prisma.project.create({
      data: {
        ownerId: user.id,
        ownerWalletKey: owner,
        repoUrl: repoFullName,
        name,
        description,
        fundingGoalXLM: fundingGoalXLM || "0",
        tiers: {
          create: [
            { label: "Supporter", amountXLM: "10" },
            { label: "Backer", amountXLM: "50" },
            { label: "Sponsor", amountXLM: "100" },
          ],
        },
      },
      include: {
        owner: true,
        tiers: true,
      },
    });

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/projects error:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "A project for this GitHub repository has already been listed." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
