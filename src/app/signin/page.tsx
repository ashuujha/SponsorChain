"use client";

import React from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function SignInPage() {
  const handleGithubSignIn = () => {
    signIn("github", { callbackUrl: "/explore" });
  };

  return (
    <div className="font-body-lg text-on-background min-h-screen flex items-center justify-center p-md dot-grid bg-[#FAFAF8]">
      {/* Focused Sign-In Container */}
      <main className="w-full max-w-[420px] bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0px_4px_12px_rgba(0,0,0,0.03)] p-xl flex flex-col items-center">
        {/* Logo Section */}
        <div className="mb-lg flex items-center gap-xs">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary">hub</span>
          </div>
          <span className="font-headline-md text-headline-md font-extrabold tracking-tight text-primary">SponsorChain</span>
        </div>

        {/* Headline & Subtext */}
        <div className="text-center mb-xl">
          <h1 className="font-headline-md text-headline-md text-primary mb-sm font-bold">Sign in to SponsorChain</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[280px] mx-auto">
            We use GitHub to verify you own or maintain the repositories you list
          </p>
        </div>

        {/* Primary Action */}
        <button
          onClick={handleGithubSignIn}
          className="w-full bg-primary text-on-primary flex items-center justify-center gap-sm py-md px-lg rounded-full font-headline-md text-body-lg hover:shadow-[0px_8px_24px_rgba(0,0,0,0.12)] transition-all duration-200 active:scale-[0.98] font-semibold"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
          </svg>
          Continue with GitHub
        </button>

        {process.env.NODE_ENV === "development" && (
          <button
            onClick={() => signIn("credentials", { username: "stellar-core-maintainer", callbackUrl: "/explore" })}
            className="w-full mt-sm bg-secondary text-on-secondary flex items-center justify-center gap-sm py-md px-lg rounded-full font-headline-md text-body-lg hover:shadow-[0px_8px_24px_rgba(0,0,0,0.12)] transition-all duration-200 active:scale-[0.98] font-semibold"
          >
            <span className="material-symbols-outlined">key</span>
            Development Bypass Login
          </button>
        )}

        {/* Divider */}
        <div className="w-full flex items-center gap-md my-lg">
          <div className="h-[1px] flex-grow bg-outline-variant"></div>
          <span className="font-label-caps text-label-caps text-on-secondary-container">or</span>
          <div className="h-[1px] flex-grow bg-outline-variant"></div>
        </div>

        {/* Secondary Action */}
        <Link href="/explore" className="w-full">
          <button className="w-full bg-surface-container-lowest text-primary border border-outline-variant flex items-center justify-center py-md px-lg rounded-full font-headline-md text-body-lg hover:bg-surface-container-low transition-all duration-200 active:scale-[0.98] font-semibold">
            Continue as a sponsor
          </button>
        </Link>

        {/* Footer */}
        <footer className="mt-xl text-center space-y-xs w-full">
          <p className="font-body-sm text-body-sm text-on-secondary-container">
            By signing in, you agree to our
          </p>
          <div className="flex justify-center gap-md">
            <a className="font-label-caps text-label-caps text-primary hover:underline transition-all" href="#">Terms of Service</a>
            <span className="text-outline-variant opacity-50">|</span>
            <a className="font-label-caps text-label-caps text-primary hover:underline transition-all" href="#">Privacy Policy</a>
          </div>
          <div className="pt-lg border-t border-outline-variant/30 mt-sm">
            <p className="font-label-caps text-[10px] uppercase tracking-widest text-on-primary-container opacity-40">
              © 2026 SponsorChain. Built on Stellar.
            </p>
          </div>
        </footer>
      </main>

      {/* Decorative Elements (Mobile hidden) */}
      <div className="hidden md:block fixed top-gutter left-gutter p-md border border-outline-variant rounded-lg bg-surface-container-low/50 backdrop-blur-sm">
        <div className="flex items-center gap-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-mono-code text-mono-code text-on-secondary-fixed-variant">System Status: Operational</span>
        </div>
      </div>
      <div className="hidden md:block fixed bottom-gutter right-gutter p-md border border-outline-variant rounded-lg bg-surface-container-low/50 backdrop-blur-sm">
        <div className="flex items-center gap-sm">
          <span className="font-label-caps text-label-caps text-on-secondary-container">Trusted by 2.4k Maintainers</span>
        </div>
      </div>
    </div>
  );
}
