"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/shared/header";
import { NavigationDrawer } from "@/components/shared/drawer";
import { Footer } from "@/components/shared/footer";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  if (pathname === "/") {
    return <main className="flex min-h-screen flex-col bg-black">{children}</main>;
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-background text-foreground transition-colors">
      <Header />
      <NavigationDrawer />
      <main className="flex-grow flex flex-col pt-16">
        {children}
      </main>
      <Footer />
    </div>
  );
}
