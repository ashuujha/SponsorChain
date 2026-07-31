import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { Session } from "next-auth";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const customSession = session as Session | null;

  if (!customSession || !customSession.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sponsorId = customSession.user.id;

  try {
    const { projectId, txHash, amountXLM } = await request.json();

    if (!projectId || !txHash || !amountXLM) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (typeof txHash !== "string" || txHash.length !== 64) {
      return NextResponse.json({ error: "Invalid Stellar transaction hash format." }, { status: 400 });
    }

    const amountNum = parseFloat(amountXLM);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: "Amount must be a positive decimal." }, { status: 400 });
    }

    // Verify the project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    // Write a Sponsorship record to Postgres as a metadata cache
    const sponsorship = await prisma.sponsorship.create({
      data: {
        sponsorId,
        projectId,
        txHash,
        amountXLM: new Prisma.Decimal(amountXLM),
        status: "CONFIRMED",
      },
    });

    return NextResponse.json({ success: true, sponsorship }, { status: 201 });
  } catch (error) {
    console.error("Error creating sponsorship record:", error);
    // Handle unique constraint check for txHash
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Sponsorship with this transaction hash already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
