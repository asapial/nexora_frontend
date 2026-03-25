"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    RiCalendarCheckLine, RiTimeLine, RiMapPinLine, RiFileTextLine,
    RiGroupLine, RiFlaskLine, RiSparklingFill, RiAddLine,
    RiNotificationLine, RiAlertLine, RiArrowRightLine,
    RiSearchLine, RiFilterLine, RiMoreLine, RiCheckLine,
    RiEditLine, RiDeleteBinLine, RiPlayLine, RiPauseLine,
    RiEyeLine, RiCalendar2Line, RiListCheck2, RiBookOpenLine,
    RiVideoLine, RiStarLine, RiUserLine, RiClockwiseLine,
    RiArrowDownSLine, RiCloseLine, RiDraftLine, RiCheckboxCircleLine,
    RiRefreshLine, RiBarChartLine, RiThumbUpLine, RiChat3Line,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────
type SessionStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

interface AgendaItem {
    id: string;
    startTime: string;
    durationMins: number;
    topic: string;
    presenter?: string;
    order: number;
}

interface FeedbackSummary {
    averageRating: number;
    totalCount: number;
}

interface StudySession {
    id: string;
    clusterId: string;
    clusterName: string;
    clusterBatchTag: string;
    title: string;
    description?: string;
    scheduledAt: string;
    durationMins?: number;
    location?: string;
    taskDeadline?: string;
    templateId?: string;
    recordingUrl?: string;
    recordingNotes?: string;
    createdAt: string;
    memberCount: number;
    taskSubmittedCount: number;
    attendanceCount: number;
    feedback?: FeedbackSummary;
    agenda: AgendaItem[];
    status: SessionStatus;
}

// ─── Mock Data ────────────────────────────────────────────
const MOCK_SESSIONS: StudySession[] = [
    {
        id: "s1",
        clusterId: "c1",
        clusterName: "ML Research Group — 2025",
        clusterBatchTag: "Batch 2025",
        title: "Session 14 — Transformer Architectures Deep Dive",
        description: "We'll explore the internals of transformer models, attention heads, and positional encodings. Bring your questions.",
        scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        durationMins: 90,
        location: "Room 204, Lab Building",
        taskDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        memberCount: 18,
        taskSubmittedCount: 0,
        attendanceCount: 0,
        createdAt: new Date().toISOString(),
        agenda: [
            { id: "a1", startTime: "10:00", durationMins: 15, topic: "Recap of last session", presenter: "Dr. Ahmed", order: 0 },
            { id: "a2", startTime: "10:15", durationMins: 40, topic: "Transformer internals walkthrough", presenter: "Dr. Ahmed", order: 1 },
            { id: "a3", startTime: "10:55", durationMins: 20, topic: "Group discussion", order: 2 },
            { id: "a4", startTime: "11:15", durationMins: 15, topic: "Q&A + wrap-up", order: 3 },
        ],
        status: "upcoming",
    },
    {
        id: "s2",
        clusterId: "c1",
        clusterName: "ML Research Group — 2025",
        clusterBatchTag: "Batch 2025",
        title: "Session 13 — Attention Mechanisms",
        description: "Detailed look at self-attention, cross-attention, and multi-head attention with live coding.",
        scheduledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        durationMins: 90,
        location: "Room 204, Lab Building",
        taskDeadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        recordingUrl: "https://zoom.us/rec/share/example",
        memberCount: 18,
        taskSubmittedCount: 12,
        attendanceCount: 15,
        createdAt: new Date().toISOString(),
        feedback: { averageRating: 4.3, totalCount: 11 },
        agenda: [],
        status: "completed",
    },
    {
        id: "s3",
        clusterId: "c2",
        clusterName: "NLP Reading Circle",
        clusterBatchTag: "Spring 25",
        title: "Paper Review — Chain of Thought Prompting",
        description: "Review and discussion of Wei et al. 2022 CoT paper.",
        scheduledAt: new Date(Date.now() + 0.5 * 24 * 60 * 60 * 1000).toISOString(),
        durationMins: 60,
        location: "Zoom",
        memberCount: 11,
        taskSubmittedCount: 3,
        attendanceCount: 0,
        createdAt: new Date().toISOString(),
        agenda: [],
        status: "upcoming",
    },
    {
        id: "s4",
        clusterId: "c3",
        clusterName: "Bootcamp Cohort B",
        clusterBatchTag: "Cohort B",
        title: "Sprint 4 Writeup & Review",
        scheduledAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        durationMins: 120,
        location: "Auditorium A",
        taskDeadline: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        memberCount: 42,
        taskSubmittedCount: 38,
        attendanceCount: 40,
        createdAt: new Date().toISOString(),
        feedback: { averageRating: 4.7, totalCount: 35 },
        recordingUrl: "https://drive.google.com/example",
        agenda: [],
        status: "completed",
    },
    {
        id: "s5",
        clusterId: "c2",
        clusterName: "NLP Reading Circle",
        clusterBatchTag: "Spring 25",
        title: "Paper Review — RLHF in Large Language Models",
        scheduledAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        durationMins: 75,
        memberCount: 11,
        taskSubmittedCount: 9,
        attendanceCount: 10,
        createdAt: new Date().toISOString(),
        feedback: { averageRating: 3.9, totalCount: 8 },
        agenda: [],
        status: "completed",
    },
];

// ─── Status config ────────────────────────────────────────
const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string; dot: string }> = {
    upcoming: {
        label: "Upcoming",
        color: "text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/30 border-blue-200/60 dark:border-blue-800/50",
        dot: "bg-blue-500",
    },
    ongoing: {
        label: "Ongoing",
        color: "text-teal-600 dark:text-teal-400 bg-teal-50/60 dark:bg-teal-950/30 border-teal-200/60 dark:border-teal-800/50",
        dot: "bg-teal-500 animate-pulse",
    },
    completed: {
        label: "Completed",
        color: "text-muted-foreground bg-muted/40 border-border",
        dot: "bg-muted-foreground/40",
    },
    cancelled: {
        label: "Cancelled",
        color: "text-red-600 dark:text-red-400 bg-red-50/40 dark:bg-red-950/20 border-red-200/60 dark:border-red-800/50",
        dot: "bg-red-500",
    },
};

// ─── Helpers ──────────────────────────────────────────────
function formatDate(d: string) {
    try {
        return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    } catch { return d; }
}

function formatTime(d: string) {
    try {
        return new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
}

function formatRelative(d: string) {
    const diff = new Date(d).getTime() - Date.now();
    const abs = Math.abs(diff);
    const mins = Math.floor(abs / 60000);
    const hours = Math.floor(abs / 3600000);
    const days = Math.floor(abs / 86400000);
    const past = diff < 0;
    if (days > 0) return past ? `${days}d ago` : `in ${days}d`;
    if (hours > 0) return past ? `${hours}h ago` : `in ${hours}h`;
    return past ? `${mins}m ago` : `in ${mins}m`;
}

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
                <RiStarLine
                    key={s}
                    className={cn(
                        "text-xs",
                        s <= Math.round(rating) ? "text-amber-400" : "text-muted-foreground/20"
                    )}
                />
            ))}
        </div>
    );
}

// ─── Status Badge ─────────────────────────────────────────
function StatusBadge({ status }: { status: SessionStatus }) {
    const cfg = STATUS_CONFIG[status];
    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide border",
            cfg.color
        )}>
            <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", cfg.dot)} />
            {cfg.label}
        </span>
    );
}

// ─── Stat Chip ────────────────────────────────────────────
function StatChip({ icon, label, value, muted }: {
    icon: React.ReactNode; label: string; value: string | number; muted?: boolean;
}) {
    return (
        <div className="flex items-center gap-1.5">
            <span className={cn("text-xs flex-shrink-0", muted ? "text-muted-foreground/40" : "text-teal-600 dark:text-teal-400")}>
                {icon}
            </span>
            <span className="text-[12px] text-muted-foreground">{label}</span>
            <span className={cn("text-[12px] font-bold", muted ? "text-muted-foreground/60" : "text-foreground")}>{value}</span>
        </div>
    );
}

// ─── Dropdown menu ────────────────────────────────────────
function ActionMenu({ session, onEdit, onDelete, onCancel }: {
    session: StudySession;
    onEdit: () => void;
    onDelete: () => void;
    onCancel: () => void;
}) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button
                onClick={e => { e.stopPropagation(); setOpen(p => !p); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center
                   text-muted-foreground hover:text-foreground
                   hover:bg-muted/60 transition-all text-base"
            >
                <RiMoreLine />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-9 z-20 w-48 rounded-xl border border-border
                          bg-card shadow-lg shadow-black/10 dark:shadow-black/30 overflow-hidden">
                        <button
                            onClick={() => { setOpen(false); onEdit(); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5
                         text-[13px] font-medium text-foreground hover:bg-muted/50 transition-colors"
                        >
                            <RiEditLine className="text-sm text-muted-foreground" /> Edit session
                        </button>
                        {session.status === "upcoming" && (
                            <button
                                onClick={() => { setOpen(false); onCancel(); }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5
                           text-[13px] font-medium text-amber-600 dark:text-amber-400
                           hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors"
                            >
                                <RiCloseLine className="text-sm" /> Cancel session
                            </button>
                        )}
                        <div className="border-t border-border" />
                        <button
                            onClick={() => { setOpen(false); onDelete(); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5
                         text-[13px] font-medium text-red-600 dark:text-red-400
                         hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors"
                        >
                            <RiDeleteBinLine className="text-sm" /> Delete session
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Edit Session Modal ───────────────────────────────────
function EditSessionModal({
    session, onClose, onSave,
}: {
    session: StudySession;
    onClose: () => void;
    onSave: (updated: Partial<StudySession>) => void;
}) {
    const toDateInput = (iso: string) => iso ? iso.split("T")[0] : "";
    const toTimeInput = (iso: string) => {
        if (!iso) return "";
        try { return new Date(iso).toTimeString().slice(0, 5); } catch { return ""; }
    };

    const [title, setTitle] = useState(session.title);
    const [description, setDescription] = useState(session.description ?? "");
    const [date, setDate] = useState(toDateInput(session.scheduledAt));
    const [time, setTime] = useState(toTimeInput(session.scheduledAt));
    const [durationMins, setDurationMins] = useState(String(session.durationMins ?? ""));
    const [location, setLocation] = useState(session.location ?? "");
    const [deadlineDate, setDeadlineDate] = useState(toDateInput(session.taskDeadline ?? ""));
    const [deadlineTime, setDeadlineTime] = useState(toTimeInput(session.taskDeadline ?? ""));
    const [recordingUrl, setRecordingUrl] = useState(session.recordingUrl ?? "");
    const [recordingNotes, setRecordingNotes] = useState(session.recordingNotes ?? "");
    const [error, setError] = useState("");

    const handleSave = () => {
        if (!title.trim()) { setError("Title is required"); return; }
        if (!date || !time) { setError("Date and time are required"); return; }
        const scheduledAt = new Date(`${date}T${time}`).toISOString();
        const taskDeadline = deadlineDate && deadlineTime
            ? new Date(`${deadlineDate}T${deadlineTime}`).toISOString()
            : undefined;
        onSave({
            title: title.trim(),
            description: description.trim() || undefined,
            scheduledAt,
            durationMins: durationMins ? parseInt(durationMins) : undefined,
            location: location.trim() || undefined,
            taskDeadline,
            recordingUrl: recordingUrl.trim() || undefined,
            recordingNotes: recordingNotes.trim() || undefined,
        });
        onClose();
    };

    const inputCls = "w-full h-10 px-3.5 rounded-xl text-[13px] font-medium bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all";
    const labelCls = "text-[12px] font-bold text-muted-foreground";

    return (
        <>
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
                <div className="pointer-events-auto w-full max-w-lg max-h-[90vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                    <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-teal-100/70 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/50 text-teal-600 dark:text-teal-400 text-sm">
                                <RiEditLine />
                            </div>
                            <h3 className="text-[14px] font-extrabold text-foreground">Edit Session</h3>
                        </div>
                        <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all">
                            <RiCloseLine />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
                        {error && (
                            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/50">
                                <RiAlertLine className="text-red-500 text-sm flex-shrink-0" />
                                <p className="text-[12.5px] font-medium text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        <div className="flex flex-col gap-1.5">
                            <label className={labelCls}>Title <span className="text-red-500">*</span></label>
                            <input className={inputCls} value={title} onChange={e => { setTitle(e.target.value); setError(""); }} placeholder="Session title" />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className={labelCls}>Description</label>
                            <textarea
                                rows={3}
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="What will be covered?"
                                className="w-full px-3.5 py-2.5 rounded-xl text-[13px] font-medium bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all resize-none leading-relaxed"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="flex flex-col gap-1.5 col-span-1">
                                <label className={labelCls}>Date <span className="text-red-500">*</span></label>
                                <input type="date" className={inputCls} value={date} onChange={e => { setDate(e.target.value); setError(""); }} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className={labelCls}>Time <span className="text-red-500">*</span></label>
                                <input type="time" className={inputCls} value={time} onChange={e => { setTime(e.target.value); setError(""); }} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className={labelCls}>Duration (min)</label>
                                <input type="number" className={inputCls} value={durationMins} onChange={e => setDurationMins(e.target.value)} placeholder="90" min="15" step="15" />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className={labelCls}>Location</label>
                            <input className={inputCls} value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Room 204 or Zoom link" />
                        </div>

                        <div className="border-t border-border pt-4 flex flex-col gap-3">
                            <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide">Task deadline</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <label className={labelCls}>Date</label>
                                    <input type="date" className={inputCls} value={deadlineDate} onChange={e => setDeadlineDate(e.target.value)} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className={labelCls}>Time</label>
                                    <input type="time" className={inputCls} value={deadlineTime} onChange={e => setDeadlineTime(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-border pt-4 flex flex-col gap-3">
                            <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide">Recording</p>
                            <div className="flex flex-col gap-1.5">
                                <label className={labelCls}>Recording URL</label>
                                <input className={inputCls} value={recordingUrl} onChange={e => setRecordingUrl(e.target.value)} placeholder="https://zoom.us/rec/..." />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className={labelCls}>Recording notes</label>
                                <input className={inputCls} value={recordingNotes} onChange={e => setRecordingNotes(e.target.value)} placeholder="e.g. Starts at 3:20" />
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 border-t border-border flex items-center gap-3 flex-shrink-0">
                        <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
                            Cancel
                        </button>
                        <button onClick={handleSave} className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2 bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 text-white text-[13px] font-bold transition-all">
                            <RiCheckLine className="text-sm" /> Save changes
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

// ─── Add Agenda Modal ─────────────────────────────────────
function AddAgendaModal({
    onClose, onAdd, existingCount,
}: {
    onClose: () => void;
    onAdd: (item: Omit<AgendaItem, "id">) => void;
    existingCount: number;
}) {
    const [topic, setTopic] = useState("");
    const [startTime, setStartTime] = useState("");
    const [durationMins, setDurationMins] = useState("30");
    const [presenter, setPresenter] = useState("");
    const [error, setError] = useState("");

    const inputCls = "w-full h-10 px-3.5 rounded-xl text-[13px] font-medium bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all";
    const labelCls = "text-[12px] font-bold text-muted-foreground";

    const handleAdd = () => {
        if (!topic.trim()) { setError("Topic is required"); return; }
        if (!startTime) { setError("Start time is required"); return; }
        onAdd({
            startTime,
            durationMins: parseInt(durationMins) || 30,
            topic: topic.trim(),
            presenter: presenter.trim() || undefined,
            order: existingCount,
        });
        onClose();
    };

    return (
        <>
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
                <div className="pointer-events-auto w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-teal-100/70 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/50 text-teal-600 dark:text-teal-400 text-sm">
                                <RiListCheck2 />
                            </div>
                            <h3 className="text-[14px] font-extrabold text-foreground">Add agenda item</h3>
                        </div>
                        <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all">
                            <RiCloseLine />
                        </button>
                    </div>

                    <div className="px-5 py-5 flex flex-col gap-4">
                        {error && (
                            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/50">
                                <RiAlertLine className="text-red-500 text-sm flex-shrink-0" />
                                <p className="text-[12.5px] font-medium text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}
                        <div className="flex flex-col gap-1.5">
                            <label className={labelCls}>Topic <span className="text-red-500">*</span></label>
                            <input className={inputCls} value={topic} onChange={e => { setTopic(e.target.value); setError(""); }} placeholder="e.g. Group discussion" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label className={labelCls}>Start time <span className="text-red-500">*</span></label>
                                <input type="time" className={inputCls} value={startTime} onChange={e => { setStartTime(e.target.value); setError(""); }} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className={labelCls}>Duration (min)</label>
                                <input type="number" className={inputCls} value={durationMins} onChange={e => setDurationMins(e.target.value)} min="5" step="5" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className={labelCls}>Presenter <span className="text-[11px] font-normal text-muted-foreground/60">(optional)</span></label>
                            <input className={inputCls} value={presenter} onChange={e => setPresenter(e.target.value)} placeholder="e.g. Dr. Ahmed" />
                        </div>
                    </div>

                    <div className="px-5 pb-5 flex items-center gap-3">
                        <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
                            Cancel
                        </button>
                        <button onClick={handleAdd} className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2 bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 text-white text-[13px] font-bold transition-all">
                            <RiAddLine className="text-sm" /> Add item
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

// ─── Session Detail Drawer ────────────────────────────────
function SessionDrawer({
    session,
    onClose,
    onUpdateSession,
    onAgendaAdd,    // ✅ dedicated callback — does NOT fire PATCH
    onAgendaDelete, // ✅ dedicated callback — does NOT fire PATCH
}: {
    session: StudySession;
    onClose: () => void;
    onUpdateSession: (id: string, updates: Partial<StudySession>) => void;
    onAgendaAdd: (sessionId: string, item: AgendaItem) => void;
    onAgendaDelete: (sessionId: string, agendaId: string) => void;
}) {
    const [activeTab, setActiveTab] = useState<"overview" | "agenda" | "tasks" | "feedback">("overview");
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAddAgenda, setShowAddAgenda] = useState(false);

    const tabs = [
        { id: "overview", label: "Overview", icon: <RiEyeLine /> },
        { id: "agenda", label: "Agenda", icon: <RiListCheck2 /> },
        { id: "tasks", label: "Tasks", icon: <RiFileTextLine /> },
        { id: "feedback", label: "Feedback", icon: <RiThumbUpLine /> },
    ] as const;

    const submissionRate = session.memberCount
        ? Math.round((session.taskSubmittedCount / session.memberCount) * 100)
        : 0;
    const attendanceRate = session.memberCount
        ? Math.round((session.attendanceCount / session.memberCount) * 100)
        : 0;

        
    const handleAddAgendaItem = async (item: Omit<AgendaItem, "id">) => {
        const { order, ...blockPayload } = item;

        try {
            const res = await fetch(`/api/sessions/${session.id}/agenda`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ blocks: [blockPayload] }),
                credentials: "include",
            });
            const data = await res.json();

            if (data.success) {
                toast.success("Agenda item added successfully", { position: "top-right" });
                const newItem: AgendaItem = { ...item, id: `a-${Date.now()}` };
                onAgendaAdd(session.id, newItem); 
            } else {
                toast.error(data.message ?? "Failed to add agenda item");
            }
        } catch (err) {
            console.error("Failed to add agenda item:", err);
            toast.error("Network error — please try again");
        }
    };

    // ✅ Fix 4: call onAgendaDelete instead of onUpdateSession (no PATCH fired)
    const handleDeleteAgendaItem = (agendaId: string) => {
        onAgendaDelete(session.id, agendaId);
    };

    return (
        <>
            {showEditModal && (
                <EditSessionModal
                    session={session}
                    onClose={() => setShowEditModal(false)}
                    onSave={(updates) => onUpdateSession(session.id, updates)}
                />
            )}

            {showAddAgenda && (
                <AddAgendaModal
                    onClose={() => setShowAddAgenda(false)}
                    onAdd={handleAddAgendaItem}
                    existingCount={session.agenda.length}
                />
            )}

            <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-none">
                <div className="pointer-events-auto w-full max-w-xl max-h-[90vh]
                      bg-card border border-border rounded-2xl shadow-2xl shadow-black/20
                      flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-border flex items-start justify-between gap-4 flex-shrink-0">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                                <StatusBadge status={session.status} />
                                <span className="text-[11px] text-muted-foreground font-medium">
                                    {session.clusterBatchTag}
                                </span>
                            </div>
                            <h2 className="text-[15px] font-extrabold text-foreground leading-snug">{session.title}</h2>
                            <p className="text-[12.5px] text-muted-foreground flex items-center gap-1.5 mt-1">
                                <RiFlaskLine className="text-xs text-teal-600 dark:text-teal-400" />
                                {session.clusterName}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center
                       text-muted-foreground hover:text-foreground hover:bg-muted/60
                       transition-all flex-shrink-0"
                        >
                            <RiCloseLine />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-0.5 px-5 pt-3 pb-0 border-b border-border flex-shrink-0">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-[12.5px] font-semibold",
                                    "transition-all duration-150 -mb-px",
                                    activeTab === tab.id
                                        ? "text-teal-600 dark:text-teal-400 border-b-2 border-teal-500"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <span className="text-xs">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab content */}
                    <div className="flex-1 overflow-y-auto px-6 py-5">

                        {/* ── Overview tab ── */}
                        {activeTab === "overview" && (
                            <div className="flex flex-col gap-5">
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { icon: <RiCalendarCheckLine />, label: "Date", value: formatDate(session.scheduledAt) },
                                        { icon: <RiTimeLine />, label: "Time", value: formatTime(session.scheduledAt) },
                                        { icon: <RiClockwiseLine />, label: "Duration", value: session.durationMins ? `${session.durationMins} min` : "—" },
                                        { icon: <RiMapPinLine />, label: "Location", value: session.location || "—" },
                                    ].map((item, i) => (
                                        <div key={i} className="flex flex-col gap-1 px-4 py-3 rounded-xl bg-muted/30 border border-border">
                                            <div className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 text-sm">
                                                {item.icon}
                                                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                                                    {item.label}
                                                </span>
                                            </div>
                                            <p className="text-[13px] font-bold text-foreground truncate">{item.value}</p>
                                        </div>
                                    ))}
                                </div>

                                {session.description && (
                                    <div className="flex flex-col gap-1.5">
                                        <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide">Description</p>
                                        <p className="text-[13.5px] text-foreground/80 leading-relaxed">{session.description}</p>
                                    </div>
                                )}

                                {session.taskDeadline && (
                                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl
                                bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/50">
                                        <RiTimeLine className="text-amber-600 dark:text-amber-400 text-base flex-shrink-0" />
                                        <div>
                                            <p className="text-[12px] font-bold text-amber-700 dark:text-amber-400">Task deadline</p>
                                            <p className="text-[12.5px] text-muted-foreground">
                                                {formatDate(session.taskDeadline)} at {formatTime(session.taskDeadline)}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {session.recordingUrl && (
                                    <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl
                                bg-teal-50/40 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-800/50">
                                        <RiVideoLine className="text-teal-600 dark:text-teal-400 text-base flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[12px] font-bold text-teal-700 dark:text-teal-300">Recording available</p>
                                            {session.recordingNotes && (
                                                <p className="text-[12px] text-muted-foreground truncate">{session.recordingNotes}</p>
                                            )}
                                        </div>
                                        <a
                                            href={session.recordingUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-1.5 h-8 px-3 rounded-lg
                               bg-teal-600 dark:bg-teal-500 text-white
                               text-[12px] font-bold hover:bg-teal-700 dark:hover:bg-teal-600
                               transition-colors flex-shrink-0"
                                        >
                                            <RiPlayLine className="text-xs" /> Watch
                                        </a>
                                    </div>
                                )}

                                <div className="flex flex-col gap-2">
                                    <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide">Stats</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { label: "Members", value: session.memberCount, icon: <RiGroupLine /> },
                                            { label: "Attended", value: `${session.attendanceCount}/${session.memberCount}`, icon: <RiCheckLine /> },
                                            { label: "Submitted", value: `${session.taskSubmittedCount}/${session.memberCount}`, icon: <RiFileTextLine /> },
                                        ].map((s, i) => (
                                            <div key={i} className="flex flex-col gap-1.5 px-3 py-2.5 rounded-xl
                                            bg-muted/30 border border-border text-center">
                                                <span className="text-teal-600 dark:text-teal-400 text-base mx-auto">{s.icon}</span>
                                                <p className="text-[14px] font-extrabold text-foreground">{s.value}</p>
                                                <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {session.status === "completed" && (
                                        <div className="flex flex-col gap-3 mt-1">
                                            <ProgressBar label="Attendance rate" value={attendanceRate} color="teal" />
                                            <ProgressBar label="Submission rate" value={submissionRate} color="amber" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── Agenda tab ── */}
                        {activeTab === "agenda" && (
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-[13px] font-bold text-foreground">
                                        {session.agenda.length} agenda item{session.agenda.length !== 1 ? "s" : ""}
                                    </p>
                                    <button
                                        onClick={() => setShowAddAgenda(true)}
                                        className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border
                             text-[12px] font-semibold text-muted-foreground
                             hover:text-foreground hover:bg-muted/50 transition-all"
                                    >
                                        <RiAddLine className="text-xs" /> Add item
                                    </button>
                                </div>

                                {session.agenda.length === 0 ? (
                                    <EmptyState icon={<RiListCheck2 />} message="No agenda items yet" sub="Add items to structure your session timeline." />
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {[...session.agenda]
                                            .sort((a, b) => a.order - b.order)
                                            .map((item, i) => (
                                                <div key={item.id} className="group flex items-start gap-3 px-4 py-3.5 rounded-xl
                                                     bg-muted/30 border border-border hover:border-teal-200/60 dark:hover:border-teal-800/50 transition-colors">
                                                    <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center
                                        bg-teal-100/70 dark:bg-teal-950/50
                                        border border-teal-200/60 dark:border-teal-800/50
                                        text-teal-600 dark:text-teal-400 text-[10px] font-bold">
                                                        {i + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[13px] font-bold text-foreground">{item.topic}</p>
                                                        <div className="flex items-center gap-3 mt-0.5">
                                                            <span className="text-[11.5px] text-muted-foreground flex items-center gap-1">
                                                                <RiTimeLine className="text-xs" /> {item.startTime} · {item.durationMins} min
                                                            </span>
                                                            {item.presenter && (
                                                                <span className="text-[11.5px] text-muted-foreground flex items-center gap-1">
                                                                    <RiUserLine className="text-xs" /> {item.presenter}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteAgendaItem(item.id)}
                                                        className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center
                                     text-muted-foreground/50 hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/20
                                     transition-all flex-shrink-0"
                                                    >
                                                        <RiDeleteBinLine className="text-xs" />
                                                    </button>
                                                </div>
                                            ))}
                                    </div>
                                )}

                                <button
                                    onClick={() => setShowAddAgenda(true)}
                                    className="flex items-center justify-center gap-2 h-10 rounded-xl border border-dashed
                           border-teal-300/60 dark:border-teal-700/50
                           text-[13px] font-semibold text-teal-600 dark:text-teal-400
                           hover:bg-teal-50/30 dark:hover:bg-teal-950/20 transition-all"
                                >
                                    <RiAddLine /> Add agenda item
                                </button>
                            </div>
                        )}

                        {/* ── Tasks tab ── */}
                        {activeTab === "tasks" && (
                            <div className="flex flex-col gap-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="px-4 py-3 rounded-xl bg-muted/30 border border-border">
                                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Total tasks</p>
                                        <p className="text-[20px] font-extrabold text-foreground">{session.memberCount}</p>
                                    </div>
                                    <div className="px-4 py-3 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-800/50">
                                        <p className="text-[11px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wide mb-1">Submitted</p>
                                        <p className="text-[20px] font-extrabold text-teal-700 dark:text-teal-300">
                                            {session.taskSubmittedCount}
                                        </p>
                                    </div>
                                </div>
                                <ProgressBar
                                    label="Submission progress"
                                    value={session.memberCount ? Math.round((session.taskSubmittedCount / session.memberCount) * 100) : 0}
                                    color="teal"
                                />
                                <div className="flex items-center justify-between pt-2">
                                    <p className="text-[13px] font-bold text-foreground">Pending submissions</p>
                                    <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border
                                   text-[12px] font-semibold text-muted-foreground
                                   hover:text-foreground hover:bg-muted/50 transition-all">
                                        <RiNotificationLine className="text-xs" /> Remind all
                                    </button>
                                </div>
                                <EmptyState icon={<RiFileTextLine />} message="Task list coming soon" sub="Individual task tracking will appear here." />
                            </div>
                        )}

                        {/* ── Feedback tab ── */}
                        {activeTab === "feedback" && (
                            <div className="flex flex-col gap-4">
                                {session.feedback ? (
                                    <>
                                        <div className="flex items-center gap-4 px-5 py-5 rounded-2xl bg-muted/30 border border-border">
                                            <div className="text-center">
                                                <p className="text-[32px] font-extrabold text-foreground leading-none">
                                                    {session.feedback.averageRating.toFixed(1)}
                                                </p>
                                                <StarRating rating={session.feedback.averageRating} />
                                                <p className="text-[11px] text-muted-foreground mt-1">
                                                    {session.feedback.totalCount} responses
                                                </p>
                                            </div>
                                            <div className="flex-1 flex flex-col gap-1.5">
                                                {[5, 4, 3, 2, 1].map(star => {
                                                    const pct = star === 5 ? 50 : star === 4 ? 30 : star === 3 ? 10 : 5;
                                                    return (
                                                        <div key={star} className="flex items-center gap-2">
                                                            <span className="text-[11px] text-muted-foreground w-3">{star}</span>
                                                            <div className="flex-1 h-1.5 rounded-full bg-muted/50">
                                                                <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <EmptyState icon={<RiChat3Line />} message="Individual comments hidden" sub="Per-member feedback is private. Summary shown above." />
                                    </>
                                ) : (
                                    <EmptyState
                                        icon={<RiStarLine />}
                                        message="No feedback yet"
                                        sub={session.status === "upcoming"
                                            ? "Feedback will appear after the session."
                                            : "No members have submitted feedback yet."}
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    {/* Drawer footer */}
                    <div className="px-6 py-4 border-t border-border flex items-center gap-3 flex-shrink-0">
                        <button
                            onClick={onClose}
                            className="flex-1 h-10 rounded-xl border border-border
                       text-[13.5px] font-semibold text-muted-foreground
                       hover:text-foreground hover:bg-muted/50 transition-all"
                        >
                            Close
                        </button>
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2
                       bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600
                       text-white text-[13.5px] font-bold transition-all"
                        >
                            <RiEditLine className="text-sm" /> Edit session
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

// ─── Progress bar ─────────────────────────────────────────
function ProgressBar({ label, value, color }: { label: string; value: number; color: "teal" | "amber" }) {
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
                <p className="text-[12px] text-muted-foreground">{label}</p>
                <p className={cn("text-[12px] font-bold",
                    color === "teal" ? "text-teal-600 dark:text-teal-400" : "text-amber-600 dark:text-amber-400"
                )}>{value}%</p>
            </div>
            <div className="h-1.5 rounded-full bg-muted/50">
                <div
                    className={cn(
                        "h-full rounded-full transition-all duration-500",
                        color === "teal" ? "bg-teal-500" : "bg-amber-400"
                    )}
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );
}

// ─── Empty state ──────────────────────────────────────────
function EmptyState({ icon, message, sub }: { icon: React.ReactNode; message: string; sub?: string }) {
    return (
        <div className="flex flex-col items-center text-center gap-2 py-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center
                      bg-muted/40 border border-border text-muted-foreground/40 text-lg">
                {icon}
            </div>
            <p className="text-[13.5px] font-bold text-muted-foreground">{message}</p>
            {sub && <p className="text-[12px] text-muted-foreground/60 max-w-xs">{sub}</p>}
        </div>
    );
}

// ─── Session Card ─────────────────────────────────────────
function SessionCard({
    session, onClick, onEdit, onDelete, onCancel,
}: {
    session: StudySession;
    onClick: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onCancel: () => void;
}) {
    const submissionRate = session.memberCount
        ? Math.round((session.taskSubmittedCount / session.memberCount) * 100)
        : 0;

    return (
        <div
            onClick={onClick}
            className={cn(
                "group rounded-2xl border border-border bg-card overflow-hidden",
                "hover:border-teal-300/50 dark:hover:border-teal-700/40",
                "hover:shadow-md hover:shadow-teal-600/5",
                "transition-all duration-200 cursor-pointer"
            )}
        >
            {session.status === "upcoming" && (
                <div className="h-0.5 w-full bg-gradient-to-r from-teal-500/60 via-teal-400/40 to-transparent" />
            )}
            {session.status === "ongoing" && (
                <div className="h-0.5 w-full bg-gradient-to-r from-teal-400 via-teal-300 to-transparent animate-pulse" />
            )}

            <div className="px-5 py-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <StatusBadge status={session.status} />
                        <span className="text-[11px] text-muted-foreground/60 font-medium truncate hidden sm:block">
                            {session.clusterName}
                        </span>
                    </div>
                    <ActionMenu session={session} onEdit={onEdit} onDelete={onDelete} onCancel={onCancel} />
                </div>

                <div>
                    <h3 className="text-[14px] font-extrabold text-foreground leading-snug
                         group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors duration-150">
                        {session.title}
                    </h3>
                    {session.description && (
                        <p className="text-[12.5px] text-muted-foreground mt-0.5 line-clamp-1">{session.description}</p>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                        <RiCalendarCheckLine className="text-xs text-teal-600 dark:text-teal-400" />
                        {formatDate(session.scheduledAt)} · {formatTime(session.scheduledAt)}
                    </span>
                    {session.durationMins && (
                        <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                            <RiTimeLine className="text-xs text-teal-600 dark:text-teal-400" />
                            {session.durationMins} min
                        </span>
                    )}
                    {session.location && (
                        <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                            <RiMapPinLine className="text-xs text-teal-600 dark:text-teal-400" />
                            {session.location}
                        </span>
                    )}
                </div>

                <div className="border-t border-border/60" />

                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-wrap">
                        <StatChip icon={<RiGroupLine />} label="Members" value={session.memberCount} />
                        {session.status !== "upcoming" && (
                            <StatChip icon={<RiCheckboxCircleLine />} label="Attended" value={`${session.attendanceCount}/${session.memberCount}`} />
                        )}
                        <StatChip icon={<RiFileTextLine />} label="Submitted" value={`${session.taskSubmittedCount}/${session.memberCount}`} />
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {session.feedback && (
                            <div className="flex items-center gap-1">
                                <RiStarLine className="text-xs text-amber-400" />
                                <span className="text-[12px] font-bold text-foreground">
                                    {session.feedback.averageRating.toFixed(1)}
                                </span>
                            </div>
                        )}
                        <span className="text-[11.5px] text-muted-foreground/60 font-medium">
                            {formatRelative(session.scheduledAt)}
                        </span>
                    </div>
                </div>

                {session.status === "completed" && (
                    <div className="h-1 rounded-full bg-muted/40 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-teal-500/60 transition-all duration-500"
                            style={{ width: `${submissionRate}%` }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────
export default function ManageSessionsPage() {
    const router = useRouter();

    const [sessions, setSessions] = useState<StudySession[]>(MOCK_SESSIONS);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<SessionStatus | "all">("all");
    const [filterCluster, setFilterCluster] = useState("all");
    const [selectedSession, setSelectedSession] = useState<StudySession | null>(null);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const res = await fetch(`/api/sessions`, {
                    method: "GET",
                    credentials: "include",
                });
                const data = await res.json();
                if (data.success) {
                    setSessions(data.data);
                }
            } catch (err) {
                console.error("Failed to fetch sessions:", err);
            }
        };
        fetchSessions();
    }, []);

    const clusters = Array.from(new Set(sessions.map(s => s.clusterName))).map(name => ({
        name,
        id: sessions.find(s => s.clusterName === name)!.clusterId,
    }));

    const filtered = sessions.filter(s => {
        const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === "all" || s.status === filterStatus;
        const matchCluster = filterCluster === "all" || s.clusterId === filterCluster;
        return matchSearch && matchStatus && matchCluster;
    });

    const grouped = {
        ongoing: filtered.filter(s => s.status === "ongoing"),
        upcoming: filtered.filter(s => s.status === "upcoming").sort(
            (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
        ),
        completed: filtered.filter(s => s.status === "completed").sort(
            (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
        ),
        cancelled: filtered.filter(s => s.status === "cancelled"),
    };

    const totalSessions = sessions.length;
    const completedCount = sessions.filter(s => s.status === "completed").length;
    const avgRating = (() => {
        const rated = sessions.filter(s => s.feedback);
        if (!rated.length) return null;
        return (rated.reduce((acc, s) => acc + s.feedback!.averageRating, 0) / rated.length).toFixed(1);
    })();
    const totalMembers = sessions.reduce((acc, s) => acc + s.memberCount, 0);


    const handleUpdateSession = async (id: string, updates: Partial<StudySession>) => {
        try {
            const res = await fetch(`/api/sessions/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
                credentials: "include",
            });
            const data = await res.json();

            if (data.success) {
                toast.success("Session updated successfully", { position: "top-right" });
                setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
                setSelectedSession(prev => prev?.id === id ? { ...prev, ...updates } : prev);
            } else {
                toast.error(data.message ?? "Failed to update session");
            }
        } catch (err) {
            console.error("Failed to update session:", err);
            toast.error("Network error — please try again");
        }
    };

    const handleAgendaAdd = (sessionId: string, item: AgendaItem) => {
        setSessions(prev =>
            prev.map(s =>
                s.id === sessionId
                    ? { ...s, agenda: [...s.agenda, item] }
                    : s
            )
        );
        setSelectedSession(prev =>
            prev?.id === sessionId
                ? { ...prev, agenda: [...prev.agenda, item] }
                : prev
        );
    };

    // ✅ Agenda delete — updates local state only (no API call yet — add one here if needed)
    const handleAgendaDelete = (sessionId: string, agendaId: string) => {

        // todo

        setSessions(prev =>
            prev.map(s =>
                s.id === sessionId
                    ? {
                        ...s,
                        agenda: s.agenda
                            .filter(a => a.id !== agendaId)
                            .map((a, i) => ({ ...a, order: i })),
                    }
                    : s
            )
        );
        setSelectedSession(prev =>
            prev?.id === sessionId
                ? {
                    ...prev,
                    agenda: prev.agenda
                        .filter(a => a.id !== agendaId)
                        .map((a, i) => ({ ...a, order: i })),
                }
                : prev
        );
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/sessions/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await res.json();

            if (data.success) {
                toast.success("Session deleted successfully", { position: "top-right" });
                setSessions(p => p.filter(s => s.id !== id));
                if (selectedSession?.id === id) setSelectedSession(null);
            } else {
                toast.error(data.message ?? "Failed to delete session");
            }
        } catch (err) {
            console.error("Failed to delete session:", err);
            toast.error("Network error — please try again");
        }
    };

    const handleCancel = async (id: string) => {
        try {
            const res = await fetch(`/api/sessions/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "cancelled" }),
                credentials: "include",
            });
            const data = await res.json();

            if (data.success) {
                toast.success("Session cancelled successfully", { position: "top-right" });
                setSessions(prev =>
                    prev.map(s => s.id === id ? { ...s, status: "cancelled" as SessionStatus } : s)
                );
                setSelectedSession(prev =>
                    prev?.id === id ? { ...prev, status: "cancelled" as SessionStatus } : prev
                );
            } else {
                toast.error(data.message ?? "Failed to cancel session");
            }
        } catch (err) {
            console.error("Failed to cancel session:", err);
            toast.error("Network error — please try again");
        }
    };

    return (
        <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-5xl mx-auto w-full">

            {/* ── Page heading ── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-1.5 mb-1">
                        <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
                        <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">
                            Sessions
                        </span>
                    </div>
                    <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">
                        Manage sessions
                    </h1>
                    <p className="text-[13.5px] text-muted-foreground mt-1">
                        View, track, and manage all your sessions across clusters.
                    </p>
                </div>
                <button
                    onClick={() => router.push("/dashboard/teacher/session/create")}
                    className={cn(
                        "inline-flex items-center gap-2 h-10 px-5 rounded-xl flex-shrink-0",
                        "bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600",
                        "text-white text-[13.5px] font-bold",
                        "shadow-md shadow-teal-600/20 transition-all duration-200",
                        "hover:scale-[1.02] active:scale-[0.98]"
                    )}
                >
                    <RiAddLine /> New session
                </button>
            </div>

            {/* ── Summary stats ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Total sessions", value: totalSessions, icon: <RiCalendar2Line />, color: "teal" },
                    { label: "Completed", value: completedCount, icon: <RiCheckLine />, color: "teal" },
                    { label: "Avg. rating", value: avgRating ?? "—", icon: <RiStarLine />, color: "amber" },
                    { label: "Total members", value: totalMembers, icon: <RiGroupLine />, color: "teal" },
                ].map((stat, i) => (
                    <div key={i} className="rounded-2xl border border-border bg-card px-4 py-3.5 flex items-center gap-3">
                        <div className={cn(
                            "w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-base",
                            stat.color === "amber"
                                ? "bg-amber-100/70 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/50 text-amber-600 dark:text-amber-400"
                                : "bg-teal-100/70 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/50 text-teal-600 dark:text-teal-400"
                        )}>
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-[18px] font-extrabold text-foreground leading-none">{stat.value}</p>
                            <p className="text-[11.5px] text-muted-foreground mt-0.5">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Filters ── */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2
                                    text-muted-foreground/50 text-base pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search sessions…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 rounded-xl text-[13.5px] font-medium
                       bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/40
                       focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70
                       dark:focus:border-teal-500/60 transition-all duration-150"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value as SessionStatus | "all")}
                    className="h-10 px-3.5 rounded-xl text-[13px] font-medium bg-muted/40 border border-border
                     appearance-none cursor-pointer text-foreground focus:outline-none
                     focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all"
                >
                    <option value="all">All statuses</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
                <select
                    value={filterCluster}
                    onChange={e => setFilterCluster(e.target.value)}
                    className="h-10 px-3.5 rounded-xl text-[13px] font-medium bg-muted/40 border border-border
                     appearance-none cursor-pointer text-foreground focus:outline-none
                     focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/70 transition-all"
                >
                    <option value="all">All clusters</option>
                    {clusters.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            {/* ── Session groups ── */}
            {filtered.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card px-6 py-16
                        flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center
                          bg-muted/40 border border-border text-muted-foreground/40 text-xl">
                        <RiCalendar2Line />
                    </div>
                    <p className="text-[14px] font-bold text-muted-foreground">No sessions found</p>
                    <p className="text-[13px] text-muted-foreground/60">Try adjusting your filters or create a new session.</p>
                    <button
                        onClick={() => router.push("/dashboard/teacher/session/create")}
                        className="mt-2 flex items-center gap-2 h-9 px-5 rounded-xl
                       bg-teal-600 dark:bg-teal-500 text-white text-[13px] font-bold
                       hover:bg-teal-700 dark:hover:bg-teal-600 transition-colors"
                    >
                        <RiAddLine /> Create session
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {grouped.ongoing.length > 0 && (
                        <SessionGroup title="Ongoing" count={grouped.ongoing.length} accent="teal" pulse>
                            {grouped.ongoing.map(s => (
                                <SessionCard key={s.id} session={s}
                                    onClick={() => setSelectedSession(s)}
                                    onEdit={() => router.push(`/sessions/${s.id}/edit`)}
                                    onDelete={() => handleDelete(s.id)}
                                    onCancel={() => handleCancel(s.id)}
                                />
                            ))}
                        </SessionGroup>
                    )}
                    {grouped.upcoming.length > 0 && (
                        <SessionGroup title="Upcoming" count={grouped.upcoming.length} accent="blue">
                            {grouped.upcoming.map(s => (
                                <SessionCard key={s.id} session={s}
                                    onClick={() => setSelectedSession(s)}
                                    onEdit={() => router.push(`/sessions/${s.id}/edit`)}
                                    onDelete={() => handleDelete(s.id)}
                                    onCancel={() => handleCancel(s.id)}
                                />
                            ))}
                        </SessionGroup>
                    )}
                    {grouped.completed.length > 0 && (
                        <SessionGroup title="Completed" count={grouped.completed.length} accent="muted">
                            {grouped.completed.map(s => (
                                <SessionCard key={s.id} session={s}
                                    onClick={() => setSelectedSession(s)}
                                    onEdit={() => router.push(`/sessions/${s.id}/edit`)}
                                    onDelete={() => handleDelete(s.id)}
                                    onCancel={() => handleCancel(s.id)}
                                />
                            ))}
                        </SessionGroup>
                    )}
                    {grouped.cancelled.length > 0 && (
                        <SessionGroup title="Cancelled" count={grouped.cancelled.length} accent="red">
                            {grouped.cancelled.map(s => (
                                <SessionCard key={s.id} session={s}
                                    onClick={() => setSelectedSession(s)}
                                    onEdit={() => router.push(`/sessions/${s.id}/edit`)}
                                    onDelete={() => handleDelete(s.id)}
                                    onCancel={() => handleCancel(s.id)}
                                />
                            ))}
                        </SessionGroup>
                    )}
                </div>
            )}

            {/* ── Detail drawer ── */}
            {selectedSession && (
                <SessionDrawer
                    session={selectedSession}
                    onClose={() => setSelectedSession(null)}
                    onUpdateSession={handleUpdateSession}
                    onAgendaAdd={handleAgendaAdd}       // ✅
                    onAgendaDelete={handleAgendaDelete} // ✅
                />
            )}
        </div>
    );
}

// ─── Session group header ─────────────────────────────────
function SessionGroup({
    title, count, accent, pulse, children,
}: {
    title: string; count: number; accent: "teal" | "blue" | "muted" | "red"; pulse?: boolean;
    children: React.ReactNode;
}) {
    const accentMap = {
        teal: "text-teal-600 dark:text-teal-400 bg-teal-100/60 dark:bg-teal-950/40 border-teal-200/60 dark:border-teal-800/50",
        blue: "text-blue-600 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-800/50",
        muted: "text-muted-foreground bg-muted/40 border-border",
        red: "text-red-600 dark:text-red-400 bg-red-100/60 dark:bg-red-950/40 border-red-200/60 dark:border-red-800/50",
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
                <span className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide border",
                    accentMap[accent]
                )}>
                    {title}
                </span>
                <span className="text-[11px] text-muted-foreground/60">{count} session{count !== 1 ? "s" : ""}</span>
                {pulse && <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />}
            </div>
            <div className="flex flex-col gap-3">{children}</div>
        </div>
    );
}