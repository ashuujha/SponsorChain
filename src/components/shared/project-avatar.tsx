import React from "react";

const SLACC_PALETTES = [
  { bg: "bg-[#4a154b]", text: "text-white" },       // Slacc Aubergine
  { bg: "bg-[#f9f0ff] dark:bg-[#34193c]", text: "text-[#4a154b] dark:text-[#fcf8fd]" }, // Lavender
  { bg: "bg-[#f4ede4] dark:bg-[#28142e]", text: "text-[#1d1d1d] dark:text-[#fcf8fd]" }, // Cream
  { bg: "bg-[#007a5a]", text: "text-white" },       // Emerald
  { bg: "bg-[#1264a3]", text: "text-white" },       // Slacc Link Blue
  { bg: "bg-[#481a54]", text: "text-white" },       // Deep Aubergine
];

export function ProjectAvatar({
  name,
  size = "md",
  className = "",
}: {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const initial = name ? name.charAt(0).toUpperCase() : "P";
  
  // Pick deterministic palette from name string
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const paletteIndex = Math.abs(hash) % SLACC_PALETTES.length;
  const palette = SLACC_PALETTES[paletteIndex];

  const sizeClasses = {
    sm: "w-8 h-8 text-xs font-bold rounded-lg",
    md: "w-10 h-10 text-sm font-bold rounded-xl",
    lg: "w-14 h-14 text-lg font-bold rounded-2xl",
    xl: "w-20 h-20 text-2xl font-extrabold rounded-2xl",
  }[size];

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 shadow-xs border border-border-color/40 ${palette.bg} ${palette.text} ${sizeClasses} ${className}`}
    >
      {initial}
    </div>
  );
}
