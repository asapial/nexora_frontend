"use client";

import { useEffect, useRef, useState } from "react";

// ─── Status messages that cycle during loading ─────────────
const LOADING_STATUSES = [
  "Initialising your clusters...",
  "Loading session data...",
  "Fetching resource library...",
  "Syncing member progress...",
  "Almost ready...",
];

// ─── Particle canvas ───────────────────────────────────────
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

function NeuralCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let particles: Particle[] = [];

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const count   = Math.floor((canvas.width * canvas.height) / 9000);
      particles     = Array.from({ length: count }, () => ({
        x:       Math.random() * canvas.width,
        y:       Math.random() * canvas.height,
        vx:      (Math.random() - 0.5) * 0.35,
        vy:      (Math.random() - 0.5) * 0.35,
        radius:  Math.random() * 1.4 + 0.5,
        opacity: Math.random() * 0.35 + 0.1,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(20,184,166,${p.opacity})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 110) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(20,184,166,${(1 - d / 110) * 0.12})`;
            ctx.lineWidth   = 0.5;
            ctx.stroke();
          }
        }
      });

      animId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-70"
      aria-hidden="true"
    />
  );
}

// ─── Loading page ──────────────────────────────────────────
export default function Loading() {
  const [statusIndex, setStatusIndex] = useState(0);
  const [statusVisible, setStatusVisible] = useState(true);

  // Cycle status messages with a fade transition
  useEffect(() => {
    const interval = setInterval(() => {
      setStatusVisible(false);
      setTimeout(() => {
        setStatusIndex((i) => (i + 1) % LOADING_STATUSES.length);
        setStatusVisible(true);
      }, 380);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #0d1117 0%, #0a1f1c 50%, #0d1117 100%)",
      }}
      role="status"
      aria-label="Loading Nexora"
    >
      {/* ── Neural network canvas ── */}
      <NeuralCanvas />

      {/* ── Subtle grid overlay ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(20,184,166,.03) 1px,transparent 1px), linear-gradient(90deg,rgba(20,184,166,.03) 1px,transparent 1px)",
          backgroundSize: "52px 52px",
        }}
      />

      {/* ── Background orbs ── */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 420, height: 420,
          top: -140, left: -100,
          background: "radial-gradient(circle, rgba(20,184,166,.11) 0%, transparent 65%)",
          filter: "blur(40px)",
          animation: "nexora-orb 12s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 320, height: 320,
          bottom: -90, right: -70,
          background: "radial-gradient(circle, rgba(20,184,166,.07) 0%, transparent 65%)",
          filter: "blur(36px)",
          animation: "nexora-orb 9s ease-in-out infinite 3s",
        }}
      />

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes nexora-orb {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(-20px,20px) scale(1.06); }
        }
        @keyframes nexora-spin-cw {
          to { transform: rotate(360deg); }
        }
        @keyframes nexora-spin-ccw {
          to { transform: rotate(-360deg); }
        }
        @keyframes nexora-progress {
          0%   { width: 0%;   margin-left: 0%; }
          50%  { width: 80%;  margin-left: 0%; }
          70%  { width: 80%;  margin-left: 10%; }
          100% { width: 0%;   margin-left: 100%; }
        }
        @keyframes nexora-dot {
          0%,100% { background: rgba(20,184,166,.2); transform: scale(1); }
          50%      { background: rgba(20,184,166,.9); transform: scale(1.5); }
        }
        @keyframes nexora-hex-pulse {
          0%,100% { box-shadow: 0 0 0 0px rgba(20,184,166,0); }
          50%      { box-shadow: 0 0 0 10px rgba(20,184,166,.06); }
        }
      `}</style>

      {/* ── Center content ── */}
      <div className="relative z-10 flex flex-col items-center">

        {/* ── Hex logo with orbital rings ── */}
        <div className="relative mb-8" style={{ width: 76, height: 76 }}>

          {/* Outer rotating ring */}
          <div
            className="absolute inset-[-12px] rounded-full border border-transparent"
            style={{
              borderTopColor:   "rgba(20,184,166,.5)",
              borderRightColor: "rgba(20,184,166,.15)",
              animation: "nexora-spin-cw 2.6s linear infinite",
            }}
          />

          {/* Inner counter-rotating ring */}
          <div
            className="absolute inset-[-20px] rounded-full border border-transparent"
            style={{
              borderBottomColor: "rgba(20,184,166,.3)",
              borderLeftColor:   "rgba(20,184,166,.1)",
              animation: "nexora-spin-ccw 4.2s linear infinite",
            }}
          />

          {/* Hex icon */}
          <div
            className="w-[76px] h-[76px] rounded-[18px] flex items-center justify-center text-[28px] text-teal-400 relative overflow-hidden"
            style={{
              background: "rgba(20,184,166,.1)",
              border:     "1.5px solid rgba(20,184,166,.3)",
              animation:  "nexora-hex-pulse 3s ease-in-out infinite",
            }}
          >
            {/* Inner gradient shimmer */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, rgba(20,184,166,.18) 0%, transparent 60%)",
              }}
            />
            <span className="relative z-10 select-none">⬡</span>
          </div>
        </div>

        {/* ── Wordmark ── */}
        <h1
          className="text-[22px] font-extrabold tracking-tight text-white mb-1 select-none"
          style={{ letterSpacing: "-.025em" }}
        >
          Nexora
        </h1>
        <p
          className="text-[11px] font-semibold tracking-[.1em] uppercase mb-9 select-none"
          style={{ color: "rgba(82,82,91,1)" }}
        >
          Where Knowledge Meets Mentorship
        </p>

        {/* ── Progress bar ── */}
        <div
          className="w-[220px] h-[2px] rounded-full overflow-hidden mb-4"
          style={{ background: "rgba(255,255,255,.06)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              background:
                "linear-gradient(90deg, #0d9488, #2dd4bf, #5eead4)",
              animation: "nexora-progress 3.2s cubic-bezier(.4,0,.6,1) infinite",
            }}
          />
        </div>

        {/* ── Cycling status text ── */}
        <p
          className="text-[12.5px] font-medium h-5 text-center select-none"
          style={{
            color:      "rgba(45,212,191,1)",
            transition: "opacity 0.36s ease",
            opacity:    statusVisible ? 1 : 0,
          }}
        >
          {LOADING_STATUSES[statusIndex]}
        </p>

        {/* ── Bouncing dots ── */}
        <div className="flex gap-[5px] mt-5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-[4px] h-[4px] rounded-full"
              style={{
                background: "rgba(20,184,166,.3)",
                animation:  `nexora-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Corner geometry (decorative) ── */}
      <svg
        className="absolute top-0 right-0 pointer-events-none"
        style={{ width: 160, height: 160, opacity: 0.05 }}
        viewBox="0 0 160 160"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="160" cy="0" r="120" stroke="#14b8a6" strokeWidth=".8" />
        <circle cx="160" cy="0" r="75"  stroke="#14b8a6" strokeWidth=".8" />
        <circle cx="160" cy="0" r="35"  stroke="#14b8a6" strokeWidth=".8" />
      </svg>
      <svg
        className="absolute bottom-0 left-0 pointer-events-none"
        style={{ width: 140, height: 140, opacity: 0.05 }}
        viewBox="0 0 140 140"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="0" cy="140" r="110" stroke="#14b8a6" strokeWidth=".8" />
        <circle cx="0" cy="140" r="65"  stroke="#14b8a6" strokeWidth=".8" />
      </svg>
    </div>
  );
}