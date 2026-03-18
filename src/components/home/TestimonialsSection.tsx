"use client";

import { useState, useCallback } from "react";
import {
  RiSparklingFill,
  RiStarFill,
  RiStarLine,
  RiAddLine,
  RiPencilLine,
  RiDeleteBinLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import SectionContainer from "@/utils/SectionContainer";

// ─── Types ────────────────────────────────────────────────
export interface Testimonial {
  id: string;
  name: string;
  role: string;
  /** URL — when omitted, initials avatar is rendered instead */
  avatar?: string;
  quote: string;
  /** Integer 1–5 */
  rating: number;
  /** Tailwind class string — controls card bg + border colour */
  cardBg: string;
}

// ─── Card background presets ───────────────────────────────
export const CARD_BG_VARIANTS: string[] = [
  "bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80",
  "bg-teal-50/60 dark:bg-teal-950/30 border-teal-200/50 dark:border-teal-800/40",
  "bg-violet-50/60 dark:bg-violet-950/30 border-violet-200/50 dark:border-violet-800/40",
  "bg-amber-50/60 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-800/40",
  "bg-sky-50/60 dark:bg-sky-950/30 border-sky-200/50 dark:border-sky-800/40",
  "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200/60 dark:border-zinc-800/60",
];

// ─── Avatar colour presets (cycle by index) ────────────────
const AVATAR_COLORS: string[] = [
  "bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400",
  "bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400",
  "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400",
  "bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400",
  "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400",
];

// ─── Default testimonials ──────────────────────────────────
const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    name: "Dr. Riya Mehta",
    role: "Research Lead · NIT Trichy",
    quote:
      "Nexora completely transformed how I manage my research group. Auto-generated tasks alone saved me 3 hours every week.",
    rating: 5,
    cardBg: CARD_BG_VARIANTS[0],
  },
  {
    id: "t2",
    name: "Arjun Krishnan",
    role: "Professor · IIT Delhi",
    quote:
      "The cluster health score keeps me honest. When it dips, I know exactly which members need attention before it's too late.",
    rating: 5,
    cardBg: CARD_BG_VARIANTS[1],
  },
  {
    id: "t3",
    name: "Sara El-Amin",
    role: "PhD Student · Cairo University",
    quote:
      "I submitted my chapter, got rubric feedback within an hour, and earned my first milestone badge. Deeply motivating.",
    rating: 5,
    cardBg: CARD_BG_VARIANTS[2],
  },
  {
    id: "t4",
    name: "Lucas Moreau",
    role: "MSc Student · Sorbonne",
    quote:
      "The AI study companion answered my questions at 2 AM. It's like having a tutor available 24/7.",
    rating: 4,
    cardBg: CARD_BG_VARIANTS[3],
  },
  {
    id: "t5",
    name: "Dr. Fatima Ouédraogo",
    role: "Lecturer · University of Dakar",
    quote:
      "Resource quizzes are genius — students actually read the papers before sessions. Discussion quality went through the roof.",
    rating: 5,
    cardBg: CARD_BG_VARIANTS[4],
  },
];

// ─── Helpers ───────────────────────────────────────────────
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ─── Star display ──────────────────────────────────────────
function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 mb-4">
      {[1, 2, 3, 4, 5].map((s) =>
        s <= rating ? (
          <RiStarFill key={s} className="text-amber-400 text-[13px]" />
        ) : (
          <RiStarLine key={s} className="text-zinc-300 dark:text-zinc-700 text-[13px]" />
        )
      )}
    </div>
  );
}

// ─── Individual testimonial card ───────────────────────────
function TestimonialCard({
  item,
  idx,
  isRemoving,
  onDelete,
  onEdit,
}: {
  item: Testimonial;
  idx: number;
  isRemoving: boolean;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        // Layout
        "group relative rounded-2xl border p-6",
        // Transitions
        "transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-xl",
        "hover:shadow-zinc-900/8 dark:hover:shadow-zinc-900/30",
        // Remove animation
        isRemoving && "opacity-0 scale-95",
        // Card background (set per item)
        item.cardBg
      )}
    >
      {/* ── Action buttons — revealed on hover ── */}
      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={() => onEdit(item.id)}
          title="Edit testimonial"
          className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center text-xs",
            "bg-zinc-100 dark:bg-zinc-800",
            "text-zinc-500 dark:text-zinc-400",
            "hover:bg-zinc-200 dark:hover:bg-zinc-700",
            "hover:text-zinc-700 dark:hover:text-zinc-200",
            "transition-colors"
          )}
        >
          <RiPencilLine />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          title="Delete testimonial"
          className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center text-xs",
            "bg-zinc-100 dark:bg-zinc-800",
            "text-zinc-500 dark:text-zinc-400",
            "hover:bg-red-100 dark:hover:bg-red-950/50",
            "hover:text-red-600 dark:hover:text-red-400",
            "transition-colors"
          )}
        >
          <RiDeleteBinLine />
        </button>
      </div>

      {/* ── Opening quotation mark ── */}
      <span className="block text-4xl leading-none text-teal-300/40 dark:text-teal-600/30 font-serif mb-1">
        "
      </span>

      {/* ── Quote body ── */}
      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 italic mb-4">
        {item.quote}
      </p>

      {/* ── Star rating ── */}
      <StarRow rating={item.rating} />

      {/* ── Author row ── */}
      <div className="flex items-center gap-3">
        {item.avatar ? (
          <img
            src={item.avatar}
            alt={item.name}
            className="w-9 h-9 rounded-full object-cover flex-shrink-0 border-2 border-white/50 dark:border-zinc-800"
          />
        ) : (
          <div
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
              "text-[13px] font-bold",
              "border-2 border-white/50 dark:border-zinc-800",
              AVATAR_COLORS[idx % AVATAR_COLORS.length]
            )}
          >
            {getInitials(item.name)}
          </div>
        )}
        <div>
          <p className="text-[13.5px] font-bold text-zinc-900 dark:text-zinc-50 leading-none">
            {item.name}
          </p>
          <p className="text-[11.5px] text-zinc-500 dark:text-zinc-500 mt-0.5">
            {item.role}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Section ───────────────────────────────────────────────
export default function TestimonialsSection({
  initialTestimonials = DEFAULT_TESTIMONIALS,
}: {
  initialTestimonials?: Testimonial[];
}) {
  const [testimonials, setTestimonials] =
    useState<Testimonial[]>(initialTestimonials);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // ── Delete: animate out then remove from state ──────────
  const handleDelete = useCallback((id: string) => {
    setRemovingId(id);
    setTimeout(() => {
      setTestimonials((prev) => prev.filter((t) => t.id !== id));
      setRemovingId(null);
    }, 280);
  }, []);

  // ── Edit: simple prompt — swap with a modal in production ─
  const handleEdit = useCallback(
    (id: string) => {
      const target = testimonials.find((t) => t.id === id);
      if (!target) return;
      const newQuote = window.prompt("Edit quote:", target.quote);
      if (!newQuote) return;
      setTestimonials((prev) =>
        prev.map((t) => (t.id === id ? { ...t, quote: newQuote } : t))
      );
    },
    [testimonials]
  );

  // ── Add: prompt chain — swap with a modal in production ──
  const handleAdd = useCallback(() => {
    const name = window.prompt("Name:");
    if (!name) return;
    const role = window.prompt("Role & institution:") ?? "";
    const quote = window.prompt("Quote:");
    if (!quote) return;
    const ratingRaw = window.prompt("Rating (1–5):", "5");
    const rating = Math.min(5, Math.max(1, parseInt(ratingRaw ?? "5") || 5));

    const idx = testimonials.length % CARD_BG_VARIANTS.length;
    const newItem: Testimonial = {
      id: `t_${Date.now()}`,
      name,
      role,
      quote,
      rating,
      cardBg: CARD_BG_VARIANTS[idx],
    };
    setTestimonials((prev) => [...prev, newItem]);
  }, [testimonials.length]);

  return (
    <SectionContainer className="relative py-24 lg:py-32 bg-zinc-50 dark:bg-zinc-950 overflow-hidden">

      {/* ── Radial glow from bottom ── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_100%,rgba(20,184,166,0.05),transparent)] dark:bg-[radial-gradient(ellipse_60%_40%_at_50%_100%,rgba(20,184,166,0.07),transparent)] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Section header ── */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border-teal-200/60 dark:border-teal-800/60 mb-5">
            <RiSparklingFill className="animate-pulse" />
            Testimonials
          </div>

          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight leading-[1.1] text-zinc-900 dark:text-zinc-50 mb-4">
            Loved by researchers{" "}
            <span
              style={{
                background:
                  "linear-gradient(135deg,#0d9488 0%,#14b8a6 50%,#5eead4 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              &amp; learners worldwide
            </span>
          </h2>

          <p className="text-zinc-500 dark:text-zinc-400 text-[clamp(1rem,1.8vw,1.15rem)] max-w-lg mx-auto leading-relaxed">
            Real stories from teachers and members who use Nexora every day.
          </p>
        </div>

        {/* ── Cards grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((item, idx) => (
            <TestimonialCard
              key={item.id}
              item={item}
              idx={idx}
              isRemoving={removingId === item.id}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}

          {/* ── Add new testimonial placeholder ── */}
          <button
            onClick={handleAdd}
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
            <span className="text-sm font-semibold">Add testimonial</span>
            <span className="text-xs opacity-70">name · role · quote · rating</span>
          </button>
        </div>
      </div>
    </SectionContainer>
  );
}