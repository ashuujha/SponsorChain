import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="pb-xl px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-x-hidden pt-8">
      {/* Hero Section */}
      <section className="mb-xl text-center max-w-4xl mx-auto flex flex-col items-center pt-4">
        <h2 className="font-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-headline-lg-mobile mb-md text-foreground font-bold leading-tight">
          Fund the open source you depend on. Directly. Transparently.
        </h2>
        <p className="font-body-lg text-body-lg text-secondary dark:text-neutral-400 mb-lg max-w-2xl text-center leading-relaxed">
          Connect your Stellar wallet to browse and sponsor projects instantly.
          Own a repo? Link GitHub and list it in under a minute.
        </p>
        <div className="flex flex-col sm:flex-row gap-sm mb-lg justify-center w-full max-w-md">
          <Link href="/explore" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-primary dark:bg-neutral-100 text-on-primary dark:text-neutral-900 font-semibold shadow-sm hover:opacity-90">
              Browse Projects
            </Button>
          </Link>
          <Link href="/list-project" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto border-outline-variant dark:border-neutral-700 text-foreground font-semibold">
              List Your Project
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-md border-t border-outline-variant dark:border-neutral-800 pt-lg w-full max-w-3xl">
          <div className="flex items-center justify-center gap-sm">
            <span className="material-symbols-outlined text-primary dark:text-emerald-400 text-[18px]">bolt</span>
            <span className="font-label-caps text-label-caps text-secondary dark:text-neutral-400">
              Settles in ~5 sec
            </span>
          </div>
          <div className="flex items-center justify-center gap-sm">
            <span className="material-symbols-outlined text-primary dark:text-emerald-400 text-[18px]">savings</span>
            <span className="font-label-caps text-label-caps text-secondary dark:text-neutral-400">
              Near-zero fees
            </span>
          </div>
          <div className="flex items-center justify-center gap-sm">
            <span className="material-symbols-outlined text-primary dark:text-emerald-400 text-[18px]">verified_user</span>
            <span className="font-label-caps text-label-caps text-secondary dark:text-neutral-400">
              100% on-chain verifiable
            </span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mb-xl pt-4">
        <h3 className="font-headline-md text-headline-md text-foreground mb-lg font-bold">
          How it works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
          <div className="bg-white dark:bg-neutral-900 border border-outline-variant dark:border-neutral-800 rounded-2xl p-lg flex gap-md items-start shadow-xs">
            <div className="bg-surface-container dark:bg-neutral-800 rounded-xl p-md flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary dark:text-neutral-100">account_balance_wallet</span>
            </div>
            <div>
              <h4 className="font-body-lg text-body-lg font-bold text-foreground mb-1">
                1. Connect Wallet
              </h4>
              <p className="font-body-sm text-body-sm text-secondary dark:text-neutral-400 leading-relaxed">
                Freighter, Albedo, or any Stellar wallet — connect and you&apos;re ready to sponsor.
              </p>
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900 border border-outline-variant dark:border-neutral-800 rounded-2xl p-lg flex gap-md items-start shadow-xs">
            <div className="bg-surface-container dark:bg-neutral-800 rounded-xl p-md flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary dark:text-neutral-100">search</span>
            </div>
            <div>
              <h4 className="font-body-lg text-body-lg font-bold text-foreground mb-1">
                2. Sponsor Projects
              </h4>
              <p className="font-body-sm text-body-sm text-secondary dark:text-neutral-400 leading-relaxed">
                Browse verified repositories and send XLM directly to maintainers on-chain.
              </p>
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900 border border-outline-variant dark:border-neutral-800 rounded-2xl p-lg flex gap-md items-start shadow-xs">
            <div className="bg-surface-container dark:bg-neutral-800 rounded-xl p-md flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary dark:text-neutral-100">add_circle</span>
            </div>
            <div>
              <h4 className="font-body-lg text-body-lg font-bold text-foreground mb-1">
                3. List Your Project
              </h4>
              <p className="font-body-sm text-body-sm text-secondary dark:text-neutral-400 leading-relaxed">
                Link your GitHub to prove repo ownership, then list it in one step.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="text-center py-xl border-t border-outline-variant/60 dark:border-neutral-800">
        <h3 className="font-headline-md text-foreground font-bold mb-xs">
          Ready to start?
        </h3>
        <p className="text-secondary dark:text-neutral-400 text-body-md mb-lg max-w-md mx-auto">
          Everything on SponsorChain runs on the Stellar testnet. No real funds needed
          — just connect a wallet and go.
        </p>
        <Link href="/explore">
          <Button className="px-xl py-md rounded-full font-bold bg-primary dark:bg-neutral-100 text-on-primary dark:text-neutral-900 hover:opacity-90 shadow-md">
            Explore Projects
          </Button>
        </Link>
      </section>
    </div>
  );
}
