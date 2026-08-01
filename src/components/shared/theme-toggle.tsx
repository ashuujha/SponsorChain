"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";

function SunIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function MonitorIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="14" x="2" y="3" rx="1" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = mounted ? theme : "system";

  return (
    <div className="flex items-center bg-surface border border-hairline p-0.5 rounded-full shadow-xs">
      <button
        type="button"
        onClick={() => setTheme("light")}
        title="Light Theme"
        aria-label="Switch to Light Theme"
        className={`w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all duration-200 ${
          activeTheme === "light"
            ? "bg-foreground text-background shadow-xs scale-105"
            : "text-muted hover:text-foreground"
        }`}
      >
        <SunIcon className="w-3 h-3 sm:w-4 sm:h-4" />
      </button>

      <button
        type="button"
        onClick={() => setTheme("dark")}
        title="Dark Theme"
        aria-label="Switch to Dark Theme"
        className={`w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all duration-200 ${
          activeTheme === "dark"
            ? "bg-foreground text-background shadow-xs scale-105"
            : "text-muted hover:text-foreground"
        }`}
      >
        <MoonIcon className="w-3 h-3 sm:w-4 sm:h-4" />
      </button>

      <button
        type="button"
        onClick={() => setTheme("system")}
        title="System Theme"
        aria-label="Switch to System Theme"
        className={`w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all duration-200 ${
          activeTheme === "system"
            ? "bg-foreground text-background shadow-xs scale-105"
            : "text-muted hover:text-foreground"
        }`}
      >
        <MonitorIcon className="w-3 h-3 sm:w-4 sm:h-4" />
      </button>
    </div>
  );
}
