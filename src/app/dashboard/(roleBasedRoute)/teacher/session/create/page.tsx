"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RiCalendarCheckLine, RiTimeLine, RiMapPinLine, RiFileTextLine,
  RiGroupLine, RiFlaskLine, RiCheckLine, RiSparklingFill,
  RiAddLine, RiNotificationLine, RiMailLine,
  RiAlertLine, RiBookOpenLine, RiArrowRightLine, RiDraftLine,
  RiUserLine, RiCloseLine, RiLoader4Line, RiErrorWarningLine,
  RiCheckboxLine, RiCheckboxBlankLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { combineDateTime } from "@/utils/combineDateTime";
import { teacherDashApi } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────
interface SessionForm {
  clusterId: string;
  title: string;
  description: string;
  date: string;
  time: string;
  durationMins: string;
  location: string;
  taskDeadlineDate: string;
  taskDeadlineTime: string;
  templateId: string;
  sendEmail: boolean;
  sendInApp: boolean;
}

interface Cluster {
  id: string;
  name: string;
  _count: { members: number };
  batchTag: string;
}

interface ClusterMember {
  studentProfileId: string;
  userId: string | null;
  name: string;
  email: string;
  image: string | null;
}

interface IndividualTaskEntry {
  studentProfileId: string;
  title: string;
  description: string;
}

type TaskMode = "template" | "individual" | "none";
type SessionErrors = Partial<Record<keyof SessionForm, string>> & { general?: string };

// ─── Field components ─────────────────────────────────────────────────────────
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-[13px] font-semibold text-foreground/80">
      {children}
      {required && <span className="text-red-500 dark:text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function InputField({
  id, type = "text", value, onChange, placeholder, error, icon, min, step, disabled,
}: {
  id: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; error?: string; icon?: React.ReactNode;
  min?: string; step?: string; disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2
                           text-muted-foreground/50 text-base pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={id} type={type} value={value} min={min} step={step} disabled={disabled}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full h-11 rounded-xl text-[13.5px] font-medium",
            icon ? "pl-10 pr-4" : "px-4",
            "bg-muted/40 border",
            error
              ? "border-red-400/60 dark:border-red-500/50"
              : "border-border focus:border-teal-400/70 dark:focus:border-teal-500/60",
            "text-foreground placeholder:text-muted-foreground/40",
            "focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all duration-150",
            disabled && "opacity-60 cursor-not-allowed bg-muted/20"
          )}
        />
      </div>
      {error && <p className="text-[12px] text-red-500 dark:text-red-400 font-medium">{error}</p>}
    </div>
  );
}

function SelectField({
  id, value, onChange, children, error, icon,
}: {
  id: string; value: string; onChange: (v: string) => void;
  children: React.ReactNode; error?: string; icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2
                           text-muted-foreground/50 text-base pointer-events-none z-10">
            {icon}
          </span>
        )}
        <select
          id={id} value={value} onChange={e => onChange(e.target.value)}
          className={cn(
            "w-full h-11 rounded-xl text-[13.5px] font-medium",
            icon ? "pl-10 pr-4" : "px-4",
            "bg-muted/40 border appearance-none cursor-pointer",
            error
              ? "border-red-400/60 dark:border-red-500/50"
              : "border-border focus:border-teal-400/70 dark:focus:border-teal-500/60",
            "text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all duration-150"
          )}
        >
          {children}
        </select>
      </div>
      {error && <p className="text-[12px] text-red-500 dark:text-red-400 font-medium">{error}</p>}
    </div>
  );
}

function TextAreaField({
  id, value, onChange, placeholder, rows = 3,
}: {
  id: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      id={id} rows={rows} value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl px-4 py-3 text-[13.5px] font-medium leading-relaxed resize-none
                 bg-muted/40 border border-border
                 text-foreground placeholder:text-muted-foreground/40
                 focus:outline-none focus:ring-2 focus:ring-teal-400/20
                 focus:border-teal-400/70 dark:focus:border-teal-500/60
                 transition-all duration-150"
    />
  );
}

function ToggleRow({
  label, description, checked, onChange, icon,
}: {
  label: string; description?: string; checked: boolean; onChange: (v: boolean) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl cursor-pointer",
        "border transition-all duration-150",
        checked
          ? "border-teal-300/60 dark:border-teal-700/50 bg-teal-50/40 dark:bg-teal-950/20"
          : "border-border bg-muted/30 hover:bg-muted/50",
      )}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <span className={cn("text-base mt-0.5 flex-shrink-0",
            checked ? "text-teal-600 dark:text-teal-400" : "text-muted-foreground/50")}>
            {icon}
          </span>
        )}
        <div>
          <p className={cn("text-[13.5px] font-semibold",
            checked ? "text-teal-700 dark:text-teal-300" : "text-foreground")}>
            {label}
          </p>
          {description && (
            <p className="text-[12px] text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className={cn(
        "rounded-full flex-shrink-0 transition-all duration-200 relative border",
        checked
          ? "bg-teal-600 dark:bg-teal-500 border-teal-600 dark:border-teal-500"
          : "bg-muted border-border"
      )} style={{ height: "22px", width: "40px" }}>
        <div className={cn(
          "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200",
          checked ? "left-[22px]" : "left-0.5"
        )} />
      </div>
    </div>
  );
}

function Section({
  icon, title, description, children,
}: {
  icon: React.ReactNode; title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center
                        bg-teal-100/70 dark:bg-teal-950/50
                        border border-teal-200/60 dark:border-teal-800/50
                        text-teal-600 dark:text-teal-400 text-base">
          {icon}
        </div>
        <div>
          <h2 className="text-[14px] font-bold text-foreground leading-none mb-0.5">{title}</h2>
          {description && <p className="text-[12px] text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="px-6 py-5 flex flex-col gap-4">{children}</div>
    </div>
  );
}

// ─── Task mode card ───────────────────────────────────────────────────────────
function TaskModeCard({
  mode, selected, onSelect, icon, label, description,
}: {
  mode: TaskMode; selected: TaskMode; onSelect: (m: TaskMode) => void;
  icon: React.ReactNode; label: string; description: string;
}) {
  const active = selected === mode;
  return (
    <button
      type="button"
      onClick={() => onSelect(mode)}
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-150",
        active
          ? "border-teal-400/70 dark:border-teal-600/60 bg-teal-50/50 dark:bg-teal-950/30"
          : "border-border bg-muted/20 hover:bg-muted/40 hover:border-border/80"
      )}
    >
      <span className={cn(
        "w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-sm mt-0.5",
        active
          ? "bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 border border-teal-200/60 dark:border-teal-700/50"
          : "bg-muted/60 text-muted-foreground/60 border border-border"
      )}>
        {icon}
      </span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className={cn("text-[13px] font-bold", active ? "text-teal-700 dark:text-teal-300" : "text-foreground")}>
            {label}
          </p>
          {active && (
            <span className="w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
              <RiCheckLine className="text-white text-[10px]" />
            </span>
          )}
        </div>
        <p className="text-[11.5px] text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
      </div>
    </button>
  );
}

// ─── Individual task card per student ────────────────────────────────────────
function IndividualTaskCard({
  member, entry, onChange,
}: {
  member: ClusterMember;
  entry: IndividualTaskEntry;
  onChange: (studentProfileId: string, field: "title" | "description", val: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0">
          <RiUserLine className="text-muted-foreground/60 text-xs" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-foreground leading-none">{member.name}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{member.email}</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <input
          type="text"
          value={entry.title}
          onChange={e => onChange(member.studentProfileId, "title", e.target.value)}
          placeholder="Task title for this student…"
          className="w-full h-9 px-3 rounded-lg text-[12.5px] font-medium
                     bg-background border border-border
                     text-foreground placeholder:text-muted-foreground/40
                     focus:outline-none focus:ring-2 focus:ring-teal-400/20
                     focus:border-teal-400/70 transition-all"
        />
        <textarea
          rows={2}
          value={entry.description}
          onChange={e => onChange(member.studentProfileId, "description", e.target.value)}
          placeholder="Optional description / instructions…"
          className="w-full px-3 py-2 rounded-lg text-[12px] leading-relaxed resize-none
                     bg-background border border-border
                     text-foreground placeholder:text-muted-foreground/40
                     focus:outline-none focus:ring-2 focus:ring-teal-400/20
                     focus:border-teal-400/70 transition-all"
        />
      </div>
    </div>
  );
}

// ─── Session preview ──────────────────────────────────────────────────────────
function SessionPreview({
  form, clusters, taskMode, templates, membersCount, individualTasks,
}: {
  form: SessionForm; clusters: Cluster[]; taskMode: TaskMode;
  templates: { id: string; title: string }[];
  membersCount: number;
  individualTasks: IndividualTaskEntry[];
}) {
  const cluster = clusters.find(c => c.id === form.clusterId);
  const template = templates.find(t => t.id === form.templateId);
  const formatDate = (d: string) => {
    if (!d) return null;
    try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return d; }
  };
  const assignedCount = taskMode === "individual"
    ? individualTasks.filter(t => t.title.trim()).length
    : taskMode === "template" ? membersCount : 0;

  return (
    <div className="rounded-2xl border border-border bg-muted/20 overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
        <span className="text-[11px] font-bold tracking-[.1em] uppercase text-muted-foreground">Preview</span>
      </div>
      <div className="px-5 py-4 flex flex-col gap-3">
        <div>
          <p className="text-[15px] font-bold text-foreground">
            {form.title || <span className="text-muted-foreground/40 font-normal italic">Session title</span>}
          </p>
          {cluster && (
            <p className="text-[12px] text-muted-foreground flex items-center gap-1.5 mt-1">
              <RiFlaskLine className="text-xs text-teal-600 dark:text-teal-400" />
              {cluster.name}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {form.date && (
            <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
              <RiCalendarCheckLine className="text-sm text-teal-600 dark:text-teal-400 flex-shrink-0" />
              {formatDate(form.date)}{form.time && ` at ${form.time}`}
              {form.durationMins && ` · ${form.durationMins} min`}
            </div>
          )}
          {form.location && (
            <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
              <RiMapPinLine className="text-sm text-teal-600 dark:text-teal-400 flex-shrink-0" />
              {form.location}
            </div>
          )}
          {form.taskDeadlineDate && (
            <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
              <RiTimeLine className="text-sm text-amber-600 dark:text-amber-400 flex-shrink-0" />
              Deadline: {formatDate(form.taskDeadlineDate)}{form.taskDeadlineTime && ` at ${form.taskDeadlineTime}`}
            </div>
          )}
        </div>
        {cluster && (
          <div className="pt-2 border-t border-border/50 flex flex-col gap-1.5">
            {taskMode === "none" ? (
              <p className="text-[12px] text-muted-foreground flex items-center gap-1.5">
                <RiFileTextLine className="text-xs text-muted-foreground/60" />
                Session created — <span className="italic">no tasks assigned</span>
              </p>
            ) : taskMode === "individual" ? (
              <p className="text-[12px] text-muted-foreground flex items-center gap-1.5">
                <RiUserLine className="text-xs text-teal-600 dark:text-teal-400" />
                Individual tasks for <strong className="text-foreground">{assignedCount} student{assignedCount !== 1 ? "s" : ""}</strong>
              </p>
            ) : (
              <>
                <p className="text-[12px] text-muted-foreground flex items-center gap-1.5">
                  <RiGroupLine className="text-xs text-teal-600 dark:text-teal-400" />
                  Tasks for <strong className="text-foreground">{membersCount} members</strong>
                </p>
                {template && (
                  <p className="text-[12px] text-muted-foreground flex items-center gap-1.5">
                    <RiDraftLine className="text-xs text-teal-600 dark:text-teal-400" />
                    Template: <strong className="text-foreground">{template.title}</strong>
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CreateSessionPage() {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState<SessionForm>({
    clusterId: "",
    title: "",
    description: "",
    date: "",
    time: "",
    durationMins: "90",
    location: "",
    taskDeadlineDate: "",
    taskDeadlineTime: "23:59",
    templateId: "",
    sendEmail: true,
    sendInApp: true,
  });

  const [errors, setErrors] = useState<SessionErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [templates, setTemplates] = useState<{ id: string; title: string }[]>([]);
  const [clusterMembers, setClusterMembers] = useState<ClusterMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Task mode state
  const [taskMode, setTaskMode] = useState<TaskMode>("template");

  // "Before the session" deadline checkbox
  const [deadlineBeforeSession, setDeadlineBeforeSession] = useState(false);

  // Individual task entries: studentProfileId -> { title, description }
  const [individualTasks, setIndividualTasks] = useState<IndividualTaskEntry[]>([]);

  const set = <K extends keyof SessionForm>(k: K) => (v: SessionForm[K]) => {
    setForm(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: undefined }));
  };

  // ─── Load clusters + templates on mount ──────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, tRes] = await Promise.all([
          fetch("/api/cluster", { credentials: "include" }),
          fetch("/api/teacher/task-templates", { credentials: "include" }),
        ]);
        const cData = await cRes.json();
        if (cData.success) setClusters(cData.data);

        const tData = await tRes.json();
        if (tData.success) setTemplates(Array.isArray(tData.data) ? tData.data : []);
      } catch (err) {
        console.error("Failed to load clusters/templates:", err);
      }
    };
    load();
  }, []);

  // ─── Load cluster members when cluster changes (for individual mode) ──────
  useEffect(() => {
    if (!form.clusterId) {
      setClusterMembers([]);
      setIndividualTasks([]);
      return;
    }
    const fetch = async () => {
      setMembersLoading(true);
      try {
        const res = await teacherDashApi.getClusterMembers(form.clusterId);
        const members: ClusterMember[] = Array.isArray(res.data) ? res.data : [];
        setClusterMembers(members);
        setIndividualTasks(
          members.map(m => ({
            studentProfileId: m.studentProfileId,
            title: "",
            description: "",
          }))
        );
      } catch {
        setClusterMembers([]);
        setIndividualTasks([]);
      } finally {
        setMembersLoading(false);
      }
    };
    fetch();
  }, [form.clusterId]);

  // ─── "Before the session" deadline auto-set ───────────────────────────────
  // When checked, pin deadline to session date+time
  useEffect(() => {
    if (!deadlineBeforeSession) return;
    if (form.date && form.time) {
      setForm(p => ({
        ...p,
        taskDeadlineDate: form.date,
        taskDeadlineTime: form.time,
      }));
    }
  }, [deadlineBeforeSession, form.date, form.time]);

  // ─── Auto-adjust deadline when session date/time changes ─────────────────
  const prevDate = useRef(form.date);
  const prevTime = useRef(form.time);
  useEffect(() => {
    const dateChanged = form.date !== prevDate.current;
    const timeChanged = form.time !== prevTime.current;
    prevDate.current = form.date;
    prevTime.current = form.time;

    if ((dateChanged || timeChanged) && deadlineBeforeSession && form.date && form.time) {
      setForm(p => ({
        ...p,
        taskDeadlineDate: form.date,
        taskDeadlineTime: form.time,
      }));
    }
  }, [form.date, form.time, deadlineBeforeSession]);

  const handleIndividualTaskChange = (
    studentProfileId: string,
    field: "title" | "description",
    val: string
  ) => {
    setIndividualTasks(prev =>
      prev.map(t => t.studentProfileId === studentProfileId ? { ...t, [field]: val } : t)
    );
  };

  // ─── Validation ───────────────────────────────────────────────────────────
  const validate = (): SessionErrors => {
    const e: SessionErrors = {};
    if (!form.clusterId) e.clusterId = "Please select a cluster";
    if (!form.title.trim()) e.title = "Session title is required";
    if (!form.date) e.date = "Session date is required";
    if (!form.time) e.time = "Session time is required";
    return e;
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);

    let scheduledAt: string;
    let taskDeadline: string | undefined;

    try {
      scheduledAt = combineDateTime(form.date, form.time);
      taskDeadline =
        form.taskDeadlineDate && form.taskDeadlineTime
          ? combineDateTime(form.taskDeadlineDate, form.taskDeadlineTime)
          : undefined;
    } catch {
      setErrors({ general: "Invalid date/time format" });
      setLoading(false);
      return;
    }

    // Build body based on task mode
    const body: Record<string, unknown> = {
      clusterId: form.clusterId,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      scheduledAt,
      taskDeadline,
      location: form.location.trim() || undefined,
      taskMode,
    };

    if (taskMode === "template" && form.templateId) {
      body.templateId = form.templateId;
    }
    if (taskMode === "individual") {
      body.individualTasks = individualTasks
        .filter(t => t.title.trim())
        .map(t => ({
          studentProfileId: t.studentProfileId,
          title: t.title.trim(),
          description: t.description.trim() || undefined,
        }));
    }

    try {
      const res = await fetch("/api/sessions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrors({ general: data.message ?? "Something went wrong" });
        setLoading(false);
        return;
      }

      toast.success("Session created successfully", { position: "top-right" });
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/teacher/session/manageSession"), 1500);
    } catch {
      setErrors({ general: "Network error — please try again" });
    } finally {
      setLoading(false);
    }
  };

  const selectedCluster = clusters.find(c => c.id === form.clusterId);

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-2xl mx-auto w-full">
        <div className="rounded-2xl border border-border bg-card p-10
                        flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl
                          bg-teal-100/70 dark:bg-teal-950/50
                          border border-teal-200/60 dark:border-teal-800/50
                          flex items-center justify-center
                          text-teal-600 dark:text-teal-400 text-2xl">
            <RiCheckLine />
          </div>
          <div>
            <h2 className="text-[18px] font-extrabold text-foreground mb-1">Session created!</h2>
            <p className="text-[13.5px] text-muted-foreground leading-relaxed max-w-xs mx-auto">
              {taskMode === "individual"
                ? "Individual tasks have been assigned to selected students."
                : taskMode === "template"
                ? "Tasks have been auto-created for every active member."
                : "Session created. Members have been notified."}
              {form.sendEmail && " Email notifications are on their way."}
            </p>
          </div>
          <div className="w-6 h-6 border-2 border-teal-200 dark:border-teal-800
                          border-t-teal-500 rounded-full animate-spin mt-2" />
          <p className="text-[12px] text-muted-foreground/60">Redirecting to sessions…</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-5xl mx-auto w-full">

        {/* ── Page heading ── */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
            <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">
              Sessions
            </span>
          </div>
          <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">
            Create a new session
          </h1>
          <p className="text-[13.5px] text-muted-foreground mt-1">
            Schedule a session, set tasks, and notify your cluster members.
          </p>
        </div>

        {/* ── General error ── */}
        {errors.general && (
          <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl
                          bg-red-50 dark:bg-red-950/30
                          border border-red-200 dark:border-red-800/50">
            <RiAlertLine className="text-red-500 dark:text-red-400 text-base mt-0.5 flex-shrink-0" />
            <p className="text-[13px] font-medium text-red-600 dark:text-red-400">{errors.general}</p>
          </div>
        )}

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">

          {/* Left ─ form */}
          <div className="flex flex-col gap-5">

            {/* Cluster */}
            <Section icon={<RiFlaskLine />} title="Cluster" description="Which cluster is this session for?">
              <div className="flex flex-col gap-1.5">
                <Label required>Select cluster</Label>
                <SelectField
                  id="cluster"
                  value={form.clusterId}
                  onChange={set("clusterId")}
                  error={errors.clusterId}
                  icon={<RiFlaskLine />}
                >
                  <option value="" disabled>Choose a cluster…</option>
                  {clusters.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c._count.members} members)
                    </option>
                  ))}
                </SelectField>
              </div>

              {selectedCluster && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl
                                bg-teal-50/50 dark:bg-teal-950/20
                                border border-teal-200/60 dark:border-teal-800/50">
                  <RiGroupLine className="text-teal-600 dark:text-teal-400 text-base flex-shrink-0" />
                  <p className="text-[13px] text-teal-700 dark:text-teal-300">
                    <strong>{selectedCluster._count.members} active members</strong> in this cluster.
                  </p>
                </div>
              )}
            </Section>

            {/* Session details */}
            <Section icon={<RiCalendarCheckLine />} title="Session Details" description="Title, description, and scheduling.">
              <div className="flex flex-col gap-1.5">
                <Label required>Title</Label>
                <InputField
                  id="title" value={form.title} onChange={set("title")}
                  placeholder="e.g. Session 12 — Attention Mechanisms"
                  error={errors.title} icon={<RiCalendarCheckLine />}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Description</Label>
                <TextAreaField
                  id="description" value={form.description} onChange={set("description")}
                  placeholder="What will be covered? Any preparation required?"
                />
              </div>

              {/* Date + Time + Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label required>Date</Label>
                  <InputField id="date" type="date" value={form.date} onChange={set("date")} error={errors.date} min={today} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label required>Time</Label>
                  <InputField id="time" type="time" value={form.time} onChange={set("time")} error={errors.time} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Duration (min)</Label>
                  <InputField id="duration" type="number" value={form.durationMins} onChange={set("durationMins")} placeholder="90" min="15" step="15" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Location</Label>
                <InputField
                  id="location" value={form.location} onChange={set("location")}
                  placeholder="e.g. Room 204, Lab Building · or Zoom link"
                  icon={<RiMapPinLine />}
                />
              </div>
            </Section>

            {/* ── Task Settings ── */}
            <Section
              icon={<RiFileTextLine />}
              title="Task Settings"
              description="Choose how tasks are assigned to students for this session."
            >
              {/* Task mode picker */}
              <div className="flex flex-col gap-2">
                <Label>Task assignment mode</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <TaskModeCard
                    mode="template" selected={taskMode} onSelect={setTaskMode}
                    icon={<RiDraftLine />}
                    label="Template / Same task"
                    description="Assign one task (from a template or session title) to all active members."
                  />
                  <TaskModeCard
                    mode="individual" selected={taskMode} onSelect={setTaskMode}
                    icon={<RiUserLine />}
                    label="Individual tasks"
                    description="Craft a unique task title & description for each student separately."
                  />
                  <TaskModeCard
                    mode="none" selected={taskMode} onSelect={setTaskMode}
                    icon={<RiCalendarCheckLine />}
                    label="Session only"
                    description="Create the session record without attaching any tasks."
                  />
                </div>
              </div>

              {/* Template picker — only shown in template mode */}
              {taskMode === "template" && (
                <div className="flex flex-col gap-1.5">
                  <Label>Task template</Label>
                  <SelectField
                    id="template" value={form.templateId} onChange={set("templateId")}
                    icon={<RiBookOpenLine />}
                  >
                    <option value="">No template — use session title</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </SelectField>
                  <p className="text-[11.5px] text-muted-foreground/60">
                    Template pre-fills task titles &amp; descriptions for every member.{" "}
                    <a
                      href="/dashboard/teacher/task-templates"
                      target="_blank"
                      className="text-teal-500 hover:underline"
                    >
                      Manage templates
                    </a>
                  </p>
                </div>
              )}

              {/* Individual task forms — only shown in individual mode */}
              {taskMode === "individual" && (
                <div className="flex flex-col gap-3">
                  {!form.clusterId ? (
                    <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl
                                    bg-amber-50/50 dark:bg-amber-950/20
                                    border border-amber-200/50 dark:border-amber-800/40">
                      <RiErrorWarningLine className="text-amber-500 text-base flex-shrink-0" />
                      <p className="text-[12.5px] text-amber-700 dark:text-amber-400">
                        Select a cluster first to load its students.
                      </p>
                    </div>
                  ) : membersLoading ? (
                    <div className="flex items-center gap-2 py-4 text-muted-foreground">
                      <RiLoader4Line className="animate-spin text-base" />
                      <p className="text-[13px]">Loading students…</p>
                    </div>
                  ) : clusterMembers.length === 0 ? (
                    <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl
                                    bg-muted/30 border border-border">
                      <RiGroupLine className="text-muted-foreground/50 text-base flex-shrink-0" />
                      <p className="text-[12.5px] text-muted-foreground">
                        No active (RUNNING) students found in this cluster.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-[12px] text-muted-foreground">
                          Fill in task details for each student. Leave blank to skip.
                        </p>
                        <span className="text-[11.5px] font-semibold text-teal-600 dark:text-teal-400">
                          {individualTasks.filter(t => t.title.trim()).length}/{clusterMembers.length} assigned
                        </span>
                      </div>
                      <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-1">
                        {clusterMembers.map(m => {
                          const entry = individualTasks.find(t => t.studentProfileId === m.studentProfileId)
                            ?? { studentProfileId: m.studentProfileId, title: "", description: "" };
                          return (
                            <IndividualTaskCard
                              key={m.studentProfileId}
                              member={m}
                              entry={entry}
                              onChange={handleIndividualTaskChange}
                            />
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* No-task notice */}
              {taskMode === "none" && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl
                                bg-muted/30 border border-border">
                  <RiCalendarCheckLine className="text-muted-foreground/50 text-base flex-shrink-0 mt-0.5" />
                  <p className="text-[12.5px] text-muted-foreground">
                    No tasks will be created. Members will receive a session notification only.
                  </p>
                </div>
              )}

              {/* ── Task submission deadline ── */}
              <div className="flex flex-col gap-3 pt-1 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <Label>Task submission deadline</Label>
                  {/* "Before the session" checkbox */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !deadlineBeforeSession;
                      setDeadlineBeforeSession(next);
                      if (!next) {
                        // Clear deadline fields when unchecked
                        setForm(p => ({ ...p, taskDeadlineDate: "", taskDeadlineTime: "23:59" }));
                      }
                    }}
                    className={cn(
                      "flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg border transition-all",
                      deadlineBeforeSession
                        ? "border-teal-400/60 bg-teal-50/50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300"
                        : "border-border text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    {deadlineBeforeSession
                      ? <RiCheckboxLine className="text-teal-500 text-sm" />
                      : <RiCheckboxBlankLine className="text-muted-foreground/50 text-sm" />
                    }
                    Before the session
                  </button>
                </div>

                {deadlineBeforeSession && form.date && form.time ? (
                  <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl
                                  bg-teal-50/40 dark:bg-teal-950/20
                                  border border-teal-200/50 dark:border-teal-800/40">
                    <RiTimeLine className="text-teal-500 text-sm flex-shrink-0" />
                    <p className="text-[12.5px] text-teal-700 dark:text-teal-300">
                      Deadline auto-set to session time:{" "}
                      <strong>{form.taskDeadlineDate} at {form.taskDeadlineTime}</strong>.
                      It will update if you change the session date or time.
                    </p>
                  </div>
                ) : deadlineBeforeSession && (!form.date || !form.time) ? (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                                  bg-amber-50/50 dark:bg-amber-950/20
                                  border border-amber-200/50 dark:border-amber-800/40">
                    <RiAlertLine className="text-amber-500 text-sm flex-shrink-0" />
                    <p className="text-[12.5px] text-amber-700 dark:text-amber-400">
                      Set the session date and time above to auto-fill the deadline.
                    </p>
                  </div>
                ) : null}

                {!deadlineBeforeSession && (
                  <>
                    <p className="text-[11.5px] text-muted-foreground/60">
                      Shown as a countdown on each member's dashboard. Leave blank for no deadline.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <p className="text-[12px] font-semibold text-muted-foreground">Date</p>
                        <InputField
                          id="deadlineDate" type="date"
                          value={form.taskDeadlineDate} onChange={set("taskDeadlineDate")}
                          error={errors.taskDeadlineDate}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <p className="text-[12px] font-semibold text-muted-foreground">Time</p>
                        <InputField
                          id="deadlineTime" type="time"
                          value={form.taskDeadlineTime} onChange={set("taskDeadlineTime")}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Section>

            {/* Notifications */}
            <Section icon={<RiNotificationLine />} title="Notifications" description="How members are informed about this session.">
              <ToggleRow
                label="Email notification"
                description="Send session details and task link to every member's email."
                checked={form.sendEmail} onChange={set("sendEmail")}
                icon={<RiMailLine />}
              />
              {!form.sendEmail && !form.sendInApp && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl
                                bg-amber-50/60 dark:bg-amber-950/20
                                border border-amber-200/60 dark:border-amber-800/50">
                  <RiAlertLine className="text-amber-500 dark:text-amber-400 text-base flex-shrink-0 mt-0.5" />
                  <p className="text-[12.5px] text-amber-700 dark:text-amber-400">
                    No notifications selected. Members won't be alerted automatically.
                  </p>
                </div>
              )}
            </Section>

          </div>

          {/* Right — preview + what happens */}
          <div className="flex flex-col gap-4">
            <SessionPreview
              form={form}
              clusters={clusters}
              taskMode={taskMode}
              templates={templates}
              membersCount={clusterMembers.length || (selectedCluster?._count.members ?? 0)}
              individualTasks={individualTasks}
            />

            <div className="rounded-2xl border border-border bg-card px-5 py-4">
              <p className="text-[12.5px] font-bold text-foreground mb-3">What happens on create</p>
              <div className="flex flex-col gap-3">
                {[
                  { icon: <RiCalendarCheckLine />, text: "Session added to cluster timeline" },
                  taskMode === "none"
                    ? { icon: <RiNotificationLine />, text: "Members notified (no tasks)" }
                    : taskMode === "individual"
                    ? { icon: <RiUserLine />, text: "Custom task per student assigned" }
                    : { icon: <RiFileTextLine />, text: "Task auto-created for each active member" },
                  { icon: <RiNotificationLine />, text: "Members notified via selected channels" },
                  { icon: <RiTimeLine />, text: "Deadline countdown on member dashboards" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center
                                     bg-teal-100/60 dark:bg-teal-950/40
                                     text-teal-600 dark:text-teal-400 text-xs mt-0.5">
                      {item.icon}
                    </span>
                    <p className="text-[12.5px] text-muted-foreground leading-snug">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Submit row ── */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-10 px-5 rounded-xl border border-border
                       text-[13.5px] font-semibold text-muted-foreground
                       hover:text-foreground hover:bg-muted/50 transition-all">
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "inline-flex items-center gap-2 h-10 px-7 rounded-xl",
              "bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600",
              "text-white text-[14px] font-bold",
              "shadow-md shadow-teal-600/20",
              "transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
              "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            )}>
            {loading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><RiAddLine /> Create session</>
            }
          </button>
        </div>

      </div>
    </form>
  );
}