"use client";

import {
  useState, useEffect, useRef, useCallback,
  type ReactNode,
} from "react";
import {
  AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  RiSparklingFill, RiAdminLine, RiUserLine, RiBookOpenLine,
  RiGroupLine, RiBarChartBoxLine, RiMoneyDollarCircleLine,
  RiTimeLine, RiArrowUpLine, RiArrowDownLine, RiCheckboxCircleLine,
  RiCupLine, RiFireLine, RiStarLine,
  RiPlayCircleLine, RiTrophyLine, RiPulseLine,
  RiGlobalLine, RiArrowRightLine,
  RiFlashlightLine, RiShieldCheckLine, RiDatabase2Line,
  RiUserAddLine, RiAlertLine, RiLoader4Line,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────
type Role = "ADMIN" | "TEACHER" | "STUDENT";

interface DashboardData {
  stats: Record<string, number>;
  enrollmentTrend?: { month: string; count: number }[];
  revenueTrend?: { month: string; amount: number }[];
  recentSessions?: any[];
  progressDistribution?: { notStarted: number; inProgress: number; completed: number };
  recentEnrollments?: any[];
  userGrowthTrend?: { month: string; count: number }[];
}

// ─────────────────────────────────────────────────────────
// ANIMATED COUNTER HOOK
// ─────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1800, start = true) {
  const [count, setCount] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!start) return;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration, start]);

  return count;
}

// ─────────────────────────────────────────────────────────
// GLASS CARD
// ─────────────────────────────────────────────────────────
function GlassCard({
  children,
  className,
  hover = true,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-white/10 dark:border-white/[0.06]",
        "bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl",
        "shadow-sm shadow-black/[0.04] dark:shadow-black/20",
        hover && "transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/[0.06] dark:hover:shadow-teal-500/[0.1] hover:border-teal-300/30 dark:hover:border-teal-700/40",
        className
      )}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 to-transparent dark:from-white/[0.03] pointer-events-none" />
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────
type Accent = "teal" | "amber" | "blue" | "rose" | "violet";

const ACCENT_MAP: Record<Accent, {
  icon: string; bg: string; border: string; glow: string; badge: string;
}> = {
  teal: { icon: "text-teal-600 dark:text-teal-400", bg: "bg-teal-500/10 dark:bg-teal-500/15", border: "border-teal-400/30 dark:border-teal-600/30", glow: "shadow-teal-400/20", badge: "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200/60 dark:border-teal-800/50" },
  amber: { icon: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10 dark:bg-amber-500/15", border: "border-amber-400/30 dark:border-amber-600/30", glow: "shadow-amber-400/20", badge: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/50" },
  blue: { icon: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10 dark:bg-blue-500/15", border: "border-blue-400/30 dark:border-blue-600/30", glow: "shadow-blue-400/20", badge: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/50" },
  rose: { icon: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10 dark:bg-rose-500/15", border: "border-rose-400/30 dark:border-rose-600/30", glow: "shadow-rose-400/20", badge: "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/50" },
  violet: { icon: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10 dark:bg-violet-500/15", border: "border-violet-400/30 dark:border-violet-600/30", glow: "shadow-violet-400/20", badge: "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200/60 dark:border-violet-800/50" },
};

interface StatCardProps {
  label: string;
  value: number;
  unit?: string;
  icon: ReactNode;
  accent: Accent;
  suffix?: string;
  delay?: number;
}

function StatCard({ label, value, unit = "", icon, accent, suffix = "", delay = 0 }: StatCardProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const count = useCountUp(value, 1600, visible);
  const a = ACCENT_MAP[accent];

  return (
    <GlassCard className="p-5 overflow-hidden group">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-400/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-5">
          <div className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center text-xl border shadow-md",
            a.bg, a.border, a.icon, a.glow
          )}>
            {icon}
          </div>
        </div>
        <p className="text-[2.1rem] font-extrabold tabular-nums leading-none text-foreground tracking-tight">
          {unit}{count.toLocaleString()}{suffix}
        </p>
        <p className="text-[13px] font-medium text-muted-foreground mt-1.5">{label}</p>
      </div>
    </GlassCard>
  );
}

// ─────────────────────────────────────────────────────────
// CUSTOM TOOLTIP
// ─────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, prefix = "", suffix = "" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card/95 backdrop-blur-sm px-3.5 py-2.5 shadow-xl text-[12.5px]">
      <p className="font-bold text-foreground mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="font-bold text-foreground">{prefix}{Number(p.value).toLocaleString()}{suffix}</span>
        </p>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// TEACHER CHARTS
// ─────────────────────────────────────────────────────────
function EnrollmentTrendChart({ data }: { data: { month: string; count: number }[] }) {
  if (!data?.length) return null;
  return (
    <GlassCard className="p-5 col-span-full lg:col-span-2">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground mb-0.5">Growth trends</p>
          <h3 className="text-[15px] font-extrabold text-foreground">Enrollment Trend</h3>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="gTeal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Area type="monotone" dataKey="count" name="Enrollments" stroke="#14b8a6" strokeWidth={2.5} fill="url(#gTeal)" dot={false} activeDot={{ r: 5, fill: "#14b8a6", strokeWidth: 2, stroke: "#fff" }} />
        </AreaChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}

function RevenueTrendChart({ data }: { data: { month: string; amount: number }[] }) {
  if (!data?.length) return null;
  return (
    <GlassCard className="p-5">
      <div className="mb-5">
        <p className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground mb-0.5">Revenue</p>
        <h3 className="text-[15px] font-extrabold text-foreground">Monthly Earnings</h3>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barGap={4} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip prefix="$" />} />
          <Bar dataKey="amount" name="Earnings" fill="#f59e0b" radius={[5, 5, 0, 0]} maxBarSize={18} opacity={0.85} />
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}

// ─────────────────────────────────────────────────────────
// STUDENT PROGRESS DONUT
// ─────────────────────────────────────────────────────────
function ProgressDonut({ distribution }: { distribution: { notStarted: number; inProgress: number; completed: number } }) {
  const data = [
    { name: "Completed", value: distribution.completed, color: "#14b8a6" },
    { name: "In Progress", value: distribution.inProgress, color: "#f59e0b" },
    { name: "Not Started", value: distribution.notStarted, color: "#e2e8f0" },
  ].filter(d => d.value > 0);

  if (data.length === 0) data.push({ name: "No courses", value: 1, color: "#e2e8f0" });

  const RADIAN = Math.PI / 180;
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (value < 1) return null;
    return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>{value}</text>;
  };

  return (
    <GlassCard className="p-5">
      <div className="mb-4">
        <p className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground mb-0.5">Course status</p>
        <h3 className="text-[15px] font-extrabold text-foreground">Progress Distribution</h3>
      </div>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={42} outerRadius={72} paddingAngle={3} dataKey="value" labelLine={false} label={renderCustomLabel}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-2 flex-shrink-0">
          {data.map(d => (
            <div key={d.name} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
              <div>
                <p className="text-[11px] text-muted-foreground leading-none">{d.name}</p>
                <p className="text-[13px] font-bold text-foreground">{d.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

// ─────────────────────────────────────────────────────────
// ADMIN USER GROWTH CHART
// ─────────────────────────────────────────────────────────
function UserGrowthChart({ data }: { data: { month: string; count: number }[] }) {
  if (!data?.length) return null;
  return (
    <GlassCard className="p-5 col-span-full lg:col-span-2">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground mb-0.5">Platform</p>
          <h3 className="text-[15px] font-extrabold text-foreground">User Growth (Last 6 Months)</h3>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="gViolet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Area type="monotone" dataKey="count" name="New Users" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#gViolet)" dot={false} activeDot={{ r: 5, fill: "#8b5cf6", strokeWidth: 2, stroke: "#fff" }} />
        </AreaChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}

// ─────────────────────────────────────────────────────────
// RECENT SESSIONS WIDGET (TEACHER)
// ─────────────────────────────────────────────────────────
function RecentSessionsWidget({ sessions }: { sessions: any[] }) {
  if (!sessions?.length) return null;
  const fmtDate = (d: string) => { try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }); } catch { return d; } };
  const statusCfg: Record<string, string> = {
    upcoming: "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/40 dark:border-blue-800/50",
    ongoing: "text-teal-600 bg-teal-50 border-teal-200 dark:text-teal-400 dark:bg-teal-950/40 dark:border-teal-800/50",
    completed: "text-muted-foreground bg-muted/40 border-border",
    cancelled: "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/30 dark:border-red-800/50",
  };

  return (
    <GlassCard className="p-5">
      <div className="mb-4">
        <p className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground mb-0.5">Sessions</p>
        <h3 className="text-[15px] font-extrabold text-foreground">Recent Sessions</h3>
      </div>
      <div className="flex flex-col gap-3">
        {sessions.map(s => (
          <div key={s.id} className="flex items-center gap-3 px-3 py-3 rounded-xl bg-muted/30 border border-border/60 hover:bg-muted/50 transition-colors cursor-default">
            <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center bg-teal-100/60 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/50 text-teal-600 dark:text-teal-400">
              <RiTimeLine className="text-base" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-foreground truncate">{s.title}</p>
              <p className="text-[11.5px] text-muted-foreground">{s.cluster?.name} · {fmtDate(s.scheduledAt)}</p>
            </div>
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", statusCfg[s.status] || statusCfg.upcoming)}>
              {s.status}
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ─────────────────────────────────────────────────────────
// STUDENT RECENT ENROLLMENTS
// ─────────────────────────────────────────────────────────
function StudentEnrollments({ enrollments }: { enrollments: any[] }) {
  if (!enrollments?.length) return null;
  return (
    <GlassCard className="p-5">
      <div className="mb-4">
        <p className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground mb-0.5">Learning</p>
        <h3 className="text-[15px] font-extrabold text-foreground">My Progress</h3>
      </div>
      <div className="flex flex-col gap-4">
        {enrollments.map(c => (
          <div key={c.id}>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[13px] font-semibold text-foreground truncate">{c.courseTitle}</p>
              <p className="text-[12px] text-muted-foreground tabular-nums">{c.progress}%</p>
            </div>
            <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-400 transition-all duration-1000 ease-out"
                style={{ width: `${c.progress}%` }}
              />
            </div>
            {c.completedAt && (
              <p className="text-[11px] text-teal-600 dark:text-teal-400 mt-1 font-semibold">✓ Completed</p>
            )}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ─────────────────────────────────────────────────────────
// QUICK ACTIONS
// ─────────────────────────────────────────────────────────
const ADMIN_ACTIONS = [
  { label: "Add Teacher", icon: <RiUserAddLine />, accent: "teal" as Accent },
  { label: "Approve Course", icon: <RiCheckboxCircleLine />, accent: "blue" as Accent },
  { label: "View Revenue", icon: <RiMoneyDollarCircleLine />, accent: "amber" as Accent },
  { label: "System Logs", icon: <RiDatabase2Line />, accent: "violet" as Accent },
];
const TEACHER_ACTIONS = [
  { label: "New Course", icon: <RiBookOpenLine />, accent: "teal" as Accent },
  { label: "Schedule Class", icon: <RiTimeLine />, accent: "blue" as Accent },
  { label: "Grade Assignments", icon: <RiCheckboxCircleLine />, accent: "amber" as Accent },
  { label: "View Students", icon: <RiGroupLine />, accent: "violet" as Accent },
];
const STUDENT_ACTIONS = [
  { label: "Browse Courses", icon: <RiGlobalLine />, accent: "teal" as Accent },
  { label: "Resume Learning", icon: <RiPlayCircleLine />, accent: "blue" as Accent },
  { label: "My Certificates", icon: <RiTrophyLine />, accent: "amber" as Accent },
  { label: "Ask Mentor", icon: <RiPulseLine />, accent: "violet" as Accent },
];

function QuickActions({ role }: { role: Role }) {
  const actions = role === "ADMIN" ? ADMIN_ACTIONS : role === "TEACHER" ? TEACHER_ACTIONS : STUDENT_ACTIONS;
  return (
    <div>
      <p className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground mb-3">Quick Actions</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map(action => {
          const a = ACCENT_MAP[action.accent];
          return (
            <button
              key={action.label}
              className={cn(
                "group relative flex flex-col items-center gap-2.5 py-5 px-3 rounded-2xl",
                "border border-white/10 dark:border-white/[0.06]",
                "bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl",
                "hover:border-teal-300/40 dark:hover:border-teal-700/40",
                "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-teal-500/[0.08]",
                "transition-all duration-200 text-center overflow-hidden"
              )}
            >
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center text-xl border shadow-sm",
                "group-hover:scale-110 transition-transform duration-200",
                a.bg, a.border, a.icon
              )}>
                {action.icon}
              </div>
              <span className="text-[12.5px] font-semibold text-foreground/80 leading-snug">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// WELCOME SECTION
// ─────────────────────────────────────────────────────────
function WelcomeSection({ role, name, stats }: { role: Role; name: string; stats: Record<string, number> }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const roleInfo = {
    ADMIN: { icon: <RiAdminLine />, label: "Administrator", accent: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100/60 dark:bg-violet-950/40 border-violet-200/60 dark:border-violet-800/50" },
    TEACHER: { icon: <RiUserLine />, label: "Teacher", accent: "text-teal-600 dark:text-teal-400", bg: "bg-teal-100/60 dark:bg-teal-950/40 border-teal-200/60 dark:border-teal-800/50" },
    STUDENT: { icon: <RiBookOpenLine />, label: "Student", accent: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100/60 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-800/50" },
  };
  const ri = roleInfo[role];

  const subtitle =
    role === "ADMIN" ? `Managing ${stats.totalUsers ?? 0} users and ${stats.totalCourses ?? 0} courses.`
    : role === "TEACHER" ? `You have ${stats.totalStudents ?? 0} students across ${stats.totalClusters ?? 0} clusters.`
    : `You are enrolled in ${stats.totalEnrollments ?? 0} courses.`;

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
          <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Dashboard</span>
          <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold", ri.bg, ri.accent)}>
            {ri.icon}
            {ri.label}
          </span>
        </div>
        <h1 className="text-[1.6rem] font-extrabold tracking-tight text-foreground leading-none">
          {greeting}, {name || "User"} 👋
        </h1>
        <p className="text-[13.5px] text-muted-foreground mt-1.5">{subtitle}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// BUILD STAT CARDS FROM REAL DATA
// ─────────────────────────────────────────────────────────
function buildStatCards(role: Role, stats: Record<string, number>): StatCardProps[] {
  if (role === "ADMIN") {
    return [
      { label: "Total Users", value: stats.totalUsers ?? 0, icon: <RiGroupLine />, accent: "teal", delay: 0 },
      { label: "Active Courses", value: stats.totalCourses ?? 0, icon: <RiBookOpenLine />, accent: "blue", delay: 80 },
      { label: "Total Enrollments", value: stats.totalEnrollments ?? 0, icon: <RiBarChartBoxLine />, accent: "amber", delay: 160 },
      { label: "Pending Approvals", value: stats.pendingApprovals ?? 0, icon: <RiShieldCheckLine />, accent: "rose", delay: 240 },
    ];
  }
  if (role === "TEACHER") {
    return [
      { label: "Total Students", value: stats.totalStudents ?? 0, icon: <RiGroupLine />, accent: "teal", delay: 0 },
      { label: "My Courses", value: stats.totalCourses ?? 0, icon: <RiBookOpenLine />, accent: "blue", delay: 80 },
      { label: "Total Enrollments", value: stats.totalEnrollments ?? 0, icon: <RiBarChartBoxLine />, accent: "amber", delay: 160 },
      { label: "Total Resources", value: stats.totalResources ?? 0, icon: <RiDatabase2Line />, accent: "violet", delay: 240 },
    ];
  }
  // STUDENT
  return [
    { label: "Enrolled Courses", value: stats.totalEnrollments ?? 0, icon: <RiBookOpenLine />, accent: "teal", delay: 0 },
    { label: "Completed Courses", value: stats.completedCourses ?? 0, icon: <RiCheckboxCircleLine />, accent: "blue", delay: 80 },
    { label: "Average Progress", value: stats.averageProgress ?? 0, icon: <RiBarChartBoxLine />, accent: "amber", suffix: "%", delay: 160 },
    { label: "Certificates", value: stats.totalCertificates ?? 0, icon: <RiTrophyLine />, accent: "rose", delay: 240 },
  ];
}

// ─────────────────────────────────────────────────────────
// MAIN DASHBOARD PAGE
// ─────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [role, setRole] = useState<Role>("STUDENT");
  const [userName, setUserName] = useState<string>("");
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch user info
        const userRes = await fetch("/api/auth/me", { credentials: "include" });
        const userData = await userRes.json();

        if (userData.success) {
          const fullName = userData?.data?.userData?.name || "";
          const userRole = userData?.data?.userData?.role || "STUDENT";
          setUserName(fullName);
          setRole(userRole);
        }

        // Fetch dashboard data
        const dashRes = await fetch("/api/dashboard/stats", { credentials: "include" });
        const dashJson = await dashRes.json();

        if (dashJson.success && dashJson.data) {
          setDashData(dashJson.data);
        }
      } catch (err: any) {
        console.error("Failed to fetch dashboard:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen text-foreground font-sans">
        <main className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-7xl mx-auto">

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-muted/40 animate-pulse border border-border" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="h-64 rounded-2xl bg-muted/40 animate-pulse border border-border col-span-2" />
            <div className="h-64 rounded-2xl bg-muted/40 animate-pulse border border-border" />
          </div>
        </main>
      </div>
    );
  }

  const stats = dashData?.stats ?? {};
  const statCards = buildStatCards(role, stats);

  return (
    <div className={cn("min-h-screen text-foreground transition-colors duration-300", "font-sans")}>
      <main className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-7xl mx-auto">
        {/* Welcome */}
        <WelcomeSection role={role} name={userName} stats={stats} />

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map(s => <StatCard key={s.label} {...s} />)}
        </div>

        {/* Role-specific charts */}
        {role === "TEACHER" && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <EnrollmentTrendChart data={dashData?.enrollmentTrend ?? []} />
              <RevenueTrendChart data={dashData?.revenueTrend ?? []} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <RecentSessionsWidget sessions={dashData?.recentSessions ?? []} />
              <GlassCard className="p-5">
                <div className="mb-4">
                  <p className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground mb-0.5">Overview</p>
                  <h3 className="text-[15px] font-extrabold text-foreground">Course Stats</h3>
                </div>
                <div className="flex flex-col gap-2.5">
                  {[
                    { label: "Published courses", value: stats.publishedCourses ?? 0, icon: <RiCheckboxCircleLine className="text-teal-500" /> },
                    { label: "Total clusters", value: stats.totalClusters ?? 0, icon: <RiGroupLine className="text-blue-500" /> },
                    { label: "Total sessions", value: stats.totalSessions ?? 0, icon: <RiTimeLine className="text-amber-500" /> },
                    { label: "Teacher earnings", value: `$${stats.teacherEarnings ?? 0}`, icon: <RiMoneyDollarCircleLine className="text-violet-500" /> },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50">
                      <span className="text-base flex-shrink-0">{item.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-muted-foreground">{item.label}</p>
                      </div>
                      <p className="text-[13px] font-bold text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </>
        )}

        {role === "STUDENT" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ProgressDonut distribution={dashData?.progressDistribution ?? { notStarted: 0, inProgress: 0, completed: 0 }} />
            <StudentEnrollments enrollments={dashData?.recentEnrollments ?? []} />
          </div>
        )}

        {role === "ADMIN" && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <UserGrowthChart data={dashData?.userGrowthTrend ?? []} />
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground mb-0.5">System</p>
                    <h3 className="text-[15px] font-extrabold text-foreground">Platform Overview</h3>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-100/60 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/50">
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300">Operational</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    { label: "Teachers", value: stats.totalTeachers ?? 0, ok: true },
                    { label: "Students", value: stats.totalStudents ?? 0, ok: true },
                    { label: "Admins", value: stats.totalAdmins ?? 0, ok: true },
                    { label: "Total Clusters", value: stats.totalClusters ?? 0, ok: true },
                    { label: "Platform Revenue", value: `$${stats.platformRevenue ?? 0}`, ok: true },
                    { label: "Pending Approvals", value: stats.pendingApprovals ?? 0, ok: (stats.pendingApprovals ?? 0) === 0 },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <span className="text-[12.5px] text-muted-foreground">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-foreground tabular-nums">{item.value}</span>
                        <span className={cn("w-1.5 h-1.5 rounded-full", item.ok ? "bg-teal-500" : "bg-amber-400 animate-pulse")} />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </>
        )}

        {/* Quick Actions */}
        <QuickActions role={role} />
      </main>
    </div>
  );
}