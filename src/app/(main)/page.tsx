import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const featuredProjects = [
    {
      id: "stellar-horizon-js",
      tag: "TOOLING",
      title: "stellar-horizon-js",
      description: "JavaScript client library for communicating with a Horizon server.",
      goal: "5,000",
      progress: 65,
    },
    {
      id: "soroban-utils",
      tag: "SMART CONTRACTS",
      title: "soroban-utils",
      description: "Essential utilities for Soroban smart contract development.",
      goal: "2,500",
      progress: 42,
    },
    {
      id: "stellar-explorer",
      tag: "ECOSYSTEM",
      title: "stellar-explorer",
      description: "A lightweight, lightning-fast blockchain explorer for the Stellar testnet.",
      goal: "10,000",
      progress: 12,
    },
  ];

  return (
    <div className="pb-xl px-gutter max-w-container-max mx-auto overflow-x-hidden pt-8">
      {/* Hero Section */}
      <section className="mb-xl text-center max-w-3xl mx-auto flex flex-col items-center">
        <h2 className="font-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-headline-lg-mobile mb-md text-primary font-bold">
          Fund the open source you depend on. Directly. Transparently.
        </h2>
        <p className="font-body-lg text-body-lg text-secondary mb-lg max-w-xl text-center">
          Secure, instant XLM contributions directly from your wallet to maintainers. Built on the Stellar network for maximum trust and minimum friction.
        </p>
        <div className="flex flex-col sm:flex-row gap-sm mb-lg justify-center w-full">
          <Link href="/explore" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              Browse Projects
            </Button>
          </Link>
          <Link href="/projects/create" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              Become a Maintainer
            </Button>
          </Link>
        </div>
        {/* Trust Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-md border-t border-outline-variant pt-lg">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary text-[18px]">bolt</span>
            <span className="font-label-caps text-label-caps text-secondary">Settles in ~5 sec</span>
          </div>
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary text-[18px]">savings</span>
            <span className="font-label-caps text-label-caps text-secondary">Near-zero fees</span>
          </div>
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
            <span className="font-label-caps text-label-caps text-secondary">100% on-chain verifiable</span>
          </div>
        </div>
      </section>

      {/* Sponsorship Receipt (Bento Card Layout) */}
      <section className="mb-xl">
        <div className="bg-white border border-outline-variant rounded-xl p-lg shadow-[0px_4px_12px_rgba(0,0,0,0.03)] relative overflow-hidden max-w-md">
          <div className="flex justify-between items-start mb-lg">
            <div>
              <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-xs">Transaction Receipt</h3>
              <p className="font-headline-md text-headline-md text-primary font-bold">Sponsorship Complete</p>
            </div>
            <span className="material-symbols-outlined text-primary opacity-20 text-[48px]">receipt_long</span>
          </div>
          <div className="space-y-md">
            <div className="flex justify-between items-center">
              <span className="font-body-sm text-body-sm text-secondary">Project</span>
              <span className="font-body-sm text-body-sm font-semibold text-primary">Stellar SDK</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-body-sm text-body-sm text-secondary">Amount</span>
              <span className="font-body-sm text-body-sm font-bold text-primary">500 XLM</span>
            </div>
            <div className="receipt-dotted-line my-md"></div>
            <div className="flex justify-between items-center">
              <span className="font-body-sm text-body-sm text-secondary">Tx Hash</span>
              <div className="bg-surface-container-low px-sm py-[2px] rounded-full flex items-center gap-xs">
                <span className="font-mono-code text-mono-code text-secondary">GABC...4F2K</span>
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-body-sm text-body-sm text-secondary">Status</span>
              <div className="flex items-center gap-xs text-[#1B5E20] bg-[#E8F5E9] px-sm py-[2px] rounded-full">
                <div className="w-[6px] h-[6px] rounded-full bg-[#1B5E20]"></div>
                <span className="font-label-caps text-[10px] font-bold">VERIFIED ON-CHAIN</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mb-xl">
        <h3 className="font-headline-md text-headline-md text-primary mb-lg font-bold">How it works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <div className="bg-white border border-outline-variant rounded-xl p-md flex gap-md items-start">
            <div className="bg-surface-container rounded-lg p-sm flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
            </div>
            <div>
              <h4 className="font-body-lg text-body-lg font-bold text-primary">1. Connect Wallet</h4>
              <p className="font-body-sm text-body-sm text-secondary">Link your Albedo or Freighter wallet securely.</p>
            </div>
          </div>
          <div className="bg-white border border-outline-variant rounded-xl p-md flex gap-md items-start">
            <div className="bg-surface-container rounded-lg p-sm flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">search</span>
            </div>
            <div>
              <h4 className="font-body-lg text-body-lg font-bold text-primary">2. Choose a Project</h4>
              <p className="font-body-sm text-body-sm text-secondary">Find verified repositories that need support.</p>
            </div>
          </div>
          <div className="bg-white border border-outline-variant rounded-xl p-md flex gap-md items-start">
            <div className="bg-surface-container rounded-lg p-sm flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">send</span>
            </div>
            <div>
              <h4 className="font-body-lg text-body-lg font-bold text-primary">3. Send XLM</h4>
              <p className="font-body-sm text-body-sm text-secondary">Direct contribution with near-zero network fees.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="mb-xl">
        <div className="flex justify-between items-end mb-lg">
          <h3 className="font-headline-md text-headline-md text-primary font-bold">Featured Projects</h3>
          <Link href="/explore" className="font-label-caps text-label-caps text-secondary hover:text-primary transition-colors">
            See all
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          {featuredProjects.map((project) => (
            <div key={project.id} className="bg-white border border-outline-variant rounded-xl overflow-hidden flex flex-col justify-between">
              <div className="h-32 relative bg-surface-container-high flex items-center justify-center p-md">
                <span className="font-mono text-xl font-bold opacity-30 tracking-wider text-neutral-500 uppercase">{project.tag}</span>
              </div>
              <div className="p-md flex-grow flex flex-col justify-between">
                <div>
                  <h4 className="font-body-lg text-body-lg font-bold text-primary mb-xs">{project.title}</h4>
                  <p className="font-body-sm text-body-sm text-secondary line-clamp-2 mb-md">{project.description}</p>
                </div>
                <div>
                  <div className="mb-md">
                    <div className="flex justify-between mb-xs">
                      <span className="font-label-caps text-[10px] text-secondary">GOAL: {project.goal} XLM</span>
                      <span className="font-label-caps text-[10px] text-primary">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-surface-container-low h-1 rounded-full overflow-hidden">
                      <div className="bg-primary h-full" style={{ width: `${project.progress}%` }}></div>
                    </div>
                  </div>
                  <Link href={`/projects/${project.id}`} className="flex items-center gap-xs text-primary font-label-caps text-label-caps hover:gap-sm transition-all">
                    View project <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
