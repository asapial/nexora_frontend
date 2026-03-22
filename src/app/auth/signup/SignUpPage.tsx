"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    RiMailLine,
    RiLockPasswordLine,
    RiEyeLine,
    RiEyeOffLine,
    RiGoogleLine,
    RiArrowRightLine,
    RiUserLine,
    RiUploadCloud2Line,
    RiCheckboxCircleLine,
    RiShieldCheckLine,
    RiTrophyLine,
    RiRobot2Line,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

// ─── imgbb upload config ──────────────────────────────────
const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY ?? "";

async function uploadToImgbb(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: "POST",
        body: fd,
    });
    if (!res.ok) throw new Error("Photo upload failed");
    const data = await res.json();
    return data.data.url as string;
}

// ─── Types ────────────────────────────────────────────────
interface RegisterForm {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
}

interface FormErrors extends Partial<RegisterForm> {
    photo?: string;
}

// ─── Shared input ─────────────────────────────────────────
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
            <label htmlFor={id} className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300">
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
                        "w-full h-11 pl-10 rounded-xl text-sm font-medium",
                        "bg-zinc-100 dark:bg-zinc-800/80",
                        "border",
                        error
                            ? "border-red-400 dark:border-red-500/70 focus:ring-red-400/30"
                            : "border-zinc-200 dark:border-zinc-700/60 focus:border-teal-400 dark:focus:border-teal-500",
                        "text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-600",
                        "focus:outline-none focus:ring-2",
                        error ? "focus:ring-red-400/20" : "focus:ring-teal-400/20",
                        "transition-all duration-150",
                        rightSlot ? "pr-11" : "pr-4"
                    )}
                />
                {rightSlot && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightSlot}</span>
                )}
            </div>
            {error && <p className="text-[12px] text-red-500 dark:text-red-400 font-medium">{error}</p>}
        </div>
    );
}

// ─── Password strength ────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
    const rules = [
        { label: "8+ characters", pass: password.length >= 8 },
        { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
        { label: "Number", pass: /\d/.test(password) },
    ];
    const score = rules.filter((r) => r.pass).length;
    const color = score === 0 ? "bg-zinc-200 dark:bg-zinc-700" : score === 1 ? "bg-red-400" : score === 2 ? "bg-amber-400" : "bg-teal-500";

    if (!password) return null;

    return (
        <div className="flex flex-col gap-1.5 mt-1">
            <div className="flex gap-1">
                {[1, 2, 3].map((i) => (
                    <div key={i} className={cn("flex-1 h-1 rounded-full transition-all duration-300", i <= score ? color : "bg-zinc-200 dark:bg-zinc-700")} />
                ))}
            </div>
            <div className="flex gap-3 flex-wrap">
                {rules.map((r) => (
                    <span key={r.label} className={cn("flex items-center gap-1 text-[11px] font-medium", r.pass ? "text-teal-600 dark:text-teal-400" : "text-zinc-400 dark:text-zinc-600")}>
                        <span className="text-[10px]">{r.pass ? "✓" : "○"}</span>
                        {r.label}
                    </span>
                ))}
            </div>
        </div>
    );
}

// ─── Photo upload zone ────────────────────────────────────
function PhotoUpload({
    file,
    preview,
    onSelect,
    error,
}: {
    file: File | null;
    preview: string | null;
    onSelect: (f: File) => void;
    error?: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped && dropped.type.startsWith("image/")) onSelect(dropped);
    }, [onSelect]);

    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300">
                Profile photo <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border-2 border-dashed cursor-pointer",
                    "transition-all duration-200",
                    isDragging
                        ? "border-teal-400 bg-teal-50/50 dark:border-teal-500/60 dark:bg-teal-950/30"
                        : error
                            ? "border-red-400/60 bg-red-50/30 dark:border-red-500/40 dark:bg-red-950/20"
                            : "border-zinc-300/60 dark:border-zinc-700/60 bg-zinc-50 dark:bg-zinc-800/40",
                    "hover:border-teal-400/60 dark:hover:border-teal-500/50 hover:bg-teal-50/30 dark:hover:bg-teal-950/20"
                )}
            >
                {/* Preview or placeholder */}
                {preview ? (
                    <img src={preview} alt="Preview" className="w-14 h-14 rounded-xl object-cover ring-2 ring-teal-400/30 flex-shrink-0" />
                ) : (
                    <div className="w-14 h-14 rounded-xl bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
                        <RiUserLine className="text-zinc-400 dark:text-zinc-500 text-xl" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <RiUploadCloud2Line className="text-teal-600 dark:text-teal-400 text-base flex-shrink-0" />
                        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 line-clamp-1 ">
                            {file ? file.name : "Click or drag to upload"}
                        </span>
                    </div>
                    <p className="text-[11.5px] text-zinc-400 dark:text-zinc-600 truncate">
                        {file
                            ? `${(file.size / 1024).toFixed(0)} KB · Will upload to cloud`
                            : "JPG, PNG, WebP · Max 5 MB"}
                    </p>
                </div>
                {file && (
                    <RiCheckboxCircleLine className="text-teal-500 dark:text-teal-400 text-xl flex-shrink-0" />
                )}
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) onSelect(f); }}
                />
            </div>
            {error && <p className="text-[12px] text-red-500 dark:text-red-400 font-medium">{error}</p>}
        </div>
    );
}

// ─── Left panel feature list ──────────────────────────────
const PERKS = [
    { icon: <RiShieldCheckLine />, text: "Auto-generated task deadlines" },
    { icon: <RiTrophyLine />, text: "Earn milestone badges automatically" },
    { icon: <RiRobot2Line />, text: "AI study companion on every resource" },
    { icon: <RiCheckboxCircleLine />, text: "PDF certificates with verification URL" },
];

// ─── Page ─────────────────────────────────────────────────
export default function SignUpPage() {
    const router = useRouter();
    const [form, setForm] = useState<RegisterForm>({ name: "", email: "", password: "", confirmPassword: "" });
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const set = (k: keyof RegisterForm) => (v: string) => {
        setForm((p) => ({ ...p, [k]: v }));
        if (errors[k]) setErrors((p) => ({ ...p, [k]: "" }));
    };

    const handlePhoto = (f: File) => {
        if (f.size > 5 * 1024 * 1024) {
            setErrors((p) => ({ ...p, photo: "File too large — max 5 MB" }));
            return;
        }
        setPhotoFile(f);
        setErrors((p) => ({ ...p, photo: "" }));
        const reader = new FileReader();
        reader.onload = (e) => setPhotoPreview(e.target?.result as string);
        reader.readAsDataURL(f);
    };

    const validate = () => {
        const e: FormErrors = {};
        if (!form.name.trim()) e.name = "Full name is required";
        else if (form.name.trim().length < 2) e.name = "Name must be at least 2 characters";
        if (!form.email.trim()) e.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
        if (!form.password) e.password = "Password is required";
        else if (form.password.length < 8) e.password = "Password must be at least 8 characters";
        if (!form.confirmPassword) e.confirmPassword = "Please confirm your password";
        else if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
        return e;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setIsLoading(true);
        try {
            // 1. Upload photo to imgbb (if provided)
            let photoUrl: string | undefined;
            if (photoFile) {
                photoUrl = await uploadToImgbb(photoFile);
                console.log(photoUrl)
            }

            // 2. Register the user
            // TODO: replace with your Better Auth call

            const res = await fetch(`/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: form.email,
                    password: form.password,
                    name: form.name,
                    image: photoUrl,
                }),
                credentials: "include",
            });

            console.log(res)

            const data = await res.json();
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



            // router.push("/verify-email");
        } catch (err: any) {
            setErrors({ email: err?.message ?? "Registration failed. Try again." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogle = async () => {
        setIsGoogleLoading(true);
        try {
            // Navigate to the backend EJS redirect page via Next.js proxy.
            // The EJS page shows a "Connecting with Google…" UI, calls BetterAuth
            // to get the Google OAuth URL, then redirects the browser to Google.
            window.location.href = "/api/auth/login/google";
        } finally {
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950">

            {/* ══ Left decorative panel ═══════════════════════════ */}
            <div className="hidden lg:flex lg:w-[44%] relative overflow-hidden flex-col justify-center p-14"
                style={{ background: "linear-gradient(135deg, #0a0f14 0%, #0d1b1a 50%, #0f1a2e 100%)" }}
            >
                <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,.03)_1px,transparent_1px)] bg-[size:54px_54px]" />
                <div className="absolute top-[-80px] right-[-60px] w-[380px] h-[380px] rounded-full blur-3xl"
                    style={{ background: "radial-gradient(circle, rgba(20,184,166,0.1) 0%, transparent 70%)", animation: "orb2 12s ease-in-out infinite" }} />
                <div className="absolute bottom-[-60px] left-[-40px] w-[300px] h-[300px] rounded-full blur-3xl"
                    style={{ background: "radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)", animation: "orb2 9s ease-in-out infinite 3s" }} />

                <style>{`@keyframes orb2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-16px,16px) scale(1.04)}}`}</style>

                <div className="relative z-10 max-w-[340px]">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/25 flex items-center justify-center text-teal-400 text-lg">⬡</div>
                        <span className="text-[22px] font-extrabold tracking-tight text-white">Nexora</span>
                    </div>

                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[11.5px] font-bold tracking-wider uppercase mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                        Join as a Student
                    </div>

                    <h1 className="text-[clamp(1.9rem,3vw,2.6rem)] font-extrabold leading-[1.1] tracking-tight text-white mb-5">
                        Start your<br />learning{" "}
                        <span style={{ background: "linear-gradient(135deg,#2dd4bf,#5eead4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                            journey.
                        </span>
                    </h1>
                    <p className="text-[14px] text-zinc-400 leading-relaxed mb-10">
                        Create your free account and join thousands of learners already growing on Nexora.
                    </p>

                    {/* Perk list */}
                    <div className="flex flex-col gap-3.5">
                        {PERKS.map((perk, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-teal-500/12 border border-teal-500/20 flex items-center justify-center text-teal-400 text-base flex-shrink-0">
                                    {perk.icon}
                                </div>
                                <span className="text-[13.5px] text-zinc-300">{perk.text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Social proof */}
                    <div className="mt-10 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.07]">
                        <div className="flex -space-x-2 mb-2.5">
                            {["DR", "AK", "SE", "LM", "FO"].map((i, idx) => (
                                <div key={idx} className="w-7 h-7 rounded-full bg-teal-500/20 border-2 border-zinc-900 flex items-center justify-center text-[9px] font-bold text-teal-400">
                                    {i}
                                </div>
                            ))}
                            <div className="w-7 h-7 rounded-full bg-zinc-700 border-2 border-zinc-900 flex items-center justify-center text-[9px] font-bold text-zinc-400">
                                +8k
                            </div>
                        </div>
                        <p className="text-[12.5px] text-zinc-400 leading-snug">
                            <span className="text-white font-semibold">8,000+ students</span> already enrolled in clusters this month.
                        </p>
                    </div>
                </div>
            </div>

            {/* ══ Right form panel ════════════════════════════════ */}
            <div className="flex-1 flex items-center justify-center px-5 py-10 sm:px-10 overflow-y-auto">
                <div className="w-full max-w-[430px] py-4">

                    {/* Mobile logo */}
                    <div className="flex items-center gap-2.5 mb-7 lg:hidden">
                        <div className="w-9 h-9 rounded-xl bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 text-base">⬡</div>
                        <span className="text-[18px] font-extrabold tracking-tight text-zinc-900 dark:text-white">Nexora</span>
                    </div>

                    {/* Header */}
                    <div className="mb-7">
                        <h2 className="text-[24px] font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-1.5">
                            Create your account
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            Already have an account?{" "}
                            <Link href="/login" className="font-semibold text-teal-600 dark:text-teal-400 hover:underline">Sign in</Link>
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
                            "transition-all duration-150",
                            "disabled:opacity-60 disabled:cursor-not-allowed"
                        )}
                    >
                        {isGoogleLoading ? (
                            <span className="w-4 h-4 border-2 border-zinc-300 border-t-teal-500 rounded-full animate-spin" />
                        ) : <RiGoogleLine className="text-base" />}
                        Continue with Google
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                        <span className="text-[11.5px] font-semibold text-zinc-400 dark:text-zinc-600 tracking-wider uppercase">or</span>
                        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <PhotoUpload file={photoFile} preview={photoPreview} onSelect={handlePhoto} error={errors.photo} />

                        <AuthInput label="Full name" id="name" placeholder="Dr. Jane Smith" value={form.name} onChange={set("name")} icon={<RiUserLine />} error={errors.name} />
                        <AuthInput label="Email address" id="email" type="email" placeholder="you@university.edu" value={form.email} onChange={set("email")} icon={<RiMailLine />} error={errors.email} />

                        <div>
                            <AuthInput
                                label="Password" id="password"
                                type={showPass ? "text" : "password"}
                                placeholder="Create a strong password"
                                value={form.password} onChange={set("password")}
                                icon={<RiLockPasswordLine />}
                                error={errors.password}
                                rightSlot={
                                    <button type="button" onClick={() => setShowPass((p) => !p)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                                        {showPass ? <RiEyeOffLine className="text-base" /> : <RiEyeLine className="text-base" />}
                                    </button>
                                }
                            />
                            <PasswordStrength password={form.password} />
                        </div>

                        <AuthInput
                            label="Confirm password" id="confirmPassword"
                            type={showConfirm ? "text" : "password"}
                            placeholder="Re-enter your password"
                            value={form.confirmPassword} onChange={set("confirmPassword")}
                            icon={<RiLockPasswordLine />}
                            error={errors.confirmPassword}
                            rightSlot={
                                <button type="button" onClick={() => setShowConfirm((p) => !p)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                                    {showConfirm ? <RiEyeOffLine className="text-base" /> : <RiEyeLine className="text-base" />}
                                </button>
                            }
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
                                <>Create account <RiArrowRightLine className="text-base" /></>
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-[11.5px] text-zinc-400 dark:text-zinc-600 text-center leading-relaxed">
                        By creating an account you agree to our{" "}
                        <Link href="/terms" className="underline hover:text-zinc-600 dark:hover:text-zinc-400">Terms</Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="underline hover:text-zinc-600 dark:hover:text-zinc-400">Privacy Policy</Link>.
                    </p>
                </div>
            </div>
        </div>
    );
}