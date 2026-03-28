"use client";

import { useState } from "react";
import {
  RiSparklingFill,
  RiMailLine,
  RiShieldUserLine,
  RiUserStarLine,
  RiLoader4Line,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";

function parseEmails(text: string): string[] {
  return text
    .split(/[\s,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
}

type CreateResult = {
  newAccountsCreated: string[];
  existingUpgraded: string[];
  alreadyRegisteredAsTeacher?: string[];
  alreadyRegisteredAsAdmin?: string[];
};

function ResultBlock({ title, emails, variant }: { title: string; emails: string[]; variant: "ok" | "neutral" | "warn" }) {
  if (!emails.length) return null;
  const cls =
    variant === "ok"
      ? "border-teal-200/60 dark:border-teal-800/50 bg-teal-50/40 dark:bg-teal-950/20"
      : variant === "warn"
        ? "border-amber-200/60 dark:border-amber-800/50 bg-amber-50/40 dark:bg-amber-950/20"
        : "border-border bg-muted/30";
  return (
    <div className={cn("rounded-xl border px-4 py-3", cls)}>
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2">{title}</p>
      <ul className="flex flex-wrap gap-1.5">
        {emails.map((e) => (
          <li
            key={e}
            className="text-[12px] font-mono px-2 py-0.5 rounded-md bg-background/80 border border-border"
          >
            {e}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AdminBulkCreatePage() {
  const [teacherEmails, setTeacherEmails] = useState("");
  const [adminEmails, setAdminEmails] = useState("");
  const [loadingT, setLoadingT] = useState(false);
  const [loadingA, setLoadingA] = useState(false);
  const [resultT, setResultT] = useState<CreateResult | null>(null);
  const [resultA, setResultA] = useState<CreateResult | null>(null);

  const submitTeachers = async (e: React.FormEvent) => {
    e.preventDefault();
    const emails = parseEmails(teacherEmails);
    if (!emails.length) {
      toast.error("Enter at least one valid email", { position: "top-right" });
      return;
    }
    setLoadingT(true);
    setResultT(null);
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
    setLoadingA(true);
    setResultA(null);
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
    <div className="relative flex flex-col gap-8 p-5 lg:p-8 pt-6 max-w-4xl mx-auto w-full min-h-screen">
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <RiSparklingFill className="text-violet-500 dark:text-violet-400 text-sm" />
          <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Administration</span>
        </div>
        <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">Bulk account creation</h1>
        <p className="text-[13.5px] text-muted-foreground mt-1 max-w-2xl">
          Create teacher or admin accounts from one or more email addresses. New users receive a welcome email with a temporary
          password when applicable. Existing users may be promoted to the selected role.
        </p>
      </div>

      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-amber-200/60 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20 text-[12.5px] text-amber-900 dark:text-amber-200">
        <RiErrorWarningLine className="text-lg shrink-0 mt-0.5" />
        <p>
          Only trusted addresses should receive admin access. This action is audited by your mail provider and server logs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={submitTeachers} className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-teal-100/70 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/50 text-teal-600 dark:text-teal-400">
              <RiUserStarLine className="text-xl" />
            </span>
            <div>
              <h2 className="text-[15px] font-extrabold text-foreground">Teachers</h2>
              <p className="text-[12px] text-muted-foreground">One email per line, or comma / semicolon separated</p>
            </div>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-foreground flex items-center gap-1.5">
              <RiMailLine className="text-muted-foreground" /> Email list
            </span>
            <textarea
              value={teacherEmails}
              onChange={(e) => setTeacherEmails(e.target.value)}
              rows={6}
              placeholder={"teacher1@school.edu\nteacher2@school.edu"}
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-[13px] font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/25"
            />
          </label>
          <button
            type="submit"
            disabled={loadingT}
            className="h-11 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white text-[13px] font-bold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loadingT ? <RiLoader4Line className="animate-spin text-lg" /> : <RiCheckboxCircleLine />}
            Create / upgrade teachers
          </button>
          {resultT && (
            <div className="flex flex-col gap-2 mt-2">
              <ResultBlock title="New accounts" emails={resultT.newAccountsCreated} variant="ok" />
              <ResultBlock title="Upgraded to teacher" emails={resultT.existingUpgraded} variant="neutral" />
              <ResultBlock title="Already teachers" emails={resultT.alreadyRegisteredAsTeacher ?? []} variant="warn" />
            </div>
          )}
        </form>

        <form onSubmit={submitAdmins} className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-100/70 dark:bg-violet-950/50 border border-violet-200/60 dark:border-violet-800/50 text-violet-600 dark:text-violet-400">
              <RiShieldUserLine className="text-xl" />
            </span>
            <div>
              <h2 className="text-[15px] font-extrabold text-foreground">Administrators</h2>
              <p className="text-[12px] text-muted-foreground">Grant admin dashboard access</p>
            </div>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-foreground flex items-center gap-1.5">
              <RiMailLine className="text-muted-foreground" /> Email list
            </span>
            <textarea
              value={adminEmails}
              onChange={(e) => setAdminEmails(e.target.value)}
              rows={6}
              placeholder={"ops@company.com\nsecurity@company.com"}
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-[13px] font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-violet-400/25"
            />
          </label>
          <button
            type="submit"
            disabled={loadingA}
            className="h-11 rounded-xl bg-violet-600 dark:bg-violet-500 hover:bg-violet-700 text-white text-[13px] font-bold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loadingA ? <RiLoader4Line className="animate-spin text-lg" /> : <RiCheckboxCircleLine />}
            Create / upgrade admins
          </button>
          {resultA && (
            <div className="flex flex-col gap-2 mt-2">
              <ResultBlock title="New accounts" emails={resultA.newAccountsCreated} variant="ok" />
              <ResultBlock title="Upgraded to admin" emails={resultA.existingUpgraded} variant="neutral" />
              <ResultBlock title="Already admins" emails={resultA.alreadyRegisteredAsAdmin ?? []} variant="warn" />
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
