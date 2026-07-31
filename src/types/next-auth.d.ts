import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    githubId?: string;
    githubUsername?: string;
    user: {
      id: string;
      role: string;
      walletPublicKey: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    walletPublicKey: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    githubId?: string;
    githubUsername?: string;
    userId?: string;
    userRole?: string;
    walletPublicKey?: string | null;
  }
}
