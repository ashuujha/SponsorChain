import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="pb-xl px-gutter max-w-container-max mx-auto overflow-x-hidden pt-8">
      {/* Hero Section */}
      <section className="mb-xl text-center max-w-3xl mx-auto flex flex-col items-center">
        <h2 className="font-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-headline-lg-mobile mb-md text-primary font-bold">
          Fund the open source you depend on. Directly. Transparently.
        </h2>
        <p className="font-body-lg text-body-lg text-secondary mb-lg max-w-xl text-center">
          Connect your Stellar wallet to browse and sponsor projects instantly.
          Own a repo? Link GitHub and list it in under a minute.
        </p>
        <div className="flex flex-col sm:flex-row gap-sm mb-lg justify-center w-full">
          <Link href="/explore" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-primary text-on-primary">
              Browse Projects
            </Button>
          </Link>
          <Link href="/list-project" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              List Your Project
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-md border-t border-outline-variant pt-lg">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary text-[18px]">bolt</span>
            <span className="font-label-caps text-label-caps text-secondary">
              Settles in ~5 sec
            </span>
          </div>
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary text-[18px]">savings</span>
            <span className="font-label-caps text-label-caps text-secondary">
              Near-zero fees
            </span>
          </div>
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
            <span className="font-label-caps text-label-caps text-secondary">
              100% on-chain verifiable
            </span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mb-xl">
        <h3 className="font-headline-md text-headline-md text-primary mb-lg font-bold">
          How it works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <div className="bg-white border border-outline-variant rounded-xl p-md flex gap-md items-start">
            <div className="bg-surface-container rounded-lg p-sm flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
            </div>
            <div>
              <h4 className="font-body-lg text-body-lg font-bold text-primary">
                1. Connect Wallet
              </h4>
              <p className="font-body-sm text-body-sm text-secondary">
                Freighter, Albedo, or any Stellar wallet — connect and you&apos;re ready to sponsor.
              </p>
            </div>
          </div>
          <div className="bg-white border border-outline-variant rounded-xl p-md flex gap-md items-start">
            <div className="bg-surface-container rounded-lg p-sm flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">search</span>
            </div>
            <div>
              <h4 className="font-body-lg text-body-lg font-bold text-primary">
                2. Sponsor Projects
              </h4>
              <p className="font-body-sm text-body-sm text-secondary">
                Browse verified repositories and send XLM directly to maintainers on-chain.
              </p>
            </div>
          </div>
          <div className="bg-white border border-outline-variant rounded-xl p-md flex gap-md items-start">
            <div className="bg-surface-container rounded-lg p-sm flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">hub</span>
            </div>
            <div>
              <h4 className="font-body-lg text-body-lg font-bold text-primary">
                3. List Your Project
              </h4>
              <p className="font-body-sm text-body-sm text-secondary">
                Link your GitHub to prove repo ownership, then list it in one step.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="text-center py-xl">
        <h3 className="font-headline-md text-primary font-bold mb-sm">
          Ready to start?
        </h3>
        <p className="text-secondary text-body-md mb-lg max-w-md mx-auto">
          Everything on SponsorChain runs on the Stellar testnet. No real funds needed
          — just connect a wallet and go.
        </p>
        <Link href="/explore">
          <Button className="px-xl py-md rounded-full font-bold" variant="default">
            Explore Projects
          </Button>
        </Link>
      </section>
    </div>
  );
}
