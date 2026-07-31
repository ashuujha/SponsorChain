/**
 * SponsorChain — GitHub-only NextAuth configuration
 *
 * WHY THIS IS STATELESS AND SAFE:
 * ---------------------------------
 * This NextAuth instance exists ONLY to power the project-listing flow at
 * `/list-project`.  The JWT session and GitHub access token are never used
 * to identify the user anywhere else in the app — the Stellar wallet public
 * key from Phase N2 IS the user's real identity.
 *
 * GitHub here answers exactly one question: "does the person at the keyboard
 * own (or have write access to) the repository they're about to list?"
 * Once the listing page is closed or the flow is abandoned, no GitHub-linked
 * state persists on the server.  No database record, no user table, no
 * server-side session database — just a short-lived JWT in a cookie.
 *
 * The actual enforcement that matters (who receives sponsor funds) lives
 * on-chain in the Soroban `ProjectRegistry.create_project()` call (Phase N5).
 * That call requires a wallet signature (`owner.require_auth()`), which is
 * what cryptographically binds a Stellar address to a project.  The GitHub
 * step is a convenience proof-of-ownership at listing time, not an identity
 * system.
 */
import { NextAuthOptions, Session } from "next-auth";
import GithubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: "read:user public_repo",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      if (profile) {
        const ghProfile = profile as { login?: string };
        token.githubUsername = ghProfile.login || "";
      }
      return token;
    },
    async session({ session, token }) {
      const customSession = session as Session & {
        accessToken?: string;
        githubUsername?: string;
      };
      customSession.accessToken = token.accessToken;
      customSession.githubUsername = token.githubUsername;
      return customSession;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/list-project",
  },
};
