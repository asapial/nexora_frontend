"use client";

import {
  useState, useEffect, useRef, useCallback, Suspense,
  type ReactNode,
} from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend,
} from "recharts";
import {
  RiSparklingFill, RiAdminLine, RiUserLine, RiBookOpenLine,
  RiGroupLine, RiBarChartBoxLine, RiMoneyDollarCircleLine,
  RiTimeLine, RiArrowUpLine, RiArrowDownLine, RiCheckboxCircleLine,
  RiBookmarkLine, RiCupLine, RiFireLine, RiStarLine,
  RiPlayCircleLine, RiTrophyLine, RiPulseLine,
  RiGlobalLine, RiNotification3Line, RiSearch2Line,
  RiMenuLine, RiMoonLine, RiSunLine, RiArrowRightLine,
  RiFlashlightLine, RiShieldCheckLine, RiDatabase2Line,
  RiUserAddLine, RiAlertLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";


// ─────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────
type Role = "ADMIN" | "TEACHER" | "STUDENT";

interface DashboardProps {
  role?: Role;
  userName?: string;
}

// ─────────────────────────────────────────────────────────
// CHART DATA
// ─────────────────────────────────────────────────────────
const enrollmentData = [
  { month: "Aug", students: 120, revenue: 4800, courses: 8 },
  { month: "Sep", students: 185, revenue: 7400, courses: 12 },
  { month: "Oct", students: 210, revenue: 8400, courses: 14 },
  { month: "Nov", students: 290, revenue: 11600, courses: 18 },
  { month: "Dec", students: 260, revenue: 10400, courses: 16 },
  { month: "Jan", students: 340, revenue: 13600, courses: 22 },
  { month: "Feb", students: 420, revenue: 16800, courses: 28 },
  { month: "Mar", students: 510, revenue: 20400, courses: 34 },
];

const courseCompletionData = [
  { name: "Completed", value: 68, color: "#14b8a6" },
  { name: "In Progress", value: 24, color: "#f59e0b" },
  { name: "Not Started", value: 8, color: "#e2e8f0" },
];

const weeklyActivityData = [
  { day: "Mon", sessions: 42, submissions: 28 },
  { day: "Tue", sessions: 65, submissions: 47 },
  { day: "Wed", sessions: 58, submissions: 39 },
  { day: "Thu", sessions: 80, submissions: 61 },
  { day: "Fri", sessions: 73, submissions: 54 },
  { day: "Sat", sessions: 28, submissions: 19 },
  { day: "Sun", sessions: 15, submissions: 11 },
];

const studentProgressData = [
  { subject: "React", score: 88 },
  { subject: "TypeScript", score: 74 },
  { subject: "Node.js", score: 91 },
  { subject: "Databases", score: 62 },
  { subject: "DevOps", score: 45 },
];

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
      // Ease out cubic
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
      {/* subtle inner highlight */}
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
  trend: number;
  icon: ReactNode;
  accent: Accent;
  suffix?: string;
  delay?: number;
}

function StatCard({ label, value, unit = "", trend, icon, accent, suffix = "", delay = 0 }: StatCardProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const count = useCountUp(value, 1600, visible);
  const a = ACCENT_MAP[accent];
  const up = trend >= 0;

  return (
    <GlassCard className="p-5 overflow-hidden group">
      {/* Animated shimmer on hover */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-400/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-5">
          <div className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center text-xl border shadow-md",
            a.bg, a.border, a.icon, a.glow
          )}>
            {icon}
          </div>
          <span className={cn(
            "flex items-center gap-1 text-[11.5px] font-bold px-2.5 py-1 rounded-full border",
            up
              ? "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200/60 dark:border-teal-800/50"
              : "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200/60 dark:border-red-800/50"
          )}>
            {up ? <RiArrowUpLine className="text-xs" /> : <RiArrowDownLine className="text-xs" />}
            {Math.abs(trend)}%
          </span>
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
// CHARTS SECTION
// ─────────────────────────────────────────────────────────
function EnrollmentAreaChart() {
  return (
    <GlassCard className="p-5 col-span-full lg:col-span-2">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground mb-0.5">Growth trends</p>
          <h3 className="text-[15px] font-extrabold text-foreground">Enrollment & Revenue</h3>
        </div>
        <div className="flex items-center gap-3 text-[11.5px]">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-3 h-[3px] rounded-full bg-teal-500 inline-block" /> Students
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-3 h-[3px] rounded-full bg-amber-400 inline-block" /> Revenue
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={enrollmentData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="gTeal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="gAmber" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Area type="monotone" dataKey="students" stroke="#14b8a6" strokeWidth={2.5} fill="url(#gTeal)" dot={false} activeDot={{ r: 5, fill: "#14b8a6", strokeWidth: 2, stroke: "#fff" }} />
          <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} fill="url(#gAmber)" dot={false} activeDot={{ r: 4, fill: "#f59e0b", strokeWidth: 2, stroke: "#fff" }} />
        </AreaChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}

function WeeklyActivityBar() {
  return (
    <GlassCard className="p-5">
      <div className="mb-5">
        <p className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground mb-0.5">This week</p>
        <h3 className="text-[15px] font-extrabold text-foreground">Daily Activity</h3>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={weeklyActivityData} barGap={4} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="sessions" fill="#14b8a6" radius={[5, 5, 0, 0]} maxBarSize={18} opacity={0.85} />
          <Bar dataKey="submissions" fill="#f59e0b" radius={[5, 5, 0, 0]} maxBarSize={18} opacity={0.75} />
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}

function DonutChart() {
  const RADIAN = Math.PI / 180;
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, index }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (value < 10) return null;
    return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>{value}%</text>;
  };

  return (
    <GlassCard className="p-5">
      <div className="mb-4">
        <p className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground mb-0.5">Course status</p>
        <h3 className="text-[15px] font-extrabold text-foreground">Completion Rate</h3>
      </div>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={courseCompletionData}
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={72}
              paddingAngle={3}
              dataKey="value"
              labelLine={false}
              label={renderCustomLabel}
            >
              {courseCompletionData.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip suffix="%" />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-2 flex-shrink-0">
          {courseCompletionData.map(d => (
            <div key={d.name} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
              <div>
                <p className="text-[11px] text-muted-foreground leading-none">{d.name}</p>
                <p className="text-[13px] font-bold text-foreground">{d.value}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

function ProgressRadialChart() {
  return (
    <GlassCard className="p-5">
      <div className="mb-4">
        <p className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground mb-0.5">Student scores</p>
        <h3 className="text-[15px] font-extrabold text-foreground">Subject Performance</h3>
      </div>
      <div className="flex flex-col gap-2.5">
        {studentProgressData.map(({ subject, score }) => (
          <div key={subject} className="flex items-center gap-3">
            <p className="text-[12px] font-semibold text-muted-foreground w-20 flex-shrink-0">{subject}</p>
            <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-1000 ease-out",
                  score >= 80 ? "bg-teal-500" : score >= 60 ? "bg-amber-400" : "bg-rose-400"
                )}
                style={{ width: `${score}%` }}
              />
            </div>
            <p className="text-[12px] font-bold text-foreground tabular-nums w-8 text-right">{score}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ─────────────────────────────────────────────────────────
// ROLE-SPECIFIC WIDGETS
// ─────────────────────────────────────────────────────────

// Admin widget: system health
function AdminSystemWidget() {
  const items = [
    { label: "API Uptime", value: "99.98%", ok: true },
    { label: "DB Response", value: "12ms", ok: true },
    { label: "CDN latency", value: "38ms", ok: true },
    { label: "Error rate", value: "0.02%", ok: true },
    { label: "Pending flags", value: "3", ok: false },
  ];
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground mb-0.5">System</p>
          <h3 className="text-[15px] font-extrabold text-foreground">Platform Health</h3>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-100/60 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/50">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300">Operational</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {items.map(item => (
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
  );
}

// Teacher widget: class performance
function TeacherClassWidget() {
  const classes = [
    { name: "React Advanced", students: 34, avg: 87, trend: 4 },
    { name: "TypeScript Basics", students: 28, avg: 74, trend: -2 },
    { name: "Node.js API Design", students: 19, avg: 91, trend: 7 },
  ];
  return (
    <GlassCard className="p-5">
      <div className="mb-4">
        <p className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground mb-0.5">My classes</p>
        <h3 className="text-[15px] font-extrabold text-foreground">Course Overview</h3>
      </div>
      <div className="flex flex-col gap-3">
        {classes.map(cls => (
          <div key={cls.name} className="flex items-center gap-3 px-3 py-3 rounded-xl bg-muted/30 border border-border/60 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center bg-teal-100/60 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/50 text-teal-600 dark:text-teal-400">
              <RiBookOpenLine className="text-base" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-foreground truncate">{cls.name}</p>
              <p className="text-[11.5px] text-muted-foreground">{cls.students} students · avg {cls.avg}%</p>
            </div>
            <span className={cn(
              "flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border",
              cls.trend >= 0
                ? "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200/60 dark:border-teal-800/50"
                : "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200/60 dark:border-red-800/50"
            )}>
              {cls.trend >= 0 ? <RiArrowUpLine className="text-[10px]" /> : <RiArrowDownLine className="text-[10px]" />}
              {Math.abs(cls.trend)}%
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// Student widget: learning streak + enrolled courses
function StudentProgressWidget() {
  const courses = [
    { name: "React Advanced", progress: 78, total: 24, done: 18 },
    { name: "TypeScript Basics", progress: 42, total: 16, done: 7 },
    { name: "Node.js API", progress: 15, total: 20, done: 3 },
  ];
  const streak = 12;

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground mb-0.5">Learning</p>
          <h3 className="text-[15px] font-extrabold text-foreground">My Progress</h3>
        </div>
        {/* Streak badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50">
          <RiFireLine className="text-amber-500 text-sm" />
          <span className="text-[12px] font-extrabold text-amber-700 dark:text-amber-300">{streak} day streak</span>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {courses.map(c => (
          <div key={c.name}>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[13px] font-semibold text-foreground">{c.name}</p>
              <p className="text-[12px] text-muted-foreground tabular-nums">{c.done}/{c.total} missions</p>
            </div>
            <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-400 transition-all duration-1000 ease-out"
                style={{ width: `${c.progress}%` }}
              />
            </div>
            <p className="text-[11.5px] text-muted-foreground mt-1">{c.progress}% complete</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ─────────────────────────────────────────────────────────
// ACTIVITY FEED
// ─────────────────────────────────────────────────────────
type ActivityType = "submit" | "enroll" | "badge" | "alert" | "revenue";

const ACT_CFG: Record<ActivityType, { icon: ReactNode; cls: string }> = {
  submit: { icon: <RiCheckboxCircleLine />, cls: "text-teal-600 dark:text-teal-400 bg-teal-100/60 dark:bg-teal-950/40 border-teal-200/60 dark:border-teal-800/50" },
  enroll: { icon: <RiUserAddLine />, cls: "text-blue-600 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-800/50" },
  badge: { icon: <RiTrophyLine />, cls: "text-amber-600 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/50" },
  alert: { icon: <RiAlertLine />, cls: "text-rose-500 dark:text-rose-400 bg-rose-100/60 dark:bg-rose-950/30 border-rose-200/60 dark:border-rose-800/50" },
  revenue: { icon: <RiMoneyDollarCircleLine />, cls: "text-violet-600 dark:text-violet-400 bg-violet-100/60 dark:bg-violet-950/40 border-violet-200/60 dark:border-violet-800/50" },
};

const ACTIVITIES: { action: string; subject: string; time: string; type: ActivityType }[] = [
  { action: "Submitted", subject: "Sprint 8 — REST API Project", time: "5 min ago", type: "submit" },
  { action: "New enrollment", subject: "Aisha K enrolled in React Advanced", time: "22 min ago", type: "enroll" },
  { action: "Badge awarded", subject: "5 Consecutive Submissions — Lucas M", time: "1 hr ago", type: "badge" },
  { action: "Revenue", subject: "$320 payment processed — Node.js API", time: "2 hr ago", type: "revenue" },
  { action: "At-risk alert", subject: "NLP Reading Circle health dropped to 67%", time: "3 hr ago", type: "alert" },
  { action: "Submitted", subject: "Attention Paper Review — Priya S", time: "4 hr ago", type: "submit" },
];

function ActivityFeed() {
  return (
    <GlassCard className="overflow-hidden" hover={false}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <div>
          <p className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground mb-0.5">Live feed</p>
          <h3 className="text-[15px] font-extrabold text-foreground">Recent Activity</h3>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-100/60 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/50">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
          <span className="text-[10.5px] font-bold text-teal-700 dark:text-teal-300">Live</span>
        </div>
      </div>
      <div className="flex flex-col divide-y divide-border/40">
        {ACTIVITIES.map((item, i) => {
          const s = ACT_CFG[item.type];
          return (
            <div key={i} className="flex items-start gap-3 px-5 py-3.5 hover:bg-muted/20 transition-colors group cursor-default">
              <div className={cn("mt-0.5 w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-sm border", s.cls)}>
                {s.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] leading-snug text-foreground">
                  <span className="font-bold">{item.action}</span>
                  <span className="text-muted-foreground"> — {item.subject}</span>
                </p>
                <p className="text-[11px] text-muted-foreground/50 mt-0.5">{item.time}</p>
              </div>
              <RiArrowRightLine className="text-muted-foreground/30 text-sm flex-shrink-0 mt-1 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all" />
            </div>
          );
        })}
      </div>
      <div className="px-5 py-3.5 border-t border-border/60">
        <button className="flex items-center gap-1.5 text-[12.5px] font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors">
          View all activity <RiArrowRightLine className="text-sm" />
        </button>
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
function WelcomeSection({ role, name }: { role: Role; name: string }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const roleInfo = {
    ADMIN: { icon: <RiAdminLine />, label: "Administrator", accent: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100/60 dark:bg-violet-950/40 border-violet-200/60 dark:border-violet-800/50" },
    TEACHER: { icon: <RiUserLine />, label: "Teacher", accent: "text-teal-600 dark:text-teal-400", bg: "bg-teal-100/60 dark:bg-teal-950/40 border-teal-200/60 dark:border-teal-800/50" },
    STUDENT: { icon: <RiBookOpenLine />, label: "Student", accent: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100/60 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-800/50" },
  };
  const ri = roleInfo[role];

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
          {greeting}, {name} 👋
        </h1>
        <p className="text-[13.5px] text-muted-foreground mt-1.5">
          {role === "ADMIN" && "Platform is running smoothly. 3 items need your attention."}
          {role === "TEACHER" && "You have 2 pending assignments to grade and 1 session tomorrow."}
          {role === "STUDENT" && "You're on a 12-day streak! Keep it up."}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// STAT CONFIG BY ROLE
// ─────────────────────────────────────────────────────────
const STAT_DATA: Record<Role, StatCardProps[]> = {
  ADMIN: [
    { label: "Total Students", value: 1842, trend: 12, icon: <RiGroupLine />, accent: "teal", delay: 0 },
    { label: "Active Courses", value: 68, trend: 8, icon: <RiBookOpenLine />, accent: "blue", delay: 80 },
    { label: "Monthly Revenue", value: 24600, trend: 18, icon: <RiMoneyDollarCircleLine />, accent: "amber", unit: "$", delay: 160 },
    { label: "Pending Approvals", value: 3, trend: -25, icon: <RiShieldCheckLine />, accent: "rose", delay: 240 },
  ],
  TEACHER: [
    { label: "Enrolled Students", value: 81, trend: 6, icon: <RiGroupLine />, accent: "teal", delay: 0 },
    { label: "Active Courses", value: 3, trend: 0, icon: <RiBookOpenLine />, accent: "blue", delay: 80 },
    { label: "Avg Completion", value: 74, trend: 4, icon: <RiBarChartBoxLine />, accent: "amber", suffix: "%", delay: 160 },
    { label: "Sessions this month", value: 18, trend: 12, icon: <RiTimeLine />, accent: "violet", delay: 240 },
  ],
  STUDENT: [
    { label: "Enrolled Courses", value: 3, trend: 50, icon: <RiBookOpenLine />, accent: "teal", delay: 0 },
    { label: "Missions Completed", value: 28, trend: 17, icon: <RiCheckboxCircleLine />, accent: "blue", delay: 80 },
    { label: "Overall Progress", value: 62, trend: 8, icon: <RiBarChartBoxLine />, accent: "amber", suffix: "%", delay: 160 },
    { label: "Learning Streak", value: 12, trend: 20, icon: <RiFireLine />, accent: "rose", suffix: " days", delay: 240 },
  ],
};

// ─────────────────────────────────────────────────────────
// MAIN DASHBOARD PAGE
// ─────────────────────────────────────────────────────────
export default function DashboardPage({ }: DashboardProps = {}) {
  const [role, setRole] = useState<Role>("STUDENT")
  const [userName, setUserName] = useState<string>("")


    useEffect(() => {


  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = await res.json();

      console.log(data)

      if (data.success) {

        const fullName = data?.data?.userData?.name || "";
        const userRole = data?.data?.userData?.role || "STUDENT";

        setUserName(fullName);
        setRole(userRole);
      }
    } catch (err) {
      console.error("Failed to fetch user:", err);
    }
  };

  fetchUser();
}, []);


const stats = STAT_DATA[role];



return (
  <div className={cn(
    "min-h-screen  text-foreground transition-colors duration-300",
    "font-sans"
  )}>



    {/* ── Page Content ── */}
    <main className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-7xl mx-auto">

      {/* Welcome */}
      <WelcomeSection role={role} name={userName} />

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Charts 2-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area chart spans 2 cols */}
        <EnrollmentAreaChart />
        {/* Bar chart */}
        <WeeklyActivityBar />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Donut */}
        <DonutChart />
        {/* Progress bars */}
        <ProgressRadialChart />
        {/* Role-specific widget */}
        {role === "ADMIN" && <AdminSystemWidget />}
        {role === "TEACHER" && <TeacherClassWidget />}
        {role === "STUDENT" && <StudentProgressWidget />}
      </div>

      {/* Activity feed */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <ActivityFeed />

        {/* Mini KPI panel */}
        <div className="flex flex-col gap-3">
          {/* Streak / focus widget */}
          <GlassCard className="p-5">
            <p className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground mb-3">Top spotlight</p>
            <div className="flex flex-col gap-2.5">
              {[
                { label: "Highest scoring STUDENT", value: "Aisha K — 97%", icon: <RiTrophyLine className="text-amber-500" /> },
                { label: "Most active course", value: "React Advanced", icon: <RiFlashlightLine className="text-teal-500" /> },
                { label: "Best completion rate", value: "Node.js API — 91%", icon: <RiStarLine className="text-violet-500" /> },
                { label: "Revenue leader", value: "Sprint 8 — $820", icon: <RiMoneyDollarCircleLine className="text-blue-500" /> },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50">
                  <span className="text-base flex-shrink-0">{item.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">{item.label}</p>
                    <p className="text-[13px] font-bold text-foreground truncate">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Habit tracker mini */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">This month</p>
              <RiCupLine className="text-teal-500 text-base" />
            </div>
            <p className="text-[14px] font-extrabold text-foreground mb-3">Daily login streak</p>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 28 }).map((_, i) => {
                const active = Math.random() > 0.25;
                return (
                  <div
                    key={i}
                    title={`Day ${i + 1}`}
                    className={cn(
                      "aspect-square rounded-sm transition-colors",
                      active
                        ? i > 20 ? "bg-teal-500" : "bg-teal-400/70"
                        : "bg-muted/40 border border-border/40"
                    )}
                  />
                );
              })}
            </div>
            <p className="text-[11.5px] text-muted-foreground mt-2">21 active days this month</p>
          </GlassCard>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions role={role} />
    </main>
  </div>
);
}