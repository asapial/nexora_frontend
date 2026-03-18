"use client";

import {
  RiSparklingFill,
  RiArrowRightLine,
  RiStarFill,
  RiStarLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import SectionContainer from "@/utils/SectionContainer";

// ─── Types ────────────────────────────────────────────────
export interface CourseCard {
  id: string;
  title: string;
  description: string;
  category: string;
  priceType: "FREE" | "PAID";
  price?: number;
  rating: number;
  enrollments: number;
  /** Single emoji shown centred on the thumbnail */
  thumbEmoji: string;
  /** Inline CSS gradient string for the thumbnail background */
  thumbGradient: string;
  isFeatured?: boolean;
}

export interface CoursesSectionData {
  title: string;
  subtitle: string;
  /** IDs from allCourses to display — admin-controlled via CMS */
  featuredIds: string[];
}

// ─── All available courses ─────────────────────────────────
export const ALL_COURSES: CourseCard[] = [
  {
    id: "c1",
    title: "Mastering Research Methods",
    description:
      "A comprehensive guide to academic research design, literature review, and data analysis.",
    category: "Research",
    priceType: "FREE",
    rating: 4.9,
    enrollments: 1842,
    thumbEmoji: "🧠",
    thumbGradient: "linear-gradient(135deg,#0f766e,#0d9488,#0891b2)",
    isFeatured: true,
  },
  {
    id: "c2",
    title: "Machine Learning Foundations",
    description:
      "From linear regression to transformers — structured modules with graded assignments.",
    category: "AI / ML",
    priceType: "PAID",
    price: 29.99,
    rating: 4.8,
    enrollments: 3201,
    thumbEmoji: "🤖",
    thumbGradient: "linear-gradient(135deg,#4c1d95,#6d28d9,#7c3aed)",
    isFeatured: true,
  },
  {
    id: "c3",
    title: "Data Analysis with Python",
    description:
      "Pandas, NumPy, Matplotlib, and Seaborn — hands-on project-based curriculum.",
    category: "Data Science",
    priceType: "PAID",
    price: 19.99,
    rating: 4.6,
    enrollments: 2104,
    thumbEmoji: "📊",
    thumbGradient: "linear-gradient(135deg,#92400e,#d97706,#f59e0b)",
  },
  {
    id: "c4",
    title: "Full-Stack with Next.js",
    description:
      "Build production-ready apps with Next.js 14, Prisma, TypeScript, and Tailwind CSS.",
    category: "Web Dev",
    priceType: "FREE",
    rating: 4.9,
    enrollments: 5630,
    thumbEmoji: "🌐",
    thumbGradient: "linear-gradient(135deg,#0c4a6e,#0284c7,#38bdf8)",
  },
  {
    id: "c5",
    title: "Scientific Writing Mastery",
    description:
      "Craft compelling papers, theses, and grant proposals with proven structure and clarity.",
    category: "Academic Writing",
    priceType: "PAID",
    price: 14.99,
    rating: 4.7,
    enrollments: 987,
    thumbEmoji: "✍️",
    thumbGradient: "linear-gradient(135deg,#3d1a8e,#7c3aed,#a855f7)",
    isFeatured: true,
  },
];

// ─── Default section config ────────────────────────────────
const DEFAULT_SECTION: CoursesSectionData = {
  title: "Curated by our team",
  subtitle: "Hand-picked structured learning paths — free and paid.",
  featuredIds: ["c1", "c2", "c3", "c4", "c5"],
};

// ─── Star rating sub-component ─────────────────────────────
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) =>
        s <= Math.floor(rating) ? (
          <RiStarFill key={s} className="text-amber-400 text-[12px]" />
        ) : (
          <RiStarLine key={s} className="text-zinc-300 dark:text-zinc-700 text-[12px]" />
        )
      )}
      <span className="ml-1 text-[11.5px] text-zinc-500 dark:text-zinc-500 font-medium">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

// ─── Individual course card ────────────────────────────────
function CourseCardItem({ course }: { course: CourseCard }) {
  return (
    <div
      className={cn(
        "flex-shrink-0 w-[288px] rounded-2xl overflow-hidden",
        "border border-zinc-200/80 dark:border-zinc-800/80",
        "bg-white dark:bg-zinc-900",
        "transition-all duration-300",
        "hover:-translate-y-1.5 hover:shadow-xl",
        "hover:shadow-zinc-900/10 dark:hover:shadow-zinc-900/40",
        "cursor-pointer"
      )}
      style={{ scrollSnapAlign: "start" }}
    >
      {/* ── Thumbnail ── */}
      <div
        className="relative w-full h-36 flex items-center justify-center text-4xl"
        style={{ background: course.thumbGradient }}
      >
        {course.thumbEmoji}

        {course.isFeatured && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[9.5px] font-bold tracking-wider uppercase bg-teal-600/90 text-white backdrop-blur-sm">
            Featured
          </span>
        )}

        {/* Bottom fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* ── Body ── */}
      <div className="p-5">
        {/* Tags */}
        <div className="flex gap-1.5 mb-3 flex-wrap">
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase",
              course.priceType === "FREE"
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
            )}
          >
            {course.priceType === "FREE" ? "Free" : "Paid"}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            {course.category}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-[15px] font-bold text-zinc-900 dark:text-zinc-50 mb-2 leading-snug tracking-tight">
          {course.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4 line-clamp-2">
          {course.description}
        </p>

        {/* Price + rating row */}
        <div className="flex items-center justify-between">
          <StarRating rating={course.rating} />
          <span
            className={cn(
              "text-sm font-extrabold",
              course.priceType === "FREE"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-teal-600 dark:text-teal-400"
            )}
          >
            {course.priceType === "FREE" ? "Free" : `$${course.price}`}
          </span>
        </div>

        {/* Enrollment count */}
        <p className="text-[11px] text-zinc-400 dark:text-zinc-600 mt-2">
          {course.enrollments.toLocaleString()} enrolled
        </p>
      </div>
    </div>
  );
}

// ─── Section ───────────────────────────────────────────────
export default function CoursesSection({
  section = DEFAULT_SECTION,
  allCourses = ALL_COURSES,
}: {
  section?: CoursesSectionData;
  allCourses?: CourseCard[];
}) {
  // Admin controls which courses appear via featuredIds.
  // If the array is empty fall back to showing everything.
  const displayed =
    section.featuredIds.length > 0
      ? allCourses.filter((c) => section.featuredIds.includes(c.id))
      : allCourses;

  return (
    <SectionContainer className="relative py-24 lg:py-28 bg-white dark:bg-zinc-950 overflow-hidden">

      {/* ── Radial glow ── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_30%_at_50%_100%,rgba(20,184,166,0.04),transparent)] dark:bg-[radial-gradient(ellipse_60%_30%_at_50%_100%,rgba(20,184,166,0.07),transparent)] pointer-events-none" />

      {/* ── Section header ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border-teal-200/60 dark:border-teal-800/60 mb-4">
            <RiSparklingFill className="animate-pulse" />
            Featured Courses
          </div>
          <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
            {section.title}
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-base">
            {section.subtitle}
          </p>
        </div>

        <a
          href="#"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors whitespace-nowrap"
        >
          Browse all courses
          <RiArrowRightLine className="text-sm" />
        </a>
      </div>

      {/* ── Horizontal scroll track ── */}
      <div
        className="relative z-10 flex gap-4 overflow-x-auto scroll-smooth pb-4 px-4 sm:px-6 lg:px-8"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {displayed.map((course) => (
          <CourseCardItem key={course.id} course={course} />
        ))}
      </div>
    </SectionContainer>
  );
}