"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/lib/ui-store";
import { BrandLogo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

export function NavigationDrawer() {
  const isDrawerOpen = useUIStore((state) => state.isDrawerOpen);
  const toggleDrawer = useUIStore((state) => state.toggleDrawer);
  const pathname = usePathname();

  const menuItems = [
    { label: "Home", href: "/", icon: "home" },
    { label: "Explore", href: "/explore", icon: "travel_explore" },
    { label: "My Activity", href: "/activity", icon: "monitoring" },
    { label: "List a Project", href: "/list-project", icon: "add_circle" },
    { label: "Wallet", href: "/wallet", icon: "account_balance_wallet" },
  ];

  return (
    <>
      {/* Overlay */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 transition-opacity duration-300 backdrop-blur-xs"
          onClick={toggleDrawer}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 z-50 bg-surface dark:bg-neutral-900 border-r border-outline-variant dark:border-neutral-800 transition-transform duration-300 ease-in-out flex flex-col p-md gap-sm ${
          isDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between mb-lg pt-sm">
          <div className="flex items-center gap-2">
            <BrandLogo className="w-6 h-6 text-primary dark:text-neutral-100" />
            <span className="font-headline-md text-headline-md font-bold text-primary dark:text-neutral-100">
              SponsorChain
            </span>
          </div>
          <button
            className="p-xs hover:bg-surface-container dark:hover:bg-neutral-800 rounded-full text-secondary dark:text-neutral-300"
            onClick={toggleDrawer}
            aria-label="Close menu"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex flex-col gap-xs flex-grow">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={toggleDrawer}
                className={`flex items-center gap-md px-md py-3 rounded-xl font-semibold text-body-sm transition-colors ${
                  isActive
                    ? "bg-primary dark:bg-neutral-100 text-on-primary dark:text-neutral-900 shadow-xs"
                    : "text-secondary dark:text-neutral-400 hover:bg-surface-container dark:hover:bg-neutral-800 hover:text-primary dark:hover:text-neutral-100"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-md border-t border-outline-variant dark:border-neutral-800 flex items-center justify-between text-secondary dark:text-neutral-400 text-body-sm">
          <span>Appearance</span>
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}
