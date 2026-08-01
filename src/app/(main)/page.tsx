import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="pb-16 overflow-x-hidden pt-4">
      {/* Hero Section with Slacc Pastel-Mesh Backdrop */}
      <section className="pastel-mesh-bg py-16 px-4 sm:px-6 lg:px-8 border-b border-border-color/60 mb-16 rounded-3xl mx-4 sm:mx-6 lg:mx-8">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          {/* Slacc Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 bg-canvas-cream dark:bg-surface-container text-ink dark:text-foreground text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6 border border-aubergine/10 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-aubergine dark:bg-aubergine-press" />
            Built on Stellar Soroban
          </div>

          <h1 className="display-hero text-3xl sm:text-5xl md:text-6xl text-foreground font-extrabold mb-6 tracking-tight leading-tight">
            Fund open source directly. Transparently.
          </h1>

          <p className="text-lg md:text-xl text-text-secondary mb-8 max-w-2xl text-center leading-relaxed">
            Connect your Stellar wallet to browse and sponsor GitHub maintainers instantly.
            Own a repo? Link GitHub and list it on-chain in under a minute.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-10 justify-center w-full max-w-md">
            <Link href="/explore" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto shadow-md">
                Browse Projects
              </Button>
            </Link>
            <Link href="/list-project" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                List Your Project
              </Button>
            </Link>
          </div>

          {/* Key Value Props Pill Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border-color/60 pt-6 w-full max-w-3xl text-sm">
            <div className="flex items-center justify-center gap-2 text-text-secondary font-medium">
              <span className="material-symbols-outlined text-aubergine dark:text-aubergine-mute text-[20px]">bolt</span>
              <span>Settles in ~5 sec</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-text-secondary font-medium">
              <span className="material-symbols-outlined text-aubergine dark:text-aubergine-mute text-[20px]">savings</span>
              <span>Near-zero transaction fees</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-text-secondary font-medium">
              <span className="material-symbols-outlined text-aubergine dark:text-aubergine-mute text-[20px]">verified_user</span>
              <span>100% on-chain verifiable</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-container-max mx-auto px-4 sm:px-6 lg:px-8">
        {/* Slacc Statistics Display Callouts */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface dark:bg-surface border border-border-color rounded-2xl p-8 text-center shadow-xs">
              <div className="display-stat text-5xl font-extrabold mb-2">100%</div>
              <h4 className="font-bold text-foreground text-lg mb-1">Direct to Maintainer</h4>
              <p className="text-text-secondary text-sm">Zero intermediary platform cuts on sponsorships.</p>
            </div>
            <div className="bg-surface dark:bg-surface border border-border-color rounded-2xl p-8 text-center shadow-xs">
              <div className="display-stat text-5xl font-extrabold mb-2">~5s</div>
              <h4 className="font-bold text-foreground text-lg mb-1">Instant Settlement</h4>
              <p className="text-text-secondary text-sm">Powered by Stellar Horizon speed and Soroban smart contracts.</p>
            </div>
            <div className="bg-surface dark:bg-surface border border-border-color rounded-2xl p-8 text-center shadow-xs">
              <div className="display-stat text-5xl font-extrabold mb-2">GitHub</div>
              <h4 className="font-bold text-foreground text-lg mb-1">Verified Ownership</h4>
              <p className="text-text-secondary text-sm">Proof of repository ownership verified via OAuth link.</p>
            </div>
          </div>
        </section>

        {/* Slacc How It Works Section */}
        <section className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-3">
              How SponsorChain Works
            </h2>
            <p className="text-text-secondary text-base">
              A friction-free sponsorship bridge connecting open-source maintainers with global backers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-canvas-cream dark:bg-surface-container border border-border-color rounded-2xl p-8 flex flex-col justify-between shadow-xs">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-aubergine text-white flex items-center justify-center mb-6 shadow-sm">
                  <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
                </div>
                <h3 className="font-extrabold text-xl text-foreground mb-2">
                  1. Connect Wallet
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Freighter, Albedo, or any Stellar wallet — connect in seconds and you&apos;re ready to sponsor.
                </p>
              </div>
            </div>

            <div className="bg-canvas-cream dark:bg-surface-container border border-border-color rounded-2xl p-8 flex flex-col justify-between shadow-xs">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-aubergine text-white flex items-center justify-center mb-6 shadow-sm">
                  <span className="material-symbols-outlined text-[24px]">search</span>
                </div>
                <h3 className="font-extrabold text-xl text-foreground mb-2">
                  2. Sponsor Projects
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Browse verified open-source repositories and send XLM directly to maintainers on-chain.
                </p>
              </div>
            </div>

            <div className="bg-canvas-cream dark:bg-surface-container border border-border-color rounded-2xl p-8 flex flex-col justify-between shadow-xs">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-aubergine text-white flex items-center justify-center mb-6 shadow-sm">
                  <span className="material-symbols-outlined text-[24px]">add_circle</span>
                </div>
                <h3 className="font-extrabold text-xl text-foreground mb-2">
                  3. List Your Project
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Link your GitHub to prove repository ownership, set a goal, and start receiving sponsorships.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Slacc Aubergine Closing CTA Band */}
        <section className="bg-aubergine text-white rounded-3xl p-10 md:p-14 text-center shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight">
              Ready to support open source?
            </h2>
            <p className="text-aubergine-mute text-base md:text-lg mb-8 leading-relaxed">
              Everything on SponsorChain runs transparently on the Stellar testnet. No real funds needed — just connect your wallet and go.
            </p>
            <Link href="/explore">
              <Button size="lg" className="bg-white text-aubergine hover:bg-canvas-cream font-bold px-8 shadow-md">
                Explore Projects
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
