

"use client";

// ── Shared keyframes injected once ───────────────────────
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
  @keyframes rotate-slow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes breathe {
    0%,100% { transform: translate(-50%,-50%) scale(1);   opacity:0.9; }
    50%      { transform: translate(-50%,-50%) scale(1.15); opacity:0.6; }
  }
  @keyframes shimmer-x {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes float-up {
    0%,100% { transform: translateY(0px); }
    50%      { transform: translateY(-18px); }
  }
`;

function GlobalKeyframes() {
    return <style suppressHydrationWarning>{KEYFRAMES}</style>;
}

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

// ── 1. TEAL MESH — dashboard / profile ───────────────────
export function AmbientBg1() {
    return (
        <div className="pointer-events-none fixed inset-0 overflow-hidden select-none">
            <GlobalKeyframes />
            {/* Slowly panning dot grid */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: "radial-gradient(rgba(20,184,166,0.11) 1px,transparent 1px)",
                    backgroundSize: "30px 30px",
                    animation: "grid-pan 8s linear infinite",
                }}
            />
            {/* Top-left glow — drift1 */}
            <div
                className="absolute -top-60 -left-40 w-[600px] h-[600px] rounded-full bg-teal-500/[0.07] blur-[120px]"
                style={{ animation: "drift1 18s ease-in-out infinite" }}
            />
            {/* Mid-right glow — drift2 */}
            <div
                className="absolute top-1/2 right-0 w-[420px] h-[420px] rounded-full bg-teal-400/[0.05] blur-[100px]"
                style={{ animation: "drift2 22s ease-in-out infinite" }}
            />
            {/* Bottom-center warm — drift3 + pulse */}
            <div
                className="absolute -bottom-60 left-1/3 w-[500px] h-[400px] rounded-full bg-amber-500/[0.05] blur-[110px]"
                style={{ animation: "drift3 16s ease-in-out infinite, pulse-slow 9s ease-in-out infinite" }}
            />
            {/* Extra: small emerald accent that floats */}
            <div
                className="absolute top-1/4 left-2/3 w-[220px] h-[220px] rounded-full bg-emerald-400/[0.04] blur-[80px]"
                style={{ animation: "float-up 11s ease-in-out infinite", animationDelay: "-4s" }}
            />
        </div>
    );
}


// ── 2. CROSS-HATCH GRID — analytics / data pages ─────────
export function AmbientBg2() {
    return (
        <div className="pointer-events-none fixed inset-0 overflow-hidden select-none">
            <GlobalKeyframes />
            {/* Diagonal-panning cross-hatch */}
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
            {/* Top centre sweep — slow breathe */}
            <div
                className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[400px] rounded-full bg-teal-500/[0.08] blur-[130px]"
                style={{ animation: "pulse-slow 10s ease-in-out infinite" }}
            />
            {/* Bottom-left violet — drift1 */}
            <div
                className="absolute -bottom-40 -left-20 w-[500px] h-[400px] rounded-full bg-violet-500/[0.06] blur-[100px]"
                style={{ animation: "drift1 20s ease-in-out infinite", animationDelay: "-6s" }}
            />
            {/* Bottom-right teal — drift2 */}
            <div
                className="absolute -bottom-20 right-0 w-[360px] h-[320px] rounded-full bg-teal-400/[0.05] blur-[90px]"
                style={{ animation: "drift2 17s ease-in-out infinite", animationDelay: "-3s" }}
            />
            {/* Floating mid accent */}
            <div
                className="absolute top-1/3 left-1/4 w-[200px] h-[200px] rounded-full bg-sky-400/[0.04] blur-[70px]"
                style={{ animation: "float-up 13s ease-in-out infinite", animationDelay: "-7s" }}
            />
        </div>
    );
}


// ── 3. DIAGONAL LINES — session / announcement pages ──────
export function AmbientBg3() {
    return (
        <div className="pointer-events-none fixed inset-0 overflow-hidden select-none">
            <GlobalKeyframes />
            {/* Slowly scrolling diagonal stripes */}
            <div
                className="absolute inset-0 opacity-[0.028]"
                style={{
                    backgroundImage:
                        "repeating-linear-gradient(135deg,rgba(20,184,166,1) 0px,rgba(20,184,166,1) 1px,transparent 1px,transparent 32px)",
                    animation: "grid-pan-diag 20s linear infinite",
                }}
            />
            {/* Far-left tall glow — drift1 */}
            <div
                className="absolute top-0 -left-60 w-[500px] h-[800px] rounded-full bg-teal-500/[0.07] blur-[140px]"
                style={{ animation: "drift1 24s ease-in-out infinite" }}
            />
            {/* Top-right warm — pulse + float */}
            <div
                className="absolute -top-20 right-0 w-[400px] h-[350px] rounded-full bg-amber-400/[0.06] blur-[100px]"
                style={{ animation: "drift2 19s ease-in-out infinite, pulse-slow 12s ease-in-out infinite", animationDelay: "-5s" }}
            />
            {/* Centre-bottom cool — drift3 */}
            <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-sky-500/[0.05] blur-[120px]"
                style={{ animation: "drift3 14s ease-in-out infinite", animationDelay: "-2s" }}
            />
            {/* Wandering small dot */}
            <div
                className="absolute top-2/3 right-1/4 w-[160px] h-[160px] rounded-full bg-teal-300/[0.05] blur-[60px]"
                style={{ animation: "float-up 9s ease-in-out infinite", animationDelay: "-1s" }}
            />
        </div>
    );
}


// ── 4. HEX DOTS — cluster / resource pages ───────────────
export function AmbientBg4() {
    return (
        <div className="pointer-events-none fixed inset-0 overflow-hidden select-none">
            <GlobalKeyframes />
            {/* Primary offset dot layer — pans */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: "radial-gradient(rgba(20,184,166,0.09) 1.5px,transparent 1.5px)",
                    backgroundSize: "24px 24px",
                    animation: "grid-pan 10s linear infinite",
                }}
            />
            {/* Secondary offset dot layer — slightly faster pan */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: "radial-gradient(rgba(20,184,166,0.05) 1.5px,transparent 1.5px)",
                    backgroundSize: "24px 24px",
                    backgroundPosition: "12px 12px",
                    animation: "grid-pan 14s linear infinite reverse",
                }}
            />
            {/* Top-right large glow — drift2 */}
            <div
                className="absolute -top-40 right-0 w-[560px] h-[560px] rounded-full bg-teal-500/[0.08] blur-[120px]"
                style={{ animation: "drift2 21s ease-in-out infinite" }}
            />
            {/* Bottom-left warm — drift1 + pulse */}
            <div
                className="absolute -bottom-40 -left-20 w-[480px] h-[480px] rounded-full bg-amber-400/[0.06] blur-[110px]"
                style={{ animation: "drift1 18s ease-in-out infinite, pulse-slow 11s ease-in-out infinite", animationDelay: "-8s" }}
            />
            {/* Mid-left cool — float */}
            <div
                className="absolute top-1/2 -translate-y-1/2 -left-20 w-[300px] h-[400px] rounded-full bg-teal-300/[0.05] blur-[90px]"
                style={{ animation: "float-up 15s ease-in-out infinite", animationDelay: "-4s" }}
            />
            {/* Centre roaming accent */}
            <div
                className="absolute top-1/3 left-1/2 w-[180px] h-[180px] rounded-full bg-emerald-400/[0.04] blur-[70px]"
                style={{ animation: "drift3 12s ease-in-out infinite", animationDelay: "-9s" }}
            />
        </div>
    );
}


// ── 5. NOISE VIGNETTE — auth / landing pages ─────────────
export function AmbientBg5() {
    return (
        <div className="pointer-events-none fixed inset-0 overflow-hidden select-none">
            <GlobalKeyframes />
            {/* Central teal glow — breathes */}
            <div
                className="absolute top-1/2 left-1/2 w-[900px] h-[550px] rounded-full bg-teal-500/[0.09] blur-[160px]"
                style={{ animation: "breathe 14s ease-in-out infinite" }}
            />
            {/* Secondary inner glow — offset phase */}
            <div
                className="absolute top-1/2 left-1/2 w-[500px] h-[320px] rounded-full bg-teal-400/[0.06] blur-[100px]"
                style={{
                    animation: "breathe 10s ease-in-out infinite",
                    animationDelay: "-5s",
                    transform: "translate(-50%,-50%)",
                }}
            />
            {/* Warm lower-right — drifts */}
            <div
                className="absolute -bottom-20 right-0 w-[420px] h-[320px] rounded-full bg-amber-500/[0.05] blur-[100px]"
                style={{ animation: "drift1 20s ease-in-out infinite", animationDelay: "-3s" }}
            />
            {/* Cool upper-left — drifts */}
            <div
                className="absolute -top-20 -left-20 w-[380px] h-[380px] rounded-full bg-teal-400/[0.06] blur-[100px]"
                style={{ animation: "drift2 17s ease-in-out infinite", animationDelay: "-7s" }}
            />
            {/* Vignette edges — static, no animation needed */}
            <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-background/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-background/60 to-transparent" />
            <div className="absolute top-0 bottom-0 left-0 w-40 bg-gradient-to-r from-background/40 to-transparent" />
            <div className="absolute top-0 bottom-0 right-0 w-40 bg-gradient-to-l from-background/40 to-transparent" />
        </div>
    );
}
import { useEffect, useRef, useState } from "react";

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    opacity: number;
}



export function AmbientBg6() {
    return(
        <div className="pointer-events-none fixed inset-0 overflow-hidden select-none ">
            <GridBackground />
            <div className="absolute inset-0">
                <NeuralCanvas />
            </div>
        </div>
)
}