"use client";

import { useState, useCallback, useEffect } from "react";
import {
  RiSparklingFill,
  RiStarFill,
  RiStarLine,
  RiAddLine,
  RiCloseLine,
  RiSendPlane2Line,
  RiLoaderLine,
  RiCheckboxCircleLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import SectionContainer from "@/utils/SectionContainer";

// ─── Types ────────────────────────────────────────────────
export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  quote: string;
  rating: number;
  user?: { id: string; name: string; email: string; image?: string | null };
  cardBg?: string;
}

// ─── Card background presets ───────────────────────────────
const CARD_BG_VARIANTS: string[] = [
  "bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80",
  "bg-teal-50/60 dark:bg-teal-950/30 border-teal-200/50 dark:border-teal-800/40",
  "bg-violet-50/60 dark:bg-violet-950/30 border-violet-200/50 dark:border-violet-800/40",
  "bg-amber-50/60 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-800/40",
  "bg-sky-50/60 dark:bg-sky-950/30 border-sky-200/50 dark:border-sky-800/40",
  "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200/60 dark:border-zinc-800/60",
];

const AVATAR_COLORS: string[] = [
  "bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400",
  "bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400",
  "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400",
  "bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400",
  "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400",
];

// ─── Helpers ───────────────────────────────────────────────
function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Star display ──────────────────────────────────────────
function StarRow({ rating, interactive = false, onRate }: { rating: number; interactive?: boolean; onRate?: (r: number) => void }) {
  return (
    <div className="flex items-center gap-0.5 mb-4">
      {[1, 2, 3, 4, 5].map((s) =>
        s <= rating ? (
          <RiStarFill
            key={s}
            className={cn("text-amber-400 text-[13px]", interactive && "cursor-pointer hover:scale-110 transition-transform")}
            onClick={() => onRate?.(s)}
          />
        ) : (
          <RiStarLine
            key={s}
            className={cn("text-zinc-300 dark:text-zinc-700 text-[13px]", interactive && "cursor-pointer hover:scale-110 transition-transform")}
            onClick={() => onRate?.(s)}
          />
        )
      )}
    </div>
  );
}

// ─── Individual testimonial card ───────────────────────────
function TestimonialCard({ item, idx }: { item: Testimonial; idx: number }) {
  const cardBg = CARD_BG_VARIANTS[idx % CARD_BG_VARIANTS.length];
  const avatarUrl = item.user?.image || item.avatar;
  const authorName = item.name || item.user?.name || "Anonymous";

  return (
    <div
      className={cn(
        "group relative rounded-2xl border p-6",
        "transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-xl",
        "hover:shadow-zinc-900/8 dark:hover:shadow-zinc-900/30",
        cardBg
      )}
    >
      {/* Opening quotation mark */}
      <span className="block text-4xl leading-none text-teal-300/40 dark:text-teal-600/30 font-serif mb-1">"</span>

      {/* Quote body */}
      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 italic mb-4">{item.quote}</p>

      {/* Star rating */}
      <StarRow rating={item.rating} />

      {/* Author row */}
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <img src={avatarUrl} alt={authorName} className="w-9 h-9 rounded-full object-cover flex-shrink-0 border-2 border-white/50 dark:border-zinc-800" />
        ) : (
          <div className={cn("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-[13px] font-bold border-2 border-white/50 dark:border-zinc-800", AVATAR_COLORS[idx % AVATAR_COLORS.length])}>
            {getInitials(authorName)}
          </div>
        )}
        <div>
          <p className="text-[13.5px] font-bold text-zinc-900 dark:text-zinc-50 leading-none">{authorName}</p>
          <p className="text-[11.5px] text-zinc-500 dark:text-zinc-500 mt-0.5">{item.role}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Submit Modal ──────────────────────────────────────────
function AddTestimonialModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ name: "", role: "", quote: "", rating: 5 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.quote.trim() || !form.role.trim()) {
      setError("All fields are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Submission failed");
      setSubmitted(true);
      setTimeout(() => { onSuccess(); onClose(); }, 2000);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-[17px] font-bold text-zinc-900 dark:text-zinc-50">Share your experience</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Your review will be reviewed before publishing.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <RiCloseLine className="text-lg" />
          </button>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <RiCheckboxCircleLine className="text-4xl text-teal-500" />
            <p className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-50">Thank you!</p>
            <p className="text-sm text-zinc-500">Your testimonial has been submitted for review.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs border border-red-200/60 dark:border-red-800/60">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide block mb-1.5">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Your name"
                  className="w-full h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-[13px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-400/40 placeholder:text-zinc-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide block mb-1.5">Role *</label>
                <input
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  placeholder="e.g. PhD Student · MIT"
                  className="w-full h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-[13px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-400/40 placeholder:text-zinc-400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide block mb-1.5">Your review *</label>
              <textarea
                value={form.quote}
                onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
                placeholder="Share how Nexora has helped you..."
                rows={4}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-[13px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-400/40 placeholder:text-zinc-400 resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide block mb-1.5">Rating</label>
              <StarRow rating={form.rating} interactive onRate={(r) => setForm((f) => ({ ...f, rating: r }))} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "flex items-center justify-center gap-2 h-10 rounded-xl font-semibold text-sm text-white",
                "bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600",
                "transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                loading && "opacity-70 cursor-not-allowed"
              )}
            >
              {loading ? <RiLoaderLine className="animate-spin" /> : <RiSendPlane2Line />}
              {loading ? "Submitting..." : "Submit Testimonial"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton cards ────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-6 space-y-3 animate-pulse bg-white dark:bg-zinc-900">
      <div className="h-4 w-8 bg-zinc-200 dark:bg-zinc-800 rounded" />
      <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded" />
      <div className="h-3 w-5/6 bg-zinc-100 dark:bg-zinc-800 rounded" />
      <div className="h-3 w-4/6 bg-zinc-100 dark:bg-zinc-800 rounded" />
      <div className="flex gap-0.5 mt-2">{[1,2,3,4,5].map(i => <div key={i} className="h-3 w-3 bg-zinc-200 dark:bg-zinc-800 rounded" />)}</div>
      <div className="flex gap-3 mt-2">
        <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="space-y-1.5">
          <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="h-2.5 w-32 bg-zinc-100 dark:bg-zinc-800 rounded" />
        </div>
      </div>
    </div>
  );
}

// ─── Section ───────────────────────────────────────────────
export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  const fetchTestimonials = useCallback(async () => {
    try {
      const res = await fetch("/api/testimonials");
      const data = await res.json();
      if (data.success) setTestimonials(data.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = await res.json();
      setIsLoggedIn(data.success);
    } catch { setIsLoggedIn(false); }
  }, []);

  useEffect(() => {
    fetchTestimonials();
    checkAuth();
  }, [fetchTestimonials, checkAuth]);

  return (
    <>
      {showModal && (
        <AddTestimonialModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setAlreadySubmitted(true);
            fetchTestimonials();
          }}
        />
      )}

      <SectionContainer className="relative py-24 lg:py-32 bg-zinc-50 dark:bg-zinc-950 overflow-hidden">

        {/* Radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_100%,rgba(20,184,166,0.05),transparent)] dark:bg-[radial-gradient(ellipse_60%_40%_at_50%_100%,rgba(20,184,166,0.07),transparent)] pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border-teal-200/60 dark:border-teal-800/60 mb-5">
              <RiSparklingFill className="animate-pulse" />
              Testimonials
            </div>

            <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight leading-[1.1] text-zinc-900 dark:text-zinc-50 mb-4">
              Loved by researchers{" "}
              <span style={{ background: "linear-gradient(135deg,#0d9488 0%,#14b8a6 50%,#5eead4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                &amp; learners worldwide
              </span>
            </h2>

            <p className="text-zinc-500 dark:text-zinc-400 text-[clamp(1rem,1.8vw,1.15rem)] max-w-lg mx-auto leading-relaxed">
              Real stories from teachers and members who use Nexora every day.
            </p>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              : testimonials.map((item, idx) => (
                  <TestimonialCard key={item.id} item={item} idx={idx} />
                ))}

            {/* Add testimonial — only shown when user is logged in */}
            {!loading && isLoggedIn && !alreadySubmitted && (
              <button
                id="add-testimonial-btn"
                onClick={() => setShowModal(true)}
                className={cn(
                  "group flex flex-col items-center justify-center gap-2.5",
                  "rounded-2xl border-2 border-dashed p-8",
                  "border-zinc-300/60 dark:border-zinc-700/60",
                  "text-zinc-400 dark:text-zinc-600",
                  "hover:border-teal-400/50 dark:hover:border-teal-600/50",
                  "hover:text-teal-600 dark:hover:text-teal-400",
                  "hover:bg-teal-50/40 dark:hover:bg-teal-950/20",
                  "transition-all duration-200 cursor-pointer"
                )}
              >
                <RiAddLine className="text-2xl opacity-60 group-hover:opacity-100 transition-opacity" />
                <span className="text-sm font-semibold">Share your experience</span>
                <span className="text-xs opacity-70">It will be reviewed before publishing</span>
              </button>
            )}

            {!loading && isLoggedIn && alreadySubmitted && (
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-teal-300/60 dark:border-teal-700/60 p-8 text-teal-600 dark:text-teal-400">
                <RiCheckboxCircleLine className="text-2xl" />
                <span className="text-sm font-semibold">Testimonial submitted</span>
                <span className="text-xs opacity-70">Pending admin review</span>
              </div>
            )}
          </div>
        </div>
      </SectionContainer>
    </>
  );
}