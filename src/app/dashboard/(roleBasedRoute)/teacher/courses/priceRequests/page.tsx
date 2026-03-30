"use client";


import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  RiSparklingFill, RiArrowLeftLine,
  RiAlertLine, RiPriceTag3Line, RiAddLine, RiShieldCheckLine,
  RiCloseLine, RiSendPlaneLine, RiLoader4Line, RiRefreshLine,

} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { courseApi } from "../../../../../../lib/api";
import { toast } from "sonner";
import type {  CoursePriceRequest} from "../../../../../../types/course.type";

function AmbientBg() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(20,184,166,0.08) 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
      <div className="absolute top-0 right-0 w-[500px] h-[400px] rounded-full bg-teal-500/[0.04] blur-[110px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[300px] rounded-full bg-amber-500/[0.03] blur-[90px]" />
    </div>
  );
}

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });


const PRICE_CFG = {
  PENDING:  { label: "Pending",  badge: "text-amber-600 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-800/50", dot: "bg-amber-500 animate-pulse" },
  APPROVED: { label: "Approved", badge: "text-teal-600 dark:text-teal-400 bg-teal-50/60 dark:bg-teal-950/30 border-teal-200/60 dark:border-teal-800/50",     dot: "bg-teal-500" },
  REJECTED: { label: "Rejected", badge: "text-red-600 dark:text-red-400 bg-red-50/40 dark:bg-red-950/20 border-red-200/60 dark:border-red-800/50",             dot: "bg-red-500" },
};

const iCls = "w-full h-10 px-3.5 rounded-xl text-[13px] font-medium bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all";

// ─── New Price Request Modal ──────────────────────────────
function NewPriceRequestModal({ courseId, onClose, onCreated }: { courseId: string; onClose: () => void; onCreated: (r: CoursePriceRequest) => void }) {
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!price || parseFloat(price) <= 0) { setError("Enter a valid price"); return; }
    setSaving(true);
    try {
      const res = await courseApi.createPriceRequest(courseId, { requestedPrice: parseFloat(price), note: note.trim() || undefined });
      onCreated(res.data);
      toast.success("Price request submitted!", { position: "top-right" });
      onClose();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-teal-100/70 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/50 text-teal-600 dark:text-teal-400 text-sm"><RiPriceTag3Line /></div>
              <h3 className="text-[14px] font-extrabold text-foreground">Request price change</h3>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-all"><RiCloseLine /></button>
          </div>
          <div className="px-6 py-5 flex flex-col gap-4">
            {error && <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/50"><RiAlertLine className="text-red-500 text-sm" /><p className="text-[12.5px] font-medium text-red-600 dark:text-red-400">{error}</p></div>}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-muted-foreground">Requested price (USD) <span className="text-red-500">*</span></label>
              <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                <input type="number" min="0.99" step="0.01" value={price} onChange={e => { setPrice(e.target.value); setError(""); }} placeholder="0.00" className={cn(iCls, "pl-8")} /></div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-muted-foreground">Justification note</label>
              <textarea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Why is this price appropriate?" className="w-full px-3.5 py-2.5 rounded-xl text-[13px] font-medium bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all resize-none" />
            </div>
            <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/50">
              <RiAlertLine className="text-amber-500 text-sm flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-amber-700 dark:text-amber-400">Admin will review this request before the new price takes effect.</p>
            </div>
          </div>
          <div className="px-6 pb-5 flex items-center gap-3">
            <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:bg-muted/50 transition-all">Cancel</button>
            <button onClick={handleSubmit} disabled={saving} className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2 bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white text-[13px] font-bold transition-all disabled:opacity-60">
              {saving ? <RiLoader4Line className="animate-spin text-sm" /> : <RiSendPlaneLine className="text-sm" />} Submit
            </button>
          </div>
        </div>
      </div>
    </>
  );
}



// ─── Price Requests Page ──────────────────────────────────
export default function PriceRequestsPage() {
  const router = useRouter();

  // ── Course picker state
  const [courses, setCourses] = useState<any[]>([]);
  const [courseId, setCourseId] = useState<string>("");
  const [loadingCourses, setLoadingCourses] = useState(true);

  // ── Price requests state
  const [requests, setRequests] = useState<CoursePriceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // load teacher's courses first
  useEffect(() => {
    courseApi.list()
      .then((r) => {
    const data = r.data as any;
    const list = Array.isArray(data) ? data : (data?.courses ?? []);
        setCourses(list);
        if (list.length > 0) setCourseId(list[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingCourses(false));
  }, []);
  
  useEffect(() => {
    if (courseId) return;
    fetch("/api/courses", { credentials: "include" })
      .then((r) => r.json())
      .then(d => {
        const list = Array.isArray(d.data) ? d.data : (d.data?.courses ?? []);
        setCourses(list);
        if (list.length > 0) setCourseId(list[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingCourses(false));
  }, []);

  const fetchRequests = useCallback(async () => {
    if (!courseId) return;
    setLoading(true); setError(null);
    try { const r = await courseApi.getPriceRequests(courseId); setRequests(r.data); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [courseId]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const selectedCourse = courses.find(c => c.id === courseId);

  return (
    <>
      {showModal && courseId && <NewPriceRequestModal courseId={courseId} onClose={() => setShowModal(false)} onCreated={r => setRequests(p => [r, ...p])} />}
      <div className="relative flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-3xl mx-auto w-full min-h-screen">
        <AmbientBg />
        <div>
          <button onClick={() => router.push("/dashboard/teacher/courses")} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground hover:text-foreground transition-colors mb-3"><RiArrowLeftLine /> Back to courses</button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
                <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Pricing</span>
              </div>
              <h1 className="text-[1.4rem] font-extrabold tracking-tight text-foreground">Price Request History</h1>
              <p className="text-[13px] text-muted-foreground mt-1">Submit and track price approval requests for your courses.</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={fetchRequests} className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
                <RiRefreshLine className={cn("text-sm", loading && "animate-spin")} />
              </button>
              <button onClick={() => setShowModal(true)} disabled={!courseId} className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white text-[13.5px] font-bold shadow-md shadow-teal-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50">
                <RiAddLine /> New request
              </button>
            </div>
          </div>
        </div>

        {/* Course picker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[12.5px] font-semibold text-foreground/70">Select course</label>
          {loadingCourses ? (
            <div className="h-10 rounded-xl bg-muted animate-pulse" />
          ) : courses.length === 0 ? (
            <p className="text-[13px] text-muted-foreground italic">No courses found. Create a course first.</p>
          ) : (
            <select value={courseId} onChange={e => setCourseId(e.target.value)}
              className="h-10 px-4 rounded-xl text-[13.5px] bg-muted/40 border border-border text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all">
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          )}
          {selectedCourse && (
            <p className="text-[12px] text-muted-foreground">
              Status: <span className="font-semibold">{selectedCourse.status}</span>
              {selectedCourse.price != null && <> · Current price: <span className="font-semibold">${Number(selectedCourse.price).toFixed(2)}</span></>}
            </p>
          )}
        </div>

        {error && <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50"><RiAlertLine className="text-red-500 text-base mt-0.5 flex-shrink-0" /><p className="text-[13px] font-medium text-red-600 dark:text-red-400 flex-1">{error}</p><button onClick={fetchRequests} className="text-[12px] font-semibold text-red-600 dark:text-red-400 hover:underline flex-shrink-0">Retry</button></div>}

        {loading
          ? <div className="flex flex-col gap-3 animate-pulse">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 rounded-2xl bg-muted/40" />)}</div>
          : loadingCourses ? null
          : requests.length === 0
            ? (
              <div className="rounded-2xl border border-border bg-card/80 py-16 flex flex-col items-center gap-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-muted/40 border border-border flex items-center justify-center text-xl text-muted-foreground/30"><RiPriceTag3Line /></div>
                <p className="text-[14px] font-bold text-muted-foreground">No price requests yet</p>
                <p className="text-[13px] text-muted-foreground/60">Submit a request to have admin set the course price.</p>
              </div>
            )
            : (
              <div className="flex flex-col gap-3">
                {requests.map((req, i) => {
                  const cfg = PRICE_CFG[req.status];
                  return (
                    <div key={req.id} className={cn("rounded-2xl border bg-card/90 backdrop-blur-sm px-5 py-5 flex flex-col gap-3 transition-all",
                      i === 0 && req.status === "PENDING" ? "border-amber-200/60 dark:border-amber-800/50 shadow-md shadow-amber-500/5" : "border-border")}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center bg-teal-100/60 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/50 text-teal-600 dark:text-teal-400 text-lg"><RiPriceTag3Line /></div>
                          <div>
                            <p className="text-[22px] font-extrabold text-foreground leading-none tabular-nums">${req.requestedPrice.toFixed(2)}</p>
                            <p className="text-[12px] text-muted-foreground mt-0.5">Submitted {fmtDate(req.createdAt)}</p>
                          </div>
                        </div>
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border", cfg.badge)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", cfg.dot)} />{cfg.label}
                        </span>
                      </div>
                      {req.note && <div><p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Your note</p><p className="text-[13px] text-foreground/80 leading-relaxed">{req.note}</p></div>}
                      {req.adminNote && (
                        <div className={cn("flex items-start gap-2.5 px-4 py-3 rounded-xl border",
                          req.status === "APPROVED" ? "bg-teal-50/40 dark:bg-teal-950/20 border-teal-200/60 dark:border-teal-800/50" : "bg-red-50/40 dark:bg-red-950/20 border-red-200/60 dark:border-red-800/50")}>
                          <RiShieldCheckLine className={cn("text-sm mt-0.5 flex-shrink-0", req.status === "APPROVED" ? "text-teal-600 dark:text-teal-400" : "text-red-500")} />
                          <div>
                            <p className="text-[11.5px] font-bold text-muted-foreground">Admin · {req.reviewedAt ? fmtDate(req.reviewedAt) : ""}</p>
                            <p className="text-[13px] text-foreground/80 mt-0.5">{req.adminNote}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
        }
      </div>
    </>
  );
}
