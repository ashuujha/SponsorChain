import React from "react";
import Link from "next/link";
import { BrandLogo } from "./logo";

export function Footer() {
  return (
    <footer className="bg-black text-muted w-full py-16 mt-auto border-t border-hairline">
      <div className="max-w-container-max mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-hairline">
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <BrandLogo className="w-7 h-7" />
              <span className="font-mono text-sm tracking-[6px] text-white uppercase">
                SPONSORCHAIN
              </span>
            </Link>
            <p className="font-serif text-sm text-muted leading-relaxed">
              Direct, transparent XLM sponsorships for GitHub open-source maintainers powered by Stellar.
            </p>
            <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[2px] text-muted border border-hairline px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Stellar Testnet Live
            </div>
          </div>

          <div>
            <h4 className="font-mono text-xs text-white uppercase tracking-[2px] mb-4 font-normal">Platform</h4>
            <ul className="space-y-2.5 font-serif text-sm text-muted">
              <li><Link href="/explore" className="hover:text-white transition-colors">Explore Projects</Link></li>
              <li><Link href="/list-project" className="hover:text-white transition-colors">List a Project</Link></li>
              <li><Link href="/activity" className="hover:text-white transition-colors">Activity Feed</Link></li>
              <li><Link href="/wallet" className="hover:text-white transition-colors">Wallet Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-xs text-white uppercase tracking-[2px] mb-4 font-normal">Network</h4>
            <ul className="space-y-2.5 font-serif text-sm text-muted">
              <li><a href="https://stellar.org" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Stellar Network</a></li>
              <li><a href="https://github.com/ashuujha/SponsorChain" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub Repository</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Developer API</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-xs text-white uppercase tracking-[2px] mb-4 font-normal">Legal</h4>
            <ul className="space-y-2.5 font-serif text-sm text-muted">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Compliance</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Maintainers</a></li>
            </ul>
          </div>
        </div>

        {/* Centered Wordmark & Copyright Bottom Row */}
        <div className="pt-12 flex flex-col items-center text-center space-y-6">
          <div className="font-mono text-xs tracking-[6px] text-white uppercase">
            S P O N S O R C H A I N
          </div>
          <p className="font-serif text-xs text-muted-soft">
            © 2026 SponsorChain. Inspired by Bugatti Design Language. Built on Stellar.
          </p>
        </div>
      </div>
    </footer>
  );
}
