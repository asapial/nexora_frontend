"use client";
// /admin/approvals/price-requests

import { useEffect, useState, useCallback } from "react";
import {
  RiSparklingFill, RiCheckLine, RiCloseLine, RiAlertLine,
  RiPriceTag3Line, RiRefreshLine, RiLoader4Line, RiBookOpenLine, RiUserLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { adminApi } from "../../../../../../lib/api";
import { toast } from "sonner";

const fmtUSD = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function AmbientBg() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none">
      <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(20,184,166,0.11) 1px,transparent 1px)", backgroundSize: "30px 30px" }} />
      <div className="absolute -top-60 -left-40 w-[600px] h-[600px] rounded-full bg-teal-500/[0.06] blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-amber-500/[0.04] blur-[100px]" />
    </div>
  );
}

function RejectModal({ label, onClose, onReject }: { label: string; onClose: () => void; onReject: (n: string) => Promise<void> }) {
  const [note, setNote] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between"><h3 className="text-[14px] font-extrabold text-foreground">Reject — {label}</h3><button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-all"><RiCloseLine /></button></div>
          <div className="px-6 py-5">
            {err && <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/50 mb-3"><RiAlertLine className="text-red-500 text-sm" /><p className="text-[12.5px] text-red-600 dark:text-red-400">{err}</p></div>}
            <textarea rows={4} value={note} onChange={e => { setNote(e.target.value); setErr(""); }} placeholder="Reason for rejection…" className="w-full px-3.5 py-2.5 rounded-xl text-[13px] font-medium bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all resize-none" />
          </div>
          <div className="px-6 pb-5 flex items-center gap-3">
            <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:bg-muted/50 transition-all">Cancel</button>
            <button onClick={async () => { if (!note.trim()) { setErr("Note required"); return; } setBusy(true); try { await onReject(note.trim()); onClose(); } catch (e: any) { setErr(e.message); setBusy(false); } }} disabled={busy}
              className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-[13px] font-bold transition-all disabled:opacity-60">
              {busy ? <RiLoader4Line className="animate-spin text-sm" /> : <RiCloseLine className="text-sm" />} Reject
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function ApproveModal({ req, onClose, onApprove }: { req: any; onClose: () => void; onApprove: (price: number) => Promise<void> }) {
  const [price, setPrice] = useState(String(req.requestedPrice));
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-teal-100/70 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/50 text-teal-600 dark:text-teal-400 text-sm"><RiCheckLine /></div>
              <h3 className="text-[14px] font-extrabold text-foreground">Approve Price</h3>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-all"><RiCloseLine /></button>
          </div>
          <div className="px-6 py-5 flex flex-col gap-4">
            {err && <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/50"><RiAlertLine className="text-red-500 text-sm" /><p className="text-[12.5px] text-red-600 dark:text-red-400">{err}</p></div>}
            <p className="text-[13px] text-muted-foreground">Teacher requested <strong className="text-foreground">{fmtUSD(req.requestedPrice)}</strong> for <strong className="text-foreground">{req.course?.title}</strong></p>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-muted-foreground">Approved price (USD) <span className="text-red-500">*</span></label>
              <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                <input type="number" min="0.01" step="0.01" value={price} onChange={e => { setPrice(e.target.value); setErr(""); }} className="w-full h-11 pl-8 pr-4 rounded-xl text-[13.5px] font-medium bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all" />
              </div>
              <p className="text-[11px] text-muted-foreground/60">You can adjust the price before approving.</p>
            </div>
            {req.note && <div className="px-4 py-3 rounded-xl bg-muted/30 border border-border"><p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Teacher note</p><p className="text-[13px] text-foreground/80">{req.note}</p></div>}
          </div>
          <div className="px-6 pb-5 flex items-center gap-3">
            <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:bg-muted/50 transition-all">Cancel</button>
            <button onClick={async () => { const v = parseFloat(price); if (!v || v <= 0) { setErr("Enter valid price"); return; } setBusy(true); try { await onApprove(v); onClose(); } catch (e: any) { setErr(e.message); setBusy(false); } }} disabled={busy || !price}
              className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2 bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white text-[13px] font-bold transition-all disabled:opacity-60">
              {busy ? <RiLoader4Line className="animate-spin text-sm" /> : <RiCheckLine className="text-sm" />} Approve
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function PriceRequestApprovalsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<any | null>(null);
  const [approveTarget, setApproveTarget] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { const r = await adminApi.getPendingPriceReqs({ status: "PENDING" }); setRequests(Array.isArray(r.data) ? r.data : r.data?.data ?? []); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id: string, price: number) => {
    await adminApi.approvePriceRequest(id, price);
    setRequests(p => p.filter(r => r.id !== id));
    toast.success(`Price ${fmtUSD(price)} approved!`, { position: "top-right" });
  };

  const handleReject = async (id: string, note: string) => {
    await adminApi.rejectPriceRequest(id, note);
    setRequests(p => p.filter(r => r.id !== id));
    toast.success("Price request rejected.", { position: "top-right" });
  };

  return (
    <>
      {rejectTarget && <RejectModal label={`$${rejectTarget.requestedPrice} — ${rejectTarget.course?.title}`} onClose={() => setRejectTarget(null)} onReject={(n) => handleReject(rejectTarget.id, n)} />}
      {approveTarget && <ApproveModal req={approveTarget} onClose={() => setApproveTarget(null)} onApprove={(p) => handleApprove(approveTarget.id, p)} />}

      <div className="relative flex flex-col gap-6 p-5 lg:p-8 pt-6 max-w-4xl mx-auto w-full min-h-screen">
        <AmbientBg />

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1"><RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" /><span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Admin · Approvals</span></div>
            <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">Price Request Approvals</h1>
            <p className="text-[13.5px] text-muted-foreground mt-1">Set the approved price or reject teacher pricing submissions.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} disabled={loading} className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all disabled:opacity-50"><RiRefreshLine className={cn("text-sm", loading && "animate-spin")} /></button>
            <div className="flex items-center gap-2 h-9 px-4 rounded-xl bg-amber-100/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 text-[13px] font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />{requests.length} pending
            </div>
          </div>
        </div>

        {error && <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50"><RiAlertLine className="text-red-500 text-base mt-0.5 flex-shrink-0" /><p className="text-[13px] font-medium text-red-600 dark:text-red-400 flex-1">{error}</p><button onClick={load} className="text-[12px] font-semibold text-red-600 dark:text-red-400 hover:underline">Retry</button></div>}

        {loading
          ? <div className="flex flex-col gap-3 animate-pulse">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 rounded-2xl bg-gradient-to-r from-muted/60 via-muted/40 to-muted/60" />)}</div>
          : requests.length === 0
            ? <div className="rounded-2xl border border-border bg-card/80 py-24 flex flex-col items-center gap-4 text-center"><div className="w-16 h-16 rounded-2xl bg-teal-100/60 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/50 flex items-center justify-center text-2xl text-teal-600 dark:text-teal-400"><RiCheckLine /></div><p className="text-[15px] font-extrabold text-foreground">All caught up!</p></div>
            : (
              <div className="flex flex-col gap-3">
                {requests.map(req => (
                  <div key={req.id} className="group relative rounded-2xl border border-border bg-card/90 backdrop-blur-sm px-5 py-5 hover:border-teal-200/60 dark:hover:border-teal-800/50 hover:shadow-lg hover:shadow-teal-500/[0.05] transition-all overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center bg-teal-100/60 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/50 text-teal-600 dark:text-teal-400 text-xl"><RiPriceTag3Line /></div>
                        <div className="min-w-0">
                          <p className="text-[24px] font-extrabold text-foreground leading-none tabular-nums">{fmtUSD(req.requestedPrice)}</p>
                          {req.course && <p className="text-[12.5px] text-muted-foreground mt-0.5 flex items-center gap-1.5"><RiBookOpenLine className="text-xs text-teal-600 dark:text-teal-400" />{req.course.title}</p>}
                          {req.teacher?.user && <p className="text-[12px] text-muted-foreground flex items-center gap-1.5"><RiUserLine className="text-xs text-teal-600 dark:text-teal-400" />{req.teacher.user.name}</p>}
                          <p className="text-[11.5px] text-muted-foreground/60 mt-0.5">Submitted {fmtDate(req.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => setRejectTarget(req)} className="h-9 px-3 rounded-xl border border-red-200/60 dark:border-red-800/50 bg-red-50/40 dark:bg-red-950/20 text-[12px] font-bold text-red-600 dark:text-red-400 hover:bg-red-100/60 transition-all">Reject</button>
                        <button onClick={() => setApproveTarget(req)} className="h-9 px-4 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white text-[12px] font-bold transition-all flex items-center gap-1.5"><RiCheckLine className="text-xs" />Set & Approve</button>
                      </div>
                    </div>
                    {req.note && <div className="mt-3.5 px-4 py-3 rounded-xl bg-muted/30 border border-border"><p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Teacher note</p><p className="text-[13px] text-foreground/80">{req.note}</p></div>}
                  </div>
                ))}
              </div>
            )
        }
      </div>
    </>
  );
}