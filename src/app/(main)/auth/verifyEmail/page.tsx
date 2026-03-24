"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  RiMailOpenLine,
  RiArrowRightLine,
  RiArrowLeftLine,
  RiRefreshLine,
  RiCheckboxCircleLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

// ─── OTP length ───────────────────────────────────────────
const OTP_LENGTH = 6;

// ─── Single OTP digit input ───────────────────────────────
function OtpBox({
  value,
  index,
  inputRef,
  onChange,
  onKeyDown,
  onPaste,
  hasError,
}: {
  value: string;
  index: number;
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
        "w-12 h-14 sm:w-14 sm:h-16 rounded-xl text-center text-[22px] font-extrabold",
        "border-2 transition-all duration-150",
        "focus:outline-none focus:scale-105",
        "bg-zinc-100 dark:bg-zinc-800/80",
        hasError
          ? "border-red-400 dark:border-red-500/70 text-red-600 dark:text-red-400 focus:border-red-500"
          : value
            ? "border-teal-400 dark:border-teal-500 text-teal-700 dark:text-teal-300 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
            : "border-zinc-200 dark:border-zinc-700/60 text-zinc-900 dark:text-zinc-50 focus:border-teal-400 dark:focus:border-teal-500 focus:ring-2 focus:ring-teal-400/20"
      )}
    />
  );
}


// ─── Page ─────────────────────────────────────────────────
export default function VerifyEmailPage({
  email: initialEmail = "",
}: {
  email?: string;
}) {
  const router = useRouter();

  const [email, setEmail] = useState(initialEmail);
  const [isEmailLoading, setIsEmailLoading] = useState(true); // ← loading state
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/auth/me`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (data?.data?.email) {
          setEmail(data.data.email);
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      } finally {
        setIsEmailLoading(false);
      }
    };
    fetchUser();
  }, []);

  const startCooldown = () => {
    setResendCooldown(60);
    const t = setInterval(() => {
      setResendCooldown((v) => { if (v <= 1) { clearInterval(t); return 0; } return v - 1; });
    }, 1000);
  };

  const setRef = useCallback((i: number) => (el: HTMLInputElement | null) => {
    inputRefs.current[i] = el;
  }, []);

  const handleChange = (i: number, v: string) => {
    setError("");
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < OTP_LENGTH - 1) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0) inputRefs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < OTP_LENGTH - 1) inputRefs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    const next = [...digits];
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < OTP_LENGTH) { setError("Please enter the full 6-digit code"); return; }
    setIsLoading(true);
    try {
      // TODO: await authClient.emailOtp.verifyEmail({ email, otp: code });
      console.log(code)

      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email,
          otp: code

        }),
        credentials: "include"
      })

      const data = await res.json();
      console.log(data);

      if (data.success) {
        setSuccess(true);
        router.push('/');
      }

    } catch {
      setError("Invalid or expired code. Please try again.");
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsResending(true);
    try {
      // TODO: await authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" });
            const res = await fetch("/api/auth/resend-verification-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email,
        }),
        credentials: "include"
      })
      setError("");
      setDigits(Array(OTP_LENGTH).fill(""));
      startCooldown();
      inputRefs.current[0]?.focus();
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-12">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_0%,rgba(20,184,166,0.06),transparent)] dark:bg-[radial-gradient(ellipse_50%_40%_at_50%_0%,rgba(20,184,166,0.09),transparent)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xl shadow-zinc-900/5 dark:shadow-zinc-900/30 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-teal-500/0 via-teal-500 to-teal-500/0" />

          <div className="p-8">
            <Link href="/register" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-zinc-500 dark:text-zinc-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors mb-6">
              <RiArrowLeftLine className="text-sm" />
              Back
            </Link>

            {success ? (
              <div className="py-8 flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-teal-600 dark:text-teal-400 text-3xl">
                  <RiCheckboxCircleLine />
                </div>
                <h2 className="text-[18px] font-bold text-zinc-900 dark:text-zinc-50">Email verified!</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Redirecting to your dashboard…</p>
                <div className="w-5 h-5 border-2 border-zinc-200 dark:border-zinc-700 border-t-teal-500 rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Icon */}
                <div className="flex flex-col items-center text-center mb-7">
                  <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-800/60 flex items-center justify-center text-teal-600 dark:text-teal-400 text-3xl mb-5">
                    <RiMailOpenLine />
                  </div>
                  <h1 className="text-[22px] font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
                    Check your inbox
                  </h1>
                  <p className="text-[13.5px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    We sent a 6-digit code to{" "}
                    {isEmailLoading ? (
                      // ✅ skeleton loader — email আসার আগে দেখাবে
                      <span className="inline-block w-36 h-4 rounded-md bg-zinc-200 dark:bg-zinc-700 animate-pulse align-middle" />
                    ) : (
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300 break-all">
                        {email || "your email"}
                      </span>
                    )}
                  </p>
                </div>

                {/* OTP form */}
                <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6">
                  <div className="flex gap-2 sm:gap-3">
                    {digits.map((d, i) => (
                      <OtpBox
                        key={i}
                        value={d}
                        index={i}
                        inputRef={setRef(i)}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        hasError={!!error}
                      />
                    ))}
                  </div>

                  {error && (
                    <p className="text-[12.5px] text-red-500 dark:text-red-400 font-medium text-center -mt-2">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || digits.join("").length < OTP_LENGTH}
                    className={cn(
                      "w-full h-11 rounded-xl flex items-center justify-center gap-2",
                      "bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600",
                      "text-white text-[15px] font-bold",
                      "shadow-sm shadow-teal-600/20",
                      "transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]",
                      "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    )}
                  >
                    {isLoading ? (
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Verify email <RiArrowRightLine className="text-base" /></>
                    )}
                  </button>
                </form>

                {/* Resend */}
                <div className="mt-6 text-center">
                  <p className="text-[12.5px] text-zinc-500 dark:text-zinc-500 mb-2">
                    Didn't receive the code?
                  </p>
                  <button
                    onClick={handleResend}
                    disabled={isResending || resendCooldown > 0}
                    className={cn(
                      "inline-flex items-center gap-1.5 text-[13px] font-semibold",
                      resendCooldown > 0 || isResending
                        ? "text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                        : "text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                    )}
                  >
                    {isResending ? (
                      <span className="w-3.5 h-3.5 border-2 border-zinc-300 border-t-teal-500 rounded-full animate-spin" />
                    ) : (
                      <RiRefreshLine className="text-sm" />
                    )}
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}