import { NextAuthOptions, Session, User } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./db";

interface GitHubProfile {
  id?: number;
  login?: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
      authorization: {
        params: {
          scope: "read:user user:email public_repo",
        },
      },
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Development Bypass",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "stellar-core-maintainer" },
      },
      async authorize(credentials) {
        if (process.env.NODE_ENV !== "development") return null;
        const username = credentials?.username || "stellar-core-maintainer";
        let dbUser = await prisma.user.findUnique({
          where: { githubId: username },
        });
        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              githubId: username,
              role: "MAINTAINER",
            },
          });
        }
        return {
          id: dbUser.id,
          name: username,
          email: `${username}@example.com`,
          role: dbUser.role,
          walletPublicKey: dbUser.walletPublicKey,
        };
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "credentials") {
        return true;
      }
      if (!account || !profile) return false;
      const ghProfile = profile as GitHubProfile;
      const githubId = ghProfile.id?.toString() || "";
      if (!githubId) return false;
      
      try {
        let dbUser = await prisma.user.findUnique({
          where: { githubId },
        });
        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              githubId,
              role: "BOTH",
            },
          });
        }
        
        const customUser = user as User;
        customUser.id = dbUser.id;
        customUser.role = dbUser.role;
        customUser.walletPublicKey = dbUser.walletPublicKey;
        return true;
      } catch (err) {
        console.error("Error signing in user:", err);
        return false;
      }
    },
    async jwt({ token, user, account, profile }) {
      if (account && profile) {
        const ghProfile = profile as GitHubProfile;
        token.accessToken = account.access_token;
        token.githubId = ghProfile.id?.toString() || "";
        token.githubUsername = ghProfile.login || "";
      } else if (account?.provider === "credentials" && user) {
        token.accessToken = "mock-access-token";
        token.githubId = user.name || "mock-user";
        token.githubUsername = user.name || "mock-user";
      }
      if (user) {
        const customUser = user as User;
        token.userId = customUser.id;
        token.userRole = customUser.role;
        token.walletPublicKey = customUser.walletPublicKey;
      }
      return token;
    },
    async session({ session, token }) {
      const customSession = session as Session;
      if (customSession.user) {
        customSession.accessToken = token.accessToken;
        customSession.githubId = token.githubId;
        customSession.githubUsername = token.githubUsername;
        customSession.user.id = token.userId || "";
        customSession.user.role = token.userRole || "BOTH";
        customSession.user.walletPublicKey = token.walletPublicKey || null;
      }
      return customSession;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
