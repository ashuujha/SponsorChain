"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/lib/ui-store";

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
          className="fixed inset-0 bg-black/20 z-50 transition-opacity duration-300"
          onClick={toggleDrawer}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 z-50 bg-surface-container-lowest border-r border-outline-variant transition-transform duration-300 ease-in-out flex flex-col p-md gap-sm ${
          isDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between mb-lg">
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-primary">hub</span>
            <span className="font-headline-md text-headline-md font-bold text-primary">SponsorChain</span>
          </div>
          <button className="p-xs hover:bg-surface-container rounded-full" onClick={toggleDrawer} aria-label="Close menu">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <nav className="flex flex-col gap-xs">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={toggleDrawer}
                className={`flex items-center gap-md p-md rounded-lg font-body-lg text-body-lg transition-colors ${
                  isActive
                    ? "bg-secondary-container text-on-secondary-container"
                    : "text-secondary hover:bg-surface-container-high"
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
