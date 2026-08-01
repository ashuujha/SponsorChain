"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-full bg-surface-container border border-outline-variant opacity-50" />
    );
  }

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const getIcon = () => {
    if (theme === "light") return "light_mode";
    if (theme === "dark") return "dark_mode";
    return "desktop_windows";
  };

  const getTitle = () => {
    if (theme === "light") return "Theme: Light (Click for Dark)";
    if (theme === "dark") return "Theme: Dark (Click for System)";
    return "Theme: System (Click for Light)";
  };

  return (
    <button
      onClick={cycleTheme}
      title={getTitle()}
      aria-label={getTitle()}
      className="p-2 rounded-full border border-outline-variant bg-surface hover:bg-surface-container text-on-surface transition-colors flex items-center justify-center"
    >
      <span className="material-symbols-outlined text-[18px]">
        {getIcon()}
      </span>
    </button>
  );
}
