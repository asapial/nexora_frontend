"use client";

import { useState, useMemo } from "react";
import {
  RiSparklingFill,
  RiMailLine,
  RiShieldUserLine,
  RiUserStarLine,
  RiLoader4Line,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiCheckLine,
  RiCloseLine,
  RiAddLine,
  RiInformationLine,
  RiAlertLine,
  RiGroupLine,
  RiShieldCheckLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";

// ─── Ambient background ────────────────────────────────────
function AmbientBg() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(rgba(20,184,166,0.08) 1px,transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />
      <div className="absolute -top-60 -left-40 w-[600px] h-[600px] rounded-full bg-teal-500/[0.05] blur-[120px]" />
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-violet-500/[0.04] blur-[110px]" />
      <div className="absolute -bottom-60 left-1/3 w-[500px] h-[400px] rounded-full bg-teal-400/[0.04] blur-[120px]" />
    </div>
  );
}

// ─── Types ─────────────────────────────────────────────────
type CreateResult = {
  newAccountsCreated:        string[];
  existingUpgraded:          string[];
  alreadyRegisteredAsTeacher?: string[];
  alreadyRegisteredAsAdmin?:   string[];
};

// ─── Helpers ───────────────────────────────────────────────
function parseEmails(text: string): string[] {
  return text
    .split(/[\s,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
}

// ─── Live email chip preview ───────────────────────────────
function EmailPreview({ raw, accent }: { raw: string; accent: "teal" | "violet" }) {
  const emails = useMemo(() => parseEmails(raw), [raw]);
  if (!raw.trim()) return null;

  const chipCls =
    accent === "teal"
      ? "bg-teal-100/80 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200/70 dark:border-teal-800/60"
      : "bg-violet-100/80 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200/70 dark:border-violet-800/60";

  const invalid = raw
    .split(/[\s,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));

  return (
    <div className="flex flex-col gap-2 px-4 py-3 rounded-xl border border-border bg-muted/20">
      {/* Count row */}
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] font-bold text-muted-foreground uppercase tracking-[.08em]">
          Parsed
        </span>
        <div className="flex items-center gap-2">
          {emails.length > 0 && (
            <span className={cn(
              "text-[11px] font-bold px-2 py-0.5 rounded-full border",
              accent === "teal"
                ? "bg-teal-100/80 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 border-teal-200/70 dark:border-teal-800/60"
                : "bg-violet-100/80 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400 border-violet-200/70 dark:border-violet-800/60"
            )}>
              {emails.length} valid
            </span>
          )}
          {invalid.length > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-red-100/80 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200/70 dark:border-red-800/50">
              {invalid.length} invalid
            </span>
          )}
        </div>
      </div>

      {/* Valid chips */}
      {emails.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {emails.map((e) => (
            <span
              key={e}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11.5px] font-mono font-semibold border",
                chipCls
              )}
            >
              <RiCheckLine className="text-[10px] opacity-70" />
              {e}
            </span>
          ))}
        </div>
      )}

      {/* Invalid */}
      {invalid.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {invalid.map((e) => (
            <span
              key={e}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11.5px] font-mono font-semibold border bg-red-100/80 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200/70 dark:border-red-800/50"
            >
              <RiCloseLine className="text-[10px]" />
              {e}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Result block ──────────────────────────────────────────
function ResultBlock({
  title, emails, variant, icon,
}: {
  title:   string;
  emails:  string[];
  variant: "ok" | "neutral" | "warn";
  icon:    React.ReactNode;
}) {
  if (!emails.length) return null;

  const wrapCls =
    variant === "ok"
      ? "border-teal-200/60 dark:border-teal-800/50 bg-teal-50/40 dark:bg-teal-950/20"
      : variant === "warn"
      ? "border-amber-200/60 dark:border-amber-800/50 bg-amber-50/40 dark:bg-amber-950/20"
      : "border-border bg-muted/30";

  const dotCls =
    variant === "ok"
      ? "bg-teal-500"
      : variant === "warn"
      ? "bg-amber-400"
      : "bg-muted-foreground/40";

  return (
    <div className={cn("rounded-xl border px-4 py-3", wrapCls)}>
      <div className="flex items-center gap-2 mb-2">
        <span className={cn("w-2 h-2 rounded-full flex-shrink-0", dotCls)} />
        <p className="text-[11.5px] font-bold uppercase tracking-[.08em] text-muted-foreground">
          {title}
        </p>
        <span className="ml-auto text-[11.5px] font-bold text-foreground/60 tabular-nums">
          {emails.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {emails.map((e) => (
          <span
            key={e}
            className="text-[11.5px] font-mono px-2 py-0.5 rounded-md bg-background/80 border border-border text-foreground"
          >
            {e}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Section card ──────────────────────────────────────────
function SectionCard({
  icon, iconBg, title, subtitle, children,
}: {
  icon:    React.ReactNode;
  iconBg:  string;
  title:   string;
  subtitle:string;
  children:React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-lg border flex-shrink-0", iconBg)}>
          {icon}
        </div>
        <div>
          <h2 className="text-[14.5px] font-extrabold text-foreground leading-none mb-0.5">
            {title}
          </h2>
          <p className="text-[12px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5 flex flex-col gap-4">{children}</div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────
export default function AdminBulkCreatePage() {
  const [teacherEmails, setTeacherEmails] = useState("");
  const [adminEmails,   setAdminEmails]   = useState("");
  const [loadingT,      setLoadingT]      = useState(false);
  const [loadingA,      setLoadingA]      = useState(false);
  const [resultT,       setResultT]       = useState<CreateResult | null>(null);
  const [resultA,       setResultA]       = useState<CreateResult | null>(null);

  const tCount = useMemo(() => parseEmails(teacherEmails).length, [teacherEmails]);
  const aCount = useMemo(() => parseEmails(adminEmails).length,   [adminEmails]);

  const submitTeachers = async (e: React.FormEvent) => {
    e.preventDefault();
    const emails = parseEmails(teacherEmails);
    if (!emails.length) {
      toast.error("Enter at least one valid email", { position: "top-right" });
      return;
    }
    setLoadingT(true); setResultT(null);
    try {
      const r = await adminApi.createTeachersByEmails(emails);
      setResultT(r.data);
      toast.success("Teacher invitations processed", { position: "top-right" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Request failed", { position: "top-right" });
    } finally {
      setLoadingT(false);
    }
  };

  const submitAdmins = async (e: React.FormEvent) => {
    e.preventDefault();
    const emails = parseEmails(adminEmails);
    if (!emails.length) {
      toast.error("Enter at least one valid email", { position: "top-right" });
      return;
    }
    setLoadingA(true); setResultA(null);
    try {
      const r = await adminApi.createAdminsByEmails(emails);
      setResultA(r.data);
      toast.success("Admin accounts processed", { position: "top-right" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Request failed", { position: "top-right" });
    } finally {
      setLoadingA(false);
    }
  };

  return (
    <>
      <AmbientBg />

      <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-4xl mx-auto w-full">

        {/* ── Page heading ──────────────────────────────── */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
            <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">
              Administration
            </span>
          </div>
          <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">
            Bulk account creation
          </h1>
          <p className="text-[13.5px] text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
            Create teacher or admin accounts from one or more email addresses.
            New users receive a welcome email with a temporary password.
            Existing users are promoted to the selected role.
          </p>
        </div>

        {/* ── Stat pills ─────────────────────────────────── */}
        <div className="flex flex-wrap gap-3">
          {[
            {
              icon: <RiUserStarLine />,
              label: "Teachers to create",
              value: tCount,
              accent: "teal" as const,
            },
            {
              icon: <RiShieldUserLine />,
              label: "Admins to create",
              value: aCount,
              accent: "violet" as const,
            },
            {
              icon: <RiGroupLine />,
              label: "Total",
              value: tCount + aCount,
              accent: "sky" as const,
            },
          ].map((s) => {
            const a = {
              teal:   { icon: "text-teal-600 dark:text-teal-400",   bg: "bg-teal-100/70 dark:bg-teal-950/50",   border: "border-teal-200/70 dark:border-teal-800/50"    },
              violet: { icon: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100/70 dark:bg-violet-950/50", border: "border-violet-200/70 dark:border-violet-800/50" },
              sky:    { icon: "text-sky-600 dark:text-sky-400",       bg: "bg-sky-100/70 dark:bg-sky-950/50",       border: "border-sky-200/70 dark:border-sky-800/50"       },
            }[s.accent];
            return (
              <div
                key={s.label}
                className={cn(
                  "flex items-center gap-2.5 px-4 py-2.5 rounded-xl border",
                  a.bg, a.border
                )}
              >
                <span className={cn("text-base flex-shrink-0", a.icon)}>{s.icon}</span>
                <span className={cn("text-[1rem] font-extrabold tabular-nums leading-none", a.icon)}>
                  {s.value}
                </span>
                <span className="text-[12px] font-medium text-muted-foreground">{s.label}</span>
              </div>
            );
          })}
        </div>

        {/* ── Security warning banner ─────────────────────── */}
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl border border-amber-200/60 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20">
          <RiErrorWarningLine className="text-amber-500 dark:text-amber-400 text-base mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-amber-700 dark:text-amber-400 mb-0.5">
              Admin access is permanent until manually revoked
            </p>
            <p className="text-[12.5px] text-amber-600/80 dark:text-amber-500/70 leading-relaxed">
              Only trusted addresses should receive admin access. Every action here is
              logged in your server audit trail.
            </p>
          </div>
        </div>

        {/* ── Info: what happens ──────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: <RiAddLine />,           label: "New email",    desc: "Account created + welcome email with temp password" },
            { icon: <RiCheckboxCircleLine />, label: "Existing user",desc: "Role upgraded · existing password unchanged"         },
            { icon: <RiAlertLine />,          label: "Already role", desc: "Skipped — no changes made to that account"           },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-start gap-2.5 px-4 py-3.5 rounded-xl border border-border bg-card"
            >
              <span className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center bg-teal-100/60 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/40 text-teal-600 dark:text-teal-400 text-sm mt-0.5">
                {row.icon}
              </span>
              <div>
                <p className="text-[12.5px] font-bold text-foreground">{row.label}</p>
                <p className="text-[11.5px] text-muted-foreground leading-snug">{row.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Two form cards ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Teachers */}
          <form onSubmit={submitTeachers}>
            <SectionCard
              icon={<RiUserStarLine />}
              iconBg="bg-teal-100/70 dark:bg-teal-950/50 border-teal-200/60 dark:border-teal-800/50 text-teal-600 dark:text-teal-400"
              title="Teachers"
              subtitle="Cluster supervisors · can create sessions & manage members"
            >
              {/* Textarea */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-foreground/80 flex items-center gap-1.5">
                  <RiMailLine className="text-muted-foreground/60 text-base" />
                  Email list
                </label>
                <textarea
                  value={teacherEmails}
                  onChange={(e) => setTeacherEmails(e.target.value)}
                  rows={6}
                  placeholder={"teacher1@university.edu\nteacher2@university.edu"}
                  className="w-full rounded-xl border border-border bg-muted/40 px-4 py-3
                             text-[13px] font-mono text-foreground
                             placeholder:text-muted-foreground/35
                             focus:outline-none focus:ring-2 focus:ring-teal-400/25
                             focus:border-teal-400/70 dark:focus:border-teal-500/60
                             resize-none transition-all duration-150"
                />
                <p className="text-[11.5px] text-muted-foreground/60">
                  One per line, or comma / semicolon separated
                </p>
              </div>

              {/* Live preview */}
              <EmailPreview raw={teacherEmails} accent="teal" />

              {/* Submit */}
              <button
                type="submit"
                disabled={loadingT || tCount === 0}
                className={cn(
                  "w-full h-11 rounded-xl flex items-center justify-center gap-2",
                  "text-white text-[13.5px] font-bold",
                  "bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600",
                  "shadow-md shadow-teal-600/20",
                  "transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
                )}
              >
                {loadingT ? (
                  <RiLoader4Line className="animate-spin text-lg" />
                ) : (
                  <RiCheckboxCircleLine className="text-lg" />
                )}
                {loadingT
                  ? "Processing…"
                  : tCount > 0
                  ? `Create / upgrade ${tCount} teacher${tCount !== 1 ? "s" : ""}`
                  : "Create / upgrade teachers"}
              </button>

              {/* Result */}
              {resultT && (
                <div className="flex flex-col gap-2 pt-1 border-t border-border">
                  <p className="text-[11.5px] font-bold uppercase tracking-[.08em] text-muted-foreground flex items-center gap-1.5">
                    <RiShieldCheckLine className="text-teal-600 dark:text-teal-400" />
                    Results
                  </p>
                  <ResultBlock
                    title="New accounts created"
                    emails={resultT.newAccountsCreated}
                    variant="ok"
                    icon={<RiAddLine />}
                  />
                  <ResultBlock
                    title="Upgraded to teacher"
                    emails={resultT.existingUpgraded}
                    variant="neutral"
                    icon={<RiCheckLine />}
                  />
                  <ResultBlock
                    title="Already teachers — skipped"
                    emails={resultT.alreadyRegisteredAsTeacher ?? []}
                    variant="warn"
                    icon={<RiAlertLine />}
                  />
                </div>
              )}
            </SectionCard>
          </form>

          {/* Admins */}
          <form onSubmit={submitAdmins}>
            <SectionCard
              icon={<RiShieldUserLine />}
              iconBg="bg-violet-100/70 dark:bg-violet-950/50 border-violet-200/60 dark:border-violet-800/50 text-violet-600 dark:text-violet-400"
              title="Administrators"
              subtitle="Full admin dashboard access · audit-logged"
            >
              {/* Textarea */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-foreground/80 flex items-center gap-1.5">
                  <RiMailLine className="text-muted-foreground/60 text-base" />
                  Email list
                </label>
                <textarea
                  value={adminEmails}
                  onChange={(e) => setAdminEmails(e.target.value)}
                  rows={6}
                  placeholder={"ops@company.com\nsecurity@company.com"}
                  className="w-full rounded-xl border border-border bg-muted/40 px-4 py-3
                             text-[13px] font-mono text-foreground
                             placeholder:text-muted-foreground/35
                             focus:outline-none focus:ring-2 focus:ring-violet-400/25
                             focus:border-violet-400/70 dark:focus:border-violet-500/60
                             resize-none transition-all duration-150"
                />
                <p className="text-[11.5px] text-muted-foreground/60">
                  One per line, or comma / semicolon separated
                </p>
              </div>

              {/* Live preview */}
              <EmailPreview raw={adminEmails} accent="violet" />

              {/* Submit */}
              <button
                type="submit"
                disabled={loadingA || aCount === 0}
                className={cn(
                  "w-full h-11 rounded-xl flex items-center justify-center gap-2",
                  "text-white text-[13.5px] font-bold",
                  "bg-violet-600 dark:bg-violet-500 hover:bg-violet-700 dark:hover:bg-violet-600",
                  "shadow-md shadow-violet-600/20",
                  "transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
                )}
              >
                {loadingA ? (
                  <RiLoader4Line className="animate-spin text-lg" />
                ) : (
                  <RiCheckboxCircleLine className="text-lg" />
                )}
                {loadingA
                  ? "Processing…"
                  : aCount > 0
                  ? `Create / upgrade ${aCount} admin${aCount !== 1 ? "s" : ""}`
                  : "Create / upgrade admins"}
              </button>

              {/* Result */}
              {resultA && (
                <div className="flex flex-col gap-2 pt-1 border-t border-border">
                  <p className="text-[11.5px] font-bold uppercase tracking-[.08em] text-muted-foreground flex items-center gap-1.5">
                    <RiShieldCheckLine className="text-violet-600 dark:text-violet-400" />
                    Results
                  </p>
                  <ResultBlock
                    title="New accounts created"
                    emails={resultA.newAccountsCreated}
                    variant="ok"
                    icon={<RiAddLine />}
                  />
                  <ResultBlock
                    title="Upgraded to admin"
                    emails={resultA.existingUpgraded}
                    variant="neutral"
                    icon={<RiCheckLine />}
                  />
                  <ResultBlock
                    title="Already admins — skipped"
                    emails={resultA.alreadyRegisteredAsAdmin ?? []}
                    variant="warn"
                    icon={<RiAlertLine />}
                  />
                </div>
              )}
            </SectionCard>
          </form>
        </div>

        {/* ── Footer note ─────────────────────────────────── */}
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground/60 pb-4">
          <RiInformationLine className="flex-shrink-0" />
          All account creation actions are recorded in the server audit log. Temp passwords expire after first login.
        </div>

      </div>
    </>
  );
}