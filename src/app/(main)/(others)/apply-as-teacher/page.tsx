"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RiSparklingFill,
  RiGraduationCapLine,
  RiLoaderLine,
  RiCheckboxCircleLine,
  RiArrowRightLine,
  RiUserLine,
  RiMailLine,
  RiPhoneLine,
  RiBriefcaseLine,
  RiBuildingLine,
  RiBookOpenLine,
  RiTimeLine,
  RiLinkedinBoxLine,
  RiGlobalLine,
  RiFileTextLine,
  RiArrowLeftLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────
interface FormData {
  fullName: string;
  email: string;
  phone: string;
  designation: string;
  institution: string;
  department: string;
  specialization: string;
  experience: string;
  bio: string;
  linkedinUrl: string;
  website: string;
}

interface ExistingApplication {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote?: string;
  createdAt: string;
}

// ─── Field component ──────────────────────────────────────
function Field({
  label,
  required,
  icon,
  children,
}: {
  label: string;
  required?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
        {icon && <span className="text-teal-500 text-sm">{icon}</span>}
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-[13.5px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-400/40 placeholder:text-zinc-400 transition-colors";

const textareaCls =
  "w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-[13.5px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-400/40 placeholder:text-zinc-400 transition-colors resize-none";

// ─── Status Banner ────────────────────────────────────────
function StatusBanner({ app }: { app: ExistingApplication }) {
  const configs = {
    PENDING: {
      bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-800/60",
      text: "text-amber-700 dark:text-amber-400",
      icon: <RiLoaderLine className="animate-spin text-lg" />,
      title: "Application Under Review",
      desc: "Your teacher application has been submitted and is being reviewed by our admin team. We'll get back to you soon.",
    },
    APPROVED: {
      bg: "bg-teal-50 dark:bg-teal-950/30 border-teal-200/60 dark:border-teal-800/60",
      text: "text-teal-700 dark:text-teal-400",
      icon: <RiCheckboxCircleLine className="text-lg" />,
      title: "Application Approved!",
      desc: "Congratulations! Your teacher application has been approved. Check your email for your teacher account credentials.",
    },
    REJECTED: {
      bg: "bg-red-50 dark:bg-red-950/30 border-red-200/60 dark:border-red-800/60",
      text: "text-red-700 dark:text-red-400",
      icon: <RiFileTextLine className="text-lg" />,
      title: "Application Not Approved",
      desc: app.adminNote || "Your application was not approved this time. You may submit a new application.",
    },
  };

  const cfg = configs[app.status];

  return (
    <div className={cn("rounded-2xl border p-6 flex gap-4", cfg.bg)}>
      <span className={cfg.text}>{cfg.icon}</span>
      <div>
        <p className={cn("text-[15px] font-bold mb-1", cfg.text)}>{cfg.title}</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{cfg.desc}</p>
        {app.status === "APPROVED" && (
          <Link href="/auth/signin" className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-teal-700 dark:text-teal-400 hover:underline">
            Go to sign in <RiArrowRightLine />
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────
export default function ApplyAsTeacherPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [existingApp, setExistingApp] = useState<ExistingApplication | null>(null);
  const [loadingApp, setLoadingApp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");

  const [form, setForm] = useState<FormData>({
    fullName: "", email: "", phone: "", designation: "",
    institution: "", department: "", specialization: "",
    experience: "", bio: "", linkedinUrl: "", website: "",
  });

  // Check auth + pre-fill
  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const data = await res.json();
        if (data.success) {
          setIsLoggedIn(true);
          const u = data.data?.userData ?? data.data;
          setUserEmail(u.email || "");
          setUserName(u.name || "");
          setForm((f) => ({ ...f, fullName: u.name || "", email: u.email || "" }));

          // Check existing application
          setLoadingApp(true);
          try {
            const appRes = await fetch("/api/teacher-applications/my", { credentials: "include" });
            const appData = await appRes.json();
            if (appData.success && appData.data) {
              setExistingApp(appData.data);
            }
          } catch { /* silent */ }
          finally { setLoadingApp(false); }
        }
      } catch { /* not logged in */ }
      finally { setCheckingAuth(false); }
    };
    init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || !form.bio.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const payload: any = {
        ...form,
        experience: form.experience ? parseInt(form.experience) : undefined,
      };
      const res = await fetch("/api/teacher-applications/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Submission failed");
      setSubmitted(true);
      setExistingApp(data.data);
      toast.success("Application submitted successfully!");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const update = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  // ── Loading state ──
  if (checkingAuth || loadingApp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <RiLoaderLine className="text-3xl text-teal-500 animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      {/* Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(20,184,166,0.07),transparent)] pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-24">

        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors mb-8">
          <RiArrowLeftLine /> Back to home
        </Link>

        {/* Hero header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border-teal-200/60 dark:border-teal-800/60 mb-5">
            <RiSparklingFill className="animate-pulse" />
            Become a Teacher
          </div>
          <h1 className="text-[clamp(2rem,5vw,3rem)] font-extrabold tracking-tight leading-[1.08] mb-4">
            Apply to teach on{" "}
            <span
              style={{
                background: "linear-gradient(135deg,#0d9488 0%,#14b8a6 50%,#5eead4 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Nexora
            </span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-[15px] leading-relaxed max-w-xl">
            Share your expertise with thousands of learners. Fill out your professional details below and our admin team will review your application.
          </p>
        </div>

        {/* Existing application status */}
        {existingApp && <div className="mb-8"><StatusBanner app={existingApp} /></div>}

        {/* If not logged in — prompt */}
        {!isLoggedIn && (
          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-8 text-center">
            <RiGraduationCapLine className="text-4xl text-teal-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-2">Sign in to apply</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">You need an account to submit a teacher application.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/auth/signin" className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white text-sm font-bold transition-all hover:scale-[1.02]">
                Sign in <RiArrowRightLine />
              </Link>
              <Link href="/auth/signup" className="inline-flex items-center gap-2 h-10 px-5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-semibold hover:border-teal-400 transition-colors">
                Create account
              </Link>
            </div>
          </div>
        )}

        {/* Application form — only if logged in and no pending/approved app */}
        {isLoggedIn && (!existingApp || existingApp.status === "REJECTED") && !submitted && (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm p-8 space-y-6">

            <h2 className="text-[16px] font-bold text-zinc-900 dark:text-zinc-50 border-b border-zinc-100 dark:border-zinc-800 pb-4">
              Personal &amp; Professional Information
            </h2>

            {/* Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" required icon={<RiUserLine />}>
                <input value={form.fullName} onChange={update("fullName")} placeholder="Dr. Jane Smith" className={inputCls} required />
              </Field>
              <Field label="Email" required icon={<RiMailLine />}>
                <input type="email" value={form.email} onChange={update("email")} placeholder="jane@university.edu" className={inputCls} required />
              </Field>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Phone" icon={<RiPhoneLine />}>
                <input value={form.phone} onChange={update("phone")} placeholder="+1 (555) 000-0000" className={inputCls} />
              </Field>
              <Field label="Designation / Title" icon={<RiBriefcaseLine />}>
                <input value={form.designation} onChange={update("designation")} placeholder="Associate Professor" className={inputCls} />
              </Field>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Institution / Organization" icon={<RiBuildingLine />}>
                <input value={form.institution} onChange={update("institution")} placeholder="MIT" className={inputCls} />
              </Field>
              <Field label="Department" icon={<RiBookOpenLine />}>
                <input value={form.department} onChange={update("department")} placeholder="Computer Science" className={inputCls} />
              </Field>
            </div>

            {/* Row 4 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Specialization / Subject Area" icon={<RiSparklingFill />}>
                <input value={form.specialization} onChange={update("specialization")} placeholder="Machine Learning, NLP" className={inputCls} />
              </Field>
              <Field label="Years of Teaching Experience" icon={<RiTimeLine />}>
                <input type="number" min="0" max="50" value={form.experience} onChange={update("experience")} placeholder="5" className={inputCls} />
              </Field>
            </div>

            {/* Bio */}
            <Field label="Professional Bio" required icon={<RiFileTextLine />}>
              <textarea
                value={form.bio}
                onChange={update("bio")}
                rows={5}
                placeholder="Tell us about your teaching background, research interests, and why you want to teach on Nexora..."
                className={textareaCls}
                required
              />
            </Field>

            {/* Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="LinkedIn URL" icon={<RiLinkedinBoxLine />}>
                <input value={form.linkedinUrl} onChange={update("linkedinUrl")} placeholder="https://linkedin.com/in/..." className={inputCls} />
              </Field>
              <Field label="Personal Website" icon={<RiGlobalLine />}>
                <input value={form.website} onChange={update("website")} placeholder="https://yoursite.com" className={inputCls} />
              </Field>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                id="submit-teacher-application-btn"
                disabled={submitting}
                className={cn(
                  "flex items-center gap-2 h-11 px-8 rounded-xl font-bold text-sm text-white",
                  "bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600",
                  "transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                  submitting && "opacity-70 cursor-not-allowed"
                )}
              >
                {submitting ? <RiLoaderLine className="animate-spin" /> : <RiArrowRightLine />}
                {submitting ? "Submitting…" : "Submit Application"}
              </button>
              <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-3">
                Our team typically reviews applications within 2–3 business days.
              </p>
            </div>
          </form>
        )}

        {/* Success state */}
        {submitted && (
          <div className="rounded-2xl border border-teal-200/60 dark:border-teal-800/60 bg-teal-50 dark:bg-teal-950/30 p-10 text-center">
            <RiCheckboxCircleLine className="text-5xl text-teal-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Application Submitted!</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              Thank you for applying! Our admin team will review your application and get back to you within 2–3 business days.
            </p>
            <Link href="/" className="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-teal-700 dark:text-teal-400 hover:underline">
              <RiArrowLeftLine /> Back to home
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
