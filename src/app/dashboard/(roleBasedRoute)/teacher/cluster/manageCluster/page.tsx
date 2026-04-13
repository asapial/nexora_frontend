"use client";

import { useState, useEffect, useCallback, KeyboardEvent } from "react";
import Link from "next/link";
import {
    RiFlaskLine, RiGroupLine, RiMailLine, RiAddLine, RiCloseLine,
    RiCheckLine, RiMoreLine, RiDeleteBinLine,
    RiArrowRightLine, RiSparklingFill, RiCalendarCheckLine,
    RiTimeLine, RiAlertLine, RiUserLine,
    RiShieldCheckLine, RiEditLine, RiSaveLine, RiLoader4Line,
    RiRefreshLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import RefreshIcon from "@/components/shared/RefreshIcon";

// ─── Types ────────────────────────────────────────────────
type MemberSubtype = "EMERGING" | "ACTIVE" | "GRADUATED" | "ALUMNI" | "RUNNING";
type ClusterStatus = "healthy" | "at-risk" | "inactive";

interface Member {
    id: string;
    name: string;
    email: string;
    subtype: MemberSubtype;
    joinedAt: string;
    avatarUrl?: string;
}

interface Cluster {
    id: string;
    name: string;
    slug: string;
    description?: string;
    batchTag?: string;
    memberCount: number;
    sessionCount?: number;
    healthScore?: number;
    status?: ClusterStatus;
    lastActivity?: string;
    createdAt: string;
    isDeleted: boolean;
}

// ─── Edit cluster form state ──────────────────────────────
interface EditForm {
    name: string;
    slug: string;
    description: string;
    batchTag: string;
}

function mapClusterHealth(h?: string): ClusterStatus {
    if (h === "AT_RISK") return "at-risk";
    if (h === "INACTIVE") return "inactive";
    return "healthy";
}

function mapApiCluster(c: Record<string, unknown>): Cluster {
    const counts = c._count as { members?: number; sessions?: number } | undefined;
    return {
        id: String(c.id),
        name: String(c.name),
        slug: String(c.slug),
        description: c.description ? String(c.description) : undefined,
        batchTag: c.batchTag ? String(c.batchTag) : undefined,
        memberCount: counts?.members ?? 0,
        sessionCount: counts?.sessions,
        healthScore: typeof c.healthScore === "number" ? Math.round(c.healthScore) : undefined,
        status: mapClusterHealth(typeof c.healthStatus === "string" ? c.healthStatus : undefined),
        createdAt: c.createdAt ? String(c.createdAt) : "",
        isDeleted: false,
    };
}

// ─── Token maps ───────────────────────────────────────────
const HEALTH_BAR = (h: number) =>
    h >= 80 ? "bg-teal-500" : h >= 50 ? "bg-amber-400" : "bg-red-400";

const SUBTYPE_LABELS: Record<MemberSubtype, string> = {
    EMERGING: "Emerging",
    ACTIVE: "Active",
    GRADUATED: "Graduated",
    ALUMNI: "Alumni",
    RUNNING: "Running",
};

const SUBTYPE_COLORS: Record<MemberSubtype, string> = {
    EMERGING: "bg-sky-100/80 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 border-sky-200/70 dark:border-sky-800/50",
    ACTIVE: "bg-teal-100/80 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border-teal-200/70 dark:border-teal-800/50",
    GRADUATED: "bg-violet-100/80 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border-violet-200/70 dark:border-violet-800/50",
    ALUMNI: "bg-zinc-100/80 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-zinc-200/70 dark:border-zinc-700/50",
    RUNNING: "bg-orange-100/80 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 border-orange-200/70 dark:border-orange-800/50",
};

// ─── Shared input style ───────────────────────────────────
const inputCls = (error?: boolean) => cn(
    "w-full h-10 px-3.5 rounded-xl text-[13px] font-medium",
    "bg-muted/40 border transition-all duration-150",
    "text-foreground placeholder:text-muted-foreground/40",
    "focus:outline-none focus:ring-2",
    error
        ? "border-red-400/60 dark:border-red-500/50 focus:ring-red-400/20"
        : "border-border focus:border-teal-400/70 dark:focus:border-teal-500/60 focus:ring-teal-400/20"
);

// ─── Edit Cluster Modal ───────────────────────────────────
function EditClusterModal({
    cluster,
    onClose,
    onSaved,
}: {
    cluster: Cluster;
    onClose: () => void;
    onSaved: (updated: Cluster) => void;
}) {
    const [form, setForm] = useState<EditForm>({
        name: cluster.name,
        slug: cluster.slug,
        description: cluster.description ?? "",
        batchTag: cluster.batchTag ?? "",
    });
    const [errors, setErrors] = useState<Partial<EditForm>>({});
    const [saving, setSaving] = useState(false);

    const generateSlug = (name: string) =>
        name.toLowerCase().trim()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
            .replace(/-+/g, "-")
            .slice(0, 50);

    const setField = (k: keyof EditForm) => (v: string) => {
        setForm(p => ({ ...p, [k]: v }));
        if (errors[k]) setErrors(p => ({ ...p, [k]: undefined }));
    };

    const setName = (v: string) => {
        setForm(p => ({
            ...p,
            name: v,
            slug: p.slug === generateSlug(p.name) || p.slug === cluster.slug
                ? generateSlug(v)
                : p.slug,
        }));
        if (errors.name) setErrors(p => ({ ...p, name: undefined }));
    };

    const validate = (): Partial<EditForm> => {
        const e: Partial<EditForm> = {};
        if (!form.name.trim()) e.name = "Name is required";
        else if (form.name.trim().length < 3) e.name = "At least 3 characters";
        if (!form.slug.trim()) e.slug = "Slug is required";
        else if (form.slug.trim().length < 3) e.slug = "At least 3 characters";
        return e;
    };

    const handleSave = async () => {
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setSaving(true);
        try {
            const res = await fetch(`/api/cluster/${cluster.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    name: form.name.trim(),
                    slug: form.slug.trim(),
                    description: form.description.trim() || undefined,
                    batchTag: form.batchTag.trim() || undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                if (res.status === 409) {
                    setErrors({ slug: "Slug already taken — try another" });
                    return;
                }
                toast.error(data.message ?? "Failed to update cluster", { position: "top-right" });
                return;
            }

            const updated: Cluster = {
                ...cluster,
                name: form.name.trim(),
                slug: form.slug.trim(),
                description: form.description.trim() || undefined,
                batchTag: form.batchTag.trim() || undefined,
            };

            onSaved(updated);
            toast.success("Cluster updated", { position: "top-right" });
            onClose();
        } catch {
            toast.error("Network error — please try again", { position: "top-right" });
        } finally {
            setSaving(false);
        }
    };

    // Close on Escape
    useEffect(() => {
        const handler = (e: globalThis.KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div className="pointer-events-auto w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center
                                bg-teal-100/70 dark:bg-teal-950/50
                                border border-teal-200/60 dark:border-teal-800/50
                                text-teal-600 dark:text-teal-400">
                                <RiEditLine className="text-sm" />
                            </div>
                            <div>
                                <h2 className="text-[14px] font-bold text-foreground leading-none">Edit cluster</h2>
                                <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate max-w-[260px]">
                                    {cluster.name}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center
                                text-muted-foreground/50 hover:text-foreground
                                hover:bg-muted/60 transition-all">
                            <RiCloseLine />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-5 flex flex-col gap-4">

                        {/* Name */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[12.5px] font-semibold text-foreground/80">
                                Cluster name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <RiFlaskLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-sm pointer-events-none" />
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setName(e.target.value)}
                                    maxLength={80}
                                    placeholder="e.g. ML Research Group — 2025"
                                    className={cn(inputCls(!!errors.name), "pl-9")}
                                />
                            </div>
                            {errors.name && <p className="text-[11.5px] text-red-500 dark:text-red-400 font-medium">{errors.name}</p>}
                        </div>

                        {/* Slug */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[12.5px] font-semibold text-foreground/80">
                                Slug <span className="text-red-500">*</span>
                                <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">(auto-generated · editable)</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-[13px] font-mono pointer-events-none">/</span>
                                <input
                                    type="text"
                                    value={form.slug}
                                    onChange={e => {
                                        const slug = e.target.value
                                            .toLowerCase()
                                            .replace(/\s+/g, "-")
                                            .replace(/[^a-z0-9-]/g, "")
                                            .slice(0, 50);
                                        setField("slug")(slug);
                                    }}
                                    placeholder="ml-research-group-2025"
                                    className={cn(inputCls(!!errors.slug), "pl-7 font-mono")}
                                />
                            </div>
                            {errors.slug
                                ? <p className="text-[11.5px] text-red-500 dark:text-red-400 font-medium">{errors.slug}</p>
                                : <p className="text-[11px] text-muted-foreground/60">Must be unique across all clusters.</p>
                            }
                        </div>

                        {/* Description */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[12.5px] font-semibold text-foreground/80">
                                Description
                                <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">optional</span>
                            </label>
                            <textarea
                                rows={3}
                                value={form.description}
                                onChange={e => setField("description")(e.target.value)}
                                placeholder="What is this cluster about?"
                                className={cn(
                                    "w-full rounded-xl px-3.5 py-2.5 text-[13px] font-medium leading-relaxed resize-none",
                                    "bg-muted/40 border border-border",
                                    "text-foreground placeholder:text-muted-foreground/40",
                                    "focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70",
                                    "transition-all duration-150"
                                )}
                            />
                        </div>

                        {/* Batch tag */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[12.5px] font-semibold text-foreground/80">
                                Batch / cohort tag
                                <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">optional</span>
                            </label>
                            <input
                                type="text"
                                value={form.batchTag}
                                onChange={e => setField("batchTag")(e.target.value)}
                                maxLength={30}
                                placeholder="e.g. Batch 2025"
                                className={inputCls()}
                            />
                            <p className="text-[11px] text-muted-foreground/60">Short label shown as a badge on the cluster card.</p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3">
                        <button
                            onClick={onClose}
                            disabled={saving}
                            className="h-9 px-4 rounded-xl border border-border
                                text-[13px] font-semibold text-muted-foreground
                                hover:text-foreground hover:bg-muted/50
                                disabled:opacity-50 transition-all">
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={cn(
                                "inline-flex items-center gap-2 h-9 px-5 rounded-xl",
                                "bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600",
                                "text-white text-[13px] font-bold",
                                "shadow-sm shadow-teal-600/20",
                                "transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]",
                                "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                            )}>
                            {saving
                                ? <><RiLoader4Line className="animate-spin text-sm" /> Saving…</>
                                : <><RiSaveLine className="text-sm" /> Save changes</>
                            }
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

// ─── Avatar initials ──────────────────────────────────────
function MemberAvatar({ name }: { name: string }) {
    const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    return (
        <div className="w-8 h-8 rounded-full flex items-center justify-center
                    bg-teal-600/15 dark:bg-teal-400/12
                    border border-teal-300/50 dark:border-teal-600/30
                    text-teal-700 dark:text-teal-300
                    text-[11.5px] font-bold flex-shrink-0">
            {initials}
        </div>
    );
}

// ─── Add member email input ────────────────────────────────
function AddMemberInput({
    onAdd,
    cluster,
}: {
    onAdd: (clusterId: string, email: string) => Promise<void>;
    cluster: Cluster;
}) {
    const [input, setInput] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const isValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

    const submit = async () => {
        const email = input.trim().toLowerCase();
        if (!email) return;
        if (!isValid(email)) { setError("Enter a valid email address"); return; }
        setError("");
        setLoading(true);
        await onAdd(cluster.id, email);
        setInput("");
        setLoading(false);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") { e.preventDefault(); submit(); }
    };

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2
                                  text-muted-foreground/50 text-base pointer-events-none" />
                    <input
                        type="email"
                        value={input}
                        onChange={e => { setInput(e.target.value); setError(""); }}
                        onKeyDown={handleKeyDown}
                        placeholder="member@university.edu"
                        className={cn(
                            "w-full h-10 pl-9 pr-4 rounded-xl text-[13.5px] font-medium",
                            "bg-muted/40 border",
                            error
                                ? "border-red-400/60 dark:border-red-500/50"
                                : "border-border focus:border-teal-400/70 dark:focus:border-teal-500/60",
                            "text-foreground placeholder:text-muted-foreground/40",
                            "focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all"
                        )}
                    />
                </div>
                <button
                    type="button"
                    onClick={submit}
                    disabled={loading || !input.trim()}
                    className={cn(
                        "h-10 px-4 rounded-xl flex items-center gap-1.5",
                        "bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600",
                        "text-white text-[13px] font-bold transition-all",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}>
                    {loading
                        ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <><RiAddLine /> Add</>
                    }
                </button>
            </div>
            {error && <p className="text-[12px] text-red-500 dark:text-red-400 font-medium">{error}</p>}
        </div>
    );
}

// ─── Cluster card ─────────────────────────────────────────
function ClusterCard({
    cluster,
    onDelete,
    onEdit,
    handleManageCluster,
}: {
    cluster: Cluster;
    onDelete: (id: string) => void;
    onEdit: (cluster: Cluster) => void;
    handleManageCluster: (c: Cluster) => void;
}) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className={cn(
            "rounded-2xl border border-border bg-card overflow-hidden",
            "hover:shadow-md hover:shadow-black/[0.04] dark:hover:shadow-black/20",
            "transition-shadow duration-200",
        )}>
            <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center
                            bg-teal-100/70 dark:bg-teal-950/50
                            border border-teal-200/60 dark:border-teal-800/50
                            text-teal-600 dark:text-teal-400">
                            <RiFlaskLine />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <h3 className="text-[14px] font-bold text-foreground truncate">{cluster.name}</h3>
                                {cluster.batchTag && (
                                    <span className="text-[10px] font-bold tracking-wider uppercase
                                   px-2 py-0.5 rounded-full border flex-shrink-0
                                   bg-teal-100/80 dark:bg-teal-950/60
                                   text-teal-700 dark:text-teal-400
                                   border-teal-200/70 dark:border-teal-800/60">
                                        {cluster.batchTag}
                                    </span>
                                )}
                            </div>
                            <div className="group">
                                {cluster.description && (
                                    <p className="
      text-[12.5px] text-muted-foreground
      overflow-hidden
      max-h-[1.5em]
      group-hover:max-h-[200px]
      transition-all duration-300 ease-in-out
    ">
                                        {cluster.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions menu */}
                    <div className="relative flex-shrink-0">
                        <button
                            onClick={() => setMenuOpen(o => !o)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center
                         text-muted-foreground/50 hover:text-foreground
                         hover:bg-muted/60 transition-all">
                            <RiMoreLine />
                        </button>
                        {menuOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                                <div className="absolute right-0 top-full mt-1 z-20 w-48
                                rounded-xl border border-border bg-popover
                                shadow-xl overflow-hidden">
                                    <button
                                        onClick={() => { handleManageCluster(cluster); setMenuOpen(false); }}
                                        className="flex items-center gap-2.5 w-full px-4 py-2.5
                               text-[13px] text-foreground hover:bg-accent transition-colors">
                                        <RiGroupLine className="text-muted-foreground text-base" /> Manage members
                                    </button>
                                    {/* ── Edit cluster ── */}
                                    <button
                                        onClick={() => { onEdit(cluster); setMenuOpen(false); }}
                                        className="flex items-center gap-2.5 w-full px-4 py-2.5
                               text-[13px] text-foreground hover:bg-accent transition-colors">
                                        <RiEditLine className="text-muted-foreground text-base" /> Edit cluster
                                    </button>
                                    <button
                                        onClick={() => { window.location.href = "/dashboard/teacher/session/manageSession"; setMenuOpen(false); }}
                                        className="flex items-center gap-2.5 w-full px-4 py-2.5
                               text-[13px] text-foreground hover:bg-accent transition-colors">
                                        <RiCalendarCheckLine className="text-muted-foreground text-base" /> View sessions
                                    </button>
                                    <div className="border-t border-border" />
                                    <button
                                        onClick={() => { onDelete(cluster.id); setMenuOpen(false); }}
                                        className="flex items-center gap-2.5 w-full px-4 py-2.5
                               text-[13px] text-red-600 dark:text-red-400
                               hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                                        <RiDeleteBinLine className="text-base" /> Delete cluster
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {cluster.healthScore !== undefined && (
                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                                className={cn("h-full rounded-full transition-all duration-700", HEALTH_BAR(cluster.healthScore))}
                                style={{ width: `${cluster.healthScore}%` }}
                            />
                        </div>
                        <span className="text-[11.5px] font-bold tabular-nums text-foreground/60 w-7 text-right">
                            {cluster.healthScore}
                        </span>
                    </div>
                )}

                <div className="flex items-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
                        <RiGroupLine className="text-xs" /> {cluster.memberCount} members
                    </span>
                    {cluster.sessionCount !== undefined && (
                        <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
                            <RiCalendarCheckLine className="text-xs" /> {cluster.sessionCount} sessions
                        </span>
                    )}
                    {cluster.lastActivity && (
                        <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
                            <RiTimeLine className="text-xs" /> {cluster.lastActivity}
                        </span>
                    )}
                </div>
            </div>

            <div className="px-5 py-3 border-t border-border flex items-center justify-between">
                <span className="text-[11px] font-mono text-muted-foreground/50">/{cluster.slug}</span>
                <div className="flex items-center gap-3">
                    {/* Quick edit button in footer */}
                    <button
                        onClick={() => onEdit(cluster)}
                        className="flex items-center gap-1 text-[12px] font-semibold
                         text-muted-foreground hover:text-foreground transition-colors">
                        <RiEditLine className="text-xs" /> Edit
                    </button>
                    <span className="text-muted-foreground/30 text-xs">·</span>
                    <button
                        onClick={() => handleManageCluster(cluster)}
                        className="flex items-center gap-1 text-[12.5px] font-semibold
                         text-teal-600 dark:text-teal-400
                         hover:text-teal-700 dark:hover:text-teal-300 transition-colors">
                        Manage <RiArrowRightLine className="text-xs" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Member row ───────────────────────────────────────────
function MemberRow({
    member,
    onRemove,
    onSubtypeChange,
    onResendCredentials,
    cluster,
}: {
    member: Member;
    onRemove: (id: string) => void;
    onSubtypeChange: (id: string, subtype: MemberSubtype) => void;
    onResendCredentials: (clusterId: string, memberId: string) => void;
    cluster: Cluster;
}) {
    const [resending, setResending] = useState(false);
    const [resent, setResent] = useState(false);

    const handleResend = async () => {
        setResending(true);
        await onResendCredentials(cluster.id, member.id);
        setResending(false);
        setResent(true);
        setTimeout(() => setResent(false), 3000);
    };

    return (
        <div className="flex items-center gap-3 px-5 py-3.5
                    border-b border-border/60 last:border-0
                    hover:bg-muted/30 transition-colors duration-100">
            <MemberAvatar name={member.name} />
            <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-semibold text-foreground leading-none mb-0.5 truncate">
                    {member.name}
                </p>
                <p className="text-[11.5px] text-muted-foreground truncate">{member.email}</p>
            </div>
            <select
                value={member.subtype}
                onChange={e => onSubtypeChange(member.id, e.target.value as MemberSubtype)}
                className={cn(
                    "h-7 px-2 rounded-lg text-[11px] font-bold border cursor-pointer",
                    "focus:outline-none focus:ring-1 focus:ring-teal-400/40 transition-all",
                    "appearance-none bg-transparent",
                    SUBTYPE_COLORS[member.subtype]
                )}>
                {(Object.keys(SUBTYPE_LABELS) as MemberSubtype[]).map(s => (
                    <option key={s} value={s}>{SUBTYPE_LABELS[s]}</option>
                ))}
            </select>
            <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                    onClick={handleResend}
                    disabled={resending}
                    title="Resend credentials"
                    className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all",
                        resent
                            ? "text-teal-600 dark:text-teal-400 bg-teal-100/60 dark:bg-teal-950/40"
                            : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/60"
                    )}>
                    {resending
                        ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                        : resent ? <RiCheckLine className="text-xs" /> : <RiRefreshLine className="text-xs" />
                    }
                </button>
                <button
                    onClick={() => onRemove(member.id)}
                    title="Remove member"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm
                     text-muted-foreground/60 hover:text-red-500 dark:hover:text-red-400
                     hover:bg-red-50 dark:hover:bg-red-950/30 transition-all">
                    <RiCloseLine className="text-xs" />
                </button>
            </div>
        </div>
    );
}

// ─── Delete confirmation modal ─────────────────────────────
function DeleteModal({
    clusterName,
    onConfirm,
    onCancel,
}: {
    clusterName: string;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4
                    bg-background/80 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl p-6">
                <div className="flex items-start gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center
                          bg-red-100/70 dark:bg-red-950/30
                          border border-red-200/60 dark:border-red-800/50
                          text-red-600 dark:text-red-400 text-lg">
                        <RiAlertLine />
                    </div>
                    <div>
                        <h3 className="text-[15px] font-bold text-foreground mb-1">Delete cluster?</h3>
                        <p className="text-[13px] text-muted-foreground leading-relaxed">
                            <strong className="text-foreground">"{clusterName}"</strong> will be soft-deleted.
                            All sessions, tasks, and member data are preserved and can be restored by an admin.
                        </p>
                    </div>
                </div>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="h-9 px-4 rounded-xl border border-border
                       text-[13px] font-semibold text-muted-foreground
                       hover:text-foreground hover:bg-muted/50 transition-all">
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="h-9 px-5 rounded-xl
                       bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600
                       text-white text-[13px] font-bold
                       shadow-sm shadow-red-600/20 transition-all">
                        Delete cluster
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────
export default function ManageClustersPage() {
    const [clusters, setClusters] = useState<Cluster[]>([]);
    const [listLoading, setListLoading] = useState(true);
    const [members, setMembers] = useState<Member[]>([]);
    const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
    const [search, setSearch] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<Cluster | null>(null);
    // ── Edit state ──────────────────────────────────────────
    const [editTarget, setEditTarget] = useState<Cluster | null>(null);

    const fetchClusters = useCallback(async () => {
        setListLoading(true);
        try {
            const res = await fetch(`/api/cluster`, { method: "GET", credentials: "include" });
            const data = await res.json();
            if (data.success && Array.isArray(data.data)) {
                setClusters(data.data.map((c: Record<string, unknown>) => mapApiCluster(c)));
            }
        } catch (err) {
            console.error("Failed to fetch clusters:", err);
        } finally {
            setListLoading(false);
        }
    }, []);

    useEffect(() => { fetchClusters(); }, [fetchClusters]);

    const handleManageCluster = async (cluster: Cluster) => {
        try {
            const res = await fetch(`/api/cluster/${cluster.id}`, { method: "GET", credentials: "include" });
            const data = await res.json();
            if (data.success && data.data?.members) {
                const mapped: Member[] = data.data.members.map((m: Record<string, unknown>) => ({
                    id: String(m.userId),
                    name: (m.user as { name?: string; email?: string } | undefined)?.name
                        ?? (m.user as { email?: string } | undefined)?.email?.split("@")[0]
                        ?? "Unknown",
                    email: (m.user as { email?: string } | undefined)?.email ?? "",
                    subtype: m.subtype as MemberSubtype,
                    joinedAt: new Date(m.joinedAt as string).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
                }));
                setMembers(mapped);
                setSelectedCluster(cluster);
            }
        } catch (err) {
            console.error("Failed to fetch cluster:", err);
        }
    };

    const handleDelete = (id: string) => {
        const c = clusters.find(c => c.id === id);
        if (c) setDeleteTarget(c);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            const res = await fetch(`/api/cluster/${deleteTarget.id}`, { method: "DELETE", credentials: "include" });
            const data = await res.json();
            if (data.success) {
                toast.success("Cluster deleted", { position: "top-right" });
                setClusters(cs => cs.filter(c => c.id !== deleteTarget.id));
                if (selectedCluster?.id === deleteTarget.id) setSelectedCluster(null);
            } else {
                toast.error(data.message ?? "Delete failed", { position: "top-right" });
            }
        } catch {
            toast.error("Network error", { position: "top-right" });
        } finally {
            setDeleteTarget(null);
        }
    };

    // ── Cluster saved callback ─────────────────────────────
    const handleClusterSaved = (updated: Cluster) => {
        setClusters(cs => cs.map(c => c.id === updated.id ? updated : c));
        // If this cluster is open in the member panel, sync its name too
        if (selectedCluster?.id === updated.id) {
            setSelectedCluster(updated);
        }
    };

    const handleAddMember = async (clusterId: string, email: string) => {
        try {
            const res = await fetch(`/api/cluster/${clusterId}/member`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: [email] }),
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Member added successfully", { position: "top-right" });
                const newMember: Member = {
                    id: `m-${Date.now()}`,
                    name: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
                    email,
                    subtype: "EMERGING",
                    joinedAt: "Just now",
                };
                setMembers(m => [...m, newMember]);
                setClusters(cs => cs.map(c =>
                    c.id === clusterId ? { ...c, memberCount: c.memberCount + 1 } : c
                ));
            } else {
                toast.error(data.message ?? "Failed to add member", { position: "top-right" });
            }
        } catch {
            toast.error("Something went wrong", { position: "top-right" });
        }
    };

    const handleRemoveMember = async (clusterId: string, id: string) => {
        try {
            const res = await fetch(`/api/cluster/${clusterId}/members/${id}`, { method: "DELETE", credentials: "include" });
            const data = await res.json();
            if (data.success) {
                toast.success("Member removed successfully", { position: "top-right" });
                setMembers(m => m.filter(m => m.id !== id));
                setClusters(cs => cs.map(c =>
                    c.id === clusterId ? { ...c, memberCount: Math.max(0, c.memberCount - 1) } : c
                ));
            } else {
                toast.error(data.message ?? "Failed to remove member", { position: "top-right" });
            }
        } catch {
            console.error("Failed to remove member");
        }
    };

    const handleSubtypeChange = async (id: string, subtype: MemberSubtype) => {
        setMembers(m => m.map(m => m.id === id ? { ...m, subtype } : m));
    };

    const handleResendCredentials = async (clusterId: string, memberId: string): Promise<void> => {
        // API call placeholder
    };

    const filtered = clusters.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.batchTag?.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <>
            {deleteTarget && (
                <DeleteModal
                    clusterName={deleteTarget.name}
                    onConfirm={confirmDelete}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}

            {/* ── Edit modal ── */}
            {editTarget && (
                <EditClusterModal
                    cluster={editTarget}
                    onClose={() => setEditTarget(null)}
                    onSaved={handleClusterSaved}
                />
            )}

            <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-5xl mx-auto w-full">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="flex items-center gap-1.5 mb-1 text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">
                            <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
                            Manage Clusters
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <RefreshIcon onClick={fetchClusters} loading={listLoading} />
                        <Link
                            href="/dashboard/teacher/cluster/create"
                            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl
                       bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600
                       text-white text-[13.5px] font-bold
                       shadow-md shadow-teal-600/20
                       transition-all duration-200 hover:scale-[1.02]">
                            <RiAddLine /> New cluster
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
                    <div className="flex flex-col gap-4">
                        {listLoading ? (
                            <div className="flex flex-col gap-4">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="rounded-2xl border border-border h-44 animate-pulse bg-muted/30" />
                                ))}
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="rounded-2xl border border-border bg-card p-10
                              flex flex-col items-center text-center gap-3">
                                <RiFlaskLine className="text-3xl text-muted-foreground/30" />
                                <p className="text-[14px] font-semibold text-muted-foreground">
                                    {search ? "No clusters match your search" : "No clusters yet"}
                                </p>
                                {!search && (
                                    <Link href="/dashboard/clusters/create"
                                        className="text-[13px] font-semibold text-teal-600 dark:text-teal-400
                               hover:underline flex items-center gap-1">
                                        Create your first cluster <RiArrowRightLine />
                                    </Link>
                                )}
                            </div>
                        ) : (
                            filtered.map(c => (
                                <ClusterCard
                                    key={c.id}
                                    cluster={c}
                                    onDelete={handleDelete}
                                    onEdit={setEditTarget}      // ← wire edit
                                    handleManageCluster={handleManageCluster}
                                />
                            ))
                        )}
                    </div>

                    {selectedCluster ? (
                        <div className="rounded-2xl border border-border bg-card overflow-hidden
                            lg:sticky lg:top-20 h-fit">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-bold tracking-[.1em] uppercase text-muted-foreground mb-0.5">
                                        Managing members
                                    </p>
                                    <p className="text-[14px] font-bold text-foreground truncate">
                                        {selectedCluster.name}
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setSelectedCluster(null); setMembers([]); }}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center
                             text-muted-foreground/50 hover:text-foreground
                             hover:bg-muted/60 transition-all flex-shrink-0">
                                    <RiCloseLine />
                                </button>
                            </div>
                            <div className="px-5 py-4 border-b border-border">
                                <p className="text-[12.5px] font-semibold text-foreground mb-2.5 flex items-center gap-1.5">
                                    <RiAddLine className="text-teal-600 dark:text-teal-400" /> Add member by email
                                </p>
                                <AddMemberInput onAdd={handleAddMember} cluster={selectedCluster} />
                            </div>
                            <div>
                                <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
                                    <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Members</span>
                                    <span className="text-[12px] font-semibold text-muted-foreground">{members.length}</span>
                                </div>
                                <div className="max-h-[400px] overflow-y-auto">
                                    {members.length === 0 ? (
                                        <div className="px-5 py-8 text-center">
                                            <RiUserLine className="text-2xl text-muted-foreground/30 mx-auto mb-2" />
                                            <p className="text-[13px] text-muted-foreground">No members yet</p>
                                        </div>
                                    ) : (
                                        members.map(m => (
                                            <MemberRow
                                                key={m.id}
                                                member={m}
                                                onRemove={(id) => handleRemoveMember(selectedCluster.id, id)}
                                                onSubtypeChange={handleSubtypeChange}
                                                onResendCredentials={handleResendCredentials}
                                                cluster={selectedCluster}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                            <div className="px-5 py-3 border-t border-border bg-muted/20">
                                <p className="text-[11.5px] text-muted-foreground/60 flex items-center gap-1.5">
                                    <RiShieldCheckLine className="text-xs text-teal-600 dark:text-teal-400" />
                                    Credentials are emailed when members are added.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-border bg-muted/10
                            p-8 flex-col items-center justify-center text-center gap-3
                            hidden lg:flex">
                            <RiGroupLine className="text-3xl text-muted-foreground/25" />
                            <p className="text-[13.5px] font-semibold text-muted-foreground/60">
                                Select a cluster to manage its members
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}