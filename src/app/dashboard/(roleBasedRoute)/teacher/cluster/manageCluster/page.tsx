"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import Link from "next/link";
import {
    RiFlaskLine, RiGroupLine, RiMailLine, RiAddLine, RiCloseLine,
    RiCheckLine, RiMoreLine, RiDeleteBinLine,
    RiArrowRightLine, RiSparklingFill, RiCalendarCheckLine,
    RiTimeLine, RiRefreshLine, RiAlertLine, RiUserLine,
    RiShieldCheckLine, RiEditLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────
// FIX 2: Added "RUNNING" to match API subtype values
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
    // FIX 4: Made optional — API may not return these fields
    sessionCount?: number;
    healthScore?: number;
    status?: ClusterStatus;
    lastActivity?: string;
    createdAt: string;
    isDeleted: boolean;
}

// ─── Mock data (replace with real API calls) ───────────────
const MOCK_CLUSTERS: Cluster[] = [
    { id: "c1", name: "ML Research Group — 2025", slug: "ml-research-2025", description: "Weekly NLP and deep learning sessions.", batchTag: "Batch 2025", memberCount: 18, sessionCount: 12, healthScore: 94, status: "healthy", lastActivity: "2 hrs ago", createdAt: "2025-01-12", isDeleted: false },
    { id: "c2", name: "NLP Reading Circle", slug: "nlp-reading-circle", description: "Paper reading and discussion group.", batchTag: "Spring 25", memberCount: 11, sessionCount: 7, healthScore: 67, status: "at-risk", lastActivity: "3 days ago", createdAt: "2025-02-01", isDeleted: false },
    { id: "c3", name: "Bootcamp Cohort B", slug: "bootcamp-cohort-b", description: "Full-stack web development bootcamp.", batchTag: "Cohort B", memberCount: 42, sessionCount: 18, healthScore: 88, status: "healthy", lastActivity: "Yesterday", createdAt: "2025-01-05", isDeleted: false },
    { id: "c4", name: "Computer Vision Seminar", slug: "cv-seminar-2024", description: "Advanced CV and image processing.", batchTag: "2024", memberCount: 9, sessionCount: 4, healthScore: 31, status: "inactive", lastActivity: "2 weeks ago", createdAt: "2024-11-10", isDeleted: false },
];

// ─── Token maps ───────────────────────────────────────────
const HEALTH_BAR = (h: number) =>
    h >= 80 ? "bg-teal-500" : h >= 50 ? "bg-amber-400" : "bg-red-400";

const SUBTYPE_LABELS: Record<MemberSubtype, string> = {
    EMERGING: "Emerging",
    ACTIVE: "Active",
    GRADUATED: "Graduated",
    ALUMNI: "Alumni",
    // FIX 2: Added RUNNING label
    RUNNING: "Running",
};

// FIX 3: Added RUNNING color so the selector never crashes with undefined class
const SUBTYPE_COLORS: Record<MemberSubtype, string> = {
    EMERGING: "bg-sky-100/80 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 border-sky-200/70 dark:border-sky-800/50",
    ACTIVE: "bg-teal-100/80 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border-teal-200/70 dark:border-teal-800/50",
    GRADUATED: "bg-violet-100/80 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border-violet-200/70 dark:border-violet-800/50",
    ALUMNI: "bg-zinc-100/80 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-zinc-200/70 dark:border-zinc-700/50",
    RUNNING: "bg-orange-100/80 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 border-orange-200/70 dark:border-orange-800/50",
};

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
        // FIX: Pass cluster.id directly here — no ambiguity
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
    handleManageCluster,
}: {
    cluster: Cluster;
    onDelete: (id: string) => void;
    // FIX 6: Removed unused `onSelect` prop — both menu and footer now use handleManageCluster
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
                            {cluster.description && (
                                <p className="text-[12.5px] text-muted-foreground line-clamp-1">{cluster.description}</p>
                            )}
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
                                    {/* FIX 6: Menu "Manage members" now calls handleManageCluster
                                        so members are fetched — was calling onSelect(setSelectedCluster)
                                        which skipped the API fetch entirely */}
                                    <button
                                        onClick={() => { handleManageCluster(cluster); setMenuOpen(false); }}
                                        className="flex items-center gap-2.5 w-full px-4 py-2.5
                               text-[13px] text-foreground hover:bg-accent transition-colors">
                                        <RiEditLine className="text-muted-foreground text-base" /> Manage members
                                    </button>
                                    <button
                                        onClick={() => { /* TODO: navigate to sessions */ setMenuOpen(false); }}
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

                {/* FIX 4: Health bar only renders when healthScore is defined */}
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

                {/* Meta row */}
                <div className="flex items-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
                        <RiGroupLine className="text-xs" /> {cluster.memberCount} members
                    </span>
                    {/* FIX 4: Only show if present */}
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

            {/* Footer */}
            <div className="px-5 py-3 border-t border-border flex items-center justify-between">
                <span className="text-[11px] font-mono text-muted-foreground/50">/{cluster.slug}</span>
                <button
                    onClick={() => handleManageCluster(cluster)}
                    className="flex items-center gap-1 text-[12.5px] font-semibold
                     text-teal-600 dark:text-teal-400
                     hover:text-teal-700 dark:hover:text-teal-300 transition-colors">
                    Manage <RiArrowRightLine className="text-xs" />
                </button>
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
    // FIX 5: onRemove typed as (id: string) — clusterId is closed over in the parent
    onRemove: (id: string) => void;
    onSubtypeChange: (id: string, subtype: MemberSubtype) => void;
    onResendCredentials: (clusterId: string, memberId: string) => void;
    cluster: Cluster;
}) {
    // FIX 1: resending / resent state is now actually driven by async work
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

            {/* Subtype selector — FIX 3: RUNNING is now in SUBTYPE_COLORS so no crash */}
            <select
                value={member.subtype}
                onChange={e => onSubtypeChange(member.id, e.target.value as MemberSubtype)}
                className={cn(
                    "h-7 px-2 rounded-lg text-[11px] font-bold border cursor-pointer",
                    "focus:outline-none focus:ring-1 focus:ring-teal-400/40 transition-all",
                    "appearance-none bg-transparent",
                    SUBTYPE_COLORS[member.subtype]
                )}
            >
                {(Object.keys(SUBTYPE_LABELS) as MemberSubtype[]).map(s => (
                    <option key={s} value={s}>{SUBTYPE_LABELS[s]}</option>
                ))}
            </select>

            {/* Actions */}
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
                        : resent
                            ? <RiCheckLine className="text-xs" />
                            : <RiRefreshLine className="text-xs" />
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
    const [clusters, setClusters] = useState<Cluster[]>(MOCK_CLUSTERS);
    const [members, setMembers] = useState<Member[]>([]);
    const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
    const [search, setSearch] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<Cluster | null>(null);

    useEffect(() => {
        const fetchClusters = async () => {
            try {
                const res = await fetch(`/api/cluster`, {
                    method: "GET",
                    credentials: "include",
                });
                const data = await res.json();
                if (data.success) {
                    setClusters(data.data);
                }
            } catch (err) {
                console.error("Failed to fetch clusters:", err);
            }
        };
        fetchClusters();
    }, []);

    const handleManageCluster = async (cluster: Cluster) => {
        try {
            const res = await fetch(`/api/cluster/${cluster.id}`, {
                method: "GET",
                credentials: "include",
            });
            const data = await res.json();

            if (data.success) {
                const mapped: Member[] = data.data.members.map((m: any) => ({
                    id: m.userId,
                    name: m.user?.name ?? m.user?.email?.split("@")[0] ?? "Unknown",
                    email: m.user?.email ?? "",
                    subtype: m.subtype as MemberSubtype,
                    joinedAt: new Date(m.joinedAt).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                    }),
                }));

                setMembers(mapped);
                setSelectedCluster(cluster);
            }
        } catch (err) {
            console.error("Failed to fetch cluster:", err);
        }
    };

    // ── Cluster list actions ───────────────────────────────
    const handleDelete = (id: string) => {
        const c = clusters.find(c => c.id === id);
        if (c) setDeleteTarget(c);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        // TODO: await fetch(`/api/cluster/${deleteTarget.id}`, { method: "DELETE", credentials: "include" })
        setClusters(cs => cs.filter(c => c.id !== deleteTarget.id));
        if (selectedCluster?.id === deleteTarget.id) setSelectedCluster(null);
        setDeleteTarget(null);
    };

    // ── Member actions ─────────────────────────────────────
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
        } catch (err) {
            console.error("Failed to add member:", err);
            toast.error("Something went wrong", { position: "top-right" });
        }
    };

    // FIX 5: handler takes (id) only — clusterId is captured from selectedCluster in the JSX closure
    const handleRemoveMember = async (clusterId: string, id: string) => {
        try {
            const res = await fetch(`/api/cluster/${clusterId}/members/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
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
        } catch (err) {
            console.error("Failed to remove member:", err);
        }
    };

    const handleSubtypeChange = async (id: string, subtype: MemberSubtype) => {
        // TODO: persist via API
        setMembers(m => m.map(m => m.id === id ? { ...m, subtype } : m));
    };

    // FIX 1: now returns a Promise so MemberRow can await it and toggle resending/resent
    const handleResendCredentials = async (clusterId: string, memberId: string): Promise<void> => {
        // try {
        //     const res = await fetch(`/api/cluster/${clusterId}/members/${memberId}/resend-credentials`, {
        //         method: "POST",
        //         headers: { "Content-Type": "application/json" },
        //         credentials: "include",
        //     });
        //     const data = await res.json();

        //     console.log(data)

        //     if (data.success) {
        //         toast.success("New credentials sent", { position: "top-right" });
        //     } else {
        //         toast.error(data.message ?? "Failed to resend credentials", { position: "top-right" });
        //     }
        // } catch (err) {
        //     console.error("Failed to resend credentials:", err);
        //     toast.error("Something went wrong", { position: "top-right" });
        // }
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

            <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-6xl mx-auto w-full">

                {/* ── Page header ── */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="flex items-center gap-1.5 mb-1 text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">
                            <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
                            My Clusters
                        </h1>
                    </div>
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

                {/* ── Main grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

                    {/* Cluster list */}
                    <div className="flex flex-col gap-4">
                        {filtered.length === 0 ? (
                            <div className="rounded-2xl border border-border bg-card p-10
                              flex flex-col items-center text-center gap-3">
                                <RiFlaskLine className="text-3xl text-muted-foreground/30" />
                                <p className="text-[14px] font-semibold text-muted-foreground">
                                    {search ? "No clusters match your search" : "No clusters yet"}
                                </p>
                                {!search && (
                                    <Link
                                        href="/dashboard/clusters/create"
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
                                    // FIX 6: removed onSelect prop entirely
                                    onDelete={handleDelete}
                                    handleManageCluster={handleManageCluster}
                                />
                            ))
                        )}
                    </div>

                    {/* Member panel — shown when a cluster is selected */}
                    {selectedCluster ? (
                        <div className="rounded-2xl border border-border bg-card overflow-hidden
                            lg:sticky lg:top-20 h-fit">
                            {/* Panel header */}
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

                            {/* Add member */}
                            <div className="px-5 py-4 border-b border-border">
                                <p className="text-[12.5px] font-semibold text-foreground mb-2.5 flex items-center gap-1.5">
                                    <RiAddLine className="text-teal-600 dark:text-teal-400" /> Add member by email
                                </p>
                                <AddMemberInput onAdd={handleAddMember} cluster={selectedCluster} />
                            </div>

                            {/* Members list */}
                            <div>
                                <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
                                    <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">
                                        Members
                                    </span>
                                    <span className="text-[12px] font-semibold text-muted-foreground">
                                        {members.length}
                                    </span>
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
                                                // FIX 5: close over selectedCluster.id so MemberRow only gets (id)
                                                onRemove={(id) => handleRemoveMember(selectedCluster.id, id)}
                                                onSubtypeChange={handleSubtypeChange}
                                                onResendCredentials={handleResendCredentials}
                                                cluster={selectedCluster}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Panel footer */}
                            <div className="px-5 py-3 border-t border-border bg-muted/20">
                                <p className="text-[11.5px] text-muted-foreground/60 flex items-center gap-1.5">
                                    <RiShieldCheckLine className="text-xs text-teal-600 dark:text-teal-400" />
                                    Credentials are emailed when members are added. Use the resend button to re-send.
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