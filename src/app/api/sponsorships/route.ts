import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { StrKey } from "stellar-sdk";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // 1. Session check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required to record a sponsorship." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { projectId, sponsorWalletKey, amountXLM, txHash } = body;

    if (!projectId || !sponsorWalletKey || !amountXLM || !txHash) {
      return NextResponse.json(
        { error: "Missing required fields: projectId, sponsorWalletKey, amountXLM, txHash." },
        { status: 400 }
      );
    }

    // 2. StrKey check on sponsor key
    if (!StrKey.isValidEd25519PublicKey(sponsorWalletKey)) {
      return NextResponse.json(
        { error: "Invalid sponsor wallet public key format." },
        { status: 400 }
      );
    }

    // 3. Find or create User record for sponsor
    let sponsorUser = await prisma.user.findFirst({
      where: {
        OR: [
          { walletPublicKey: sponsorWalletKey },
          session.githubUsername ? { githubUsername: session.githubUsername } : {},
        ].filter(Boolean) as Array<{ walletPublicKey?: string; githubUsername?: string }>,
      },
    });

    if (!sponsorUser) {
      sponsorUser = await prisma.user.create({
        data: {
          walletPublicKey: sponsorWalletKey,
          githubUsername: session.githubUsername || null,
          role: "SPONSOR",
        },
      });
    }

    // 4. Create Sponsorship record in DB
    const sponsorship = await prisma.sponsorship.create({
      data: {
        projectId,
        sponsorId: sponsorUser.id,
        sponsorWalletKey,
        amountXLM,
        txHash,
        status: "CONFIRMED",
      },
    });

    return NextResponse.json({ success: true, sponsorship }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/sponsorships error:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "This transaction hash has already been recorded." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
