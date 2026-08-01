"use client";

import React from "react";

function getInitials(name: string): string {
  if (!name) return "PR";
  const parts = name.trim().split(/[\s-_]+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const COLOR_PALETTES = [
  { bg: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20" },
  { bg: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-500/20" },
  { bg: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20" },
  { bg: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border-rose-500/20" },
  { bg: "bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 border-sky-500/20" },
  { bg: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border-purple-500/20" },
  { bg: "bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 border-teal-500/20" },
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

interface ProjectAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ProjectAvatar({ name, size = "md", className = "" }: ProjectAvatarProps) {
  const initials = getInitials(name);
  const paletteIndex = hashString(name) % COLOR_PALETTES.length;
  const palette = COLOR_PALETTES[paletteIndex];

  const sizeClasses = {
    sm: "w-8 h-8 text-[12px]",
    md: "w-10 h-10 text-[14px]",
    lg: "w-14 h-14 text-[18px]",
  }[size];

  return (
    <div
      className={`rounded-xl border flex items-center justify-center font-bold tracking-wider shrink-0 transition-colors ${palette.bg} ${sizeClasses} ${className}`}
    >
      {initials}
    </div>
  );
}
