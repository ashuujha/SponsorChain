"use client";

import React from "react";
import Link from "next/link";
import { RequireWallet } from "@/features/wallet-session";
import { ProjectAvatar } from "@/components/shared/project-avatar";
import { REGISTRY_CONTRACT_ID } from "@/features/projects/contract-data";
import { ArrowLeft } from "lucide-react";

export default function DemoPage() {
  const project = {
    id: BigInt(1),
    name: "Stellar SDK Core",
    description:
      "A high-performance TypeScript client library for building decentralized applications on Stellar and Soroban smart contract platform.",
    repoFullName: "stellar/js-stellar-sdk",
    owner: "GA5W2X52V8V3B7P73L3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z",
    totalRaised: "1250.0",
    sponsorCount: 18,
    active: true,
  };

  return (
    <RequireWallet>
      <div className="w-full pb-24 px-6 max-w-[88rem] mx-auto pt-28 bg-[#F5F5F5] min-h-screen text-black transition-colors overflow-x-hidden space-y-12">
        {/* Header */}
        <div className="border-b border-black/10 pb-8 flex justify-between items-start">
          <div>
            <span className="text-black/60 text-xs font-mono uppercase tracking-widest block mb-2">
              Stellar Testnet // Component Preview
            </span>
            <h1 className="text-4xl md:text-5xl font-medium text-black tracking-tight">
              Halo System Demo
            </h1>
            <p className="text-black/70 text-base mt-2">
              Interactive preview of redesigned SponsorChain components under the Halo UI system.
            </p>
          </div>

          <Link href="/explore" className="inline-flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-full hover:bg-gray-800 transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            <span>Explore</span>
          </Link>
        </div>

        {/* Demo Project Component Card */}
        <div className="bg-white border border-black/10 rounded-2xl p-8 space-y-6 shadow-xs">
          <div className="flex items-center gap-4">
            <ProjectAvatar name={project.name} size="lg" />
            <div>
              <h2 className="text-2xl font-medium text-black tracking-tight">{project.name}</h2>
              <p className="text-xs font-mono text-black/50">REPO: {project.repoFullName}</p>
            </div>
          </div>

          <p className="text-black/70 text-base leading-relaxed max-w-2xl">{project.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-black/5">
            <div className="bg-[#F5F5F5] rounded-xl p-5 space-y-1">
              <span className="text-xs font-mono uppercase tracking-wider text-black/50">TOTAL RAISED</span>
              <span className="text-3xl font-medium text-black tracking-tight">{project.totalRaised} XLM</span>
            </div>

            <div className="bg-[#2B2644] text-white rounded-xl p-5 space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-white/60">CONTRACT STATS</span>
              <div className="text-xs font-mono space-y-1">
                <div className="flex justify-between border-b border-white/10 pb-1">
                  <span className="text-white/50">Registry ID</span>
                  <span className="text-white font-semibold">{REGISTRY_CONTRACT_ID.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Network</span>
                  <span className="text-white font-semibold">Stellar Testnet</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Checklist */}
        <div className="bg-white border border-black/10 rounded-2xl p-8 shadow-xs space-y-6">
          <h3 className="text-2xl font-medium text-black tracking-tight">Redesign System Checklist</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 bg-[#F5F5F5] rounded-xl space-y-1">
              <div className="text-emerald-700 font-bold">✓ Palette &amp; Surfaces</div>
              <p className="text-black/70">Canvas background `#F5F5F5`, rounded-2xl card containers, dark `#2B2644` callout panels.</p>
            </div>

            <div className="p-4 bg-[#F5F5F5] rounded-xl space-y-1">
              <div className="text-emerald-700 font-bold">✓ Typography</div>
              <p className="text-black/70">TT Norms Pro display styling, font-medium headlines with negative letter-spacing.</p>
            </div>

            <div className="p-4 bg-[#F5F5F5] rounded-xl space-y-1">
              <div className="text-emerald-700 font-bold">✓ Navigation &amp; Shared Elements</div>
              <p className="text-black/70">Transparent hero header, LogoIcon mark, rounded pill buttons with arrow icons, dark footer.</p>
            </div>

            <div className="p-4 bg-[#F5F5F5] rounded-xl space-y-1">
              <div className="text-emerald-700 font-bold">✓ Stellar &amp; GitHub Integrations</div>
              <p className="text-black/70">Soroban contract queries, Stellar Wallets Kit, NextAuth GitHub OAuth, and Horizon API functional.</p>
            </div>
          </div>
        </div>
      </div>
    </RequireWallet>
  );
}
