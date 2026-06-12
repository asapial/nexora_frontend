"use client";

import { useEffect, useRef, useState } from "react";
import {
  RiSparklingFill,
  RiArrowRightLine,
  RiPlayCircleLine,
  RiGroupLine,
  RiBookOpenLine,
  RiLineChartLine,
  RiShieldCheckLine,
  RiGraduationCapLine,
  RiBrainLine,
  RiLineChartFill,
  RiArticleLine,
  RiUserStarLine,
} from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import SectionContainer from "@/utils/SectionContainer";

interface FeaturedTeacher {
  id: string;
  name: string;
  image: string;
  teacherProfile: {
    designation: string;
    department: string;
    specialization: string;
  };
}

// ─── Types ────────────────────────────────────────────────
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

interface FloatingCard {
  id: number;
  icon: React.ReactNode;
  label: string;
  value: string;
  delay: number;
  position: string;
}

// ─── Neural Network Canvas ────────────────────────────────
function NeuralCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initParticles();
    };

    const initParticles = () => {
      const count = Math.floor((canvas.width * canvas.height) / 12000);
      particlesRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.8 + 0.6,
        opacity: Math.random() * 0.5 + 0.2,
      }));
    };

    const isDark = () =>
      document.documentElement.classList.contains("dark");

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const dark = isDark();
      const nodeColor = dark ? "rgba(20,184,166," : "rgba(13,148,136,";
      const lineColor = dark ? "rgba(20,184,166," : "rgba(13,148,136,";

      particlesRef.current.forEach((p, i) => {
        // Move
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Mouse attraction
        const dx = mouseRef.current.x - p.x;
        const dy = mouseRef.current.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          p.vx += (dx / dist) * 0.008;
          p.vy += (dy / dist) * 0.008;
          const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          if (speed > 1.5) {
            p.vx = (p.vx / speed) * 1.5;
            p.vy = (p.vy / speed) * 1.5;
          }
        }

        // Draw node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${nodeColor}${p.opacity})`;
        ctx.fill();

        // Draw connections
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const p2 = particlesRef.current[j];
          const dx2 = p.x - p2.x;
          const dy2 = p.y - p2.y;
          const d = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (d < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            const alpha = (1 - d / 130) * 0.18;
            ctx.strokeStyle = `${lineColor}${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      });

      animRef.current = requestAnimationFrame(draw);
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    resize();
    draw();
    canvas.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-60 dark:opacity-100"
    />
  );
}

// ─── Animated Orb ─────────────────────────────────────────
function Orb({
  className,
  size = 400,
  delay = 0,
}: {
  className?: string;
  size?: number;
  delay?: number;
}) {
  return (
    <div
      className={cn("absolute rounded-full blur-3xl pointer-events-none", className)}
      style={{
        width: size,
        height: size,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

// ─── Floating Stat Card ───────────────────────────────────
function FloatingCard({ card }: { card: FloatingCard; }) {
  return (
    <div
      className={cn(
        "absolute z-10 flex items-center gap-2.5 px-3.5 py-2.5",
        "rounded-xl border",
        "bg-white/80 dark:bg-zinc-900/80",
        "border-zinc-200/80 dark:border-zinc-700/60",
        "backdrop-blur-md shadow-lg dark:shadow-teal-950/20",
        "animate-float",
        card.position
      )}
      style={{ animationDelay: `${card.delay}s` }}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 text-base">
        {card.icon}
      </div>
      <div>
        <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 leading-none mb-0.5">
          {card.label}
        </p>
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 leading-none">
          {card.value}
        </p>
      </div>
    </div>
  );
}

// ─── Kinetic Headline Word ────────────────────────────────
function KineticWord({
  words,
  className,
}: {
  words: string[];
  className?: string;
}) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % words.length);
        setVisible(true);
      }, 350);
    }, 2800);
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <span
      className={cn(
        "inline-block transition-all duration-300",
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2",
        className
      )}
    >
      {words[idx]}
    </span>
  );
}

// ─── Grid Lines Background ────────────────────────────────
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Vertical lines */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`v-${i}`}
          className="absolute top-0 bottom-0 w-px bg-zinc-200/50 dark:bg-zinc-800/50"
          style={{ left: `${(i + 1) * 12.5}%` }}
        />
      ))}
      {/* Horizontal lines */}
      {[...Array(5)].map((_, i) => (
        <div
          key={`h-${i}`}
          className="absolute left-0 right-0 h-px bg-zinc-200/50 dark:bg-zinc-800/50"
          style={{ top: `${(i + 1) * 16.66}%` }}
        />
      ))}
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────
const STATS = [
  { label: "Active Clusters", value: "12,400+", icon: <RiGroupLine /> },
  { label: "Resources Shared", value: "89,000+", icon: <RiBookOpenLine /> },
  { label: "Sessions Held", value: "340,000+", icon: <RiLineChartLine /> },
  { label: "Certificates Issued", value: "28,000+", icon: <RiGraduationCapLine /> },
];

// ─── Floating Cards Data ──────────────────────────────────
const FLOATING_CARDS: FloatingCard[] = [
  {
    id: 1,
    icon: <RiShieldCheckLine />,
    label: "Task Reviewed",
    value: "Excellent ✦",
    delay: 0,
    position: "top-[18%] left-[4%] lg:left-[2%]",
  },
  {
    id: 2,
    icon: <RiGraduationCapLine />,
    label: "New Certificate",
    value: "ML Foundations",
    delay: 0.6,
    position: "top-[15%] right-[4%] lg:right-[45%]",
  },
  {
    id: 3,
    icon: <RiGroupLine />,
    label: "Cluster Health",
    value: "94 — Healthy",
    delay: 1.2,
    position: "bottom-[28%] left-[4%] lg:left-[3%]",
  },
];

// ─── HERO SECTION (main export) ───────────────────────────
export default function HeroSection2() {
  const [loaded, setLoaded] = useState(false);
  const [teachers, setTeachers] = useState<FeaturedTeacher[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await fetch("/api/homePage/featuredTeachers");
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setTeachers(data.data);
        }
      } catch (e) {
        console.error("Failed to fetch featured teachers");
      }
    };
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (teachers.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % teachers.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [teachers.length]);

  const currentTeacher = teachers.length > 0 ? teachers[currentIndex] : null;

  return (
    <div>
      {/* ── Keyframe Styles (injected once) ── */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%       { transform: translateY(-10px) rotate(0.5deg); }
          66%       { transform: translateY(-5px) rotate(-0.5deg); }
        }
        @keyframes orb-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25%       { transform: translate(30px, -20px) scale(1.05); }
          50%       { transform: translate(-20px, 30px) scale(0.95); }
          75%       { transform: translate(20px, 10px) scale(1.02); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scan-line {
          0%   { transform: translateY(-100%); opacity: 0; }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.6; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes border-trace {
          0%   { stroke-dashoffset: 1000; }
          100% { stroke-dashoffset: 0; }
        }

        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-orb-drift { animation: orb-drift 12s ease-in-out infinite; }
        .animate-glow-pulse { animation: glow-pulse 3s ease-in-out infinite; }

        .hero-reveal {
          opacity: 0;
          animation: slide-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .hero-reveal-1 { animation-delay: 0.05s; }
        .hero-reveal-2 { animation-delay: 0.15s; }
        .hero-reveal-3 { animation-delay: 0.28s; }
        .hero-reveal-4 { animation-delay: 0.42s; }
        .hero-reveal-5 { animation-delay: 0.56s; }
        .hero-reveal-6 { animation-delay: 0.72s; }

        .scan-line {
          position: absolute;
          left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(20,184,166,0.5), transparent);
          animation: scan-line 8s linear infinite;
          animation-delay: 2s;
        }

        .text-gradient-teal {
          background: linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #5eead4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .dark .text-gradient-teal {
          background: linear-gradient(135deg, #2dd4bf 0%, #5eead4 50%, #99f6e4 100%);
          -webkit-background-clip: text;
          background-clip: text;
        }

        .hero-card-glow {
          box-shadow: 0 0 0 1px rgba(20,184,166,0.15), 0 20px 60px -10px rgba(20,184,166,0.15);
        }
        .dark .hero-card-glow {
          box-shadow: 0 0 0 1px rgba(20,184,166,0.2), 0 20px 60px -10px rgba(20,184,166,0.25);
        }

        .teal-ring {
          box-shadow: 0 0 0 1px rgba(20,184,166,0.3), inset 0 0 0 1px rgba(20,184,166,0.1);
        }

        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
        }
      `}</style>

      <section className="relative min-h-[100dvh] flex flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950 selection:bg-teal-200 dark:selection:bg-teal-800/60">

        {/* ── Background layers ── */}
        <GridBackground />

        {/* Neural canvas */}
        <div className="absolute inset-0">
          <NeuralCanvas />
        </div>

        {/* Scan line effect */}
        <div className="scan-line" />

        {/* Orbs */}
        <Orb
          size={560}
          className="top-[-180px] left-[-100px] bg-teal-400/10 dark:bg-teal-500/8 animate-orb-drift"
          delay={0}
        />
        <Orb
          size={480}
          className="bottom-[-120px] right-[-80px] bg-teal-300/10 dark:bg-teal-600/10 animate-orb-drift"
          delay={4}
        />
        <Orb
          size={300}
          className="top-[30%] right-[15%] bg-emerald-400/8 dark:bg-emerald-500/6 animate-orb-drift"
          delay={2}
        />

        {/* Subtle radial vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(20,184,166,0.06),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(20,184,166,0.12),transparent)] pointer-events-none" />

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-zinc-50 dark:from-zinc-950 to-transparent pointer-events-none" />

        {/* ── Floating cards ── */}
        <div className="hide-mobile">
          {FLOATING_CARDS.map((card) => (
            <FloatingCard key={card.id} card={card} />
          ))}
        </div>

        {/* ── Hero Content ── */}
        <div className="relative z-10 w-full flex flex-col lg:flex-row items-center justify-between flex-1 px-4 sm:px-6 lg:px-12 xl:px-24 2xl:px-32 pt-24 lg:pt-32 pb-16 gap-16 lg:gap-12 xl:gap-16">
          {/* Left Text Content */}
          <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left z-10">

            {/* Badge */}
            <div className={cn("mb-7", loaded && "hero-reveal hero-reveal-1")}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border teal-ring bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm text-teal-700 dark:text-teal-300 border-teal-200/60 dark:border-teal-800/60">
                <RiSparklingFill className="text-teal-500 dark:text-teal-400 animate-glow-pulse text-base" />
                <span>Introducing Nexora — Knowledge meets Mentorship</span>

              </div>
            </div>

            {/* Headline */}
            <h1
              className={cn(
                "text-[clamp(2.4rem,6vw,4.5rem)] font-bold tracking-tight leading-[1.08] mb-6",
                loaded && "hero-reveal hero-reveal-2"
              )}
            >
              <span className="block text-zinc-900 dark:text-zinc-50">
                The Platform Where
              </span>
              <span className="block mt-1">
                <KineticWord
                  words={["Researchers", "Teachers", "Mentors", "Educators"]}
                  className="text-gradient-teal"
                />
                <span className="text-zinc-900 dark:text-zinc-50"> &amp; </span>
                <KineticWord
                  words={["Students", "Learners", "Scholars", "Members"]}
                  className="text-gradient-teal"
                />
              </span>
              <span className="block text-zinc-900 dark:text-zinc-50 mt-1">
                Grow Together
              </span>
            </h1>

            {/* Sub-headline */}
            <p
              className={cn(
                "text-[clamp(1rem,2vw,1.2rem)] text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed mb-10",
                loaded && "hero-reveal hero-reveal-3"
              )}
            >
              Create clusters, schedule sessions, assign tasks, share resources, and
              track every members progress — all in one beautifully unified workspace.
            </p>

            {/* CTA Buttons */}
            <div
              className={cn(
                "flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mb-12",
                loaded && "hero-reveal hero-reveal-4"
              )}
            >
              <Button
                size="lg"
                className={cn(
                  "h-12 px-7 rounded-xl font-semibold text-base gap-2",
                  "bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600",
                  "text-white shadow-lg shadow-teal-600/25 dark:shadow-teal-500/20",
                  "transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                )}
              >
                Start for Free
                <RiArrowRightLine className="text-lg transition-transform duration-200 group-hover:translate-x-0.5" />
              </Button>

              <Link href="/watch-demo">
                <Button
                  variant="outline"
                  size="lg"
                  className={cn(
                    "h-12 px-7 rounded-xl font-semibold text-base gap-2",
                    "border-zinc-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/50",
                    "text-zinc-700 dark:text-zinc-200",
                    "backdrop-blur-sm",
                    "transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                    "hover:border-teal-400 dark:hover:border-teal-600 hover:text-teal-700 dark:hover:text-teal-400"
                  )}
                >
                  <RiPlayCircleLine className="text-lg text-teal-600 dark:text-teal-400" />
                  Watch Demo
                </Button>
              </Link>
            </div>

            {/* Trust line */}
            <div
              className={cn(
                "flex flex-wrap items-center justify-center lg:justify-start gap-2 text-xs text-zinc-400 dark:text-zinc-600",
                loaded && "hero-reveal hero-reveal-5"
              )}
            >
              {["No credit card required", "Free forever plan", "GDPR compliant"].map(
                (item, i) => (
                  <span key={item} className="flex items-center gap-2">
                    {i > 0 && (
                      <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                    )}
                    <RiShieldCheckLine className="text-teal-500 dark:text-teal-600 text-sm" />
                    {item}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Right Profile Section */}
          <div className={cn("w-full lg:w-1/2 flex items-center justify-center lg:justify-end relative mt-12 lg:mt-0", loaded && "hero-reveal hero-reveal-5")}>
            <div className="relative w-full max-w-[480px] xl:max-w-[560px] aspect-[4/5] mx-auto lg:mx-0 lg:mr-8 xl:mr-12">
              {/* Abstract background elements behind the card */}
              <div className="absolute inset-0 -m-8 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.15)_0%,transparent_70%)] rounded-full blur-2xl pointer-events-none" />

              {/* Main Card */}
              <div className="relative w-full h-full rounded-[32px] p-2 bg-white/20 dark:bg-zinc-900/40 backdrop-blur-xl border border-white/40 dark:border-zinc-700/50 shadow-2xl overflow-visible group">
                {/* Glowing Gradient Border Effect (achieved via an underlay) */}
                <div className="absolute -inset-[2px] rounded-[34px] bg-gradient-to-br from-cyan-400 via-teal-500 to-blue-600 opacity-20 dark:opacity-30 blur-sm -z-10 group-hover:opacity-40 transition-opacity duration-500" />
                <div className="absolute inset-0 rounded-[32px] bg-white/40 dark:bg-zinc-900/60 backdrop-blur-md -z-10" />

                {/* Image Container */}
                <div className="relative w-full h-full rounded-[26px] overflow-hidden bg-zinc-200 dark:bg-zinc-800 shadow-inner">
                  <Image
                    key={currentTeacher?.id || "default"}
                    src={currentTeacher?.image || "/images/senior_professor.png"}
                    alt={currentTeacher?.name || "Senior Professor"}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Subtle overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/60 via-zinc-900/10 to-transparent opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-900/20 via-transparent to-teal-900/20 mix-blend-overlay" />
                </div>
              </div>

              {/* Top Left Floating Card */}
              <div className="absolute -top-6 -left-4 sm:-left-10 z-20 animate-float" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-white/40 dark:border-zinc-700/50 shadow-xl shadow-teal-900/10 dark:shadow-teal-900/30 group-hover:-translate-y-1 transition-transform duration-300">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-100 to-teal-100 dark:from-cyan-900/50 dark:to-teal-900/50 flex items-center justify-center border border-cyan-200/50 dark:border-cyan-800/50">
                    <RiBrainLine className="text-xl text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="pr-2">
                    <div className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-1">Neural Match</div>
                    <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-glow-pulse" />
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-glow-pulse" style={{ animationDelay: '0.4s' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-glow-pulse" style={{ animationDelay: '0.8s' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Right Floating Card */}
              <div className="absolute top-12 -right-4 sm:-right-8 z-20 animate-float" style={{ animationDelay: '1.5s' }}>
                <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-white/50 dark:border-zinc-700/50 shadow-xl shadow-blue-900/5 dark:shadow-blue-900/20 group-hover:-translate-y-1 transition-transform duration-300">
                  <div className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Research Graph
                  </div>
                  <svg width="80" height="30" viewBox="0 0 80 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 25C10 25 15 15 25 15C35 15 40 5 50 5C60 5 65 20 80 10" stroke="url(#paint0_linear)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <defs>
                      <linearGradient id="paint0_linear" x1="0" y1="15" x2="80" y2="15" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#06b6d4" />
                        <stop offset="1" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              {/* Bottom Left Floating Card */}
              <div className="absolute bottom-16 -left-4 sm:-left-12 z-20 animate-float" style={{ animationDelay: '0.8s' }}>
                <div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-white/40 dark:border-zinc-700/50 shadow-xl shadow-teal-900/10 dark:shadow-teal-900/30 w-[170px] group-hover:-translate-y-1 transition-transform duration-300">
                  <div className="flex items-center gap-2 mb-0.5">
                    <RiArticleLine className="text-teal-500 text-lg" />
                    <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Recent Pubs</div>
                  </div>
                  <div className="flex items-center gap-2.5 p-1.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700/50 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex-shrink-0 shadow-sm" />
                    <div className="text-[10px] font-medium text-zinc-600 dark:text-zinc-300 leading-tight">Quantum Computing</div>
                  </div>
                  <div className="flex items-center gap-2.5 p-1.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700/50 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 flex-shrink-0 shadow-sm" />
                    <div className="text-[10px] font-medium text-zinc-600 dark:text-zinc-300 leading-tight">Neural Research</div>
                  </div>
                </div>
              </div>

              {/* Bottom Right Floating Card */}
              <div className="absolute -bottom-6 -right-2 sm:-right-8 z-20 animate-float" style={{ animationDelay: '2.2s' }}>
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/30 dark:border-zinc-700/40 shadow-xl shadow-cyan-900/10 dark:shadow-cyan-900/20 group-hover:-translate-y-1 transition-transform duration-300">
                  <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center flex-shrink-0">
                    <RiUserStarLine className="text-cyan-600 dark:text-cyan-400 text-xl" />
                  </div>
                  <div className="flex flex-col max-w-[150px]">
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider mb-0.5 line-clamp-1">
                      {currentTeacher?.teacherProfile?.designation || "Impact Factor"}
                    </span>
                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center line-clamp-1">
                      {currentTeacher?.name || "14.2"}
                      {!currentTeacher && (
                        <span className="text-cyan-500 text-[10px] ml-1.5 flex items-center bg-cyan-50 dark:bg-cyan-900/30 px-1 py-0.5 rounded font-medium">↑ 2.1</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats Bar ── */}
        <div
          className={cn(
            "relative z-10 w-full border-t border-zinc-200/80 dark:border-zinc-800/80",
            "bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md",
            loaded && "hero-reveal hero-reveal-6"
          )}
        >
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-12 xl:px-24 2xl:px-32 py-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-zinc-200/80 dark:divide-zinc-800/80 max-w-[1600px] mx-auto">
              {STATS.map((stat, i) => (
                <div
                  key={stat.label}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 px-4 py-2",
                    i === 0 && "pl-0 sm:pl-4",
                    i === STATS.length - 1 && "pr-0 sm:pr-4"
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-teal-500 dark:text-teal-400 text-sm">
                      {stat.icon}
                    </span>
                    <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tabular-nums">
                      {stat.value}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-500 font-medium">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Corner accent geometry ── */}
        <svg
          className="absolute top-0 right-0 w-64 h-64 opacity-[0.04] dark:opacity-[0.06] pointer-events-none"
          viewBox="0 0 256 256"
          fill="none"
        >
          <circle cx="256" cy="0" r="120" stroke="#0d9488" strokeWidth="0.5" />
          <circle cx="256" cy="0" r="80" stroke="#0d9488" strokeWidth="0.5" />
          <circle cx="256" cy="0" r="40" stroke="#0d9488" strokeWidth="0.5" />
          <line x1="136" y1="0" x2="256" y2="120" stroke="#0d9488" strokeWidth="0.5" />
          <line x1="176" y1="0" x2="256" y2="80" stroke="#0d9488" strokeWidth="0.5" />
        </svg>

        <svg
          className="absolute bottom-16 left-0 w-48 h-48 opacity-[0.04] dark:opacity-[0.06] pointer-events-none"
          viewBox="0 0 192 192"
          fill="none"
        >
          <circle cx="0" cy="192" r="100" stroke="#0d9488" strokeWidth="0.5" />
          <circle cx="0" cy="192" r="60" stroke="#0d9488" strokeWidth="0.5" />
          <circle cx="0" cy="192" r="20" stroke="#0d9488" strokeWidth="0.5" />
        </svg>

        {/* ── Decorative teal line (left) ── */}
        <div className="absolute left-0 top-[20%] bottom-[20%] w-px bg-gradient-to-b from-transparent via-teal-400/20 dark:via-teal-500/30 to-transparent pointer-events-none" />
        <div className="absolute right-0 top-[30%] bottom-[30%] w-px bg-gradient-to-b from-transparent via-teal-400/20 dark:via-teal-500/30 to-transparent pointer-events-none" />

      </section>
    </div>
  );
}
