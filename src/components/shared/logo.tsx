import React from "react";

export function BrandLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="36" height="36" rx="10" className="fill-aubergine dark:fill-aubergine-press" />
      {/* Slacc-inspired P2P Bridge Icon */}
      <path
        d="M10 18C10 13.5817 13.5817 10 18 10C22.4183 10 26 13.5817 26 18"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="11" cy="24" r="3" fill="white" />
      <circle cx="25" cy="24" r="3" fill="white" />
      <path
        d="M11 24H25"
        stroke="white"
        strokeWidth="2.5"
        strokeDasharray="2 2"
      />
    </svg>
  );
}
