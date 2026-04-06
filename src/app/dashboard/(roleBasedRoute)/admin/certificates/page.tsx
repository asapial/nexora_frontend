"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RiSparklingFill, RiAwardLine, RiRefreshLine, RiLoader4Line,
  RiCheckLine, RiLinkM, RiDownloadLine, RiUserLine, RiBookOpenLine,
  RiCheckboxCircleLine, RiSearchLine, RiFilterLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { adminPlatformApi, adminApi } from "@/lib/api";
import { toast } from "sonner";

type Certificate = {
  id: string;
  title: string;
  issuedAt: string;
  pdfUrl?: string;
  verificationCode?: string;
  verifyCode?: string;
  user?: { name: string; email: string };
  course?: { id: string; title: string };
};

type Enrollment = {
  id: string;
  userId: string;
  courseId?: string;
  progress: number;
  completedAt?: string;
  paymentStatus: string;
  enrolledAt: string;
  user?: { name: string; email: string };
  course?: { title: string; status: string };
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
  const [certTotal, setCertTotal]       = useState(0);
  const [loading, setLoading]           = useState(true);
  const [generating, setGenerating]     = useState<string | null>(null);
  const [tab, setTab]                   = useState<"issued" | "generate">("issued");
  const [enrollments, setEnrollments]   = useState<Enrollment[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [enrollSearch, setEnrollSearch] = useState("");

  const loadCerts = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminPlatformApi.getCertificates();
      const raw = r.data;
      setCertificates(Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : []);
      setCertTotal(raw?.total ?? (Array.isArray(raw?.data) ? raw.data.length : (Array.isArray(raw) ? raw.length : 0)));
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }, []);

  const loadEnrollments = useCallback(async () => {
    setLoadingEnrollments(true);
    try {
      const r = await adminApi.getAllEnrollments({ limit: "100" });
      const raw = r.data;
      const allEnrollments = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
      setEnrollments(allEnrollments);
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
      toast.success("Certificate generated and saved to Cloudinary!");
      await loadCerts();
      // Refresh enrollments
      await loadEnrollments();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed to generate certificate"); }
    finally { setGenerating(null); }
  };

  const copyVerificationUrl = (code?: string) => {
    if (!code) return;
    const url = `${window.location.origin}/verify/${code}`;
    navigator.clipboard.writeText(url);
    toast.success("Verification URL copied");
  };

  // Check if an enrollment already has a certificate
  const hasCertificate = (enrollment: Enrollment) => {
    return certificates.some(c =>
      c.user?.email === enrollment.user?.email &&
      c.course?.title === enrollment.course?.title
    );
  };

  // Filter enrollments for the generate tab
  const filteredEnrollments = enrollments.filter(e => {
    if (enrollSearch) {
      const q = enrollSearch.toLowerCase();
      const nameMatch = e.user?.name?.toLowerCase().includes(q);
      const emailMatch = e.user?.email?.toLowerCase().includes(q);
      const courseMatch = e.course?.title?.toLowerCase().includes(q);
      if (!nameMatch && !emailMatch && !courseMatch) return false;
    }
    return true;
  });

  // Sort: eligible first, then by date
  const sortedEnrollments = [...filteredEnrollments].sort((a, b) => {
    const aEligible = a.completedAt || a.progress >= 100;
    const bEligible = b.completedAt || b.progress >= 100;
    if (aEligible && !bEligible) return -1;
    if (!aEligible && bEligible) return 1;
    return new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime();
  });

  return (
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
          <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Admin</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">Certificate Management</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Generate completion certificates with Cloudinary PDF storage and unique verification URLs</p>
          </div>
          <button onClick={loadCerts}
            className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
            <RiRefreshLine className={cn("text-sm", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm border mb-2.5 text-teal-600 dark:text-teal-400 bg-teal-100/60 dark:bg-teal-950/40 border-teal-200/60">
            <RiAwardLine />
          </div>
          <p className="text-[1.3rem] font-extrabold tabular-nums text-foreground leading-none mb-0.5">{loading ? "—" : certTotal}</p>
          <p className="text-[12px] font-medium text-muted-foreground">Certificates issued</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm border mb-2.5 text-violet-600 dark:text-violet-400 bg-violet-100/60 dark:bg-violet-950/40 border-violet-200/60">
            <RiCheckboxCircleLine />
          </div>
          <p className="text-[1.3rem] font-extrabold tabular-nums text-foreground leading-none mb-0.5">{loading ? "—" : certificates.filter(c => c.pdfUrl).length}</p>
          <p className="text-[12px] font-medium text-muted-foreground">With PDF on Cloudinary</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm border mb-2.5 text-sky-600 dark:text-sky-400 bg-sky-100/60 dark:bg-sky-950/40 border-sky-200/60">
            <RiUserLine />
          </div>
          <p className="text-[1.3rem] font-extrabold tabular-nums text-foreground leading-none mb-0.5">{loading ? "—" : new Set(certificates.map(c => c.user?.email)).size}</p>
          <p className="text-[12px] font-medium text-muted-foreground">Unique recipients</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted/40 border border-border w-fit">
        {[
          { key: "issued" as const, label: "Issued Certificates", count: certTotal },
          { key: "generate" as const, label: "Generate from Enrollments" },
        ].map(t => (
          <button key={t.key} onClick={() => switchTab(t.key)}
            className={cn("h-8 px-4 rounded-lg text-[12.5px] font-semibold transition-all flex items-center gap-1.5",
              tab === t.key ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {t.label}
            {"count" in t && t.count != null && t.count > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "issued" ? (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_120px_120px] gap-4 px-5 py-3 border-b border-border bg-muted/20">
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
                <p className="text-[12px] text-muted-foreground/60 mt-1">Switch to &quot;Generate&quot; tab to create certificates for eligible students</p>
              </div>
            )
            : certificates.map(cert => (
              <div key={cert.id} className="grid grid-cols-[1fr_1fr_120px_120px] gap-4 px-5 py-4 border-b border-border/60 last:border-0 hover:bg-muted/10 transition-colors items-center">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">{cert.user?.name ?? "—"}</p>
                  <p className="text-[11.5px] text-muted-foreground truncate">{cert.user?.email ?? ""}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[12.5px] text-muted-foreground truncate">{cert.course?.title ?? cert.title}</p>
                  {(cert.verifyCode || cert.verificationCode) && (
                    <p className="text-[10px] font-mono text-teal-600 dark:text-teal-400 truncate">{cert.verifyCode || cert.verificationCode}</p>
                  )}
                </div>
                <p className="text-[12.5px] text-muted-foreground">{fmtDate(cert.issuedAt)}</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => copyVerificationUrl(cert.verifyCode || cert.verificationCode)}
                    title="Copy verification URL"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sky-600 hover:bg-sky-50/60 dark:hover:bg-sky-950/30 transition-all">
                    <RiLinkM className="text-sm" />
                  </button>
                  {cert.pdfUrl ? (
                    <a href={cert.pdfUrl} target="_blank" rel="noopener noreferrer"
                      title="Download PDF from Cloudinary"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-teal-600 hover:bg-teal-50/60 dark:hover:bg-teal-950/30 transition-all">
                      <RiDownloadLine className="text-sm" />
                    </a>
                  ) : (
                    <span className="text-[10px] text-muted-foreground/50 italic">No PDF</span>
                  )}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Info banner */}
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/40 dark:border-amber-800/30">
            <RiFilterLine className="text-amber-500 text-base mt-0.5 shrink-0" />
            <p className="text-[12px] text-amber-700 dark:text-amber-300">
              Only students who have <strong>completed</strong> a <strong>FINISHED</strong> course are eligible for certificate generation. 
              The PDF will be generated, uploaded to Cloudinary, and a notification sent to the student.
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-sm pointer-events-none" />
            <input type="text" placeholder="Search by student name, email, or course…" value={enrollSearch} onChange={e => setEnrollSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl text-[13px] font-medium bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all" />
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/10">
              <p className="text-[11.5px] font-bold text-muted-foreground uppercase tracking-wider">
                Select an enrollment to generate a certificate
                {!loadingEnrollments && <span className="ml-2 text-[10px] font-normal normal-case">({sortedEnrollments.length} shown)</span>}
              </p>
            </div>
            {loadingEnrollments
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              : sortedEnrollments.length === 0
              ? (
                <div className="py-16 text-center">
                  <RiBookOpenLine className="text-4xl text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-[13.5px] font-medium text-muted-foreground">No enrollments found</p>
                </div>
              )
              : sortedEnrollments.map(e => {
                  const isCompleted = e.completedAt || e.progress >= 100;
                  const alreadyIssued = hasCertificate(e);
                  const isFinished = e.course?.status === "FINISHED";
                  const canGenerate = isCompleted && !alreadyIssued;
                  
                  return (
                    <div key={e.id} className={cn(
                      "flex items-center gap-4 px-5 py-4 border-b border-border/60 last:border-0 transition-colors",
                      canGenerate ? "hover:bg-muted/10" : "opacity-60"
                    )}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" 
                        style={{ background: isCompleted ? "linear-gradient(135deg, rgba(20,184,166,0.3), rgba(59,130,246,0.3))" : "var(--muted)" }}>
                        {isCompleted 
                          ? <RiCheckboxCircleLine className="text-teal-600 dark:text-teal-400 text-xs" />
                          : <RiUserLine className="text-muted-foreground text-xs" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-foreground truncate">{e.user?.name ?? "—"}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[11.5px] text-muted-foreground truncate">{e.course?.title ?? "—"}</span>
                          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full border",
                            isFinished
                              ? "text-violet-600 dark:text-violet-400 bg-violet-50/60 dark:bg-violet-950/30 border-violet-200/60"
                              : "text-muted-foreground bg-muted/30 border-border"
                          )}>{e.course?.status ?? "—"}</span>
                          <span className="text-[10px] text-muted-foreground">{Math.round(e.progress)}% complete</span>
                        </div>
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0">{fmtDate(e.enrolledAt)}</span>
                      {alreadyIssued ? (
                        <span className="h-8 px-3 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200/50 dark:border-teal-800/50 text-teal-600 dark:text-teal-400 text-[11px] font-bold flex items-center gap-1 shrink-0">
                          <RiCheckLine /> Issued
                        </span>
                      ) : (
                        <button onClick={() => generate(e.id)} disabled={generating === e.id || !canGenerate}
                          title={!isCompleted ? "Student has not completed the course yet" : !isFinished ? "Course must be FINISHED first" : "Generate certificate"}
                          className="h-8 px-3 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[12px] font-bold flex items-center gap-1.5 transition-all shrink-0">
                          {generating === e.id ? <RiLoader4Line className="animate-spin" /> : <RiAwardLine />}
                          Generate
                        </button>
                      )}
                    </div>
                  );
                })
            }
          </div>
        </div>
      )}
    </div>
  );
}
