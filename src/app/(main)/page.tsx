import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="pb-24 overflow-x-hidden bg-black min-h-screen text-white">
      {/* Hero Band: Austere Pure Black Canvas with Wide-Tracked Display Headline */}
      <section className="relative py-24 md:py-36 px-4 sm:px-6 lg:px-8 border-b border-hairline mb-20">
        <div className="max-w-container-max mx-auto flex flex-col items-start">
          {/* Eyebrow Caption */}
          <div className="caption-uppercase text-muted mb-6 flex items-center gap-3">
            <span className="w-1.5 h-1.5 bg-white" />
            <span>THE STELLAR OPEN SOURCE FACILITY</span>
          </div>

          <h1 className="display-xl text-3xl sm:text-5xl md:text-6xl font-normal text-white mb-8 tracking-[4px] uppercase leading-tight max-w-4xl">
            FUND OPEN SOURCE DIRECTLY. UNCOMPROMISED.
          </h1>

          <p className="body-serif text-lg md:text-xl text-body mb-12 max-w-2xl leading-relaxed">
            Connect your Stellar wallet to browse and sponsor open-source repositories over Horizon &amp; Soroban.
            Maintainers verify GitHub repository ownership and receive direct, transparent XLM sponsorships.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 mb-16 w-full sm:w-auto">
            <Link href="/explore">
              <Button size="lg" className="w-full sm:w-auto">
                EXPLORE REPOSITORIES
              </Button>
            </Link>
            <Link href="/list-project">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                LIST YOUR PROJECT
              </Button>
            </Link>
          </div>

          {/* Key Engineering Specs Line */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-8 border-t border-hairline w-full">
            <div className="flex flex-col gap-1">
              <span className="caption-uppercase text-muted">SETTLEMENT SPEED</span>
              <span className="font-mono text-sm uppercase tracking-[1.5px] text-white">~5 SECONDS ON-CHAIN</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="caption-uppercase text-muted">TRANSACTION COST</span>
              <span className="font-mono text-sm uppercase tracking-[1.5px] text-white">NEAR-ZERO FEES</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="caption-uppercase text-muted">VERIFICATION</span>
              <span className="font-mono text-sm uppercase tracking-[1.5px] text-white">100% AUDITABLE</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-container-max mx-auto px-4 sm:px-6 lg:px-8">
        {/* Bugatti Vehicle-Spec Technical Callout Grid */}
        <section className="mb-24">
          <div className="caption-uppercase text-muted mb-8 tracking-[2px]">
            PERFORMANCE METRICS
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-surface-card border border-hairline rounded-none p-8 flex flex-col justify-between h-48">
              <div className="display-lg text-4xl sm:text-5xl font-normal text-white tracking-[3px]">
                100%
              </div>
              <div>
                <h4 className="font-mono text-xs text-white uppercase tracking-[2px] mb-1">
                  DIRECT TO MAINTAINER
                </h4>
                <p className="body-serif-sm text-muted text-sm">
                  Zero platform commission. All funds route straight to the owner wallet.
                </p>
              </div>
            </div>

            <div className="bg-surface-card border border-hairline rounded-none p-8 flex flex-col justify-between h-48">
              <div className="display-lg text-4xl sm:text-5xl font-normal text-white tracking-[3px]">
                ~5.0s
              </div>
              <div>
                <h4 className="font-mono text-xs text-white uppercase tracking-[2px] mb-1">
                  STELLAR SETTLEMENT
                </h4>
                <p className="body-serif-sm text-muted text-sm">
                  High-speed ledger consensus via Horizon RPC &amp; Soroban contracts.
                </p>
              </div>
            </div>

            <div className="bg-surface-card border border-hairline rounded-none p-8 flex flex-col justify-between h-48">
              <div className="display-lg text-4xl sm:text-5xl font-normal text-white tracking-[3px]">
                GITHUB
              </div>
              <div>
                <h4 className="font-mono text-xs text-white uppercase tracking-[2px] mb-1">
                  PROOF OF OWNERSHIP
                </h4>
                <p className="body-serif-sm text-muted text-sm">
                  Repository ownership verified via OAuth link.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bugatti Model Showcase Cards Section */}
        <section className="mb-24 space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-hairline pb-6">
            <div>
              <div className="caption-uppercase text-muted mb-2">SYSTEM ARCHITECTURE</div>
              <h2 className="display-md text-2xl sm:text-3xl text-white tracking-[2px] font-normal">
                ENGINEERED FOR OPEN SOURCE
              </h2>
            </div>
            <Link href="/explore" className="bugatti-link">
              EXPLORE ALL PROJECTS &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-surface-card border border-hairline rounded-none p-8 flex flex-col justify-between">
              <div>
                <div className="caption-uppercase text-muted mb-4">STEP 01</div>
                <h3 className="font-mono text-base text-white uppercase tracking-[2px] mb-3">
                  CONNECT WALLET
                </h3>
                <p className="body-serif-sm text-body leading-relaxed mb-6">
                  Freighter, Albedo, or any Stellar wallet — connect instantly with no account signup required.
                </p>
              </div>
              <span className="caption-uppercase text-muted">01 // IDENTIFICATION</span>
            </div>

            <div className="bg-surface-card border border-hairline rounded-none p-8 flex flex-col justify-between">
              <div>
                <div className="caption-uppercase text-muted mb-4">STEP 02</div>
                <h3 className="font-mono text-base text-white uppercase tracking-[2px] mb-3">
                  SPONSOR REPOS
                </h3>
                <p className="body-serif-sm text-body leading-relaxed mb-6">
                  Browse verified open-source projects and send XLM directly to maintainers on-chain.
                </p>
              </div>
              <span className="caption-uppercase text-muted">02 // TRANSMISSION</span>
            </div>

            <div className="bg-surface-card border border-hairline rounded-none p-8 flex flex-col justify-between">
              <div>
                <div className="caption-uppercase text-muted mb-4">STEP 03</div>
                <h3 className="font-mono text-base text-white uppercase tracking-[2px] mb-3">
                  LIST REPOSITORY
                </h3>
                <p className="body-serif-sm text-body leading-relaxed mb-6">
                  Link your GitHub account to prove repository ownership and list your project in seconds.
                </p>
              </div>
              <span className="caption-uppercase text-muted">03 // REGISTRATION</span>
            </div>
          </div>
        </section>

        {/* Pre-Footer CTA Band */}
        <section className="bg-surface-card border border-hairline rounded-none p-12 md:p-16 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="caption-uppercase text-muted">STELLAR TESTNET FACILITY</div>
            <h2 className="display-md text-2xl sm:text-4xl text-white tracking-[3px] font-normal">
              DISCOVER SPONSORCHAIN
            </h2>
            <p className="body-serif text-base md:text-lg text-body leading-relaxed">
              All transactions run transparently on the Stellar testnet. No real funds required — connect a wallet and test.
            </p>
            <div className="pt-4">
              <Link href="/explore">
                <Button size="lg">
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
