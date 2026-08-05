import React from "react";
import Link from "next/link";
import { GithubLogo } from "./logo";

export function Footer() {
  return (
    <footer className="bg-background text-muted w-full py-16 mt-auto border-t border-hairline">
      <div className="max-w-container-max mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-hairline">
          <div className="md:col-span-1 space-y-4">
            <a
              href="https://github.com/ashuujha/SponsorChain"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 group"
            >
              <GithubLogo className="w-6 h-6 text-foreground" />
              <span className="font-mono text-sm tracking-[6px] text-foreground uppercase">
                SPONSORCHAIN
              </span>
            </a>
            <p className="font-serif text-sm text-muted leading-relaxed">
              Direct, transparent XLM sponsorships for GitHub open-source maintainers powered by Stellar.
            </p>
            <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[2px] text-muted border border-hairline px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground animate-pulse" />
              Stellar Mainnet Live
            </div>
          </div>

          <div>
            <h4 className="font-mono text-xs text-foreground uppercase tracking-[2px] mb-4 font-normal">Platform</h4>
            <ul className="space-y-2.5 font-serif text-sm text-muted">
              <li><Link href="/explore" className="hover:text-foreground transition-colors">Explore Projects</Link></li>
              <li><Link href="/list-project" className="hover:text-foreground transition-colors">List a Project</Link></li>
              <li><Link href="/activity" className="hover:text-foreground transition-colors">Activity Feed</Link></li>
              <li><Link href="/wallet" className="hover:text-foreground transition-colors">Wallet Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-xs text-foreground uppercase tracking-[2px] mb-4 font-normal">Network</h4>
            <ul className="space-y-2.5 font-serif text-sm text-muted">
              <li><a href="https://stellar.org" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Stellar Network</a></li>
              <li><a href="https://github.com/ashuujha/SponsorChain" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub Repository</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Developer API</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-xs text-foreground uppercase tracking-[2px] mb-4 font-normal">Legal</h4>
            <ul className="space-y-2.5 font-serif text-sm text-muted">
              <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Compliance</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Contact Maintainers</a></li>
            </ul>
          </div>
        </div>

        {/* Centered Wordmark & Copyright Bottom Row */}
        <div className="pt-12 flex flex-col items-center text-center space-y-6">
          <a
            href="https://github.com/ashuujha/SponsorChain"
            target="_blank"
            rel="noreferrer"
            className="font-mono text-xs tracking-[6px] text-foreground uppercase hover:opacity-80 transition-opacity"
          >
            S P O N S O R C H A I N
          </a>
          <p className="font-serif text-xs text-muted">
            © 2026 SponsorChain. Open source project built on Stellar.
          </p>
        </div>
      </div>
    </footer>
  );
}
