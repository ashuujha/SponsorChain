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
    const sponsorships = await prisma.sponsorship.findMany({
      where: { sponsorId: userId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            repoUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ sponsorships });
  } catch (error) {
    console.error("Error fetching sponsor sponsorships:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
