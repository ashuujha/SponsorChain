import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            githubId: true,
            walletPublicKey: true,
          },
        },
        tiers: {
          orderBy: {
            amountXLM: "asc",
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
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Error fetching project details:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
