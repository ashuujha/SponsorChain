"use client";

import Link from "next/link";
import {
  motion,
  useMotionTemplate,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { fetchOnChainProjects } from "@/lib/soroban-client";
import { useWallet } from "@/features/wallet/use-wallet";

const HERO_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_083515_290e5a10-0b95-41af-a5e2-32b6389baa4d.mp4";
const CINEMATIC_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_092455_089c54f8-3b03-4966-9df1-e9746063d0ef.mp4";
const METRICS_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_095810_ecea3dd2-fc5e-4e41-8696-4219290b6589.mp4";
const TECHNOLOGY_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_095750_32a52ce0-2005-45c9-9093-41f03fde9530.mp4";
const FOOTER_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_080203_fd7f4f85-3a86-4837-8192-85e7bfe68e75.mp4";

const RANDOM_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~|}{[]:;?><";

function randomChar() {
  return RANDOM_CHARS[Math.floor(Math.random() * RANDOM_CHARS.length)];
}

function ScrambleIn({ text, delay, triggered }: { text: string; delay: number; triggered: boolean }) {
  const [display, setDisplay] = useState("\u00a0".repeat(text.length));

  useEffect(() => {
    if (!triggered) {
      setDisplay("\u00a0".repeat(text.length));
      return;
    }

    let cursor = 0;
    let interval: ReturnType<typeof setInterval> | undefined;
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        cursor += 0.5;
        const revealed = Math.floor(cursor);
        setDisplay(
          text
            .split("")
            .map((char, index) => {
              if (char === " ") return " ";
              if (index < revealed) return char;
              if (index <= revealed + 3) return randomChar();
              return "";
            })
            .join("")
        );
        if (revealed >= text.length) {
          if (interval) clearInterval(interval);
          setDisplay(text);
        }
      }, 25);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [delay, text, triggered]);

  return <span>{display}</span>;
}

function ScrambleText({ text, isHovered, className = "" }: { text: string; isHovered: boolean; className?: string }) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (!isHovered) {
      setDisplay(text);
      return;
    }

    let frame = 0;
    const interval = setInterval(() => {
      frame += 1;
      const revealed = Math.floor(frame / 4);
      setDisplay(
        text
          .split("")
          .map((char, index) => (char === " " ? " " : index < revealed ? char : randomChar()))
          .join("")
      );
      if (revealed >= text.length) clearInterval(interval);
    }, 25);

    return () => clearInterval(interval);
  }, [isHovered, text]);

  return <span className={className}>{display}</span>;
}

function SynapseXLogo({ className = "" }: { className?: string }) {
  const quadrant =
    "M 1.5,23 L 1.5,33 C 1.5,38.5 6,43 11.5,43 L 16.5,43 C 22,43 26.5,38.5 26.5,33 Q 28,28 33,26.5 C 38.5,26.5 43,22 43,16.5 L 43,11.5 C 43,6 38.5,1.5 33,1.5 L 23,1.5 Q 12,12 1.5,23 Z";

  return (
    <svg className={className} viewBox="-50 -50 100 100" fill="none" aria-hidden="true">
      {[0, 90, 180, 270].map((rotation) => (
        <path key={rotation} d={quadrant} transform={`rotate(${rotation})`} fill="currentColor" />
      ))}
    </svg>
  );
}

function SquashHamburger({ open }: { open: boolean }) {
  return (
    <span className="synapsex-hamburger" aria-hidden="true">
      <motion.span animate={open ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }} />
      <motion.span animate={open ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }} />
      <motion.span animate={open ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }} />
    </span>
  );
}

function BackgroundVideo({ src, className = "", scrub = false }: { src: string; className?: string; scrub?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastX = useRef<number | null>(null);
  const pendingSeek = useRef<number | null>(null);
  const seeking = useRef(false);

  const seek = (time: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    const next = Math.max(0, Math.min(video.duration, time));
    if (seeking.current) {
      pendingSeek.current = next;
      return;
    }
    seeking.current = true;
    video.currentTime = next;
  };

  const handleMouseMove = (event: ReactMouseEvent<HTMLElement>) => {
    if (!scrub) return;
    if (lastX.current === null) {
      lastX.current = event.clientX;
      return;
    }
    const delta = ((event.clientX - lastX.current) / window.innerWidth) * 0.8;
    lastX.current = event.clientX;
    const video = videoRef.current;
    if (video) seek(video.currentTime + delta * video.duration);
  };

  return (
    <video
      ref={videoRef}
      className={`absolute inset-0 h-full w-full object-cover ${className}`}
      src={src}
      autoPlay={!scrub}
      muted
      loop={!scrub}
      playsInline
      preload="metadata"
      onLoadedMetadata={() => {
        if (scrub && videoRef.current) videoRef.current.currentTime = 0;
      }}
      onSeeked={() => {
        seeking.current = false;
        if (pendingSeek.current !== null) {
          const next = pendingSeek.current;
          pendingSeek.current = null;
          seek(next);
        }
      }}
      onMouseMove={handleMouseMove}
      aria-hidden="true"
    />
  );
}

function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const wallet = useWallet();

  const jumpTo = (section: number) => {
    setMenuOpen(false);
    window.scrollTo({ top: window.innerHeight * section, behavior: "smooth" });
  };

  return (
    <motion.nav
      className="fixed inset-x-0 top-0 z-50 flex h-20 items-center justify-between px-4 sm:px-6 md:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.8 }}
    >
      <div className="flex min-w-0 items-center gap-2">
        <motion.div
          className={`hidden h-12 items-center gap-3 overflow-hidden rounded-[14px] bg-white/15 px-5 backdrop-blur-md sm:flex ${menuOpen ? "md:flex" : ""}`}
          animate={{ width: menuOpen ? 0 : 143, opacity: menuOpen ? 0 : 1, paddingLeft: menuOpen ? 0 : 20, paddingRight: menuOpen ? 0 : 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
        >
          <SynapseXLogo className="h-[18px] w-[18px] shrink-0 text-white" />
          <span className="whitespace-nowrap text-[16px] font-medium tracking-tight text-white">SynapseX</span>
        </motion.div>
        <motion.div
          className="flex h-12 items-center overflow-hidden rounded-[14px] bg-white/15 backdrop-blur-md"
          animate={{ width: menuOpen ? 290 : 48 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
        >
          <motion.button
            type="button"
            className={`flex h-12 w-12 shrink-0 items-center justify-center text-white ${menuOpen ? "ml-1.5 h-9 w-9 rounded-[11px] bg-white/10 hover:bg-white/20" : "rounded-[14px]"}`}
            onClick={() => setMenuOpen((value) => !value)}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            <SquashHamburger open={menuOpen} />
          </motion.button>
          <motion.div
            className="flex items-center gap-8 whitespace-nowrap pl-5 text-[16px] font-normal text-white/85"
            initial={false}
            animate={{ opacity: menuOpen ? 1 : 0, x: menuOpen ? 0 : 15 }}
            transition={{ duration: 0.25 }}
          >
            <button type="button" onClick={() => jumpTo(1)} onMouseEnter={() => setHovered("about")} onMouseLeave={() => setHovered(null)} className="hover:text-white">
              <ScrambleText text="About" isHovered={hovered === "about"} />
            </button>
            <button type="button" onClick={() => jumpTo(2)} onMouseEnter={() => setHovered("metrics")} onMouseLeave={() => setHovered(null)} className="hover:text-white">
              <ScrambleText text="Metrics" isHovered={hovered === "metrics"} />
            </button>
          </motion.div>
        </motion.div>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden text-[10px] uppercase tracking-[0.18em] text-white/45 lg:inline">
          {wallet.isConnected ? "WALLET LINKED" : "TESTNET // READY"}
        </span>
        <Link href="/wallet">
          <motion.div
            className="flex h-12 items-center gap-2 rounded-full bg-white px-6 text-black"
            whileHover={{ scale: 1.03, backgroundColor: "#e2e2e6" }}
            whileTap={{ scale: 0.97 }}
            onMouseEnter={() => setHovered("download")}
            onMouseLeave={() => setHovered(null)}
          >
            <i className="bi bi-apple text-[15px]" aria-hidden="true" />
            <ScrambleText text="Download" isHovered={hovered === "download"} />
          </motion.div>
        </Link>
      </div>
    </motion.nav>
  );
}

const narrative =
  "A neural-AI interface built on the architecture of the human nervous system. SynapseX translates synaptic activity into computational intelligence. Every signal becomes measurable, structured, and visible. It continuously reconstructs internal state as a dynamic neural map. Biological noise is filtered into actionable cognitive patterns.";

const metrics = [
  ["2.4ms", "Synaptic Latency"],
  ["99.7%", "Signal Accuracy"],
  ["140B", "Neural Parameters"],
];

const capabilities = [
  ["Cortical Mapping", "Real-time spatial reconstruction of active neural regions."],
  ["Signal Isolation", "Separates cognitive intent from biological noise."],
  ["State Prediction", "Anticipates cognitive transitions before they occur."],
  ["Loop Feedback", "Closed-loop adjustment based on outcome correlation."],
];

function CinematicText() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const spring = useSpring(scrollYProgress, { stiffness: 15, damping: 32, mass: 1.8 });
  const y = useTransform(spring, [0, 1], [60, -120]);
  const opacity = useTransform(spring, [0.3, 0.5, 0.75], [0, 1, 0.9]);
  const transform = useMotionTemplate`rotateX(24deg) translateY(${y}px) translateZ(15px)`;

  return (
    <section ref={ref} className="relative flex h-[100dvh] min-h-screen items-center justify-center overflow-hidden bg-black">
      <BackgroundVideo src={CINEMATIC_VIDEO} />
      <div className="absolute inset-x-0 top-0 z-10 h-48 bg-gradient-to-b from-[#010103] to-transparent" />
      <motion.p style={{ transform, opacity }} className="relative z-10 max-w-5xl select-none px-6 text-center text-[22px] font-normal leading-[1.35] tracking-[-0.02em] text-white sm:px-12 sm:text-[30px] md:text-[36px] lg:text-[42px]">
        {narrative}
      </motion.p>
    </section>
  );
}

function SynapseXLanding() {
  const [entranceComplete, setEntranceComplete] = useState(false);
  const [projectCount, setProjectCount] = useState<number | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setEntranceComplete(true), 800);
    fetchOnChainProjects()
      .then((projects) => setProjectCount(projects.length))
      .catch(() => setProjectCount(null));
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="synapsex-site" style={{ fontFamily: '"Space Mono", monospace' }}>
      <Navigation />

      <section className="relative flex h-[100dvh] min-h-screen flex-col overflow-hidden bg-black px-4 pb-8 pt-20 text-white sm:px-6 sm:pb-12 sm:pt-24 md:px-8" onMouseLeave={() => undefined}>
        <BackgroundVideo src={HERO_VIDEO} scrub />
        <div className="synapsex-dots absolute inset-0 z-[1] pointer-events-none" />
        <div className="synapsex-watermark absolute left-1/2 top-1/2 z-[1] -translate-x-1/2 translate-y-[50px] whitespace-nowrap">TRANSCENDENCE</div>
        <motion.div className="relative z-10 flex flex-1 flex-col" initial={{ opacity: 0 }} animate={{ opacity: entranceComplete ? 1 : 0 }} transition={{ duration: 1 }}>
          <div className="flex-1" />
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-4">
              <h1 className="text-[clamp(40px,10vw,100px)] font-light leading-[0.95] tracking-[-0.03em] text-white">
                <ScrambleIn text="Brain" delay={200} triggered={entranceComplete} /><br />
                <ScrambleIn text="And Body" delay={500} triggered={entranceComplete} />
              </h1>
              <motion.p initial={{ y: 25, opacity: 0 }} animate={{ y: entranceComplete ? 0 : 25, opacity: entranceComplete ? 1 : 0 }} transition={{ duration: 0.9, ease: [0.215, 0.61, 0.355, 1], delay: 0.2 }} className="max-w-sm text-[13px] leading-relaxed text-white/60 sm:text-[15px]">
                Built at the intersection of neuroscience and artificial intelligence. SynapseX continuously maps neural pathways, cognitive load, and physiological states into a single adaptive intelligence layer.
              </motion.p>
              <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-white/45">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                {projectCount === null ? "CHAIN LINK // STANDBY" : `CHAIN LINK // ${projectCount} PROJECTS`}
              </div>
            </div>
            <h1 className="text-left text-[clamp(40px,10vw,100px)] font-light leading-[0.95] tracking-[-0.03em] text-white md:text-right">
              <ScrambleIn text="One" delay={700} triggered={entranceComplete} /><br />
              <ScrambleIn text="Network" delay={1000} triggered={entranceComplete} />
            </h1>
          </div>
        </motion.div>
      </section>

      <CinematicText />

      <section className="relative min-h-screen overflow-hidden bg-black px-6 py-32 text-white">
        <BackgroundVideo src={METRICS_VIDEO} />
        <div className="relative z-10 mx-auto max-w-6xl">
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 1.2 }} className="mb-20 text-center text-[13px] uppercase tracking-[0.2em] text-white/40 sm:text-[14px]">Performance Metrics</motion.p>
          <div className="grid grid-cols-1 gap-16 md:grid-cols-3 md:gap-8">
            {metrics.map(([value, label], index) => (
              <motion.div key={label} initial={{ y: 30, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.8, delay: index * 0.15 }}>
                <div className="text-[clamp(48px,10vw,96px)] font-light leading-none tracking-[-0.04em]">{value}</div>
                <div className="mt-4 text-[13px] tracking-wide text-white/40 sm:text-[15px]">{label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative flex h-[100dvh] min-h-screen flex-col overflow-hidden bg-black px-8 py-12 text-white sm:px-12 sm:py-16 md:px-16">
        <BackgroundVideo src={TECHNOLOGY_VIDEO} />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <motion.h2 initial={{ y: 40, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 1 }} className="text-[clamp(36px,8vw,72px)] font-light leading-[0.95] tracking-[-0.03em]">Adaptive<br />Intelligence</motion.h2>
          <motion.p initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 1, delay: 0.2 }} className="max-w-xs text-[13px] leading-relaxed text-white/50 sm:text-[15px] md:pt-2 md:text-right">The system learns your neural baseline within 72 hours. From there, every cognitive state is mapped, predicted, and optimized in real time.</motion.p>
        </div>
        <div className="flex-1" />
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 1, delay: 0.3 }} className="relative z-10 grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-6">
          {capabilities.map(([title, description], index) => (
            <motion.div key={title} initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: index * 0.1 }}>
              <h3 className="mb-2 text-[14px] font-normal text-white sm:text-[16px]">{title}</h3>
              <p className="text-[12px] leading-relaxed text-white/40 sm:text-[14px]">{description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="min-h-screen bg-black px-6 py-32 text-center text-white">
        <motion.div initial={{ y: 30, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 1 }} className="mx-auto max-w-3xl">
          <p className="mb-8 text-[13px] uppercase tracking-[0.2em] text-white/40 sm:text-[14px]">Architecture</p>
          <h2 className="mb-10 text-[clamp(28px,6vw,56px)] font-light leading-[1.15] tracking-[-0.02em]">Three layers. Zero friction.</h2>
          <p className="mx-auto max-w-xl text-[15px] leading-relaxed text-white/45 sm:text-[17px]">Sensor layer captures raw bioelectric signals. Processing layer isolates intent. Interface layer delivers structured output to any connected system.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 1.2, delay: 0.4 }} className="mt-20 flex flex-col items-center gap-4">
          {["Capture", "Process", "Interface"].map((name, index) => (
            <motion.div key={name} initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: index * 0.1 }} className="flex h-[72px] w-full max-w-md items-center justify-between rounded-lg border border-white/10 px-6">
              <span className="text-[12px] uppercase tracking-[0.15em] text-white/30">Layer {index + 1}</span>
              <span className="text-[16px] font-light text-white sm:text-[18px]">{name}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <footer className="flex min-h-[400px] flex-col overflow-hidden bg-black text-white md:flex-row">
        <div className="relative h-[300px] w-full md:h-auto md:w-1/2"><BackgroundVideo src={FOOTER_VIDEO} /></div>
        <div className="flex flex-1 flex-col justify-between p-10 sm:p-16">
          <div>
            <div className="mb-8 flex items-center gap-3 text-white/70"><SynapseXLogo className="h-[18px] w-[18px]" /><span className="text-[15px] font-medium tracking-tight">SynapseX</span></div>
            <p className="max-w-sm text-[14px] leading-relaxed text-white/40 sm:text-[15px]">The next evolution of human-machine interaction. Built for those who refuse to be limited by biology alone.</p>
          </div>
          <div className="mt-12 flex flex-col gap-5 text-[12px] text-white/25">
            <div>(c) 2026 SynapseX Labs. All rights reserved.</div>
            <div className="flex flex-wrap gap-4 text-white/50"><Link href="/explore" className="hover:text-white">Explore chain</Link><Link href="/list-project" className="hover:text-white">List project</Link><Link href="/wallet" className="hover:text-white">Connect wallet</Link></div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default SynapseXLanding;
