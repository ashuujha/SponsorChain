import React from "react";
import { Header } from "@/components/shared/header";
import { NavigationDrawer } from "@/components/shared/drawer";
import { Footer } from "@/components/shared/footer";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
