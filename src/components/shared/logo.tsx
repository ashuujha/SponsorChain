"use client";

import React from "react";

export function BrandLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} text-primary fill-current transition-colors`}
    >
      {/* Concept 1: Precision Interlocking Bridge / P2P Connection Mark */}
      <path
        d="M4 12C4 8.13401 7.13401 5 11 5H13C16.866 5 20 8.13401 20 12C20 13.1046 19.1046 14 18 14C16.8954 14 16 13.1046 16 12C16 10.3431 14.6569 9 13 9H11C9.34315 9 8 10.3431 8 12C8 13.6569 9.34315 15 11 15H13C13.5523 15 14 15.4477 14 16C14 16.5523 13.5523 17 13 17H11C8.23858 17 6 14.7614 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12Z"
        fill="currentColor"
      />
      <circle cx="5" cy="12" r="2.5" fill="currentColor" />
      <circle cx="19" cy="12" r="2.5" fill="currentColor" />
      <path
        d="M9 16C9 15.4477 9.44772 15 10 15H14C14.5523 15 15 15.4477 15 16C15 17.6569 13.6569 19 12 19C10.3431 19 9 17.6569 9 16Z"
        fill="currentColor"
        opacity="0.8"
      />
    </svg>
  );
}
