import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="pb-16 sm:pb-24 overflow-x-hidden bg-background min-h-screen text-foreground transition-colors">
      {/* Hero Band: Austere Canvas with Centered Wide-Tracked Display Headline */}
      <section className="relative py-16 sm:py-24 md:py-36 px-4 sm:px-8 lg:px-12 xl:px-16 border-b border-hairline mb-12 sm:mb-20">
        <div className="max-w-container-max mx-auto flex flex-col items-center text-center">
          {/* Eyebrow Caption */}
          <div className="caption-uppercase text-muted mb-4 sm:mb-6 flex items-center justify-center gap-2 sm:gap-3 text-[10px] sm:text-xs">
            <span className="w-1.5 h-1.5 bg-foreground rounded-full" />
            <span>THE STELLAR OPEN SOURCE FACILITY</span>
          </div>

          <h1 className="display-xl font-normal text-foreground mb-6 sm:mb-8 max-w-3xl text-center px-2">
            FUND OPEN SOURCE DIRECTLY. UNCOMPROMISED.
          </h1>

          <p className="body-serif text-muted mb-8 sm:mb-12 max-w-xl leading-relaxed text-center px-4">
            Connect your Stellar wallet to browse and sponsor open-source repositories over Horizon &amp; Soroban.
            Maintainers verify GitHub repository ownership and receive direct, transparent XLM sponsorships.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-12 sm:mb-16 w-full sm:w-auto justify-center px-4">
            <Link href="/explore" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto min-h-[44px]">
                EXPLORE REPOSITORIES
              </Button>
            </Link>
            <Link href="/list-project" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto min-h-[44px]">
                LIST YOUR PROJECT
              </Button>
            </Link>
          </div>

          {/* Key Engineering Specs Line */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-8 border-t border-hairline w-full text-center">
            <div className="flex flex-col items-center gap-1">
              <span className="caption-uppercase text-muted text-[9px] sm:text-[11px]">SETTLEMENT SPEED</span>
              <span className="font-mono text-[10px] sm:text-sm uppercase tracking-[0.5px] sm:tracking-[1.5px] text-foreground leading-snug">~5 SEC ON-CHAIN</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="caption-uppercase text-muted text-[9px] sm:text-[11px]">TX COST</span>
              <span className="font-mono text-[10px] sm:text-sm uppercase tracking-[0.5px] sm:tracking-[1.5px] text-foreground leading-snug">NEAR-ZERO</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="caption-uppercase text-muted text-[9px] sm:text-[11px]">VERIFICATION</span>
              <span className="font-mono text-[10px] sm:text-sm uppercase tracking-[0.5px] sm:tracking-[1.5px] text-foreground leading-snug">100% AUDITABLE</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-container-max mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        {/* Technical Callout Grid */}
        <section className="mb-16 sm:mb-24">
          <div className="caption-uppercase text-muted mb-6 sm:mb-8 tracking-[2px] text-center">
            PERFORMANCE METRICS
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-surface border border-hairline rounded-none p-6 sm:p-8 flex flex-col justify-between min-h-[160px] sm:min-h-[192px]">
              <div className="display-lg font-normal text-foreground mb-4">
                100%
              </div>
              <div>
                <h4 className="font-mono text-xs text-foreground uppercase tracking-[1.5px] sm:tracking-[2px] mb-1">
                  DIRECT TO MAINTAINER
                </h4>
                <p className="body-serif-sm text-muted text-xs sm:text-sm leading-relaxed">
                  Zero platform commission. All funds route straight to the owner wallet.
                </p>
              </div>
            </div>

            <div className="bg-surface border border-hairline rounded-none p-6 sm:p-8 flex flex-col justify-between min-h-[160px] sm:min-h-[192px]">
              <div className="display-lg font-normal text-foreground mb-4">
                ~5.0s
              </div>
              <div>
                <h4 className="font-mono text-xs text-foreground uppercase tracking-[1.5px] sm:tracking-[2px] mb-1">
                  STELLAR SETTLEMENT
                </h4>
                <p className="body-serif-sm text-muted text-xs sm:text-sm leading-relaxed">
                  High-speed ledger consensus via Horizon RPC &amp; Soroban contracts.
                </p>
              </div>
            </div>

            <div className="bg-surface border border-hairline rounded-none p-6 sm:p-8 flex flex-col justify-between min-h-[160px] sm:min-h-[192px]">
              <div className="display-lg font-normal text-foreground mb-4">
                GITHUB
              </div>
              <div>
                <h4 className="font-mono text-xs text-foreground uppercase tracking-[1.5px] sm:tracking-[2px] mb-1">
                  PROOF OF OWNERSHIP
                </h4>
                <p className="body-serif-sm text-muted text-xs sm:text-sm leading-relaxed">
                  Repository ownership verified via OAuth link.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Model Showcase Cards Section */}
        <section className="mb-16 sm:mb-24 space-y-8 sm:space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-hairline pb-6">
            <div>
              <div className="caption-uppercase text-muted mb-2">SYSTEM ARCHITECTURE</div>
              <h2 className="display-md text-foreground font-normal">
                ENGINEERED FOR OPEN SOURCE
              </h2>
            </div>
            <Link href="/explore" className="bugatti-link text-xs">
              EXPLORE ALL PROJECTS &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-surface border border-hairline rounded-none p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div>
                <div className="caption-uppercase text-muted mb-3">STEP 01</div>
                <h3 className="font-mono text-sm sm:text-base text-foreground uppercase tracking-[1.5px] sm:tracking-[2px] mb-2">
                  CONNECT WALLET
                </h3>
                <p className="body-serif-sm text-muted leading-relaxed">
                  Freighter, Albedo, or any Stellar wallet — connect instantly with no account signup required.
                </p>
              </div>
              <span className="caption-uppercase text-muted text-[10px]">01 // IDENTIFICATION</span>
            </div>

            <div className="bg-surface border border-hairline rounded-none p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div>
                <div className="caption-uppercase text-muted mb-3">STEP 02</div>
                <h3 className="font-mono text-sm sm:text-base text-foreground uppercase tracking-[1.5px] sm:tracking-[2px] mb-2">
                  SPONSOR REPOS
                </h3>
                <p className="body-serif-sm text-muted leading-relaxed">
                  Browse verified open-source projects and send XLM directly to maintainers on-chain.
                </p>
              </div>
              <span className="caption-uppercase text-muted text-[10px]">02 // TRANSMISSION</span>
            </div>

            <div className="bg-surface border border-hairline rounded-none p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div>
                <div className="caption-uppercase text-muted mb-3">STEP 03</div>
                <h3 className="font-mono text-base text-foreground uppercase tracking-[1.5px] sm:tracking-[2px] mb-2">
                  LIST REPOSITORY
                </h3>
                <p className="body-serif-sm text-muted leading-relaxed">
                  Link your GitHub account to prove repository ownership and list your project in seconds.
                </p>
              </div>
              <span className="caption-uppercase text-muted text-[10px]">03 // REGISTRATION</span>
            </div>
          </div>
        </section>

        {/* Pre-Footer CTA Band */}
        <section className="bg-surface border border-hairline rounded-none p-8 sm:p-12 md:p-16 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="caption-uppercase text-muted">STELLAR TESTNET FACILITY</div>
            <h2 className="display-md text-foreground font-normal">
              DISCOVER SPONSORCHAIN
            </h2>
            <p className="body-serif text-muted leading-relaxed">
            All project registrations and sponsorship transactions run transparently on Stellar Testnet.
            </p>
            <div className="pt-4 flex justify-center">
              <Link href="/explore">
                <Button size="lg" className="min-h-[44px]">
                  EXPLORE PROJECTS
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
