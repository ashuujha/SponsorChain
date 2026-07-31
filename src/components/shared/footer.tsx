import React from "react";

export function Footer() {
  return (
    <footer className="bg-surface-container-low border-t border-outline-variant w-full py-xl mt-auto">
      <div className="max-w-container-max mx-auto px-gutter flex flex-col md:flex-row justify-between items-center gap-md">
        <div className="text-center md:text-left">
          <div className="font-label-caps text-label-caps tracking-widest text-primary mb-xs">SPONSORCHAIN</div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">© 2026 SponsorChain. Built on Stellar.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-md">
          <a className="font-label-caps text-label-caps text-on-surface-variant hover:underline" href="#">Privacy Policy</a>
          <a className="font-label-caps text-label-caps text-on-surface-variant hover:underline" href="#">Terms of Service</a>
          <a className="font-label-caps text-label-caps text-on-surface-variant hover:underline" href="#">Github</a>
          <a className="font-label-caps text-label-caps text-on-surface-variant hover:underline" href="#">Documentation</a>
        </div>
      </div>
    </footer>
  );
}
