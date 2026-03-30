"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  RiLockPasswordLine,
  RiEyeLine,
  RiEyeOffLine,
  RiArrowRightLine,
  RiArrowLeftLine,
  RiMailLine,
  RiRefreshLine,
  RiCheckboxCircleLine,
  RiKey2Line,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { AmbientBg6 } from "@/components/backgrounds/AmbientBg";
import { toast } from "sonner";

const OTP_LENGTH = 6;

// ─── Password strength ────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const rules = [
    { label: "8+ characters",    pass: password.length >= 8 },
    { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Number",           pass: /\d/.test(password)   },
  ];
  const score = rules.filter((r) => r.pass).length;
  const color = score <= 1 ? "bg-red-400" : score === 2 ? "bg-amber-400" : "bg-teal-500";
  if (!password) return null;
  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <div className="flex gap-1">
        {[1,2,3].map((i) => (
          <div key={i} className={cn("flex-1 h-1 rounded-full transition-all duration-300", i <= score ? color : "bg-zinc-200 dark:bg-zinc-700")} />
        ))}
      </div>
      <div className="flex gap-3 flex-wrap">
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

// ─── OTP box ─────────────────────────────────────────────
function OtpBox({
  value, index, inputRef, onChange, onKeyDown, onPaste, hasError,
}: {
  value: string; index: number;
  inputRef: (el: HTMLInputElement | null) => void;
  onChange: (i: number, v: string) => void;
  onKeyDown: (i: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  hasError: boolean;
}) {
  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      maxLength={1}
      value={value}
      onChange={(e) => onChange(index, e.target.value.replace(/\D/, ""))}
      onKeyDown={(e) => onKeyDown(index, e)}
      onPaste={onPaste}
      className={cn(
        "w-11 h-13 sm:w-12 sm:h-14 rounded-xl text-center text-[20px] font-extrabold",
        "border-2 transition-all duration-150 focus:outline-none focus:scale-105",
        "bg-zinc-100 dark:bg-zinc-800/80",
        hasError
          ? "border-red-400 dark:border-red-500/70 text-red-600 dark:text-red-400"
          : value
          ? "border-teal-400 dark:border-teal-500 text-teal-700 dark:text-teal-300 focus:ring-2 focus:ring-teal-400/20"
          : "border-zinc-200 dark:border-zinc-700/60 text-zinc-900 dark:text-zinc-50 focus:border-teal-400 dark:focus:border-teal-500 focus:ring-2 focus:ring-teal-400/20"
      )}
    />
  );
}

// ─── Step indicator ───────────────────────────────────────
function StepDots({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-2 mb-6 justify-center">
      {[1, 2].map((s) => (
        <div
          key={s}
          className={cn(
            "transition-all duration-300",
            s === step
              ? "w-6 h-2 rounded-full bg-teal-500 dark:bg-teal-400"
              : s < step
              ? "w-2 h-2 rounded-full bg-teal-400/60 dark:bg-teal-600/60"
              : "w-2 h-2 rounded-full bg-zinc-200 dark:bg-zinc-700"
          )}
        />
      ))}
      <span className="text-[11px] text-zinc-400 dark:text-zinc-600 ml-1 font-medium">
        Step {step} of 2
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────
export default function ResetPasswordPage() {
  const router = useRouter();

  // Two-step: 1 = enter OTP, 2 = enter new password
  const [step, setStep] = useState<1 | 2>(1);
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [passError, setPassError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const searchParams = useSearchParams();
const email = searchParams.get("email") || "";

  const startCooldown = () => {
    setResendCooldown(60);
    const t = setInterval(() => {
      setResendCooldown((v) => { if (v <= 1) { clearInterval(t); return 0; } return v - 1; });
    }, 1000);
  };

  const setRef = useCallback((i: number) => (el: HTMLInputElement | null) => {
    inputRefs.current[i] = el;
  }, []);

  const handleDigitChange = (i: number, v: string) => {
    setOtpError("");
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < OTP_LENGTH - 1) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputRefs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) inputRefs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < OTP_LENGTH - 1) inputRefs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    const next = [...digits];
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };


const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < OTP_LENGTH) { setOtpError("Enter the full 6-digit code"); return; }

    setIsLoading(true);
    try {
        const res = await fetch("/api/auth/verifyResetOtp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp: code }),
            credentials: "include",
        });

        const data = await res.json();

        if (!data.success) {
            throw new Error(data.message || "Invalid or expired code");
        }

        setStep(2); 

    } catch (err: any) {
        setOtpError(err.message || "Invalid or expired code. Try again or resend.");
        setDigits(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
    } finally {
        setIsLoading(false);
    }
};


const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;
    if (!newPassword) { setPassError("New password is required"); valid = false; }
    else if (newPassword.length < 8) { setPassError("Must be at least 8 characters"); valid = false; }
    if (!confirmPassword) { setConfirmError("Please confirm your password"); valid = false; }
    else if (newPassword !== confirmPassword) { setConfirmError("Passwords do not match"); valid = false; }
    if (!valid) return;

    setIsLoading(true);
    try {
        const code = digits.join("");

        const res = await fetch("/api/auth/resetPassword", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp: code, newPassword }),
            credentials: "include",
        });

        const data = await res.json();

        if (!data.success) {
            throw new Error(data.message || "Reset failed. Please start over.");
        }

    toast.success("Password has been reset successfully.", { position: "top-right" });
        setSuccess(true);
        setTimeout(() => router.push("/auth/signin"), 1000);

    } catch (err: any) {
        setPassError(err.message || "Reset failed. Please start over.");
    } finally {
        setIsLoading(false);
    }
};


const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsResending(true);
    try {
        const res = await fetch("/api/auth/forgetPassword", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
            credentials: "include",
        });

        const data = await res.json();

        if (!data.success) throw new Error(data.message);
        if(data.success){
          toast.success("OTP has been sent for reset.", { position: "top-right" });
          setDigits(Array(OTP_LENGTH).fill(""));
          setOtpError("");
          startCooldown();
          inputRefs.current[0]?.focus();

        }


    } catch (err: any) {
        setOtpError(err.message || "Failed to resend. Try again.");
    } finally {
        setIsResending(false);
    }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-12">
    <AmbientBg6></AmbientBg6>

      <div className="relative z-10 w-full max-w-[440px]">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xl shadow-zinc-900/5 dark:shadow-zinc-900/30 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-teal-500/0 via-teal-500 to-teal-500/0" />

          <div className="p-8">
            <Link href="/login" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-zinc-500 dark:text-zinc-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors mb-5">
              <RiArrowLeftLine className="text-sm" />
              Back to login
            </Link>

            {success ? (
              // ── Success state ────────────────────────
              <div className="py-8 flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-teal-600 dark:text-teal-400 text-3xl">
                  <RiCheckboxCircleLine />
                </div>
                <h2 className="text-[18px] font-bold text-zinc-900 dark:text-zinc-50">Password reset!</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-[240px]">
                  Your password has been updated. Redirecting to login…
                </p>
                <div className="w-5 h-5 border-2 border-zinc-200 dark:border-zinc-700 border-t-teal-500 rounded-full animate-spin" />
              </div>
            ) : step === 1 ? (
              // ── Step 1: OTP entry ────────────────────
              <>
                <StepDots step={1} />
                <div className="flex flex-col items-center text-center mb-7">
                  <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-800/60 flex items-center justify-center text-teal-600 dark:text-teal-400 text-2xl mb-4">
                    <RiMailLine />
                  </div>
                  <h1 className="text-[21px] font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
                    Enter your reset code
                  </h1>
                  <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-[300px]">
                    We sent a 6-digit code to your email address. Enter it below to continue.
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="flex flex-col items-center gap-5">
                  <div className="flex gap-2">
                    {digits.map((d, i) => (
                      <OtpBox key={i} value={d} index={i} inputRef={setRef(i)}
                        onChange={handleDigitChange} onKeyDown={handleKeyDown}
                        onPaste={handlePaste} hasError={!!otpError} />
                    ))}
                  </div>

                  {otpError && (
                    <p className="text-[12.5px] text-red-500 dark:text-red-400 font-medium text-center -mt-1">
                      {otpError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || digits.join("").length < OTP_LENGTH}
                    className={cn(
                      "w-full h-11 rounded-xl flex items-center justify-center gap-2",
                      "bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600",
                      "text-white text-[15px] font-bold shadow-sm shadow-teal-600/20",
                      "transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]",
                      "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    )}
                  >
                    {isLoading ? (
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Verify code <RiArrowRightLine className="text-base" /></>
                    )}
                  </button>
                </form>

                {/* Resend */}
                <div className="mt-5 text-center">
                  <p className="text-[12px] text-zinc-500 dark:text-zinc-500 mb-1.5">Didn't get the code?</p>
                  <button
                    onClick={handleResend}
                    disabled={isResending || resendCooldown > 0}
                    className={cn(
                      "inline-flex items-center gap-1.5 text-[13px] font-semibold",
                      resendCooldown > 0 || isResending
                        ? "text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                        : "text-teal-600 dark:text-teal-400 hover:underline"
                    )}
                  >
                    {isResending ? <span className="w-3.5 h-3.5 border-2 border-zinc-300 border-t-teal-500 rounded-full animate-spin" /> : <RiRefreshLine className="text-sm" />}
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                  </button>
                </div>
              </>
            ) : (
              // ── Step 2: New password ─────────────────
              <>
                <StepDots step={2} />
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-800/60 flex items-center justify-center text-teal-600 dark:text-teal-400 text-xl">
                    <RiKey2Line />
                  </div>
                  <div>
                    <h1 className="text-[20px] font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-none mb-0.5">
                      Set new password
                    </h1>
                    <p className="text-[12.5px] text-zinc-500 dark:text-zinc-500">
                      Code verified ✓ — choose a strong password
                    </p>
                  </div>
                </div>

                <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                  <div>
                    <label htmlFor="newPass" className="block text-[13px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      New password
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 text-base pointer-events-none">
                        <RiLockPasswordLine />
                      </span>
                      <input
                        id="newPass"
                        type={showNew ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setPassError(""); }}
                        className={cn(
                          "w-full h-11 pl-10 pr-11 rounded-xl text-sm font-medium",
                          "bg-zinc-100 dark:bg-zinc-800/80 border",
                          passError
                            ? "border-red-400 dark:border-red-500/70 focus:ring-red-400/20"
                            : "border-zinc-200 dark:border-zinc-700/60 focus:border-teal-400 dark:focus:border-teal-500 focus:ring-teal-400/20",
                          "text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-600",
                          "focus:outline-none focus:ring-2 transition-all duration-150"
                        )}
                      />
                      <button type="button" onClick={() => setShowNew((p) => !p)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                        {showNew ? <RiEyeOffLine className="text-base" /> : <RiEyeLine className="text-base" />}
                      </button>
                    </div>
                    {passError && <p className="text-[12px] text-red-500 dark:text-red-400 font-medium mt-1.5">{passError}</p>}
                    <PasswordStrength password={newPassword} />
                  </div>

                  <div>
                    <label htmlFor="confirmPass" className="block text-[13px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Confirm new password
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 text-base pointer-events-none">
                        <RiLockPasswordLine />
                      </span>
                      <input
                        id="confirmPass"
                        type={showConfirm ? "text" : "password"}
                        placeholder="Re-enter your new password"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setConfirmError(""); }}
                        className={cn(
                          "w-full h-11 pl-10 pr-11 rounded-xl text-sm font-medium",
                          "bg-zinc-100 dark:bg-zinc-800/80 border",
                          confirmError
                            ? "border-red-400 dark:border-red-500/70 focus:ring-red-400/20"
                            : "border-zinc-200 dark:border-zinc-700/60 focus:border-teal-400 dark:focus:border-teal-500 focus:ring-teal-400/20",
                          "text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-600",
                          "focus:outline-none focus:ring-2 transition-all duration-150"
                        )}
                      />
                      <button type="button" onClick={() => setShowConfirm((p) => !p)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                        {showConfirm ? <RiEyeOffLine className="text-base" /> : <RiEyeLine className="text-base" />}
                      </button>
                    </div>
                    {confirmError && <p className="text-[12px] text-red-500 dark:text-red-400 font-medium mt-1.5">{confirmError}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={cn(
                      "w-full h-11 mt-1 rounded-xl flex items-center justify-center gap-2",
                      "bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600",
                      "text-white text-[15px] font-bold shadow-sm shadow-teal-600/20",
                      "transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]",
                      "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                    )}
                  >
                    {isLoading ? (
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Reset password <RiArrowRightLine className="text-base" /></>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}