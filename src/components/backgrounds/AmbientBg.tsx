// ─────────────────────────────────────────────────────────
// FILE: src/components/backgrounds/AmbientBg.tsx
// 5 ambient background variants for Nexora
// Usage: <AmbientBg1 /> inside any page (no sidebar wrapper needed)
// All are pointer-events-none, fixed, -z-10
// ─────────────────────────────────────────────────────────

// ── 1. TEAL MESH — default, suits dashboard / profile ─────
// Dot grid + 3 soft teal radial glows
export function AmbientBg1() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none">
      {/* Dot grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(rgba(20,184,166,0.11) 1px,transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />
      {/* Top-left glow */}
      <div className="absolute -top-60 -left-40 w-[600px] h-[600px] rounded-full bg-teal-500/[0.06] blur-[120px]" />
      {/* Mid-right glow */}
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-teal-400/[0.04] blur-[100px]" />
      {/* Bottom-center warm accent */}
      <div className="absolute -bottom-60 left-1/3 w-[500px] h-[400px] rounded-full bg-amber-500/[0.04] blur-[110px]" />
    </div>
  );
}


// ── 2. CROSS-HATCH GRID — suits analytics / data pages ───
// Fine line grid + teal top sweep + violet bottom accent
export function AmbientBg2() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none">
      {/* Fine cross-hatch */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(20,184,166,1) 1px,transparent 1px)," +
            "linear-gradient(90deg,rgba(20,184,166,1) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Top centre sweep */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[400px] rounded-full bg-teal-500/[0.07] blur-[130px]" />
      {/* Bottom-left violet */}
      <div className="absolute -bottom-40 -left-20 w-[500px] h-[400px] rounded-full bg-violet-500/[0.05] blur-[100px]" />
      {/* Bottom-right teal */}
      <div className="absolute -bottom-20 right-0 w-[350px] h-[300px] rounded-full bg-teal-400/[0.04] blur-[90px]" />
    </div>
  );
}


// ── 3. DIAGONAL LINES — suits session / announcement pages ─
// Diagonal stripe texture + asymmetric glows
export function AmbientBg3() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none">
      {/* Diagonal stripe */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(" +
            "135deg," +
            "rgba(20,184,166,1) 0px," +
            "rgba(20,184,166,1) 1px," +
            "transparent 1px," +
            "transparent 32px" +
            ")",
        }}
      />
      {/* Far-left tall glow */}
      <div className="absolute top-0 -left-60 w-[500px] h-[800px] rounded-full bg-teal-500/[0.06] blur-[140px]" />
      {/* Top-right warm */}
      <div className="absolute -top-20 right-0 w-[400px] h-[350px] rounded-full bg-amber-400/[0.05] blur-[100px]" />
      {/* Centre-bottom cool */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-sky-500/[0.04] blur-[120px]" />
    </div>
  );
}


// ── 4. HEX DOTS — suits cluster / resource pages ──────────
// Slightly larger offset dot grid + three-point glow triangle
export function AmbientBg4() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none">
      {/* Offset dot grid (hex-like feel) */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(rgba(20,184,166,0.09) 1.5px,transparent 1.5px)",
          backgroundSize: "24px 24px",
          backgroundPosition: "0 0",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(rgba(20,184,166,0.05) 1.5px,transparent 1.5px)",
          backgroundSize: "24px 24px",
          backgroundPosition: "12px 12px",
        }}
      />
      {/* Top-right large glow */}
      <div className="absolute -top-40 right-0 w-[550px] h-[550px] rounded-full bg-teal-500/[0.07] blur-[120px]" />
      {/* Bottom-left warm */}
      <div className="absolute -bottom-40 -left-20 w-[480px] h-[480px] rounded-full bg-amber-400/[0.05] blur-[110px]" />
      {/* Mid-left cool accent */}
      <div className="absolute top-1/2 -translate-y-1/2 -left-20 w-[300px] h-[400px] rounded-full bg-teal-300/[0.04] blur-[90px]" />
    </div>
  );
}


// ── 5. NOISE VIGNETTE — suits auth / landing pages ────────
// No grid, pure cinematic: dark vignette edges + central glow
// Works best on dark backgrounds (bg-zinc-950 pages)
export function AmbientBg5() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none">
      {/* Central teal glow — hero focal point */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-teal-500/[0.08] blur-[150px]" />
      {/* Top vignette */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-background/60 to-transparent" />
      {/* Bottom vignette */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-background/60 to-transparent" />
      {/* Left vignette */}
      <div className="absolute top-0 bottom-0 left-0 w-40 bg-gradient-to-r from-background/40 to-transparent" />
      {/* Right vignette */}
      <div className="absolute top-0 bottom-0 right-0 w-40 bg-gradient-to-l from-background/40 to-transparent" />
      {/* Subtle warm lower-right accent */}
      <div className="absolute -bottom-20 right-0 w-[400px] h-[300px] rounded-full bg-amber-500/[0.04] blur-[100px]" />
      {/* Cool upper-left accent */}
      <div className="absolute -top-20 -left-20 w-[350px] h-[350px] rounded-full bg-teal-400/[0.05] blur-[100px]" />
    </div>
  );
}