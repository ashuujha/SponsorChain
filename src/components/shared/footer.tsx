import React from "react";
import Link from "next/link";
import { BrandLogo } from "./logo";

export function Footer() {
  return (
    <footer className="bg-aubergine text-white w-full py-12 mt-auto border-t border-aubergine-deep">
      <div className="max-w-container-max mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-aubergine-tint/40">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <BrandLogo className="w-8 h-8" />
              <span className="font-bold text-xl text-white tracking-tight">
                SponsorChain
              </span>
            </Link>
            <p className="text-aubergine-mute text-sm leading-relaxed mb-4">
              Direct, transparent XLM sponsorships for GitHub open-source maintainers powered by Stellar.
            </p>
            <div className="inline-flex items-center gap-2 bg-aubergine-deep px-3 py-1.5 rounded-full text-xs font-bold text-aubergine-mute">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Stellar Testnet Live
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm text-aubergine-mute">
              <li><Link href="/explore" className="hover:text-white transition-colors">Explore Projects</Link></li>
              <li><Link href="/list-project" className="hover:text-white transition-colors">List a Project</Link></li>
              <li><Link href="/activity" className="hover:text-white transition-colors">Activity Feed</Link></li>
              <li><Link href="/wallet" className="hover:text-white transition-colors">Wallet Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-4">Resources</h4>
            <ul className="space-y-2.5 text-sm text-aubergine-mute">
              <li><a href="https://stellar.org" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Stellar Network</a></li>
              <li><a href="https://github.com/ashuujha/SponsorChain" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub Repository</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Developer API</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-4">Community</h4>
            <ul className="space-y-2.5 text-sm text-aubergine-mute">
              <li><a href="#" className="hover:text-white transition-colors">Discord Community</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Twitter / X</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-aubergine-mute gap-4">
          <p>© 2026 SponsorChain. Inspired by Slacc Design Language. Built on Stellar.</p>
          <p className="flex items-center gap-1">
            <span>Powered by</span>
            <strong className="text-white">Stellar Soroban & Horizon</strong>
          </p>
        </div>
      </div>
    </footer>
  );
}
