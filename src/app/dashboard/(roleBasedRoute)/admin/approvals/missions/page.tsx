"use client";
// /admin/approvals/missions

import { useEffect, useState, useCallback } from "react";
import {
  RiSparklingFill, RiCheckLine, RiCloseLine, RiAlertLine,
  RiFileTextLine, RiVideoLine, RiArticleLine, RiFileMarkedLine,
  RiRefreshLine, RiLoader4Line, RiBookOpenLine, RiUserLine

} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { adminApi } from "../../../../../../lib/api";
import { toast } from "sonner";
import { LucideChevronDown, LucideChevronUp } from "lucide-react";

function AmbientBg() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none">
      <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(20,184,166,0.11) 1px,transparent 1px)", backgroundSize: "30px 30px" }} />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-teal-500/[0.06] blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-amber-500/[0.04] blur-[100px]" />
    </div>
  );
}

const CONTENT_CFG: Record<string, { icon: React.ReactNode; color: string }> = {
  VIDEO: { icon: <RiVideoLine />,    color: "text-blue-600 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-800/50" },
  TEXT:  { icon: <RiArticleLine />,  color: "text-teal-600 dark:text-teal-400 bg-teal-100/60 dark:bg-teal-950/40 border-teal-200/60 dark:border-teal-800/50" },
  PDF:   { icon: <RiFileMarkedLine />, color: "text-amber-600 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/50" },
};

function RejectModal({ label, onClose, onReject }: { label: string; onClose: () => void; onReject: (n: string) => Promise<void> }) {
  const [note, setNote] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const submit = async () => { if (!note.trim()) { setErr("Note required"); return; } setBusy(true); try { await onReject(note.trim()); onClose(); } catch (e: any) { setErr(e.message); setBusy(false); } };
  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between"><h3 className="text-[14px] font-extrabold text-foreground">Reject — {label}</h3><button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-all"><RiCloseLine /></button></div>
          <div className="px-6 py-5 flex flex-col gap-4">
            {err && <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/50"><RiAlertLine className="text-red-500 text-sm" /><p className="text-[12.5px] text-red-600 dark:text-red-400">{err}</p></div>}
            <textarea rows={4} value={note} onChange={e => { setNote(e.target.value); setErr(""); }} placeholder="Explain reason…" className="w-full px-3.5 py-2.5 rounded-xl text-[13px] font-medium bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all resize-none" />
          </div>
          <div className="px-6 pb-5 flex items-center gap-3">
            <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:bg-muted/50 transition-all">Cancel</button>
            <button onClick={submit} disabled={busy} className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-[13px] font-bold transition-all disabled:opacity-60">
              {busy ? <RiLoader4Line className="animate-spin text-sm" /> : <RiCloseLine className="text-sm" />} Reject
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function MissionApprovalsPage() {
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<any | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { const r = await adminApi.getPendingMissions(); setMissions(Array.isArray(r.data) ? r.data : r.data?.data ?? []); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id: string) => {
    setApproving(id);
    try { await adminApi.approveMission(id); setMissions(p => p.filter(m => m.id !== id)); toast.success("Mission approved!", { position: "top-right" }); }
    catch (e: any) { toast.error(e.message); }
    finally { setApproving(null); }
  };

  const handleReject = async (id: string, note: string) => {
    await adminApi.rejectMission(id, note);
    setMissions(p => p.filter(m => m.id !== id));
    toast.success("Mission rejected.", { position: "top-right" });
  };

  return (
    <>
      {rejectTarget && <RejectModal label={rejectTarget.title} onClose={() => setRejectTarget(null)} onReject={(n) => handleReject(rejectTarget.id, n)} />}

      <div className="relative flex flex-col gap-6 p-5 lg:p-8 pt-6 max-w-5xl mx-auto w-full min-h-screen">
        <AmbientBg />

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1"><RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" /><span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Admin · Approvals</span></div>
            <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">Mission Approvals</h1>
            <p className="text-[13.5px] text-muted-foreground mt-1">Review mission content before it goes live to students.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} disabled={loading} className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all disabled:opacity-50"><RiRefreshLine className={cn("text-sm", loading && "animate-spin")} /></button>
            <div className="flex items-center gap-2 h-9 px-4 rounded-xl bg-amber-100/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 text-[13px] font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />{missions.length} pending
            </div>
          </div>
        </div>

        {error && <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50"><RiAlertLine className="text-red-500 text-base mt-0.5 flex-shrink-0" /><p className="text-[13px] font-medium text-red-600 dark:text-red-400 flex-1">{error}</p><button onClick={load} className="text-[12px] font-semibold text-red-600 dark:text-red-400 hover:underline">Retry</button></div>}

        {loading ? (
          <div className="flex flex-col gap-3 animate-pulse">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-gradient-to-r from-muted/60 via-muted/40 to-muted/60" />)}</div>
        ) : missions.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card/80 py-24 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-teal-100/60 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/50 flex items-center justify-center text-2xl text-teal-600 dark:text-teal-400"><RiCheckLine /></div>
            <p className="text-[15px] font-extrabold text-foreground">All caught up!</p>
            <p className="text-[13px] text-muted-foreground">No missions pending approval.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {missions.map(m => {
              const isExpanded = expanded === m.id;
              return (
                <div key={m.id} className={cn("rounded-2xl border bg-card/90 backdrop-blur-sm overflow-hidden transition-all duration-200", isExpanded ? "border-teal-200/60 dark:border-teal-800/50 shadow-lg shadow-teal-500/[0.05]" : "border-border hover:border-teal-200/40 dark:hover:border-teal-800/30")}>
                  <div className="flex items-center gap-4 p-5">
                    <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center bg-teal-100/60 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/50 text-teal-600 dark:text-teal-400 text-base"><RiFileTextLine /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-extrabold text-foreground truncate">{m.title}</p>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {m.course && <span className="flex items-center gap-1 text-[12px] text-muted-foreground"><RiBookOpenLine className="text-xs text-teal-600 dark:text-teal-400" />{m.course.title}</span>}
                        {m.course?.teacher?.user && <span className="flex items-center gap-1 text-[12px] text-muted-foreground"><RiUserLine className="text-xs text-teal-600 dark:text-teal-400" />{m.course.teacher.user.name}</span>}
                        <span className="flex items-center gap-1 text-[12px] text-muted-foreground"><RiFileTextLine className="text-xs" />{m.contents?.length ?? m._count?.contents ?? 0} items</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => setExpanded(isExpanded ? null : m.id)} className="w-8 h-8 rounded-lg flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
                        {isExpanded ? <LucideChevronUp  className="text-sm" /> : <LucideChevronDown  className="text-sm" />}
                      </button>
                      <button onClick={() => setRejectTarget(m)} className="h-9 px-3 rounded-xl border border-red-200/60 dark:border-red-800/50 bg-red-50/40 dark:bg-red-950/20 text-[12px] font-bold text-red-600 dark:text-red-400 hover:bg-red-100/60 transition-all">Reject</button>
                      <button onClick={() => handleApprove(m.id)} disabled={approving === m.id} className="h-9 px-3 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white text-[12px] font-bold transition-all disabled:opacity-60 flex items-center gap-1.5">
                        {approving === m.id ? <RiLoader4Line className="animate-spin text-xs" /> : <RiCheckLine className="text-xs" />} Approve
                      </button>
                    </div>
                  </div>

                  {isExpanded && (m.contents ?? []).length > 0 && (
                    <div className="border-t border-border px-5 py-4 flex flex-col gap-2">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Content preview</p>
                      {m.contents.map((cnt: any) => {
                        const cfg = CONTENT_CFG[cnt.type] ?? CONTENT_CFG.TEXT;
                        return (
                          <div key={cnt.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/30 border border-border">
                            <span className={cn("w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-sm border", cfg.color)}>{cfg.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-bold text-foreground truncate">{cnt.title}</p>
                              <p className="text-[11.5px] text-muted-foreground">{cnt.type}{cnt.duration ? ` · ${Math.floor(cnt.duration / 60)}m` : ""}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}