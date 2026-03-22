"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  RiLockPasswordLine,
  RiEyeLine,
  RiEyeOffLine,
  RiArrowRightLine,
  RiArrowLeftLine,
  RiShieldCheckLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────
interface FormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
type FormErrors = Partial<FormData> & { general?: string };

// ─── Password strength ────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const rules = [
    { label: "8+ characters", pass: password.length >= 8 },
    { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Number", pass: /\d/.test(password) },
    { label: "Special character", pass: /[^a-zA-Z0-9]/.test(password) },
  ];
  const score = rules.filter((r) => r.pass).length;
  const colorBar = score <= 1 ? "bg-red-400" : score === 2 ? "bg-amber-400" : score === 3 ? "bg-yellow-400" : "bg-teal-500";
  const label = ["", "Weak", "Fair", "Good", "Strong"][score];

  if (!password) return null;

  return (
    <div className="mt-2 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={cn("flex-1 h-1 rounded-full transition-all duration-300", i <= score ? colorBar : "bg-zinc-200 dark:bg-zinc-700")} />
          ))}
        </div>
        <span className={cn("text-[11.5px] font-bold min-w-[42px] text-right", score <= 1 ? "text-red-400" : score === 2 ? "text-amber-400" : score === 3 ? "text-yellow-500 dark:text-yellow-400" : "text-teal-500 dark:text-teal-400")}>
          {label}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {rules.map((r) => (
          <span key={r.label} className={cn("flex items-center gap-1 text-[11px] font-medium", r.pass ? "text-teal-600 dark:text-teal-400" : "text-zinc-400 dark:text-zinc-600")}>
            <span>{r.pass ? "✓" : "○"}</span>
            {r.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Shared input ─────────────────────────────────────────
function PasswordInput({
  label,
  id,
  placeholder,
  value,
  onChange,
  show,
  onToggleShow,
  error,
  hint,
}: {
  label: string;
  id: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  error?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 text-base pointer-events-none">
          <RiLockPasswordLine />
        </span>
        <input
          id={id}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full h-11 pl-10 pr-11 rounded-xl text-sm font-medium",
            "bg-zinc-100 dark:bg-zinc-800/80",
            "border",
            error
              ? "border-red-400 dark:border-red-500/70 focus:ring-red-400/20"
              : "border-zinc-200 dark:border-zinc-700/60 focus:border-teal-400 dark:focus:border-teal-500 focus:ring-teal-400/20",
            "text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-600",
            "focus:outline-none focus:ring-2 transition-all duration-150"
          )}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          {show ? <RiEyeOffLine className="text-base" /> : <RiEyeLine className="text-base" />}
        </button>
      </div>
      {hint && !error && <p className="text-[11.5px] text-zinc-400 dark:text-zinc-600">{hint}</p>}
      {error && <p className="text-[12px] text-red-500 dark:text-red-400 font-medium">{error}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────
export default function ChangePasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [show, setShow] = useState({ current: false, newP: false, confirm: false });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (k: keyof FormData) => (v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: "" }));
  };
  const toggleShow = (k: keyof typeof show) => setShow((p) => ({ ...p, [k]: !p[k] }));

  const validate = () => {
    const e: FormErrors = {};
    if (!form.currentPassword) e.currentPassword = "Current password is required";
    if (!form.newPassword) e.newPassword = "New password is required";
    else if (form.newPassword.length < 8) e.newPassword = "Password must be at least 8 characters";
    else if (form.newPassword === form.currentPassword) e.newPassword = "New password must differ from current password";
    if (!form.confirmPassword) e.confirmPassword = "Please confirm your new password";
    else if (form.newPassword !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setIsLoading(true);
    try {
      // TODO: await authClient.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });

      const res = await fetch(`/api/auth/changePassword`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword: form.currentPassword,
          newPassword: form.newPassword
        }),
        credentials: "include",
      });

      const data = await res.json();

      console.log(data);
      if (data.success) {
        switch (data.data.user.role) {
          case "ADMIN":
            window.location.href = "/dashboard/admin"
            break
          case "TEACHER":
            window.location.href = "/dashboard/teacher"
            break
          case "STUDENT":
            window.location.href = "/dashboard/student"
            break
          default:
            window.location.href = "/"
        }

        setSuccess(true);
      }



    } catch (err: any) {
      setErrors({ general: err?.message ?? "Current password is incorrect" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-12">

      {/* Background orb */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(20,184,166,0.06),transparent)] dark:bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(20,184,166,0.09),transparent)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[440px]">

        {/* Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xl shadow-zinc-900/5 dark:shadow-zinc-900/30 overflow-hidden">

          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-teal-500/0 via-teal-500 to-teal-500/0" />

          <div className="p-8">
            {/* Back link */}
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-zinc-500 dark:text-zinc-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors mb-6">
              <RiArrowLeftLine className="text-sm" />
              Back to dashboard
            </Link>

            {/* Icon + header */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-800/60 flex items-center justify-center text-teal-600 dark:text-teal-400 text-xl">
                <RiShieldCheckLine />
              </div>
              <div>
                <h1 className="text-[20px] font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-none mb-0.5">
                  Change password
                </h1>
                <p className="text-[12.5px] text-zinc-500 dark:text-zinc-500">
                  Choose a strong, unique password
                </p>
              </div>
            </div>

            {/* Success state */}
            {success ? (
              <div className="py-8 flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 rounded-full bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-teal-600 dark:text-teal-400 text-2xl">
                  <RiShieldCheckLine />
                </div>
                <h2 className="text-[17px] font-bold text-zinc-900 dark:text-zinc-50">Password changed!</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Redirecting you to your dashboard…</p>
                <div className="w-6 h-6 border-2 border-zinc-200 dark:border-zinc-700 border-t-teal-500 rounded-full animate-spin" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* General error */}
                {errors.general && (
                  <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-sm font-medium text-red-600 dark:text-red-400">
                    {errors.general}
                  </div>
                )}

                <PasswordInput
                  label="Current password" id="current"
                  placeholder="Your current password"
                  value={form.currentPassword} onChange={set("currentPassword")}
                  show={show.current} onToggleShow={() => toggleShow("current")}
                  error={errors.currentPassword}
                />

                <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />

                <div>
                  <PasswordInput
                    label="New password" id="newPassword"
                    placeholder="Create a strong password"
                    value={form.newPassword} onChange={set("newPassword")}
                    show={show.newP} onToggleShow={() => toggleShow("newP")}
                    error={errors.newPassword}
                  />
                  <PasswordStrength password={form.newPassword} />
                </div>

                <PasswordInput
                  label="Confirm new password" id="confirmPassword"
                  placeholder="Re-enter your new password"
                  value={form.confirmPassword} onChange={set("confirmPassword")}
                  show={show.confirm} onToggleShow={() => toggleShow("confirm")}
                  error={errors.confirmPassword}
                />

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
                    <>Update password <RiArrowRightLine className="text-base" /></>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}