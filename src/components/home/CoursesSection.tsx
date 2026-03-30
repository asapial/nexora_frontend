"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  RiSparklingFill, RiArrowRightLine, RiGroupLine,
  RiMapPinLine, RiTimeLine, RiShieldCheckLine,
  RiFlaskLine, RiFireLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";


// ─── Types ────────────────────────────────────────────────
interface FeaturedCourse {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  tags: string[];
  price: number;
  isFree: boolean;
  isFeatured: boolean;
  status: string;
  _count: { enrollments: number; missions: number };
  createdAt: string;
}

// ─── Accent palette per card index ───────────────────────
const ACCENTS = [
  {
    glow: "from-teal-500/20 via-emerald-500/10 to-transparent",
    badge: "bg-teal-500/10 border-teal-500/20 text-teal-400",
    tag: "bg-teal-500/8 border-teal-500/15 text-teal-500 dark:text-teal-400",
    btn: "bg-teal-500 hover:bg-teal-400 shadow-teal-500/25",
    line: "from-teal-500/60 to-transparent",
    stat: "text-teal-400",
    free: "bg-teal-500/15 text-teal-400 border-teal-500/20",
  },
  {
    glow: "from-amber-500/20 via-orange-500/10 to-transparent",
    badge: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    tag: "bg-amber-500/8 border-amber-500/15 text-amber-500 dark:text-amber-400",
    btn: "bg-amber-500 hover:bg-amber-400 shadow-amber-500/25",
    line: "from-amber-500/60 to-transparent",
    stat: "text-amber-400",
    free: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  },
  {
    glow: "from-violet-500/20 via-purple-500/10 to-transparent",
    badge: "bg-violet-500/10 border-violet-500/20 text-violet-400",
    tag: "bg-violet-500/8 border-violet-500/15 text-violet-500 dark:text-violet-400",
    btn: "bg-violet-500 hover:bg-violet-400 shadow-violet-500/25",
    line: "from-violet-500/60 to-transparent",
    stat: "text-violet-400",
    free: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  },
  {
    glow: "from-sky-500/20 via-blue-500/10 to-transparent",
    badge: "bg-sky-500/10 border-sky-500/20 text-sky-400",
    tag: "bg-sky-500/8 border-sky-500/15 text-sky-500 dark:text-sky-400",
    btn: "bg-sky-500 hover:bg-sky-400 shadow-sky-500/25",
    line: "from-sky-500/60 to-transparent",
    stat: "text-sky-400",
    free: "bg-sky-500/15 text-sky-400 border-sky-500/20",
  },
  {
    glow: "from-rose-500/20 via-pink-500/10 to-transparent",
    badge: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    tag: "bg-rose-500/8 border-rose-500/15 text-rose-500 dark:text-rose-400",
    btn: "bg-rose-500 hover:bg-rose-400 shadow-rose-500/25",
    line: "from-rose-500/60 to-transparent",
    stat: "text-rose-400",
    free: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  },
  {
    glow: "from-emerald-500/20 via-green-500/10 to-transparent",
    badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    tag: "bg-emerald-500/8 border-emerald-500/15 text-emerald-500 dark:text-emerald-400",
    btn: "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/25",
    line: "from-emerald-500/60 to-transparent",
    stat: "text-emerald-400",
    free: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  },
];

// ─── Skeleton ─────────────────────────────────────────────
function CourseSkeleton() {
  return (
    <div className="relative rounded-3xl border border-border/50 bg-card/60 overflow-hidden animate-pulse">
      <div className="aspect-[16/9] bg-muted/50" />
      <div className="p-6 flex flex-col gap-3">
        <div className="h-3 w-20 rounded-full bg-muted/60" />
        <div className="h-5 w-3/4 rounded-lg bg-muted/60" />
        <div className="h-4 w-full rounded-lg bg-muted/40" />
        <div className="h-4 w-2/3 rounded-lg bg-muted/40" />
        <div className="flex gap-2 mt-1">
          {[1, 2, 3].map(i => <div key={i} className="h-6 w-16 rounded-full bg-muted/40" />)}
        </div>
        <div className="h-10 w-full rounded-xl bg-muted/50 mt-2" />
      </div>
    </div>
  );
}

// ─── Single course card ───────────────────────────────────
function CourseCard({
  course,
  index,
  visible,
}: {
  course: FeaturedCourse;
  index: number;
  visible: boolean;
}) {
  const accent = ACCENTS[index % ACCENTS.length];
  const [imgLoaded, setImgLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={cn(
        "group relative rounded-3xl border bg-card/80 backdrop-blur-sm overflow-hidden",
        "transition-all duration-700 ease-out",
        "hover:shadow-2xl hover:-translate-y-1",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        hovered ? "border-border" : "border-border/50",
      )}
      style={{ transitionDelay: visible ? `${index * 120}ms` : "0ms" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Corner glow on hover */}
      <div className={cn(
        "absolute -top-24 -left-24 w-64 h-64 rounded-full blur-[80px] transition-opacity duration-500 pointer-events-none",
        `bg-gradient-radial ${accent.glow}`,
        hovered ? "opacity-100" : "opacity-0",
      )} />

      {/* Top accent line */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r transition-opacity duration-500",
        accent.line,
        hovered ? "opacity-100" : "opacity-0",
      )} />

      {/* ── Thumbnail ── */}
      <div className="relative aspect-[16/9] overflow-hidden bg-muted/30">
        {!imgLoaded && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted/60 to-muted/30" />
        )}
        <img
          src={course.thumbnailUrl}
          alt={course.title}
          onLoad={() => setImgLoaded(true)}
          className={cn(
            "w-full h-full object-cover transition-all duration-700",
            "group-hover:scale-[1.04]",
            imgLoaded ? "opacity-100" : "opacity-0",
          )}
        />
        {/* Thumbnail gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />

        {/* Featured badge */}
        <div className={cn(
          "absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1",
          "rounded-full border text-[10.5px] font-bold tracking-[.08em] uppercase backdrop-blur-md",
          "bg-black/30 border-white/10 text-white",
        )}>
          <RiFireLine className="text-amber-400 text-xs" />
          Featured
        </div>

        {/* Price badge */}
        <div className={cn(
          "absolute top-3 right-3 px-3 py-1 rounded-full border backdrop-blur-md",
          "text-[12px] font-black tracking-tight",
          course.isFree
            ? "bg-teal-500/20 border-teal-400/30 text-teal-300"
            : "bg-black/40 border-white/15 text-white",
        )}>
          {course.isFree ? "Free" : `$${course.price}`}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-5 flex flex-col gap-3">

        {/* Status row */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10.5px] font-bold tracking-[.1em] uppercase text-muted-foreground/60">
            <RiShieldCheckLine className={cn("text-xs", accent.stat)} />
            {course.status === "PUBLISHED" ? "Live" : course.status}
          </span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/25" />
          <span className="text-[10.5px] text-muted-foreground/50 font-medium">
            {new Date(course.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-[15.5px] font-extrabold tracking-tight text-foreground leading-snug line-clamp-2 group-hover:text-foreground/90 transition-colors">
          {course.title}
        </h3>

        {/* Description */}
        <p className="text-[12.5px] text-muted-foreground leading-relaxed line-clamp-2">
          {course.description}
        </p>

        {/* Tags */}
        {course.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {course.tags.slice(0, 4).map(tag => (
              <span
                key={tag}
                className={cn(
                  "px-2 py-0.5 rounded-full border text-[10.5px] font-semibold tracking-wide",
                  accent.tag,
                )}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-4 pt-1">
          <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <RiGroupLine className={cn("text-xs", accent.stat)} />
            <span className="font-semibold text-foreground">{course._count.enrollments}</span> enrolled
          </span>
          {course._count.missions > 0 && (
            <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <RiFlaskLine className={cn("text-xs", accent.stat)} />
              <span className="font-semibold text-foreground">{course._count.missions}</span> missions
            </span>
          )}
        </div>

        {/* CTA */}
        <Link
          href={`/courses/${course.id}`}
          className={cn(
            "mt-1 flex items-center justify-center gap-2 h-11 rounded-2xl",
            "text-[13px] font-bold tracking-wide text-white",
            "shadow-lg transition-all duration-200",
            "hover:scale-[1.02] active:scale-[0.98]",
            accent.btn,
          )}
        >
          {course.isFree ? "Start Learning Free" : "Enroll Now"}
          <RiArrowRightLine className="text-sm group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────
function SectionHeader({ count }: { count: number }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        {/* Eyebrow */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-md bg-teal-500/15 border border-teal-500/20 flex items-center justify-center">
            <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-[10px]" />
          </div>
          <span className="text-[10.5px] font-black tracking-[.18em] uppercase text-teal-600 dark:text-teal-400">
            Featured Courses
          </span>
        </div>

        {/* Headline with mixed weight typography */}
        <h2 className="text-[2rem] sm:text-[2.4rem] font-black tracking-tight text-foreground leading-[1.1]">
          Learn from the{" "}
          <span className="relative inline-block">
            <span className="relative z-10 bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent">
              best
            </span>
            {/* Underline accent */}
            <span className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-gradient-to-r from-teal-500/60 to-emerald-500/40" />
          </span>
        </h2>
        <p className="text-[13.5px] text-muted-foreground mt-2 max-w-md leading-relaxed">
          Hand-picked courses reviewed and approved by the Nexora team — built for depth, not breadth.
        </p>
      </div>

      {/* Count pill + view all */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="px-3 py-1.5 rounded-full bg-muted/50 border border-border text-[12px] font-bold text-muted-foreground">
          {count} course{count !== 1 ? "s" : ""}
        </span>
        <Link
          href="/courses"
          className="flex items-center gap-1.5 text-[13px] font-bold text-teal-600 dark:text-teal-400
            hover:text-teal-500 transition-colors group"
        >
          View all
          <RiArrowRightLine className="text-sm group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

// ─── Decorative separator line ────────────────────────────
function SectionDivider() {
  return (
    <div className="relative h-px w-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />
    </div>
  );
}

// ─── Main exported section ────────────────────────────────
export default function FeaturedCoursesSection() {
  const [courses, setCourses] = useState<FeaturedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Fetch
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch("/api/homePage/featuredCourse");
        if (!res.ok) throw new Error("Failed to load courses");
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setCourses(data.data.filter((c: FeaturedCourse) => c.status === "PUBLISHED").slice(0, 6));
        }
      } catch (e: any) {
        setError(e.message ?? "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  // Intersection observer — animate on scroll into view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.08 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (error) return null;
  if (!loading && courses.length === 0) return null;

  return (
    <section ref={sectionRef} className="relative w-full py-16 sm:py-20 overflow-hidden">



      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className={cn(
          "transition-all duration-700",
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        )}>
          <SectionHeader count={courses.length || 0} />
        </div>

        {/* ── Divider ── */}
        <div className={cn(
          "my-8 transition-all duration-700 delay-100",
          visible ? "opacity-100" : "opacity-0",
        )}>
          <SectionDivider />
        </div>

        {/* ── Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {loading
            ? [0, 1, 2, 3, 4, 5].map(i => <CourseSkeleton key={i} />)
            : courses.map((course, i) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  index={i}
                  visible={visible}
                />
              ))
          }
        </div>

        {/* ── Bottom CTA strip ── */}
        {!loading && courses.length > 0 && (
          <div className={cn(
            "mt-10 flex flex-col sm:flex-row items-center justify-between gap-4",
            "px-6 py-5 rounded-2xl border border-border/50 bg-muted/20",
            "transition-all duration-700",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
          )}
            style={{ transitionDelay: visible ? "400ms" : "0ms" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500 dark:text-teal-400">
                <RiSparklingFill className="text-sm animate-pulse" />
              </div>
              <div>
                <p className="text-[13.5px] font-bold text-foreground">More courses launching soon</p>
                <p className="text-[12px] text-muted-foreground">All courses are reviewed and approved by Nexora.</p>
              </div>
            </div>
            <Link
              href="/courses"
              className="flex-shrink-0 flex items-center gap-2 h-10 px-5 rounded-xl
                bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600
                text-white text-[13px] font-bold
                shadow-md shadow-teal-600/20
                transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Browse all courses <RiArrowRightLine className="text-sm" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}