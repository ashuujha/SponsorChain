import React from "react";

export function BrandLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Bugatti Macaron Oval Badge */}
      <ellipse cx="18" cy="18" rx="17" ry="13" fill="#000000" stroke="#ffffff" strokeWidth="1.5" />
      {/* EB / P2P Interlocking Monogram */}
      <path
        d="M12 13H21C23 13 24 14 24 15.5C24 17 22.5 18 20.5 18M12 18H22C24 18 25 19 25 20.5C25 22 23.5 23 21.5 23H12"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinecap="square"
      />
      <line x1="12" y1="13" x2="12" y2="23" stroke="#ffffff" strokeWidth="1.5" />
    </svg>
  );
}
