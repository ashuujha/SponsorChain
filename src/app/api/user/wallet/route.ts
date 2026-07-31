import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Session } from "next-auth";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const customSession = session as Session | null;

  if (!customSession || !customSession.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = customSession.user.id;

  try {
    const { publicKey } = await request.json();

    if (!publicKey || typeof publicKey !== "string" || publicKey.length !== 56 || !publicKey.startsWith("G")) {
      return NextResponse.json({ error: "Invalid Stellar public key format" }, { status: 400 });
    }

    // Update the User's walletPublicKey in Postgres
    await prisma.user.update({
      where: { id: userId },
      data: { walletPublicKey: publicKey },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error updating user wallet public key:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
