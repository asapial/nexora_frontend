"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
 RiCheckLine, RiAlertLine,
 RiFileMarkedLine, RiArrowRightLine,
  RiArrowLeftLine, RiMenuLine, RiCloseLine,  RiPlayCircleLine,
  RiVideoLine,
  RiArticleLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { studentApi } from "../../../../../../lib/api";
import { toast } from "sonner";




const CONTENT_CFG: Record<string, { icon: React.ReactNode; color: string }> = {
  VIDEO: { icon: <RiVideoLine />,    color: "text-blue-600 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-800/50" },
  TEXT:  { icon: <RiArticleLine />,  color: "text-teal-600 dark:text-teal-400 bg-teal-100/60 dark:bg-teal-950/40 border-teal-200/60 dark:border-teal-800/50" },
  PDF:   { icon: <RiFileMarkedLine />, color: "text-amber-600 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/50" },
};


// ════════════════════════════════════════════════════════════
// COURSE PLAYER
// ════════════════════════════════════════════════════════════
export default function CoursePlayerPage() {
  const router = useRouter();
  const { courseId } = useParams() as { courseId: string };
  const [enrollment, setEnrollment] = useState<any>(null);
  const [missions, setMissions] = useState<any[]>([]);
  const [contents, setContents] = useState<Record<string, any[]>>({});
  const [missionProgress, setMissionProgress] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMission, setActiveMission] = useState<any | null>(null);
  const [activeContent, setActiveContent] = useState<any | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const r = await studentApi.getMyEnrollment(courseId);
        setEnrollment(r.data);
        const m = r.data?.course?.missions ?? r.data?.missions ?? [];
        setMissions(m);
        const pm: Record<string, boolean> = {};
        (r.data?.missionProgress ?? []).forEach((mp: any) => { pm[mp.missionId] = mp.isCompleted; });
        setMissionProgress(pm);
        if (m.length > 0) setActiveMission(m[0]);
      } catch (e: any) { setError(e.message); }
      finally { setLoading(false); }
    };
    load();
  }, [courseId]);

  const loadContents = useCallback(async (missionId: string) => {
    if (contents[missionId]) return;
    setContentLoading(missionId);
    try {
      const r = await studentApi.getMissionContents(missionId);
      const arr = Array.isArray(r.data) ? r.data : [];
      setContents(p => ({ ...p, [missionId]: arr }));
      if (arr.length) setActiveContent(arr[0]);
    } catch { }
    finally { setContentLoading(null); }
  }, [contents]);

  useEffect(() => {
    if (activeMission) { setActiveContent(null); loadContents(activeMission.id); }
  }, [activeMission?.id]);

  const handleComplete = async (missionId: string) => {
    setCompleting(missionId);
    try {
      await studentApi.completeMission(courseId, missionId);
      setMissionProgress(p => ({ ...p, [missionId]: true }));
      toast.success("Mission marked as complete! ✓", { position: "top-right" });
    } catch (e: any) { toast.error(e.message); }
    finally { setCompleting(null); }
  };

  const completedCount = missions.filter(m => missionProgress[m.id]).length;
  const progressPct = missions.length > 0 ? Math.round((completedCount / missions.length) * 100) : 0;
  const activeMissionContents = activeMission ? (contents[activeMission.id] ?? []) : [];
  const activeMissionIdx = missions.findIndex(m => m.id === activeMission?.id);

  if (loading) return (
    <div className="relative flex flex-col gap-4 p-5 lg:p-8 max-w-6xl mx-auto animate-pulse">
      {/* <AmbientBg player /> */}
      <div className="h-8 w-1/3 rounded-full bg-muted/60" />
      <div className="grid grid-cols-[280px_1fr] gap-4"><div className="h-96 rounded-2xl bg-muted/40" /><div className="h-96 rounded-2xl bg-muted/40" /></div>
    </div>
  );

  if (error || !enrollment) return (
    <div className="flex flex-col items-center gap-4 p-10 text-center">
      {/* <AmbientBg /> */}
      <RiAlertLine className="text-4xl text-red-500" />
      <p className="text-[14px] font-bold text-foreground">{error ?? "Enrollment not found"}</p>
      <button onClick={() => router.push("/dashboard/student/courses")} className="h-9 px-4 rounded-xl bg-teal-600 dark:bg-teal-500 text-white text-[13px] font-bold hover:bg-teal-700 transition-colors">My courses</button>
    </div>
  );

  const course = enrollment.course ?? {};

  return (
    <div className="relative flex flex-col w-full min-h-screen">
      {/* <AmbientBg player /> */}

      {/* Top bar */}
      <div className="sticky top-0 z-20 flex items-center gap-4 px-5 py-3.5 border-b border-border bg-card/95 backdrop-blur-md">
        <button onClick={() => router.push("/dashboard/student/courses")} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all flex-shrink-0"><RiArrowLeftLine className="text-sm" /></button>
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-extrabold text-foreground truncate">{course.title ?? "Course"}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex-1 h-1 rounded-full bg-muted/50 max-w-[200px] overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-teal-600 to-teal-400 transition-all duration-700" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="text-[11px] text-muted-foreground font-semibold">{progressPct}% · {completedCount}/{missions.length}</span>
          </div>
        </div>
        <button onClick={() => setSidebarOpen(p => !p)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all flex-shrink-0 lg:hidden">
          {sidebarOpen ? <RiCloseLine className="text-sm" /> : <RiMenuLine className="text-sm" />}
        </button>
      </div>

      {/* Layout */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className={cn("flex-shrink-0 border-r border-border bg-card/80 backdrop-blur-sm flex flex-col transition-all duration-300 overflow-hidden", sidebarOpen ? "w-72" : "w-0")}>
          <div className="px-4 py-3.5 border-b border-border flex-shrink-0 bg-muted/20">
            <p className="text-[11.5px] font-bold text-muted-foreground">{missions.length} missions · {completedCount} completed</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {missions.map((m, i) => {
              const isDone = missionProgress[m.id];
              const isActive = activeMission?.id === m.id;
              return (
                <button key={m.id} onClick={() => { setActiveMission(m); if (window.innerWidth < 1024) setSidebarOpen(false); }}
                  className={cn(
                    "w-full text-left flex items-start gap-3 px-4 py-3.5 transition-all border-b border-border/50",
                    isActive ? "bg-teal-50/40 dark:bg-teal-950/20 border-l-[3px] border-l-teal-500" : "hover:bg-muted/30"
                  )}>
                  <div className={cn("w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5 text-[10px] font-extrabold border",
                    isDone ? "bg-teal-100/70 dark:bg-teal-950/50 border-teal-200/60 dark:border-teal-800/50 text-teal-600 dark:text-teal-400"
                    : isActive ? "bg-teal-100/60 dark:bg-teal-950/40 border-teal-200/60 dark:border-teal-800/50 text-teal-600 dark:text-teal-400"
                    : "bg-muted/40 border-border text-muted-foreground/50"
                  )}>{isDone ? <RiCheckLine className="text-xs" /> : i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-[13px] font-bold leading-snug line-clamp-2", isActive ? "text-teal-600 dark:text-teal-400" : isDone ? "text-foreground/60" : "text-foreground")}>{m.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{m._count?.contents ?? 0} items</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {activeMission ? (
            <div className="flex-1 overflow-y-auto p-5 lg:p-7 flex flex-col gap-5">
              {/* Mission header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Mission {activeMissionIdx + 1} of {missions.length}</span>
                    {missionProgress[activeMission.id] && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-100/60 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/50 text-teal-600 dark:text-teal-400"><RiCheckLine className="text-xs" />Complete</span>}
                  </div>
                  <h2 className="text-[1.2rem] font-extrabold text-foreground leading-tight">{activeMission.title}</h2>
                  {activeMission.description && <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">{activeMission.description}</p>}
                </div>
                {!missionProgress[activeMission.id] && (
                  <button onClick={() => handleComplete(activeMission.id)} disabled={!!completing}
                    className="flex items-center gap-2 h-9 px-4 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white text-[12.5px] font-bold transition-all disabled:opacity-60 flex-shrink-0">
                    {completing === activeMission.id ? <RiLoader4Line className="animate-spin text-sm" /> : <RiCheckLine className="text-sm" />} Mark complete
                  </button>
                )}
              </div>

              {/* Content list */}
              {contentLoading === activeMission.id ? (
                <div className="flex items-center justify-center py-12"><RiLoader4Line className="animate-spin text-teal-500 text-2xl" /></div>
              ) : activeMissionContents.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card/80 py-12 flex flex-col items-center gap-3 text-center">
                  <RiFileTextLine className="text-2xl text-muted-foreground/30" />
                  <p className="text-[13px] text-muted-foreground">No content items for this mission.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {activeMissionContents.map((cnt: any) => {
                    const isExpanded = activeContent?.id === cnt.id;
                    const cfg = CONTENT_CFG[cnt.type] ?? CONTENT_CFG.TEXT;
                    return (
                      <div key={cnt.id} onClick={() => setActiveContent(isExpanded ? null : cnt)}
                        className={cn("rounded-2xl border overflow-hidden cursor-pointer transition-all duration-200",
                          isExpanded ? "border-teal-200/60 dark:border-teal-800/50 shadow-md shadow-teal-500/5" : "border-border bg-card/90 backdrop-blur-sm hover:border-teal-200/40 dark:hover:border-teal-800/40"
                        )}>
                        <div className="flex items-center gap-3 px-5 py-3.5">
                          <span className={cn("w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-base border", cfg.color)}>{cfg.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-foreground truncate">{cnt.title}</p>
                            <p className="text-[11.5px] text-muted-foreground">{cnt.type}{cnt.duration ? ` · ${Math.floor(cnt.duration / 60)}m` : ""}</p>
                          </div>
                          <RiPlayCircleLine className={cn("text-lg text-muted-foreground/40 flex-shrink-0 transition-all", isExpanded && "text-teal-500 rotate-90")} />
                        </div>

                        {isExpanded && (
                          <div className="border-t border-border px-5 py-4 bg-muted/10">
                            {cnt.type === "VIDEO" && cnt.videoUrl && (
                              <div className="aspect-video rounded-xl overflow-hidden bg-black shadow-xl">
                                <iframe src={cnt.videoUrl.replace("watch?v=", "embed/")} className="w-full h-full" allowFullScreen title={cnt.title} />
                              </div>
                            )}
                            {cnt.type === "TEXT" && cnt.textBody && (
                              <div className="prose dark:prose-invert prose-sm max-w-none">
                                <p className="text-[13.5px] text-foreground/80 leading-relaxed whitespace-pre-wrap">{cnt.textBody}</p>
                              </div>
                            )}
                            {cnt.type === "PDF" && cnt.pdfUrl && (
                              <a href={cnt.pdfUrl} target="_blank" rel="noreferrer"
                                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/50 hover:bg-amber-100/60 transition-colors">
                                <RiFileMarkedLine className="text-amber-600 dark:text-amber-400 text-xl" />
                                <div><p className="text-[13px] font-bold text-foreground">{cnt.title}</p><p className="text-[11.5px] text-muted-foreground">Click to open PDF in new tab</p></div>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <button onClick={() => setActiveMission(missions[activeMissionIdx - 1])} disabled={activeMissionIdx === 0}
                  className="flex items-center gap-2 h-9 px-4 rounded-xl border border-border text-[12.5px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  <RiArrowLeftLine className="text-sm" /> Previous
                </button>
                <span className="text-[12px] text-muted-foreground">{activeMissionIdx + 1} / {missions.length}</span>
                <button onClick={() => setActiveMission(missions[activeMissionIdx + 1])} disabled={activeMissionIdx === missions.length - 1}
                  className="flex items-center gap-2 h-9 px-4 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white text-[12.5px] font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  Next <RiArrowRightLine className="text-sm" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-10 text-center">
              <RiPlayCircleLine className="text-6xl text-teal-500/20" />
              <p className="text-[14px] font-bold text-muted-foreground">Select a mission from the sidebar to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}