"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RiCalendarCheckLine, RiTimeLine, RiMapPinLine, RiFileTextLine,
  RiGroupLine, RiFlaskLine, RiCheckLine, RiSparklingFill,
  RiAddLine, RiNotificationLine, RiMailLine, RiCloseLine,
  RiAlertLine, RiBookOpenLine, RiArrowRightLine, RiDraftLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { combineDateTime } from "@/utils/combineDateTime";

// ─── Types ────────────────────────────────────────────────
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
  _count: {
    members: number;
  }
  batchTag: string;

}


type SessionErrors = Partial<Record<keyof SessionForm, string>> & { general?: string };

// ─── Mock data (replace with real API) ────────────────────
const MOCK_CLUSTERS: Cluster[] = [
  { id: "c1", name: "ML Research Group — 2025", _count: { members: 18 }, batchTag: "Batch 2025" },
  { id: "c2", name: "NLP Reading Circle", _count: { members: 11 }, batchTag: "Spring 25" },
  { id: "c3", name: "Bootcamp Cohort B", _count: { members: 42 }, batchTag: "Cohort B" },
];

const MOCK_TEMPLATES = [
  { id: "", name: "No template — custom task" },
  { id: "t1", name: "Weekly Progress Update" },
  { id: "t2", name: "Paper Review & Summary" },
  { id: "t3", name: "Sprint Writeup" },
  { id: "t4", name: "Lab Report" },
  { id: "t5", name: "Attendance Only (no submission)" },
];

// ─── Field components ─────────────────────────────────────
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-[13px] font-semibold text-foreground/80">
      {children}
      {required && <span className="text-red-500 dark:text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function InputField({
  id, type = "text", value, onChange, placeholder, error, icon, min, step,
}: {
  id: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; error?: string; icon?: React.ReactNode;
  min?: string; step?: string;
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
          id={id}
          type={type}
          value={value}
          min={min}
          step={step}
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
            "focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all duration-150"
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
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
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
      id={id}
      rows={rows}
      value={value}
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

// ─── Toggle row ───────────────────────────────────────────
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
      {/* Toggle indicator */}
      <div className={cn(
        "w-10 h-5.5 rounded-full flex-shrink-0 transition-all duration-200 relative",
        "border",
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

// ─── Section wrapper ──────────────────────────────────────
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

// ─── Session preview card ─────────────────────────────────
function SessionPreview({ form, clusters }: { form: SessionForm, clusters: Cluster[] }) {
  const cluster = clusters?.find(c => c.id === form.clusterId);
  const template = MOCK_TEMPLATES.find(t => t.id === form.templateId);

  console.log(clusters)
  console.log(form)

  const formatDate = (d: string) => {
    if (!d) return null;
    try {
      return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    } catch { return d; }
  };

  return (
    <div className="rounded-2xl border border-border bg-muted/20 overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
        <span className="text-[11px] font-bold tracking-[.1em] uppercase text-muted-foreground">
          Preview
        </span>
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
              Task deadline: {formatDate(form.taskDeadlineDate)}{form.taskDeadlineTime && ` at ${form.taskDeadlineTime}`}
            </div>
          )}
        </div>

        {(template?.id || cluster) && (
          <div className="pt-2 border-t border-border/50 flex flex-col gap-1.5">
            {cluster && (
              <p className="text-[12px] text-muted-foreground flex items-center gap-1.5">
                <RiGroupLine className="text-xs text-teal-600 dark:text-teal-400" />
                Tasks auto-created for <strong className="text-foreground">{cluster._count.members} active members</strong>
              </p>
            )}
            {template?.id && (
              <p className="text-[12px] text-muted-foreground flex items-center gap-1.5">
                <RiDraftLine className="text-xs text-teal-600 dark:text-teal-400" />
                Template: <strong className="text-foreground">{template.name}</strong>
              </p>
            )}
            {(form.sendEmail || form.sendInApp) && (
              <p className="text-[12px] text-muted-foreground flex items-center gap-1.5">
                <RiNotificationLine className="text-xs text-teal-600 dark:text-teal-400" />
                Notifications: {[form.sendEmail && "Email", form.sendInApp && "In-app"].filter(Boolean).join(" + ")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────
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

  const [clusters, setClusters] = useState<Cluster[]>(MOCK_CLUSTERS);


  const set = <K extends keyof SessionForm>(k: K) => (v: SessionForm[K]) => {
    setForm(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: undefined }));
  };


  const validate = (): SessionErrors => {
    const e: SessionErrors = {};
    if (!form.clusterId) e.clusterId = "Please select a cluster";
    if (!form.title.trim()) e.title = "Session title is required";
    if (!form.date) e.date = "Session date is required";
    if (!form.time) e.time = "Session time is required";
    if (form.taskDeadlineDate && form.date && form.taskDeadlineDate < form.date) {
      e.taskDeadlineDate = "Task deadline cannot be before the session date";
    }
    return e;
  };

  useEffect(() => {
    const fetchClusters = async () => {
      try {
        const res = await fetch(`/api/cluster`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();

        console.log("Cluster data :", data)
        if (data.success) {
          setClusters(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch clusters:", err);
      }
    };
    fetchClusters();
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }




    setLoading(true);
    if (!form.date || !form.time) {
      setErrors({ general: "Date and time are required" });
      return;
    }

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
      return;
    }

    try {
      const res = await fetch("/api/sessions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          clusterId: form.clusterId,
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          scheduledAt,                // ✅ ISO string
          taskDeadline,               // ✅ ISO string or undefined
          durationMins: form.durationMins
            ? parseInt(form.durationMins)
            : undefined,
          location: form.location.trim() || undefined,
          // templateId: form.templateId || undefined,
        }),
      });


      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrors({ general: data.message ?? "Something went wrong" });
        return;
      }


      toast.success("Session created successfully", { position: "top-right" })
      setSuccess(true);

    } catch {
      setErrors({ general: "Network error — please try again" });
    } finally {
      setLoading(false);
    }
  };

  const selectedCluster = clusters.find(c => c.id === form.clusterId);

  // ── Success ──────────────────────────────────────────
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
              Tasks have been auto-created for every active member.
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
      <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-3xl mx-auto w-full">

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
            A session automatically creates tasks for every active member and notifies them.
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

          {/* Left — form */}
          <div className="flex flex-col gap-5">

            {/* Cluster selection */}
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
                    Tasks will be auto-created for all{" "}
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
                  id="title"
                  value={form.title}
                  onChange={set("title")}
                  placeholder="e.g. Session 12 — Attention Mechanisms"
                  error={errors.title}
                  icon={<RiCalendarCheckLine />}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Description</Label>
                <TextAreaField
                  id="description"
                  value={form.description}
                  onChange={set("description")}
                  placeholder="What will be covered? Any preparation required?"
                />
              </div>

              {/* Date + Time row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5 sm:col-span-1">
                  <Label required>Date</Label>
                  <InputField
                    id="date" type="date"
                    value={form.date} onChange={set("date")}
                    error={errors.date} min={today}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label required>Time</Label>
                  <InputField
                    id="time" type="time"
                    value={form.time} onChange={set("time")}
                    error={errors.time}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Duration (min)</Label>
                  <InputField
                    id="duration" type="number"
                    value={form.durationMins} onChange={set("durationMins")}
                    placeholder="90" min="15" step="15"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Location</Label>
                <InputField
                  id="location"
                  value={form.location} onChange={set("location")}
                  placeholder="e.g. Room 204, Lab Building · or Zoom link"
                  icon={<RiMapPinLine />}
                />
              </div>
            </Section>

            {/* Task settings */}
            <Section
              icon={<RiFileTextLine />}
              title="Task Settings"
              description="Task deadline and template applied to every active member."
            >
              {/* Template */}
              <div className="flex flex-col gap-1.5">
                <Label>Task template</Label>
                <SelectField
                  id="template"
                  value={form.templateId}
                  onChange={set("templateId")}
                  icon={<RiBookOpenLine />}
                >
                  {MOCK_TEMPLATES.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </SelectField>
                <p className="text-[11.5px] text-muted-foreground/60">
                  Templates pre-fill task structure. You can customise tasks individually after creation.
                </p>
              </div>

              {/* Deadline */}
              <div>
                <Label>Task submission deadline</Label>
                <p className="text-[11.5px] text-muted-foreground/60 mb-2">
                  Shown as a countdown on each member's dashboard. Leave blank for no deadline.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[12px] font-semibold text-muted-foreground">Date</p>
                    <InputField
                      id="deadlineDate" type="date"
                      value={form.taskDeadlineDate} onChange={set("taskDeadlineDate")}
                      error={errors.taskDeadlineDate}
                      min={form.date || today}
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
              </div>
            </Section>

            {/* Notifications */}
            <Section
              icon={<RiNotificationLine />}
              title="Notifications"
              description="How members are informed about this session."
            >
              <ToggleRow
                label="Email notification"
                description="Send session details and task link to every member's email."
                checked={form.sendEmail}
                onChange={set("sendEmail")}
                icon={<RiMailLine />}
              />
              {/* <ToggleRow
                label="In-app notification"
                description="Push an in-app alert to members' notification centre."
                checked={form.sendInApp}
                onChange={set("sendInApp")}
                icon={<RiNotificationLine />}
              /> */}

              {!form.sendEmail && !form.sendInApp && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl
                                bg-amber-50/60 dark:bg-amber-950/20
                                border border-amber-200/60 dark:border-amber-800/50">
                  <RiAlertLine className="text-amber-500 dark:text-amber-400 text-base flex-shrink-0 mt-0.5" />
                  <p className="text-[12.5px] text-amber-700 dark:text-amber-400">
                    No notifications selected. Members won't be alerted about this session automatically.
                  </p>
                </div>
              )}
            </Section>

          </div>

          {/* Right — preview + summary */}
          <div className="flex flex-col gap-4">
            <SessionPreview form={form} clusters={clusters} />

            {/* What happens */}
            <div className="rounded-2xl border border-border bg-card px-5 py-4">
              <p className="text-[12.5px] font-bold text-foreground mb-3">What happens on create</p>
              <div className="flex flex-col gap-3">
                {[
                  { icon: <RiCalendarCheckLine />, text: "Session added to cluster timeline" },
                  { icon: <RiFileTextLine />, text: "Task auto-created for each active member" },
                  { icon: <RiNotificationLine />, text: "Members notified via selected channels" },
                  { icon: <RiTimeLine />, text: "Countdown shown on member dashboards" },
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

          <div className="flex items-center gap-3">
            {/* Draft button */}
            {/* <button
              type="button"
              onClick={() => { TODO: save as draft }}
              className="h-10 px-5 rounded-xl border border-border bg-muted/40
                         text-[13.5px] font-semibold text-foreground/80
                         hover:text-foreground hover:bg-muted/60 transition-all
                         flex items-center gap-2">
              <RiDraftLine className="text-sm" /> Save draft
            </button> */}

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

      </div>
    </form>
  );
}