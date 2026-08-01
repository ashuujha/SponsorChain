"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";

import { ThemeProvider } from "./theme-provider";

/**
 * SessionProvider wraps the entire app so that `useSession()` works on the
 * `/list-project` page.  This session is ONLY used during the project-listing
 * flow to fetch the user's GitHub repositories.  It is never used as a
 * general sign-in mechanism — wallet connection is the real auth (Phase N2).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SessionProvider>{children}</SessionProvider>
    </ThemeProvider>
  );
}
