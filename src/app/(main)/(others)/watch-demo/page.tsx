"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RiGraduationCapLine,
  RiUserLine,
  RiPlayCircleLine,
  RiArrowRightLine,
  RiLoaderLine,
  RiShieldCheckLine,
  RiSparklingFill,
  RiCheckLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────
type DemoRole = "teacher" | "student";

// ─── Config from env vars ─────────────────────────────────
const DEMO_CREDENTIALS = {
  teacher: {
    email: process.env.NEXT_PUBLIC_DEMO_TEACHER_EMAIL!,
    password: process.env.NEXT_PUBLIC_DEMO_TEACHER_PASSWORD!,
  },
  student: {
    email: process.env.NEXT_PUBLIC_DEMO_STUDENT_EMAIL!,
    password: process.env.NEXT_PUBLIC_DEMO_STUDENT_PASSWORD!,
  },
};

// ─── Feature list ─────────────────────────────────────────
const TEACHER_FEATURES = [
  "Create & manage learning clusters",
  "Schedule sessions & assign tasks",
  "Review submissions with rubric feedback",
  "Track member progress & analytics",
  "Upload resources & run quizzes",
];

const STUDENT_FEATURES = [
  "Join clusters & access sessions",
  "Submit tasks & track deadlines",
  "AI study companion on any resource",
  "Earn milestone badges automatically",
  "Download verified PDF certificates",
];

// ─── Demo Card ────────────────────────────────────────────
function DemoCard({
  role,
  selected,
  loading,
  onClick,
}: {
  role: DemoRole;
  selected: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  const isTeacher = role === "teacher";
  const gradient = isTeacher
    ? "linear-gradient(135deg, #0f766e 0%, #0d9488 40%, #0891b2 100%)"
    : "linear-gradient(135deg, #4c1d95 0%, #6d28d9 40%, #7c3aed 100%)";
  const glow = isTeacher ? "rgba(13,148,136,0.45)" : "rgba(109,40,217,0.45)";
  const features = isTeacher ? TEACHER_FEATURES : STUDENT_FEATURES;
  const label = isTeacher ? "Teacher Demo" : "Student Demo";
  const icon = isTeacher ? <RiGraduationCapLine className="text-[28px]" /> : <RiUserLine className="text-[28px]" />;
  const description = isTeacher
    ? "Experience the full teaching workflow — create clusters, grade tasks, and manage your learning community."
    : "Explore the learner journey — join sessions, submit work, and earn certifications.";

  return (
    <button
      id={`demo-${role}-btn`}
      onClick={onClick}
      disabled={loading}
      className={cn(
        "relative rounded-3xl overflow-hidden p-8 text-left transition-all duration-300",
        "hover:-translate-y-2 w-full cursor-pointer",
        selected && "ring-4 ring-white/40 scale-[1.01]",
        loading && "opacity-80 cursor-not-allowed"
      )}
      style={{
        background: gradient,
        boxShadow: selected
          ? `0 28px 70px -10px ${glow.replace("0.45", "0.7")}`
          : `0 20px 60px -12px ${glow}`,
      }}
    >
      {/* Decorative rings */}
      <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full border border-white/10 pointer-events-none" />
      <div className="absolute -top-2 -right-2 w-24 h-24 rounded-full border border-white/[0.08] pointer-events-none" />
      <div className="absolute -bottom-12 right-8 w-36 h-36 rounded-full border border-white/[0.06] pointer-events-none" />

      {/* Icon */}
      <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 text-white mb-5">
        {icon}
      </div>

      {/* Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-bold tracking-widest uppercase mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
        {label}
      </div>

      {/* Title */}
      <h3 className="text-[22px] font-extrabold text-white leading-[1.2] tracking-tight mb-3">
        {isTeacher ? "Lead. Teach.\nInspire growth." : "Learn. Submit.\nEarn your badge."}
      </h3>

      {/* Description */}
      <p className="text-sm leading-relaxed text-white/75 mb-6">{description}</p>

      {/* Feature list */}
      <ul className="flex flex-col gap-2 mb-7">
        {features.map((feat) => (
          <li key={feat} className="flex items-center gap-2.5 text-sm text-white/85">
            <RiCheckLine className="flex-shrink-0 text-white/60" />
            {feat}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.18] backdrop-blur-sm border border-white/25 text-white text-sm font-bold transition-all duration-200 hover:bg-white/[0.28]">
        {loading && selected ? (
          <>
            <RiLoaderLine className="animate-spin" />
            Signing in…
          </>
        ) : (
          <>
            <RiPlayCircleLine />
            Try as {isTeacher ? "Teacher" : "Student"}
            <RiArrowRightLine />
          </>
        )}
      </div>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────
export default function WatchDemoPage() {
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<DemoRole | null>(null);

  const handleDemoLogin = async (role: DemoRole) => {
    setLoadingRole(role);
    const creds = DEMO_CREDENTIALS[role];
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: creds.email, password: creds.password }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Login failed");
      toast.success(`Logged in as demo ${role}!`);
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Demo login failed. Please try again.");
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      {/* ── Hero header ───────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-16 lg:pt-36 lg:pb-20">
        {/* Grid bg */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(20,184,166,0.07),transparent)] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border-teal-200/60 dark:border-teal-800/60 mb-5">
            <RiSparklingFill className="animate-pulse" />
            Interactive Demo
          </div>

          <h1 className="text-[clamp(2.4rem,6vw,4rem)] font-extrabold tracking-tight leading-[1.08] mb-5">
            Experience Nexora{" "}
            <span
              style={{
                background: "linear-gradient(135deg,#0d9488 0%,#14b8a6 50%,#5eead4 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              live
            </span>
          </h1>

          <p className="text-[clamp(1rem,2vw,1.2rem)] text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-4">
            Choose your role to auto-login with a demo account and explore everything Nexora has to offer — no sign-up required.
          </p>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 text-xs text-zinc-400 dark:text-zinc-600">
            {["No sign-up required", "Full feature access", "Real data environment"].map((item, i) => (
              <span key={item} className="flex items-center gap-1.5">
                {i > 0 && <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />}
                <RiShieldCheckLine className="text-teal-500 dark:text-teal-600" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Demo cards ────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-24 lg:pb-32">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <DemoCard
            role="teacher"
            selected={loadingRole === "teacher"}
            loading={loadingRole !== null}
            onClick={() => handleDemoLogin("teacher")}
          />
          <DemoCard
            role="student"
            selected={loadingRole === "student"}
            loading={loadingRole !== null}
            onClick={() => handleDemoLogin("student")}
          />
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 mt-8">
          Demo accounts use shared data.{" "}
          <Link href="/auth/signin" className="underline hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
            Sign in with your own account
          </Link>{" "}
          or{" "}
          <Link href="/auth/signup" className="underline hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
            create one for free
          </Link>.
        </p>
      </section>
    </main>
  );
}
