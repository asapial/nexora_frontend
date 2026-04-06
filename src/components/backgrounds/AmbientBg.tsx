"use client";

import { useEffect, useRef, useState } from "react";

// ── Shared types ──────────────────────────────────────────
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  pulsePhase?: number;
}

// ── Shared keyframes ──────────────────────────────────────
const KEYFRAMES = `
  @keyframes drift1 {
    0%,100% { transform: translate(0,0) scale(1); }
    33%      { transform: translate(30px,-20px) scale(1.08); }
    66%      { transform: translate(-20px,25px) scale(0.95); }
  }
  @keyframes drift2 {
    0%,100% { transform: translate(0,0) scale(1); }
    40%      { transform: translate(-35px,20px) scale(1.1); }
    70%      { transform: translate(25px,-30px) scale(0.92); }
  }
  @keyframes drift3 {
    0%,100% { transform: translate(0,0) scale(1); }
    50%      { transform: translate(20px,30px) scale(1.06); }
  }
  @keyframes pulse-slow {
    0%,100% { opacity: 1; }
    50%      { opacity: 0.55; }
  }
  @keyframes grid-pan {
    0%   { background-position: 0px 0px; }
    100% { background-position: 30px 30px; }
  }
  @keyframes grid-pan-diag {
    0%   { background-position: 0px 0px; }
    100% { background-position: 32px 32px; }
  }
  @keyframes breathe {
    0%,100% { transform: translate(-50%,-50%) scale(1);   opacity:0.9; }
    50%      { transform: translate(-50%,-50%) scale(1.15); opacity:0.6; }
  }
  @keyframes float-up {
    0%,100% { transform: translateY(0px); }
    50%      { transform: translateY(-18px); }
  }
`;

function GlobalKeyframes() {
  return <style suppressHydrationWarning>{KEYFRAMES}</style>;
}

// ── Configurable Neural Particle Canvas ───────────────────
interface ParticleCanvasProps {
  /** rgba prefix e.g. "rgba(20,184,166," */
  nodeColor: string;
  lineColor: string;
  density?: number; // pixels-per-particle, default 12000
  speed?: number; // base velocity multiplier, default 1
  connectionDist?: number; // default 130
  mouseRadius?: number; // default 120
  opacityScale?: number; // canvas-level opacity, default 1
  // "mesh" = lines only, "nodes" = dots only, "both" = default
  mode?: "mesh" | "nodes" | "both";
  nodeMaxRadius?: number;
  lineAlphaMax?: number;
}

function ParticleCanvas({
  nodeColor,
  lineColor,
  density = 12000,
  speed = 1,
  connectionDist = 130,
  mouseRadius = 120,
  opacityScale = 1,
  mode = "both",
  nodeMaxRadius = 2.4,
  lineAlphaMax = 0.18,
}: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const initParticles = () => {
      const count = Math.floor((canvas.width * canvas.height) / density);
      particlesRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4 * speed,
        vy: (Math.random() - 0.5) * 0.4 * speed,
        radius: Math.random() * (nodeMaxRadius - 0.6) + 0.6,
        opacity: Math.random() * 0.5 + 0.2,
        pulsePhase: Math.random() * Math.PI * 2,
      }));
    };

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initParticles();
    };

    let frame = 0;
    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Mouse attraction
        const dx = mouseRef.current.x - p.x;
        const dy = mouseRef.current.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouseRadius && dist > 0) {
          p.vx += (dx / dist) * 0.009;
          p.vy += (dy / dist) * 0.009;
          const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          const maxSpd = 1.6 * speed;
          if (spd > maxSpd) {
            p.vx = (p.vx / spd) * maxSpd;
            p.vy = (p.vy / spd) * maxSpd;
          }
        }

        // Pulsing node
        const pulse = 0.85 + 0.15 * Math.sin((frame * 0.025) + (p.pulsePhase ?? 0));
        const r = p.radius * pulse;

        if (mode !== "mesh") {
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fillStyle = `${nodeColor}${p.opacity * pulse})`;
          ctx.fill();
        }

        if (mode !== "nodes") {
          for (let j = i + 1; j < particlesRef.current.length; j++) {
            const p2 = particlesRef.current[j];
            const dx2 = p.x - p2.x;
            const dy2 = p.y - p2.y;
            const d = Math.sqrt(dx2 * dx2 + dy2 * dy2);
            if (d < connectionDist) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              const alpha = (1 - d / connectionDist) * lineAlphaMax;
              ctx.strokeStyle = `${lineColor}${alpha})`;
              ctx.lineWidth = 0.7;
              ctx.stroke();
            }
          }
        }
      });

      animRef.current = requestAnimationFrame(draw);
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    resize();
    draw();
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto"
      style={{ opacity: opacityScale }}
    />
  );
}

// ─── Grid Lines Background ────────────────────────────────
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(8)].map((_, i) => (
        <div
          key={`v-${i}`}
          className="absolute top-0 bottom-0 w-px bg-zinc-200/50 dark:bg-zinc-800/50"
          style={{ left: `${(i + 1) * 12.5}%` }}
        />
      ))}
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

// ══════════════════════════════════════════════════════════
// ── 1. TEAL MESH — dashboard / profile ───────────────────
// Particles: teal mesh with pulsing nodes, medium density
// ══════════════════════════════════════════════════════════
export function AmbientBg1() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden select-none">
      <GlobalKeyframes />

      {/* Dot grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(20,184,166,0.11) 1px,transparent 1px)",
          backgroundSize: "30px 30px",
          animation: "grid-pan 8s linear infinite",
        }}
      />

      {/* Glows */}
      <div
        className="absolute -top-60 -left-40 w-[600px] h-[600px] rounded-full bg-teal-500/[0.07] blur-[120px]"
        style={{ animation: "drift1 18s ease-in-out infinite" }}
      />
      <div
        className="absolute top-1/2 right-0 w-[420px] h-[420px] rounded-full bg-teal-400/[0.05] blur-[100px]"
        style={{ animation: "drift2 22s ease-in-out infinite" }}
      />
      <div
        className="absolute -bottom-60 left-1/3 w-[500px] h-[400px] rounded-full bg-amber-500/[0.05] blur-[110px]"
        style={{ animation: "drift3 16s ease-in-out infinite, pulse-slow 9s ease-in-out infinite" }}
      />
      <div
        className="absolute top-1/4 left-2/3 w-[220px] h-[220px] rounded-full bg-emerald-400/[0.04] blur-[80px]"
        style={{ animation: "float-up 11s ease-in-out infinite", animationDelay: "-4s" }}
      />

      {/* ✦ Particles — classic teal mesh, standard density */}
      <div className="absolute inset-0 pointer-events-auto">
        <ParticleCanvas
          nodeColor="rgba(20,184,166,"
          lineColor="rgba(20,184,166,"
          density={11000}
          speed={0.9}
          connectionDist={140}
          mouseRadius={130}
          opacityScale={0.65}
          mode="both"
          nodeMaxRadius={2.0}
          lineAlphaMax={0.16}
        />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── 2. CROSS-HATCH GRID — analytics / data pages ─────────
// Particles: denser, faster, violet-tinted lines + teal nodes
// ══════════════════════════════════════════════════════════
export function AmbientBg2() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden select-none">
      <GlobalKeyframes />

      {/* Cross-hatch */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(20,184,166,1) 1px,transparent 1px)," +
            "linear-gradient(90deg,rgba(20,184,166,1) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
          animation: "grid-pan-diag 12s linear infinite",
        }}
      />

      {/* Glows */}
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[400px] rounded-full bg-teal-500/[0.08] blur-[130px]"
        style={{ animation: "pulse-slow 10s ease-in-out infinite" }}
      />
      <div
        className="absolute -bottom-40 -left-20 w-[500px] h-[400px] rounded-full bg-violet-500/[0.06] blur-[100px]"
        style={{ animation: "drift1 20s ease-in-out infinite", animationDelay: "-6s" }}
      />
      <div
        className="absolute -bottom-20 right-0 w-[360px] h-[320px] rounded-full bg-teal-400/[0.05] blur-[90px]"
        style={{ animation: "drift2 17s ease-in-out infinite", animationDelay: "-3s" }}
      />
      <div
        className="absolute top-1/3 left-1/4 w-[200px] h-[200px] rounded-full bg-sky-400/[0.04] blur-[70px]"
        style={{ animation: "float-up 13s ease-in-out infinite", animationDelay: "-7s" }}
      />

      {/* ✦ Particles — data-viz feel: tight grid lines, violet-tinted */}
      <div className="absolute inset-0 pointer-events-auto">
        <ParticleCanvas
          nodeColor="rgba(20,184,166,"
          lineColor="rgba(139,92,246,"
          density={9000}
          speed={1.1}
          connectionDist={120}
          mouseRadius={110}
          opacityScale={0.6}
          mode="both"
          nodeMaxRadius={1.8}
          lineAlphaMax={0.14}
        />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── 3. DIAGONAL LINES — session / announcement pages ──────
// Particles: sparse, slow, mesh-only — feels like radio waves
// ══════════════════════════════════════════════════════════
export function AmbientBg3() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden select-none">
      <GlobalKeyframes />

      {/* Diagonal stripes */}
      <div
        className="absolute inset-0 opacity-[0.028]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg,rgba(20,184,166,1) 0px,rgba(20,184,166,1) 1px,transparent 1px,transparent 32px)",
          animation: "grid-pan-diag 20s linear infinite",
        }}
      />

      {/* Glows */}
      <div
        className="absolute top-0 -left-60 w-[500px] h-[800px] rounded-full bg-teal-500/[0.07] blur-[140px]"
        style={{ animation: "drift1 24s ease-in-out infinite" }}
      />
      <div
        className="absolute -top-20 right-0 w-[400px] h-[350px] rounded-full bg-amber-400/[0.06] blur-[100px]"
        style={{
          animation: "drift2 19s ease-in-out infinite, pulse-slow 12s ease-in-out infinite",
          animationDelay: "-5s",
        }}
      />
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-sky-500/[0.05] blur-[120px]"
        style={{ animation: "drift3 14s ease-in-out infinite", animationDelay: "-2s" }}
      />
      <div
        className="absolute top-2/3 right-1/4 w-[160px] h-[160px] rounded-full bg-teal-300/[0.05] blur-[60px]"
        style={{ animation: "float-up 9s ease-in-out infinite", animationDelay: "-1s" }}
      />

      {/* ✦ Particles — wide-range mesh, very sparse, slow drift */}
      <div className="absolute inset-0 pointer-events-auto">
        <ParticleCanvas
          nodeColor="rgba(20,184,166,"
          lineColor="rgba(56,189,248,"
          density={16000}
          speed={0.55}
          connectionDist={170}
          mouseRadius={150}
          opacityScale={0.5}
          mode="mesh"
          lineAlphaMax={0.12}
        />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── 4. HEX DOTS — cluster / resource pages ───────────────
// Particles: dense nodes only (no lines), amber + teal mixed
// ══════════════════════════════════════════════════════════
export function AmbientBg4() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden select-none">
      <GlobalKeyframes />

      {/* Dual dot layers */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(20,184,166,0.09) 1.5px,transparent 1.5px)",
          backgroundSize: "24px 24px",
          animation: "grid-pan 10s linear infinite",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(20,184,166,0.05) 1.5px,transparent 1.5px)",
          backgroundSize: "24px 24px",
          backgroundPosition: "12px 12px",
          animation: "grid-pan 14s linear infinite reverse",
        }}
      />

      {/* Glows */}
      <div
        className="absolute -top-40 right-0 w-[560px] h-[560px] rounded-full bg-teal-500/[0.08] blur-[120px]"
        style={{ animation: "drift2 21s ease-in-out infinite" }}
      />
      <div
        className="absolute -bottom-40 -left-20 w-[480px] h-[480px] rounded-full bg-amber-400/[0.06] blur-[110px]"
        style={{
          animation: "drift1 18s ease-in-out infinite, pulse-slow 11s ease-in-out infinite",
          animationDelay: "-8s",
        }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 -left-20 w-[300px] h-[400px] rounded-full bg-teal-300/[0.05] blur-[90px]"
        style={{ animation: "float-up 15s ease-in-out infinite", animationDelay: "-4s" }}
      />
      <div
        className="absolute top-1/3 left-1/2 w-[180px] h-[180px] rounded-full bg-emerald-400/[0.04] blur-[70px]"
        style={{ animation: "drift3 12s ease-in-out infinite", animationDelay: "-9s" }}
      />

      {/* ✦ Particles — dual-layer: teal nodes + amber accent nodes, dense cluster feel */}
      <div className="absolute inset-0 pointer-events-auto">
        {/* Primary layer — teal nodes with short connections */}
        <ParticleCanvas
          nodeColor="rgba(20,184,166,"
          lineColor="rgba(20,184,166,"
          density={8000}
          speed={0.75}
          connectionDist={90}
          mouseRadius={100}
          opacityScale={0.7}
          mode="both"
          nodeMaxRadius={2.6}
          lineAlphaMax={0.13}
        />
      </div>
      <div className="absolute inset-0 pointer-events-none">
        {/* Accent layer — amber floating dots, no lines */}
        <ParticleCanvas
          nodeColor="rgba(251,191,36,"
          lineColor="rgba(251,191,36,"
          density={28000}
          speed={0.4}
          connectionDist={0}
          mouseRadius={80}
          opacityScale={0.45}
          mode="nodes"
          nodeMaxRadius={1.4}
        />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── 5. NOISE VIGNETTE — auth / landing pages ─────────────
// Particles: elegant, medium density, long connections, subtle
// ══════════════════════════════════════════════════════════
export function AmbientBg5() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden select-none">
      <GlobalKeyframes />

      {/* Central glow */}
      <div
        className="absolute top-1/2 left-1/2 w-[900px] h-[550px] rounded-full bg-teal-500/[0.09] blur-[160px]"
        style={{ animation: "breathe 14s ease-in-out infinite" }}
      />
      <div
        className="absolute top-1/2 left-1/2 w-[500px] h-[320px] rounded-full bg-teal-400/[0.06] blur-[100px]"
        style={{
          animation: "breathe 10s ease-in-out infinite",
          animationDelay: "-5s",
          transform: "translate(-50%,-50%)",
        }}
      />
      <div
        className="absolute -bottom-20 right-0 w-[420px] h-[320px] rounded-full bg-amber-500/[0.05] blur-[100px]"
        style={{ animation: "drift1 20s ease-in-out infinite", animationDelay: "-3s" }}
      />
      <div
        className="absolute -top-20 -left-20 w-[380px] h-[380px] rounded-full bg-teal-400/[0.06] blur-[100px]"
        style={{ animation: "drift2 17s ease-in-out infinite", animationDelay: "-7s" }}
      />

      {/* ✦ Particles — elegant wide-web, long-range connections, very subtle */}
      <div className="absolute inset-0 pointer-events-auto">
        <ParticleCanvas
          nodeColor="rgba(20,184,166,"
          lineColor="rgba(20,184,166,"
          density={13000}
          speed={0.6}
          connectionDist={180}
          mouseRadius={160}
          opacityScale={0.45}
          mode="both"
          nodeMaxRadius={1.6}
          lineAlphaMax={0.10}
        />
      </div>

      {/* Vignette overlay on top of particles */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-background/60 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-background/60 to-transparent pointer-events-none" />
      <div className="absolute top-0 bottom-0 left-0 w-40 bg-gradient-to-r from-background/40 to-transparent pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-40 bg-gradient-to-l from-background/40 to-transparent pointer-events-none" />
    </div>
  );
}

// ── 6. NEURAL CANVAS (original, unchanged) ───────────────
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
    const isDark = () => document.documentElement.classList.contains("dark");
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const dark = isDark();
      const nodeColor = dark ? "rgba(20,184,166," : "rgba(13,148,136,";
      const lineColor = dark ? "rgba(20,184,166," : "rgba(13,148,136,";
      particlesRef.current.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        const dx = mouseRef.current.x - p.x;
        const dy = mouseRef.current.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          p.vx += (dx / dist) * 0.008;
          p.vy += (dy / dist) * 0.008;
          const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          if (speed > 1.5) { p.vx = (p.vx / speed) * 1.5; p.vy = (p.vy / speed) * 1.5; }
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${nodeColor}${p.opacity})`;
        ctx.fill();
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const p2 = particlesRef.current[j];
          const dx2 = p.x - p2.x; const dy2 = p.y - p2.y;
          const d = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (d < 130) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y);
            const alpha = (1 - d / 130) * 0.18;
            ctx.strokeStyle = `${lineColor}${alpha})`; ctx.lineWidth = 0.6; ctx.stroke();
          }
        }
      });
      animRef.current = requestAnimationFrame(draw);
    };
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    resize(); draw();
    canvas.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60 dark:opacity-100" />;
}

export function AmbientBg6() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden select-none">
      <GridBackground />
      <div className="absolute inset-0">
        <NeuralCanvas />
      </div>
    </div>
  );
}