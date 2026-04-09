"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RiSparklingFill, RiAwardLine,
  RiLinkM, RiDownloadLine, RiBookOpenLine, RiCheckboxCircleLine,
  RiShieldCheckLine, RiTimeLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import RefreshIcon from "@/components/shared/RefreshIcon";

type Certificate = {
  id: string;
  title: string;
  issuedAt: string;
  pdfUrl?: string;
  verifyCode?: string;
  verificationCode?: string;
  course?: { id: string; title: string } | null;
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const fmtRelative = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
};

export default function StudentCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/student/certificates", { credentials: "include" });
      const json = await res.json();
      if (json.success) {
        setCertificates(Array.isArray(json.data) ? json.data : []);
      } else {
        toast.error(json.message ?? "Failed to load certificates");
      }
    } catch {
      toast.error("Failed to load certificates");
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const copyVerificationUrl = (code?: string) => {
    if (!code) return;
    const url = `${window.location.origin}/verify/${code}`;
    navigator.clipboard.writeText(url);
    toast.success("Verification URL copied to clipboard!");
  };

  const downloadCertificate = async (pdfUrl: string, title: string) => {
    try {
      const res = await fetch(pdfUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Certificate downloaded!");
    } catch {
      // Fallback: open in new tab
      window.open(pdfUrl, "_blank");
    }
  };

  const verifiedCount = certificates.filter(c => c.verifyCode || c.verificationCode).length;
  const withPdfCount = certificates.filter(c => c.pdfUrl).length;

  return (
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
            <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Student</span>
          </div>
          <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">My Certificates</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Certificates earned upon completing courses — download anytime</p>
        </div>
        <RefreshIcon onClick={load} loading={loading} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm border mb-2.5 text-teal-600 dark:text-teal-400 bg-teal-100/60 dark:bg-teal-950/40 border-teal-200/60">
            <RiAwardLine />
          </div>
          <p className="text-[1.3rem] font-extrabold tabular-nums text-foreground leading-none mb-0.5">{loading ? "—" : certificates.length}</p>
          <p className="text-[12px] font-medium text-muted-foreground">Certificates earned</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm border mb-2.5 text-violet-600 dark:text-violet-400 bg-violet-100/60 dark:bg-violet-950/40 border-violet-200/60">
            <RiCheckboxCircleLine />
          </div>
          <p className="text-[1.3rem] font-extrabold tabular-nums text-foreground leading-none mb-0.5">{loading ? "—" : verifiedCount}</p>
          <p className="text-[12px] font-medium text-muted-foreground">Verified certificates</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm border mb-2.5 text-sky-600 dark:text-sky-400 bg-sky-100/60 dark:bg-sky-950/40 border-sky-200/60">
            <RiDownloadLine />
          </div>
          <p className="text-[1.3rem] font-extrabold tabular-nums text-foreground leading-none mb-0.5">{loading ? "—" : withPdfCount}</p>
          <p className="text-[12px] font-medium text-muted-foreground">Downloadable PDFs</p>
        </div>
      </div>

      {/* Certificates list */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/10">
          <p className="text-[11.5px] font-bold text-muted-foreground uppercase tracking-wider">Your Certificates</p>
        </div>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-5 py-5 border-b border-border/60 animate-pulse flex items-center gap-4">
              <div className="w-12 h-12 bg-muted rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))
        ) : certificates.length === 0 ? (
          <div className="py-20 text-center">
            <RiAwardLine className="text-5xl text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-[14px] font-semibold text-foreground mb-1">No certificates yet</p>
            <p className="text-[13px] text-muted-foreground max-w-md mx-auto">
              Complete a course to earn your first certificate! Once the course is marked as &quot;Finished&quot; and an admin issues the certificate, it will appear here.
            </p>
          </div>
        ) : certificates.map(cert => {
          const code = cert.verifyCode || cert.verificationCode;
          return (
            <div key={cert.id} className="px-5 py-5 border-b border-border/60 last:border-0 hover:bg-muted/10 transition-colors">
              <div className="flex items-start gap-4">
                {/* Award icon */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-200/50 dark:border-teal-800/50 flex items-center justify-center shrink-0">
                  <RiAwardLine className="text-teal-600 dark:text-teal-400 text-xl" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-foreground leading-snug">{cert.title}</p>
                  {cert.course && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <RiBookOpenLine className="text-xs text-muted-foreground/60" />
                      <span className="text-[12px] text-muted-foreground">{cert.course.title}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <div className="flex items-center gap-1">
                      <RiTimeLine className="text-xs text-muted-foreground/50" />
                      <span className="text-[11.5px] text-muted-foreground/60">{fmtDate(cert.issuedAt)} · {fmtRelative(cert.issuedAt)}</span>
                    </div>
                    {code && (
                      <div className="flex items-center gap-1">
                        <RiShieldCheckLine className="text-xs text-teal-500" />
                        <span className="text-[10.5px] font-mono text-teal-600 dark:text-teal-400">{code}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {code && (
                    <button onClick={() => copyVerificationUrl(code)}
                      title="Copy verification URL"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sky-600 hover:bg-sky-50/60 dark:hover:bg-sky-950/30 transition-all">
                      <RiLinkM className="text-base" />
                    </button>
                  )}
                  {cert.pdfUrl ? (
                    <button onClick={() => downloadCertificate(cert.pdfUrl!, cert.title)}
                      title="Download certificate PDF"
                      className="h-8 px-3 rounded-lg flex items-center gap-1.5 text-[12px] font-bold text-teal-600 dark:text-teal-400 hover:bg-teal-50/60 dark:hover:bg-teal-950/30 border border-teal-200/50 dark:border-teal-800/50 transition-all">
                      <RiDownloadLine className="text-sm" />
                      Download
                    </button>
                  ) : (
                    <span className="text-[11px] text-muted-foreground/50 italic">PDF pending</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info note */}
      {!loading && certificates.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-teal-50/40 dark:bg-teal-950/20 border border-teal-200/40 dark:border-teal-800/30">
          <RiShieldCheckLine className="text-teal-500 text-base mt-0.5 shrink-0" />
          <p className="text-[12px] text-teal-700 dark:text-teal-300">
            Each certificate comes with a unique verification code. Share the verification URL with employers or institutions to prove your qualification.
          </p>
        </div>
      )}
    </div>
  );
}
