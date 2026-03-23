"use client";

import { useState } from "react";
import Link from "next/link";
import {
    RiMailLine,
    RiArrowRightLine,
    RiArrowLeftLine,
    RiMailSendLine,
    RiCheckboxCircleLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { redirect, useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
    const router = useRouter(); // ✅ এইভাবে নাও
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const validate = (value: string) => {
        if (!value.trim()) return "Email address is required";
        if (!/\S+@\S+\.\S+/.test(value)) return "Enter a valid email address";
        return "";
    };

    const handleChange = (value: string) => {
        setEmail(value);
        if (error) setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationError = validate(email);
        if (validationError) { setError(validationError); return; }

        setIsLoading(true);
        try {
            const res = await fetch(`/api/auth/forgetPassword`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
                credentials: "include",
            });

            const data = await res.json();
            console.log(data);

            // ✅ success false হলে error message দেখাও
            if (!data.success) {
                setError(data.message || "Something went wrong. Please try again.");
                return;
            }


            // ✅ success true হলে sent করো
            setSent(true);

        } catch (err: any) {
            setError(
                err?.message ?? "Something went wrong. Please try again in a moment."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center
                    bg-zinc-50 dark:bg-zinc-950 px-4 py-12">

            {/* ── Background teal orb ─────────────────────────── */}
            <div className="fixed inset-0 pointer-events-none
                      bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(20,184,166,0.06),transparent)]
                      dark:bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(20,184,166,0.09),transparent)]" />

            <div className="relative z-10 w-full max-w-[440px]">

                {/* ── Card ─────────────────────────────────────────── */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl
                        border border-zinc-200/80 dark:border-zinc-800/80
                        shadow-xl shadow-zinc-900/5 dark:shadow-zinc-900/30
                        overflow-hidden">

                    {/* Teal top accent bar */}
                    <div className="h-1 bg-gradient-to-r from-teal-500/0 via-teal-500 to-teal-500/0" />

                    <div className="p-8">

                        {/* ── Back link ──────────────────────────────── */}
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold
                         text-zinc-500 dark:text-zinc-500
                         hover:text-teal-600 dark:hover:text-teal-400
                         transition-colors mb-6"
                        >
                            <RiArrowLeftLine className="text-sm" />
                            Back to login
                        </Link>

                        {/* ── Icon + header ───────────────────────────── */}
                        <div className="flex items-center gap-3.5 mb-6">
                            <div className="w-11 h-11 rounded-xl
                              bg-teal-50 dark:bg-teal-950/60
                              border border-teal-200/60 dark:border-teal-800/60
                              flex items-center justify-center
                              text-teal-600 dark:text-teal-400 text-xl">
                                <RiMailSendLine />
                            </div>
                            <div>
                                <h1 className="text-[20px] font-extrabold tracking-tight
                               text-zinc-900 dark:text-zinc-50
                               leading-none mb-0.5">
                                    Forgot password?
                                </h1>
                                <p className="text-[12.5px] text-zinc-500 dark:text-zinc-500">
                                    We'll email you a reset code
                                </p>
                            </div>
                        </div>

                        {/* ═══════════════════════════════════════════════
                SUCCESS STATE
            ═══════════════════════════════════════════════ */}
                        {sent ? (
                            <div className="py-8 flex flex-col items-center gap-3 text-center">
                                <div className="w-14 h-14 rounded-full
                                bg-teal-50 dark:bg-teal-950/60
                                flex items-center justify-center
                                text-teal-600 dark:text-teal-400 text-2xl">
                                    <RiCheckboxCircleLine />
                                </div>

                                <h2 className="text-[17px] font-bold text-zinc-900 dark:text-zinc-50">
                                    Check your inbox
                                </h2>

                                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-[280px] leading-relaxed">
                                    If <span className="font-semibold text-zinc-700 dark:text-zinc-300 break-all">{email}</span> is
                                    registered on Nexora, a reset code is on its way.
                                </p>

                                <p className="text-[12px] text-zinc-400 dark:text-zinc-600">
                                    Didn't receive it?{" "}
                                    <button
                                        onClick={() => setSent(false)}
                                        className="font-semibold text-teal-600 dark:text-teal-400
                               hover:underline transition-colors"
                                    >
                                        Try again
                                    </button>
                                </p>

                                <Link
                                    href={`/auth/resetPassword?email=${email}`}
                                    className={cn(
                                        "mt-2 w-full h-11 rounded-xl flex items-center justify-center gap-2",
                                        "bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600",
                                        "text-white text-[15px] font-bold",
                                        "shadow-sm shadow-teal-600/20",
                                        "transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                                    )}
                                >
                                    Enter reset code <RiArrowRightLine className="text-base" />
                                </Link>
                            </div>

                        ) : (

                            /* ═══════════════════════════════════════════════
                                FORM STATE
                            ═══════════════════════════════════════════════ */
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                                {/* Description text */}
                                <p className="text-[13.5px] text-zinc-500 dark:text-zinc-400 leading-relaxed -mt-1 mb-1">
                                    Enter the email address linked to your Nexora account and
                                    we'll send you a one-time code to reset your password.
                                </p>

                                {/* Email field */}
                                <div className="flex flex-col gap-1.5">
                                    <label
                                        htmlFor="email"
                                        className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300"
                                    >
                                        Email address
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2
                                     text-zinc-400 dark:text-zinc-500 text-base
                                     pointer-events-none">
                                            <RiMailLine />
                                        </span>
                                        <input
                                            id="email"
                                            type="email"
                                            autoComplete="email"
                                            placeholder="you@university.edu"
                                            value={email}
                                            onChange={(e) => handleChange(e.target.value)}
                                            className={cn(
                                                "w-full h-11 pl-10 pr-4 rounded-xl text-sm font-medium",
                                                "bg-zinc-100 dark:bg-zinc-800/80",
                                                "border",
                                                error
                                                    ? "border-red-400 dark:border-red-500/70 focus:ring-red-400/20"
                                                    : "border-zinc-200 dark:border-zinc-700/60 focus:border-teal-400 dark:focus:border-teal-500 focus:ring-teal-400/20",
                                                "text-zinc-900 dark:text-zinc-50",
                                                "placeholder:text-zinc-400 dark:placeholder:text-zinc-600",
                                                "focus:outline-none focus:ring-2 transition-all duration-150"
                                            )}
                                        />
                                    </div>
                                    {error && (
                                        <p className="text-[12px] text-red-500 dark:text-red-400 font-medium">
                                            {error}
                                        </p>
                                    )}
                                </div>

                                {/* Submit button */}
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
                                        <>
                                            Send reset code
                                            <RiArrowRightLine className="text-base" />
                                        </>
                                    )}
                                </button>

                                {/* Helper note */}
                                <p className="text-center text-[12px] text-zinc-400 dark:text-zinc-600 leading-relaxed">
                                    Remember your password?{" "}
                                    <Link
                                        href="/login"
                                        className="font-semibold text-teal-600 dark:text-teal-400
                               hover:underline transition-colors"
                                    >
                                        Sign in
                                    </Link>
                                </p>
                            </form>
                        )}
                    </div>
                </div>

                {/* ── Privacy note ──────────────────────────────────── */}
                <p className="mt-5 text-center text-[11.5px] text-zinc-400 dark:text-zinc-600 leading-relaxed px-2">
                    For security, we never confirm whether an email is registered.
                    The reset code expires in 10 minutes and is single-use only.
                </p>
            </div>
        </div>
    );
}