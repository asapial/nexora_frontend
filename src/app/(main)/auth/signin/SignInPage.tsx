"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  RiMailLine,
  RiLockPasswordLine,
  RiEyeLine,
  RiEyeOffLine,
  RiGoogleLine,
  RiArrowRightLine,
  RiSparklingFill,
  RiShieldCheckLine,
  RiGroupLine,
  RiBookOpenLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { toast } from "sonner";



// ─── Types ────────────────────────────────────────────────
interface LoginForm {
  email: string;
  password: string;
}

// ─── Floating info card ────────────────────────────────────
function FloatingCard({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "absolute flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl",
        "bg-white/10 backdrop-blur-md border border-white/15",
        "shadow-lg",
        className
      )}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-400/20 text-teal-300 text-base">
        {icon}
      </div>
      <div>
        <p className="text-[10.5px] text-white/50 leading-none mb-0.5">{label}</p>
        <p className="text-[13px] font-semibold text-white leading-none">{value}</p>
      </div>
    </div>
  );
}

// ─── Input field ───────────────────────────────────────────
function AuthInput({
  label,
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  icon,
  rightSlot,
  error,
}: {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ReactNode;
  rightSlot?: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 text-base pointer-events-none">
          {icon}
        </span>
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full h-11 pl-10 pr-4 rounded-xl text-sm font-medium",
            "bg-zinc-100 dark:bg-zinc-800/80",
            "border",
            error
              ? "border-red-400 dark:border-red-500/70 focus:ring-red-400/30"
              : "border-zinc-200 dark:border-zinc-700/60 focus:border-teal-400 dark:focus:border-teal-500",
            "text-zinc-900 dark:text-zinc-50",
            "placeholder:text-zinc-400 dark:placeholder:text-zinc-600",
            "focus:outline-none focus:ring-2",
            error ? "focus:ring-red-400/20" : "focus:ring-teal-400/20",
            "transition-all duration-150",
            rightSlot && "pr-11"
          )}
        />
        {rightSlot && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightSlot}</span>
        )}
      </div>
      {error && (
        <p className="text-[12px] text-red-500 dark:text-red-400 font-medium">{error}</p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────
export default function SignInPage() {
  const router = useRouter();
  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginForm>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const set = (k: keyof LoginForm) => (v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: "" }));
  };

  const validate = () => {
    const e: Partial<LoginForm> = {};
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setIsLoading(true);
    try {



      // const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login`, {
      const res = await fetch(`/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
        credentials: "include",
      });

      const data = await res.json();

      if(data.success){
        toast.success("User login successfully", {position:"top-right"})
         window.location.href = "/dashboard"
      }




    } catch (err: any) {

      setErrors({ password: err.message || "Invalid email or password" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = () => {
    setIsGoogleLoading(true);
    // Navigate to the backend EJS redirect page via Next.js proxy.
    // The EJS page shows a "Connecting with Google…" UI, calls BetterAuth
    // to get the Google OAuth URL, then redirects the browser to Google.
    window.location.href = "/api/auth/login/google";
  };


  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950">

      {/* ══ Left decorative panel ══════════════════════════ */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col items-center justify-center p-16"
        style={{ background: "linear-gradient(135deg, #0d1117 0%, #0f2027 40%, #0a1f1c 100%)" }}
      >
        {/* Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,.04)_1px,transparent_1px)] bg-[size:60px_60px]" />
        {/* Orbs */}
        <div className="absolute top-[-120px] left-[-80px] w-[480px] h-[480px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(20,184,166,0.12) 0%, transparent 70%)", animation: "orb 14s ease-in-out infinite" }} />
        <div className="absolute bottom-[-80px] right-[-60px] w-[360px] h-[360px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 70%)", animation: "orb 10s ease-in-out infinite 4s" }} />

        <style>{`
          @keyframes orb { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(20px,-16px) scale(1.04)} 66%{transform:translate(-14px,20px) scale(.97)} }
          @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        `}</style>

        {/* Content */}
        <div className="relative z-10 max-w-[380px] w-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-14">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/25 flex items-center justify-center text-teal-400 text-lg">⬡</div>
            <span className="text-[22px] font-extrabold tracking-tight text-white">Nexora</span>
          </div>

          {/* Hero copy */}
          <h1 className="text-[clamp(2rem,3.5vw,2.8rem)] font-extrabold leading-[1.1] tracking-tight text-white mb-5">
            Welcome<br />
            <span style={{ background: "linear-gradient(135deg,#2dd4bf,#5eead4,#99f6e4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              back.
            </span>
          </h1>
          <p className="text-[14.5px] text-zinc-400 leading-relaxed mb-12">
            Sign in to manage your clusters, sessions, and members — all in one place.
          </p>

          {/* Floating cards */}
          <div className="relative h-[160px]">
            <FloatingCard icon={<RiShieldCheckLine />} label="Task Reviewed" value="Excellent ✦"
              className="top-0 left-0 animate-[float_5s_ease-in-out_infinite]" />
            <FloatingCard icon={<RiGroupLine />} label="Cluster Health" value="94 — Healthy"
              className="top-12 right-0 animate-[float_7s_ease-in-out_infinite_.8s]" />
            <FloatingCard icon={<RiBookOpenLine />} label="New Resource" value="Attention 2017"
              className="bottom-0 left-6 animate-[float_6s_ease-in-out_infinite_1.4s]" />
          </div>

          {/* Stats */}
          <div className="mt-12 flex gap-6">
            {[["12k+", "Clusters"], ["340k+", "Sessions"], ["28k+", "Certificates"]].map(([v, l]) => (
              <div key={l}>
                <p className="text-[19px] font-extrabold text-teal-400">{v}</p>
                <p className="text-[11.5px] text-zinc-500">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ Right form panel ═══════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-[420px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/20 dark:border-teal-500/25 flex items-center justify-center text-teal-600 dark:text-teal-400 text-base">⬡</div>
            <span className="text-[18px] font-extrabold tracking-tight text-zinc-900 dark:text-white">Nexora</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-[26px] font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-1.5">
              Sign in to your account
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Don't have an account?{" "}
              <Link href="/auth/signup" className="font-semibold text-teal-600 dark:text-teal-400 hover:underline">
                Create one free
              </Link>
            </p>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={isGoogleLoading}
            className={cn(
              "w-full h-11 flex items-center justify-center gap-2.5 rounded-xl",
              "border border-zinc-200 dark:border-zinc-700/60",
              "bg-white dark:bg-zinc-800/80",
              "text-sm font-semibold text-zinc-700 dark:text-zinc-200",
              "hover:bg-zinc-50 dark:hover:bg-zinc-800",
              "hover:border-zinc-300 dark:hover:border-zinc-600",
              "transition-all duration-150",
              "disabled:opacity-60 disabled:cursor-not-allowed"
            )}
          >
            {isGoogleLoading ? (
              <span className="w-4 h-4 border-2 border-zinc-300 border-t-teal-500 rounded-full animate-spin" />
            ) : (
              <RiGoogleLine className="text-base" />
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
            <span className="text-[11.5px] font-semibold text-zinc-400 dark:text-zinc-600 tracking-wider uppercase">
              or
            </span>
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <AuthInput
              label="Email address"
              id="email"
              type="email"
              placeholder="you@university.edu"
              value={form.email}
              onChange={set("email")}
              icon={<RiMailLine />}
              error={errors.email}
            />
            <AuthInput
              label="Password"
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={form.password}
              onChange={set("password")}
              icon={<RiLockPasswordLine />}
              error={errors.password}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <RiEyeOffLine className="text-base" /> : <RiEyeLine className="text-base" />}
                </button>
              }
            />

            {/* Forgot password */}
            <div className="flex justify-end -mt-1">
              <Link href="/auth/forgetPassword" className="text-[12.5px] font-semibold text-teal-600 dark:text-teal-400 hover:underline">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full h-11 mt-1 rounded-xl flex items-center justify-center gap-2",
                "bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600",
                "text-white text-[15px] font-bold",
                "shadow-sm shadow-teal-600/20",
                "transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]",
                "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              )}
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign in <RiArrowRightLine className="text-base" /></>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="mt-7 text-[11.5px] text-zinc-400 dark:text-zinc-600 text-center leading-relaxed">
            By signing in you agree to our{" "}
            <Link href="/termsOfService" className="underline hover:text-zinc-600 dark:hover:text-zinc-400">Terms</Link>{" "}
            and{" "}
            <Link href="/privacyPolicy" className="underline hover:text-zinc-600 dark:hover:text-zinc-400">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}