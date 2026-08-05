"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  const [scrollRatio, setScrollRatio] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const ratio = Math.min(Math.max(scrollY / 500, 0), 1);
      setScrollRatio(ratio);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const heroBrands = [
    { name: "Stripe", style: { fontFamily: "Georgia, serif", fontWeight: 700, letterSpacing: "-0.02em", fontSize: "15px" } },
    { name: "Coinbase", style: { fontFamily: "Arial, sans-serif", fontWeight: 900, letterSpacing: "0.08em", fontSize: "13px", textTransform: "uppercase" as const } },
    { name: "Uniswap", style: { fontFamily: "'Trebuchet MS', sans-serif", fontWeight: 600, letterSpacing: "0.01em", fontSize: "15px", fontStyle: "italic" } },
    { name: "Aave", style: { fontFamily: "'Courier New', monospace", fontWeight: 700, letterSpacing: "0.12em", fontSize: "13px", textTransform: "uppercase" as const } },
    { name: "Compound", style: { fontFamily: "Palatino, 'Book Antiqua', serif", fontWeight: 400, letterSpacing: "-0.01em", fontSize: "16px" } },
    { name: "MakerDAO", style: { fontFamily: "Impact, 'Arial Narrow', sans-serif", fontWeight: 400, letterSpacing: "0.04em", fontSize: "14px" } },
    { name: "Chainlink", style: { fontFamily: "Verdana, sans-serif", fontWeight: 700, letterSpacing: "-0.03em", fontSize: "13px" } },
  ];

  const backersBrands = [
    { name: "Fundamental Labs", style: { fontFamily: "'Times New Roman', serif", fontWeight: 400, letterSpacing: "0.02em", fontSize: "14px" } },
    { name: "KUCOIN", style: { fontFamily: "'Arial Black', sans-serif", fontWeight: 900, letterSpacing: "0.08em", fontSize: "16px" } },
    { name: "NGC", style: { fontFamily: "Impact, sans-serif", fontWeight: 700, letterSpacing: "0.05em", fontSize: "18px" } },
    { name: "NxGen", style: { fontFamily: "Georgia, serif", fontWeight: 600, letterSpacing: "-0.02em", fontSize: "17px" } },
    { name: "Matter Labs", style: { fontFamily: "Helvetica, sans-serif", fontWeight: 700, letterSpacing: "-0.01em", fontSize: "15px" } },
    { name: "DEXTools", style: { fontFamily: "Verdana, sans-serif", fontWeight: 700, letterSpacing: "0.06em", fontSize: "14px", textTransform: "uppercase" as const } },
    { name: "NGRAVE", style: { fontFamily: "'Courier New', monospace", fontWeight: 700, letterSpacing: "0.18em", fontSize: "14px" } },
    { name: "Polychain", style: { fontFamily: "Palatino, serif", fontWeight: 500, letterSpacing: "0.03em", fontSize: "15px" } },
  ];

  return (
    <div className="flex flex-col bg-[#F5F5F5] min-h-screen text-black overflow-x-hidden">
      {/* 1. HERO SECTION CONTAINER WITH DYNAMIC SCROLL BLUR ANIMATION */}
      <div className="h-screen flex flex-col overflow-hidden w-full max-w-[88rem] mx-auto px-6 pt-20 pb-6">
        <div
          className="relative w-full rounded-2xl overflow-hidden flex-1 transition-all duration-300 shadow-lg"
          style={{ height: "calc(100vh - 96px)" }}
        >
          {/* Background Video — Crisp & Clear */}
          <video
            autoPlay
            muted
            loop
            playsInline
            className="object-cover absolute inset-0 w-full h-full"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_161253_c72b1869-400f-45ed-ac0c-52f68c2ed5bd.mp4"
          />

          {/* Left Side Dynamic Blur Scroll Animation */}
          <div
            className="absolute inset-y-0 left-0 w-24 sm:w-36 md:w-48 pointer-events-none transition-all duration-200 z-10"
            style={{
              background: "linear-gradient(to right, rgba(245, 245, 245, 0.75), rgba(245, 245, 245, 0.25) 60%, transparent)",
              backdropFilter: `blur(${scrollRatio * 16}px)`,
              WebkitBackdropFilter: `blur(${scrollRatio * 16}px)`,
            }}
          />

          {/* Right Side Dynamic Blur Scroll Animation */}
          <div
            className="absolute inset-y-0 right-0 w-24 sm:w-36 md:w-48 pointer-events-none transition-all duration-200 z-10"
            style={{
              background: "linear-gradient(to left, rgba(245, 245, 245, 0.75), rgba(245, 245, 245, 0.25) 60%, transparent)",
              backdropFilter: `blur(${scrollRatio * 16}px)`,
              WebkitBackdropFilter: `blur(${scrollRatio * 16}px)`,
            }}
          />

          {/* Foreground Content Overlay */}
          <div className="relative z-10 flex flex-col items-start justify-start h-full p-8 md:p-12 pt-28 md:pt-36">
            <h1
              className="text-black text-5xl md:text-6xl font-medium leading-tight max-w-xl mb-4 whitespace-pre-line drop-shadow-xs"
              style={{ letterSpacing: "-0.04em" }}
            >
              {"Fund Open Source.\nDirectly."}
            </h1>

            <p className="text-black/80 text-base md:text-lg max-w-md mb-8 leading-relaxed font-sans">
              A decentralized open-source sponsorship platform built on Stellar. Verified GitHub maintainers receive direct, transparent XLM contributions over Soroban &amp; Horizon.
            </p>

            {/* Pill button "Start Sponsoring" with arrow circle */}
            <Link
              href="/explore"
              className="inline-flex items-center gap-3 bg-black text-white text-base md:text-lg font-medium pl-8 pr-2 py-2 rounded-full hover:bg-gray-800 transition-all duration-200 group shadow-md hover:shadow-lg active:scale-95"
            >
              <span>Start Sponsoring</span>
              <div className="bg-white rounded-full p-2 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="w-5 h-5 text-black" />
              </div>
            </Link>

            {/* Hero Brand Marquee */}
            <div className="mt-auto mb-4 w-full max-w-md overflow-hidden">
              <div className="marquee-track flex">
                {[...heroBrands, ...heroBrands].map((b, idx) => (
                  <span key={idx} className="mx-7 shrink-0 text-black/60 whitespace-nowrap" style={b.style}>
                    {b.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. INFO SECTION ("Meet SponsorChain.") */}
      <section className="bg-[#F5F5F5] px-6 py-24">
        <div className="max-w-[88rem] mx-auto">
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 items-start">
            <div>
              <h2 className="text-black text-4xl md:text-5xl font-medium leading-tight mb-8" style={{ letterSpacing: "-0.03em" }}>
                Meet SponsorChain.
              </h2>
              <Link
                href="/explore"
                className="inline-flex items-center gap-3 bg-black text-white text-base font-medium pl-7 pr-2 py-2 rounded-full hover:bg-gray-800 transition-colors duration-200 group"
              >
                <span>Explore Projects</span>
                <div className="bg-white rounded-full p-2 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                  <ArrowRight className="w-4 h-4 text-black" />
                </div>
              </Link>
            </div>

            <div>
              <p className="text-black/70 text-2xl md:text-3xl leading-relaxed font-normal">
                SponsorChain is an automated open-source sponsorship facility that lets maintainers prove GitHub ownership and receive direct XLM funding over Stellar.
              </p>
            </div>
          </div>

          {/* Row 2 — 4-col card grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1 (spans 2 cols on lg) */}
            <div
              className="lg:col-span-2 rounded-2xl overflow-hidden p-7 min-h-[320px] flex flex-col justify-between shadow-sm border border-black/5"
              style={{
                backgroundImage: `url("https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260423_164207_f243351d-ed59-48ec-83a0-a5e996bdbe3c.png&w=1280&q=85")`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <h3 className="text-black text-2xl font-medium leading-snug" style={{ letterSpacing: "-0.02em" }}>
                Empower Builders
              </h3>
              <p className="text-black/70 text-base max-w-xs leading-relaxed">
                Gain steady open-source momentum as your repositories receive direct on-chain XLM sponsorships from global backers.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-[#2B2644] rounded-2xl p-7 min-h-[320px] flex flex-col justify-between shadow-sm">
              <h3 className="text-white text-2xl font-medium leading-snug whitespace-pre-line">
                {"Direct &\nTransparent."}
              </h3>
              <p className="text-white/60 text-base leading-relaxed">
                100% of sponsored XLM routes directly to the maintainer&apos;s Stellar wallet — zero platform commissions or hidden fees.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-[#2B2644] rounded-2xl p-7 min-h-[320px] flex flex-col justify-between shadow-sm">
              <h3 className="text-white text-2xl font-medium leading-snug whitespace-pre-line">
                {"Fully\nOn-Chain."}
              </h3>
              <p className="text-white/60 text-base leading-relaxed">
                Skip manual accounting and central intermediaries. SponsorChain runs autonomously on Soroban smart contracts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BACKED BY SECTION (marquee row) */}
      <section className="bg-[#F5F5F5] px-6 py-12 border-t border-b border-black/5">
        <div className="max-w-[88rem] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 items-center">
          <div className="md:col-span-1">
            <p className="text-black/70 text-base leading-relaxed font-normal whitespace-pre-line">
              {"Supported by premier partners\nand web3 ecosystem leaders."}
            </p>
          </div>

          <div className="md:col-span-3 overflow-hidden">
            <div className="backers-track flex">
              {[...backersBrands, ...backersBrands].map((b, idx) => (
                <span key={idx} className="mx-10 shrink-0 text-black/50 whitespace-nowrap" style={b.style}>
                  {b.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. USE CASES & SPECIFICATION SECTION (Fills empty space in image 2) */}
      <section className="bg-[#F5F5F5] px-6 py-24">
        <div className="max-w-[88rem] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-stretch">
          {/* Left Column — Feature Specifications & Core Architecture (Fills the white space!) */}
          <div className="flex flex-col justify-between space-y-8 md:pr-4">
            <div>
              <span className="text-black/60 text-xs font-mono uppercase tracking-widest block mb-3">
                SPONSORCHAIN IN PRACTICE // ARCHITECTURE SPECIFICATION
              </span>
              <h2 className="text-5xl md:text-6xl font-medium leading-none mb-6" style={{ letterSpacing: "-0.04em" }}>
                Sponsor Open Source
              </h2>
              <p className="text-black/70 text-base leading-relaxed max-w-lg mb-8 font-normal">
                SponsorChain powers a wide range of modes for builders, companies, and treasuries wanting safe, transparent, and direct open-source sponsorship integrations.
              </p>

              {/* 4 Specification Feature Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-white border border-black/10 rounded-2xl p-5 shadow-xs hover:border-black/30 transition-all duration-200 hover:-translate-y-0.5 space-y-2">
                  <div className="flex items-center gap-2 text-black">
                    <span className="material-symbols-outlined text-[22px]">shield_lock</span>
                    <h4 className="font-medium text-sm">Soroban Smart Contracts</h4>
                  </div>
                  <p className="text-xs text-black/60 leading-relaxed">
                    Automated, non-custodial WASM contract execution on Stellar Testnet for transparent project registration.
                  </p>
                </div>

                <div className="bg-white border border-black/10 rounded-2xl p-5 shadow-xs hover:border-black/30 transition-all duration-200 hover:-translate-y-0.5 space-y-2">
                  <div className="flex items-center gap-2 text-black">
                    <span className="material-symbols-outlined text-[22px]">verified_user</span>
                    <h4 className="font-medium text-sm">GitHub OAuth Verification</h4>
                  </div>
                  <p className="text-xs text-black/60 leading-relaxed">
                    Cryptographic proof of repository maintainership via OAuth token verification and Soroban signatures.
                  </p>
                </div>

                <div className="bg-white border border-black/10 rounded-2xl p-5 shadow-xs hover:border-black/30 transition-all duration-200 hover:-translate-y-0.5 space-y-2">
                  <div className="flex items-center gap-2 text-black">
                    <span className="material-symbols-outlined text-[22px]">bolt</span>
                    <h4 className="font-medium text-sm">Stellar Horizon RPC</h4>
                  </div>
                  <p className="text-xs text-black/60 leading-relaxed">
                    Sub-second transaction finality &amp; real-time event streaming for instant payment verification.
                  </p>
                </div>

                <div className="bg-white border border-black/10 rounded-2xl p-5 shadow-xs hover:border-black/30 transition-all duration-200 hover:-translate-y-0.5 space-y-2">
                  <div className="flex items-center gap-2 text-black">
                    <span className="material-symbols-outlined text-[22px]">percent</span>
                    <h4 className="font-medium text-sm">Zero Platform Fees</h4>
                  </div>
                  <p className="text-xs text-black/60 leading-relaxed">
                    100% of sponsored XLM reaches the maintainer directly. Uncompromised open-source funding.
                  </p>
                </div>
              </div>
            </div>

            {/* Platform Specifications Banner at Bottom of Left Column */}
            <div className="bg-[#2B2644] text-white rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-white/60">ENGINE METRICS</span>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
                  Stellar Testnet Live
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div>
                  <span className="block text-[10px] font-mono text-white/50 uppercase tracking-wider">SETTLEMENT</span>
                  <span className="text-sm font-semibold text-white">&lt; 5s Finality</span>
                </div>
                <div className="border-x border-white/10">
                  <span className="block text-[10px] font-mono text-white/50 uppercase tracking-wider">CUSTODY</span>
                  <span className="text-sm font-semibold text-white">100% Direct</span>
                </div>
                <div>
                  <span className="block text-[10px] font-mono text-white/50 uppercase tracking-wider">SECURITY</span>
                  <span className="text-sm font-semibold text-white">Soroban WASM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column — Video Card */}
          <div className="relative rounded-3xl overflow-hidden min-h-[640px] flex items-end shadow-md">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="object-cover absolute inset-0 w-full h-full"
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_183428_ab5e672a-f608-4dcb-b319-f3e040f02e2d.mp4"
            />
            <div className="relative z-10 p-10 md:p-12 bg-gradient-to-t from-black/80 via-black/40 to-transparent w-full">
              <h3 className="text-white text-4xl md:text-5xl font-medium leading-tight mb-4" style={{ letterSpacing: "-0.03em" }}>
                Direct &amp; Transparent
              </h3>
              <p className="text-white/80 text-base max-w-md mb-8 leading-relaxed">
                Lift maintainer sustainability by offering SponsorChain, a trusted Stellar-backed sponsorship platform with verified GitHub ownership, letting patrons fund open source effortlessly.
              </p>
              <Link
                href="/explore"
                className="inline-flex items-center gap-3 text-white font-medium text-base group"
              >
                <div className="w-9 h-9 rounded-full bg-white/80 backdrop-blur flex items-center justify-center group-hover:bg-white transition-colors">
                  <ArrowRight className="w-4 h-4 text-black" />
                </div>
                <span>Explore Repositories</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
