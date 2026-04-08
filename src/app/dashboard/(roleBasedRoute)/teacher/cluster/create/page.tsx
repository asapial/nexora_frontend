"use client";

import { useState, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  RiFlaskLine, RiGroupLine, RiMailLine,
  RiAddLine, RiCloseLine, RiCheckLine, RiSparklingFill,
  RiInformationLine, RiTeamLine, RiFileTextLine, RiLockPasswordLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── types ────────────────────────────────────────────────
interface FormState {
  name: string;
  description: string;
  batchTag: string;
  slug: string;
}
type FormErrors = Partial<FormState> & { emails?: string; general?: string; slug?: string; };

// ─── Email chip input ──────────────────────────────────────
function EmailChipInput({
  emails,
  onChange,
  error,
}: {
  emails: string[];
  onChange: (emails: string[]) => void;
  error?: string;
}) {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);

  const isValidEmail = (e: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const add = (raw: string) => {
    const cleaned = raw.trim().replace(/,+$/, "").trim().toLowerCase();
    if (!cleaned) return;
    if (!isValidEmail(cleaned)) return;
    if (emails.includes(cleaned)) return;
    onChange([...emails, cleaned]);
    setInput("");
  };

  const remove = (idx: number) =>
    onChange(emails.filter((_, i) => i !== idx));

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (["Enter", ",", " ", "Tab"].includes(e.key)) {
      e.preventDefault();
      add(input);
    }
    if (e.key === "Backspace" && input === "" && emails.length > 0) {
      remove(emails.length - 1);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-semibold text-foreground/80">
        Member emails
        <span className="ml-1.5 text-[11px] font-medium text-muted-foreground">(optional — can add later)</span>
      </label>

      <div className={cn(
        "min-h-[56px] flex flex-wrap gap-2 p-3 rounded-xl border transition-all duration-150",
        focused
          ? "border-teal-400/70 dark:border-teal-500/60 bg-muted/40 ring-2 ring-teal-400/20 dark:ring-teal-500/20"
          : error
            ? "border-red-400/60 dark:border-red-500/50 bg-muted/30"
            : "border-border bg-muted/30 hover:border-border/80",
      )}>
        {emails.map((email, i) => (
          <span key={email}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                       text-[12.5px] font-semibold
                       bg-teal-100/80 dark:bg-teal-950/60
                       text-teal-700 dark:text-teal-300
                       border border-teal-200/70 dark:border-teal-800/60">
            <RiMailLine className="text-xs opacity-70" />
            {email}
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-teal-500 dark:text-teal-400
                         hover:text-red-500 dark:hover:text-red-400
                         transition-colors ml-0.5">
              <RiCloseLine className="text-xs" />
            </button>
          </span>
        ))}

        <input
          type="email"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); if (input.trim()) add(input); }}
          placeholder={emails.length === 0 ? "Type email and press Enter or comma…" : "Add more…"}
          className="flex-1 min-w-[200px] bg-transparent text-[13.5px]
                     text-foreground placeholder:text-muted-foreground/40
                     outline-none"
        />
      </div>

      {error
        ? <p className="text-[12px] text-red-500 dark:text-red-400 font-medium">{error}</p>
        : (
          <p className="text-[11.5px] text-muted-foreground/60 flex items-center gap-1.5">
            <RiInformationLine className="text-xs flex-shrink-0" />
            Each member receives a unique one-time password via email. They must change it on first login.
          </p>
        )
      }
    </div>
  );
}

// ─── Text input ───────────────────────────────────────────
function Field({
  label, id, placeholder, value, onChange, error, hint, icon, maxLength, required,
}: {
  label: string; id: string; placeholder?: string; value: string;
  onChange: (v: string) => void; error?: string; hint?: string;
  icon?: React.ReactNode; maxLength?: number; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-foreground/80">
        {label}
        {required && <span className="text-red-500 dark:text-red-400 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2
                           text-muted-foreground/50 text-base pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={id}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={cn(
            "w-full h-11 rounded-xl text-[13.5px] font-medium",
            icon ? "pl-10 pr-4" : "px-4",
            "bg-muted/40 border",
            error
              ? "border-red-400/60 dark:border-red-500/50 focus:ring-red-400/20"
              : "border-border focus:border-teal-400/70 dark:focus:border-teal-500/60 focus:ring-teal-400/20 dark:focus:ring-teal-500/20",
            "text-foreground placeholder:text-muted-foreground/40",
            "focus:outline-none focus:ring-2 transition-all duration-150"
          )}
        />
        {maxLength && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2
                           text-[11px] text-muted-foreground/40 tabular-nums pointer-events-none">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      {error
        ? <p className="text-[12px] text-red-500 dark:text-red-400 font-medium">{error}</p>
        : hint && <p className="text-[11.5px] text-muted-foreground/60">{hint}</p>
      }
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────
function TextArea({
  label, id, placeholder, value, onChange, error, hint, rows = 3,
}: {
  label: string; id: string; placeholder?: string; value: string;
  onChange: (v: string) => void; error?: string; hint?: string; rows?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-foreground/80">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-xl px-4 py-3 text-[13.5px] font-medium leading-relaxed resize-none",
          "bg-muted/40 border",
          error
            ? "border-red-400/60 dark:border-red-500/50"
            : "border-border focus:border-teal-400/70 dark:focus:border-teal-500/60 focus:ring-teal-400/20 dark:focus:ring-teal-500/20",
          "text-foreground placeholder:text-muted-foreground/40",
          "focus:outline-none focus:ring-2 transition-all duration-150"
        )}
      />
      {error
        ? <p className="text-[12px] text-red-500 dark:text-red-400 font-medium">{error}</p>
        : hint && <p className="text-[11.5px] text-muted-foreground/60">{hint}</p>
      }
    </div>
  );
}

// ─── Section card ──────────────────────────────────────────
function Section({
  icon, title, description, children,
}: {
  icon: React.ReactNode; title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg
                        bg-teal-100/70 dark:bg-teal-950/50
                        border border-teal-200/60 dark:border-teal-800/50
                        flex items-center justify-center
                        text-teal-600 dark:text-teal-400 text-base flex-shrink-0">
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

// ─── Preview card ──────────────────────────────────────────
function PreviewCard({
  name, batchTag, description, memberCount,
}: {
  name: string; batchTag: string; description: string; memberCount: number;
}) {
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 40) || "your-cluster";

  return (
    <div className="rounded-2xl border border-border bg-muted/20 overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
        <span className="text-[11px] font-bold tracking-[.1em] uppercase text-muted-foreground">
          Preview
        </span>
      </div>
      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center
                          bg-teal-100/70 dark:bg-teal-950/50
                          border border-teal-200/60 dark:border-teal-800/50
                          text-teal-600 dark:text-teal-400">
            <RiFlaskLine />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="text-[14px] font-bold text-foreground">
                {name || <span className="text-muted-foreground/40 font-normal italic">Cluster name</span>}
              </p>
              {batchTag && (
                <span className="text-[10.5px] font-bold tracking-wider uppercase
                                 px-2 py-0.5 rounded-full border
                                 bg-teal-100/80 dark:bg-teal-950/60
                                 text-teal-700 dark:text-teal-400
                                 border-teal-200/70 dark:border-teal-800/60">
                  {batchTag}
                </span>
              )}
            </div>
            {description && (
              <p className="text-[12.5px] text-muted-foreground leading-relaxed line-clamp-2 mb-2">
                {description}
              </p>
            )}
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[11.5px] text-muted-foreground/70">
                <RiGroupLine className="text-xs" />
                {memberCount} member{memberCount !== 1 ? "s" : ""}
              </span>
              <span className="text-muted-foreground/30">·</span>
              <span className="text-[11px] font-mono text-muted-foreground/50">/{slug}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Description field with AI suggestions ────────────────
function DescriptionField({
  value,
  onChange,
  clusterName,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  clusterName: string;
  error?: string;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchSuggestions = async () => {
    if (!clusterName || clusterName.trim().length < 3) return;
    setLoadingAI(true);
    setShowSuggestions(true);
    try {
      const res = await fetch("/api/ai/suggest-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ clusterName }),
      });
      const data = await res.json();
      console.log(data);
      setSuggestions(data.data || []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor="description" className="text-[13px] font-semibold text-foreground/80">
          Description
        </label>
        <button
          type="button"
          onClick={fetchSuggestions}
          disabled={loadingAI || clusterName.trim().length < 3}
          className={cn(
            "inline-flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11.5px] font-semibold",
            "border transition-all duration-150",
            clusterName.trim().length >= 3
              ? "border-teal-300/70 dark:border-teal-700/60 text-teal-600 dark:text-teal-400 bg-teal-50/60 dark:bg-teal-950/30 hover:bg-teal-100/60 dark:hover:bg-teal-900/30"
              : "border-border text-muted-foreground/40 bg-muted/20 cursor-not-allowed"
          )}
        >
          {loadingAI
            ? <span className="w-3 h-3 border-2 border-teal-300 border-t-teal-500 rounded-full animate-spin" />
            : <RiSparklingFill className="text-xs" />
          }
          {loadingAI ? "Generating…" : "AI Suggest"}
        </button>
      </div>

      <textarea
        id="description"
        rows={5}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="What is this cluster about?"
        className={cn(
          "w-full rounded-xl px-4 py-3 text-[13.5px] font-medium leading-relaxed resize-none",
          "bg-muted/40 border text-justify",
          error
            ? "border-red-400/60 dark:border-red-500/50"
            : "border-border focus:border-teal-400/70 dark:focus:border-teal-500/60 focus:ring-teal-400/20 dark:focus:ring-teal-500/20",
          "text-foreground placeholder:text-muted-foreground/40",
          "focus:outline-none focus:ring-2 transition-all duration-150"
        )}
      />

      {/* AI Suggestions Panel */}
      {showSuggestions && (
        <div className="rounded-xl border border-teal-200/60 dark:border-teal-800/50 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2
                          bg-teal-50/60 dark:bg-teal-950/30 border-b border-teal-200/40 dark:border-teal-800/40">
            <div className="flex items-center gap-1.5">
              <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-xs animate-pulse" />
              <span className="text-[11px] font-bold tracking-wide uppercase text-teal-600 dark:text-teal-400">
                AI Suggestions
              </span>
            </div>
            <button
              type="button"
              onClick={() => { setShowSuggestions(false); setSuggestions([]); }}
              className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              <RiCloseLine className="text-sm" />
            </button>
          </div>

          <div className="flex flex-col divide-y divide-border/50">
            {loadingAI
              ? [1, 2, 3].map(i => (
                <div key={i} className="px-4 py-3 animate-pulse">
                  <div className="h-3 bg-muted rounded-full w-full mb-1.5" />
                  <div className="h-3 bg-muted rounded-full w-3/4" />
                </div>
              ))
              : suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { onChange(s); setShowSuggestions(false); setSuggestions([]); }}
                  className="w-full text-left px-4 py-3 text-[12.5px] text-muted-foreground
                               hover:bg-teal-50/50 dark:hover:bg-teal-950/20
                               hover:text-foreground transition-colors leading-relaxed group"
                >
                  <span className="flex items-start gap-2 text-justify">
                    <RiCheckLine className="text-teal-500 dark:text-teal-400 text-sm flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {s}
                  </span>
                </button>
              ))
            }
          </div>
        </div>
      )}

      {error
        ? <p className="text-[12px] text-red-500 dark:text-red-400 font-medium">{error}</p>
        : <p className="text-[11.5px] text-muted-foreground/60">Optional — shown on the cluster page.</p>
      }
    </div>
  );
}


// ─── Page ─────────────────────────────────────────────────
export default function CreateClusterPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    name: "",
    slug: "",
    description: "",
    batchTag: "",
  });
  const [emails, setEmails] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .slice(0, 50);

  const setName = (v: string) => {
    setForm(p => ({
      ...p,
      name: v,
      slug: p.slug === generateSlug(p.name) || p.slug === ""
        ? generateSlug(v)
        : p.slug,
    }));
    if (errors.name) setErrors(p => ({ ...p, name: "" }));
  };

  const set = (k: keyof FormState) => (v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: "" }));
  };

  const validate = (): FormErrors => {
    const e: FormErrors & { slug?: string } = {};
    if (!form.name.trim()) e.name = "Cluster name is required";
    else if (form.name.length < 3) e.name = "Name must be at least 3 characters";
    if (!form.slug.trim()) (e as any).slug = "Slug is required";
    else if (form.slug.length < 3) (e as any).slug = "Slug must be at least 3 characters";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/cluster/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim() || undefined,
          batchTag: form.batchTag.trim() || undefined,
          emails,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {

        if (res.status === 409) {
          setErrors({ slug: "This slug is already taken — try another" } as any);
          return;
        }
        setErrors({ general: data.message ?? "Something went wrong" });
        return;
      }


      setSuccess(true);
      setTimeout(() => router.push("/dashboard/teacher/cluster/manageCluster"), 1500);

    } catch {
      setErrors({ general: "Network error — please try again" });
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ──────────────────────────────────────
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
            <h2 className="text-[18px] font-extrabold text-foreground mb-1">Cluster created!</h2>
            <p className="text-[13.5px] text-muted-foreground">
              {emails.length > 0
                ? `Credentials have been emailed to ${emails.length} member${emails.length !== 1 ? "s" : ""}.`
                : "You can add members at any time from the cluster page."}
            </p>
          </div>
          <div className="w-6 h-6 border-2 border-teal-200 dark:border-teal-800
                          border-t-teal-500 rounded-full animate-spin mt-2" />
          <p className="text-[12px] text-muted-foreground/60">Redirecting to clusters…</p>
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
              Clusters
            </span>
          </div>
          <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">
            Create a new cluster
          </h1>
          <p className="text-[13.5px] text-muted-foreground mt-1">
            A cluster groups members under one supervisor with shared sessions, resources, and tasks.
          </p>
        </div>

        {/* ── General error ── */}
        {errors.general && (
          <div className="px-4 py-3 rounded-xl
                          bg-red-50 dark:bg-red-950/30
                          border border-red-200 dark:border-red-800/50
                          text-[13px] font-medium text-red-600 dark:text-red-400">
            {errors.general}
          </div>
        )}

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">

          {/* Left — form sections */}
          <div className="flex flex-col gap-5">

            {/* Cluster identity */}
            <Section icon={<RiFlaskLine />} title="Cluster Identity" description="Basic information about this cluster.">
              <Field
                label="Cluster name" id="name" required
                placeholder="e.g. ML Research Group — 2025"
                value={form.name}
                onChange={setName}  // ✅ special handler
                error={errors.name}
                icon={<RiFlaskLine />} maxLength={80}
              />

              {/* ✅ Slug field */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="slug" className="text-[13px] font-semibold text-foreground/80">
                  Slug
                  <span className="ml-1.5 text-[11px] font-medium text-muted-foreground">
                    (auto-generated — editable)
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2
                       text-muted-foreground/50 text-[13px] pointer-events-none font-mono">
                    /
                  </span>
                  <input
                    id="slug"
                    type="text"
                    value={form.slug}
                    onChange={e => {
                      const slug = e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-]/g, "")
                        .slice(0, 50);
                      setForm(p => ({ ...p, slug }));
                      if (errors.slug) setErrors(p => ({ ...p, slug: "" }));
                    }}
                    placeholder="ml-research-group-2025"
                    className={cn(
                      "w-full h-11 pl-7 pr-4 rounded-xl text-[13.5px] font-mono font-medium",
                      "bg-muted/40 border",
                      (errors as any).slug
                        ? "border-red-400/60 dark:border-red-500/50"
                        : "border-border focus:border-teal-400/70 dark:focus:border-teal-500/60 focus:ring-teal-400/20",
                      "text-foreground placeholder:text-muted-foreground/40",
                      "focus:outline-none focus:ring-2 transition-all duration-150"
                    )}
                  />
                </div>
                {(errors as any).slug
                  ? <p className="text-[12px] text-red-500 dark:text-red-400 font-medium">{(errors as any).slug}</p>
                  : <p className="text-[11.5px] text-muted-foreground/60">
                    Used in the cluster URL — must be unique.
                  </p>
                }
              </div>

              <DescriptionField
                value={form.description}
                onChange={set("description")}
                clusterName={form.name}
                error={errors.description}
              />
              <Field
                label="Batch / cohort tag" id="batchTag"
                placeholder="e.g. Batch 2025"
                value={form.batchTag} onChange={set("batchTag")} error={errors.batchTag}
                icon={<RiTeamLine />} maxLength={30}
                hint="Short label shown as a badge."
              />
            </Section>

            {/* Member emails */}
            <Section
              icon={<RiGroupLine />}
              title="Invite Members"
              description="Members receive a unique one-time password and login link via email."
            >
              <EmailChipInput emails={emails} onChange={setEmails} error={errors.emails} />

              {emails.length > 0 && (
                <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl
                                bg-teal-50/60 dark:bg-teal-950/20
                                border border-teal-200/60 dark:border-teal-800/50">
                  <RiLockPasswordLine className="text-teal-600 dark:text-teal-400 text-base mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[13px] font-semibold text-teal-700 dark:text-teal-400 mb-0.5">
                      Credentials will be auto-generated
                    </p>
                    <p className="text-[12px] text-teal-600/70 dark:text-teal-500/70 leading-relaxed">
                      Each of the {emails.length} email address{emails.length !== 1 ? "es" : ""} will receive a unique
                      one-time password and a direct login link. Members must change their password on first sign-in.
                    </p>
                  </div>
                </div>
              )}
            </Section>

          </div>

          {/* Right — preview + info */}
          <div className="flex flex-col gap-4">
            <PreviewCard
              name={form.name}
              batchTag={form.batchTag}
              description={form.description}
              memberCount={emails.length}
            />

            {/* What happens next */}
            <div className="rounded-2xl border border-border bg-card px-5 py-4">
              <p className="text-[12.5px] font-bold text-foreground mb-3">What happens next</p>
              <div className="flex flex-col gap-3">
                {[
                  { icon: <RiFlaskLine />, text: "A unique cluster slug is generated" },
                  { icon: <RiLockPasswordLine />, text: "One-time passwords created per member" },
                  { icon: <RiMailLine />, text: "Login credentials emailed instantly" },
                  { icon: <RiFileTextLine />, text: "Sessions and tasks can now be created" },
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
              : <><RiAddLine /> Create cluster</>
            }
            {!loading && emails.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-[11px] font-bold">
                + {emails.length}
              </span>
            )}
          </button>
        </div>

      </div>
    </form>
  );
}