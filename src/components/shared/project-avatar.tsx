import React from "react";

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

  const sizeClasses = {
    sm: "w-8 h-8 text-sm font-serif border border-hairline",
    md: "w-10 h-10 text-base font-serif border border-hairline",
    lg: "w-14 h-14 text-xl font-serif border border-hairline-strong",
    xl: "w-20 h-20 text-3xl font-serif border border-hairline-strong",
  }[size];

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 bg-surface-card text-white rounded-none ${sizeClasses} ${className}`}
    >
      {initial}
    </div>
  );
}
