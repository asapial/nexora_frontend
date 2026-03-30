
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  RiSparklingFill,  RiGroupLine,
  RiStarFill, RiCheckLine, RiArrowRightLine,
  RiFileTextLine, RiAlertLine, 
  RiShieldCheckLine, RiLock2Line,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { studentApi } from "../../../../lib/api";
import { AmbientBg6 } from "@/components/backgrounds/AmbientBg";

const fmtUSD = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);


export default function CourseDetailPublicPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    studentApi.getCoursePublic(id)
      .then(r => setCourse(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="relative flex flex-col gap-4  lg:pt-30 pt-6 max-w-5xl mx-auto animate-pulse h-[50vh]">
      <AmbientBg6 />
      <div className="h-64 rounded-2xl bg-gradient-to-r from-muted/60 via-muted/40 to-muted/60 w-full" />
      <div className="h-6  rounded-full bg-muted/60 w-full" />
      <div className="h-4  rounded-full bg-muted/40 w-full" />
    </div>
  );

  if (error || !course) return (
    <div className="relative flex flex-col items-center gap-4 p-20 max-w-xl mx-auto text-center">
      <AmbientBg6 />
      <RiAlertLine className="text-4xl text-red-500" />
      <p className="text-[14px] font-bold text-foreground">{error ?? "Course not found"}</p>
      <button onClick={() => router.push("/courses")} className="h-9 px-4 rounded-xl bg-teal-600 dark:bg-teal-500 text-white text-[13px] font-bold hover:bg-teal-700 transition-colors">Browse courses</button>
    </div>
  );

  return (
    <div className="relative flex flex-col gap-6 p-5 lg:p-20 mt-20 max-w-7xl mx-auto w-full min-h-screen ">
      <AmbientBg6 />

      {/* Thumbnail hero */}
      {course.thumbnailUrl && (
        <div className="rounded-2xl overflow-hidden h-[40vh] shadow-2xl relative">
          <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        </div>
      )}

      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Left: info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {course.isFeatured && <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50 text-[11px] font-bold text-amber-600 dark:text-amber-400"><RiStarFill className="text-xs" />Featured</span>}
            {course.tags?.map((t: string) => <span key={t} className="px-2 py-0.5 rounded-md bg-muted/50 border border-border text-[11px] font-semibold text-muted-foreground">{t}</span>)}
          </div>
          <h1 className="text-[1.7rem] font-extrabold tracking-tight text-foreground leading-tight">{course.title}</h1>
          {course.description && <p className="text-[13.5px] text-muted-foreground mt-2 leading-relaxed">{course.description}</p>}

          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground"><RiGroupLine className="text-xs text-teal-600 dark:text-teal-400" />{(course._count?.enrollments ?? 0).toLocaleString()} students</span>
            <span className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground"><RiFileTextLine className="text-xs text-teal-600 dark:text-teal-400" />{course._count?.missions ?? 0} missions</span>
            {course.teacher?.user && <span className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground"><RiSparklingFill className="text-xs text-teal-600 dark:text-teal-400" />By {course.teacher.user.name}</span>}
          </div>

          {/* Mission list preview */}
          {course.missions && course.missions.length > 0 && (
            <div className="mt-6 flex flex-col gap-3">
              <p className="text-[14px] font-bold text-foreground">Course content — {course.missions.length} missions</p>
              <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm overflow-hidden">
                {course.missions.map((m: any, i: number) => (
                  <div key={m.id} className={cn("flex items-center gap-3 px-5 py-3.5", i !== course.missions.length - 1 && "border-b border-border")}>
                    <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center bg-teal-100/60 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/50 text-teal-600 dark:text-teal-400 text-[10px] font-extrabold">{i + 1}</div>
                    <p className="text-[13px] font-semibold text-foreground flex-1 truncate">{m.title}</p>
                    <RiLock2Line className="text-muted-foreground/40 text-sm flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: enroll card */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <div className="sticky top-4 rounded-2xl border border-border bg-card/95 backdrop-blur-md px-5 py-5 flex flex-col gap-4 shadow-xl shadow-black/10">
            <div>
              <p className="text-[30px] font-extrabold text-foreground leading-none tabular-nums">
                {course.isFree ? <span className="text-teal-600 dark:text-teal-400">Free</span> : fmtUSD(course.price)}
              </p>
              {!course.isFree && <p className="text-[12px] text-muted-foreground mt-0.5">One-time payment · Lifetime access</p>}
            </div>

            <button onClick={() => router.push(`/courses/${id}/enroll`)}
              className={cn(
                "w-full h-12 rounded-xl flex items-center justify-center gap-2",
                "bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600",
                "text-white font-extrabold text-[14.5px]",
                "shadow-lg shadow-teal-600/20 transition-all duration-200",
                "hover:scale-[1.02] active:scale-[0.99]"
              )}>
              {course.isFree ? <><RiCheckLine className="text-base" />Enroll free</> : <><RiArrowRightLine className="text-base" />Enroll now</>}
            </button>

            {!course.isFree && (
              <p className="text-[11.5px] text-muted-foreground text-center flex items-center justify-center gap-1.5">
                <RiShieldCheckLine className="text-teal-600 dark:text-teal-400 text-sm" />
                Secure payment via Stripe
              </p>
            )}

            <div className="flex flex-col gap-2 pt-1 border-t border-border/60">
              {[
                { icon: <RiFileTextLine className="text-xs text-teal-600 dark:text-teal-400" />, text: `${course._count?.missions ?? 0} missions` },
                { icon: <RiGroupLine className="text-xs text-teal-600 dark:text-teal-400" />, text: `${(course._count?.enrollments ?? 0).toLocaleString()} students` },
                { icon: <RiCheckLine className="text-xs text-teal-600 dark:text-teal-400" />, text: "Lifetime access" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span>{item.icon}</span>
                  <span className="text-[12.5px] text-muted-foreground">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}