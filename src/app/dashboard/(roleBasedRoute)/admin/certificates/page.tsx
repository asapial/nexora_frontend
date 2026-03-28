"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RiSparklingFill, RiAwardLine, RiRefreshLine, RiLoader4Line,
  RiCheckLine, RiLinkM, RiDownloadLine, RiUserLine, RiBookOpenLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { adminPlatformApi } from "@/lib/api";
import { toast } from "sonner";

type Certificate = {
  id: string;
  title: string;
  issuedAt: string;
  verificationCode?: string;
  user?: { name: string; email: string };
  course?: { title: string };
};

type Enrollment = {
  id: string;
  userId: string;
  courseId?: string;
  paymentStatus: string;
  enrolledAt: string;
  user?: { name: string; email: string };
  course?: { title: string };
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function SkeletonRow() {
  return (
    <div className="grid grid-cols-[1fr_1fr_120px_80px] gap-4 px-5 py-4 border-b border-border/60 animate-pulse items-center">
      {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-3 bg-muted rounded" />)}
    </div>
  );
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [tab, setTab] = useState<"issued" | "generate">("issued");
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  const loadCerts = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminPlatformApi.getCertificates();
      const raw = r.data;
      setCertificates(Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : []);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }, []);

  const loadEnrollments = useCallback(async () => {
    setLoadingEnrollments(true);
    try {
      // Re-use the admin enrollments endpoint
      const r = await fetch("/api/admin/enrollments?limit=50", { credentials: "include" });
      const json = await r.json();
      const raw = json.data;
      setEnrollments(Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : []);
    } catch { toast.error("Failed to load enrollments"); }
    finally { setLoadingEnrollments(false); }
  }, []);

  useEffect(() => { loadCerts(); }, [loadCerts]);

  const switchTab = (t: "issued" | "generate") => {
    setTab(t);
    if (t === "generate" && enrollments.length === 0) loadEnrollments();
  };

  const generate = async (enrollmentId: string) => {
    setGenerating(enrollmentId);
    try {
      await adminPlatformApi.generateCert(enrollmentId);
      toast.success("Certificate generated!");
      await loadCerts();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setGenerating(null); }
  };

  const copyVerificationUrl = (code?: string) => {
    if (!code) return;
    const url = `${window.location.origin}/verify/${code}`;
    navigator.clipboard.writeText(url);
    toast.success("Verification URL copied");
  };

  return (
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
          <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Admin</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">Certificate Generation</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Auto-generate completion certificates with unique verification URLs</p>
          </div>
          <button onClick={loadCerts}
            className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
            <RiRefreshLine className={cn("text-sm", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Stat card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm border mb-2.5 text-teal-600 dark:text-teal-400 bg-teal-100/60 dark:bg-teal-950/40 border-teal-200/60">
            <RiAwardLine />
          </div>
          <p className="text-[1.3rem] font-extrabold tabular-nums text-foreground leading-none mb-0.5">{loading ? "—" : certificates.length}</p>
          <p className="text-[12px] font-medium text-muted-foreground">Certificates issued</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted/40 border border-border w-fit">
        {[
          { key: "issued" as const, label: "Issued Certificates" },
          { key: "generate" as const, label: "Generate from Enrollments" },
        ].map(t => (
          <button key={t.key} onClick={() => switchTab(t.key)}
            className={cn("h-8 px-4 rounded-lg text-[12.5px] font-semibold transition-all",
              tab === t.key ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "issued" ? (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_120px_100px] gap-4 px-5 py-3 border-b border-border bg-muted/20">
            {["Student", "Course", "Issued", "Actions"].map(h => (
              <p key={h} className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{h}</p>
            ))}
          </div>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            : certificates.length === 0
            ? (
              <div className="py-16 text-center">
                <RiAwardLine className="text-4xl text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-[13.5px] font-medium text-muted-foreground">No certificates issued yet</p>
                <p className="text-[12px] text-muted-foreground/60 mt-1">Switch to "Generate" tab to create your first certificate</p>
              </div>
            )
            : certificates.map(cert => (
              <div key={cert.id} className="grid grid-cols-[1fr_1fr_120px_100px] gap-4 px-5 py-4 border-b border-border/60 last:border-0 hover:bg-muted/10 transition-colors items-center">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">{cert.user?.name ?? "—"}</p>
                  <p className="text-[11.5px] text-muted-foreground truncate">{cert.user?.email ?? ""}</p>
                </div>
                <p className="text-[12.5px] text-muted-foreground truncate">{cert.course?.title ?? "—"}</p>
                <p className="text-[12.5px] text-muted-foreground">{fmtDate(cert.issuedAt)}</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => copyVerificationUrl(cert.verificationCode)}
                    title="Copy verification URL"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sky-600 hover:bg-sky-50/60 transition-all">
                    <RiLinkM className="text-sm" />
                  </button>
                  <button onClick={() => window.print()} title="Download / print"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-teal-600 hover:bg-teal-50/60 transition-all">
                    <RiDownloadLine className="text-sm" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/10">
            <p className="text-[11.5px] font-bold text-muted-foreground uppercase tracking-wider">Select an enrollment to generate a certificate</p>
          </div>
          {loadingEnrollments
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            : enrollments.length === 0
            ? (
              <div className="py-16 text-center">
                <RiBookOpenLine className="text-4xl text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-[13.5px] font-medium text-muted-foreground">No enrollments found</p>
              </div>
            )
            : enrollments.map(e => (
              <div key={e.id} className="flex items-center gap-4 px-5 py-4 border-b border-border/60 last:border-0 hover:bg-muted/10 transition-colors">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <RiUserLine className="text-muted-foreground text-xs" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">{e.user?.name ?? "—"}</p>
                  <p className="text-[11.5px] text-muted-foreground truncate">{e.course?.title ?? "—"} · {e.paymentStatus}</p>
                </div>
                <span className="text-[11px] text-muted-foreground">{fmtDate(e.enrolledAt)}</span>
                <button onClick={() => generate(e.id)} disabled={generating === e.id}
                  className="h-8 px-3 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 disabled:opacity-50 text-white text-[12px] font-bold flex items-center gap-1.5 transition-all shrink-0">
                  {generating === e.id ? <RiLoader4Line className="animate-spin" /> : <RiCheckLine />}
                  Generate
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
