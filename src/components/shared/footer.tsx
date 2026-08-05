import React from "react";
import Link from "next/link";
import { LogoIcon, GithubLogo } from "./logo";

export function Footer() {
  return (
    <footer className="bg-[#F5F5F5] text-black/70 w-full py-16 border-t border-black/10">
      <div className="max-w-[88rem] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-black/10">
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <LogoIcon className="w-7 h-7 text-black transition-transform group-hover:scale-105" />
              <span className="text-xl font-medium tracking-tight text-black">
                SponsorChain
              </span>
            </Link>
            <p className="text-sm text-black/70 leading-relaxed font-normal">
              Direct, transparent XLM sponsorships for GitHub open-source maintainers powered by Stellar Soroban &amp; Horizon.
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-black/80 bg-black/5 px-3 py-1.5 rounded-full border border-black/10">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Stellar Testnet Live
            </div>
          </div>

          <div>
            <h4 className="text-sm text-black font-semibold uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-3 text-sm text-black/70 font-medium">
              <li><Link href="/explore" className="hover:text-black transition-colors">Explore Projects</Link></li>
              <li><Link href="/list-project" className="hover:text-black transition-colors">List a Project</Link></li>
              <li><Link href="/activity" className="hover:text-black transition-colors">Activity Feed</Link></li>
              <li><Link href="/payments/status" className="hover:text-black transition-colors">Ledger Transactions</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm text-black font-semibold uppercase tracking-wider mb-4">Ecosystem</h4>
            <ul className="space-y-3 text-sm text-black/70 font-medium">
              <li><a href="https://stellar.org" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">Stellar Network</a></li>
              <li><a href="https://soroban.stellar.org" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">Soroban Smart Contracts</a></li>
              <li><a href="https://github.com/ashuujha/SponsorChain" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors flex items-center gap-1.5"><GithubLogo className="w-4 h-4" /> GitHub Repository</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm text-black font-semibold uppercase tracking-wider mb-4">Legal &amp; Trust</h4>
            <ul className="space-y-3 text-sm text-black/70 font-medium">
              <li><a href="#" className="hover:text-black transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-black transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-black transition-colors">Security &amp; Audit</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-black/60 font-medium">
          <p>© 2026 SponsorChain. Open source project built on Stellar.</p>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-black transition-colors">Home</Link>
            <Link href="/explore" className="hover:text-black transition-colors">Explore</Link>
            <Link href="/wallet" className="hover:text-black transition-colors">Wallet</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

