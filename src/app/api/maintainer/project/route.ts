import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Session } from "next-auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  const customSession = session as Session | null;

  if (!customSession || !customSession.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = customSession.user.id;

  try {
    const project = await prisma.project.findFirst({
      where: { ownerId: userId },
      include: {
        owner: {
          select: {
            walletPublicKey: true,
          },
        },
        sponsorships: {
          include: {
            sponsor: {
              select: {
                githubId: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ project: null });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Error fetching maintainer project:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
