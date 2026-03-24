"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import {
   RiMailLine, RiPhoneLine, RiMapPinLine,RiEditLine,
  RiCheckLine,  RiFlaskLine, RiCalendarCheckLine,
  RiGroupLine, RiAwardLine, RiArrowRightLine, RiShieldCheckLine,
  RiTimeLine, RiBriefcaseLine, RiSparklingFill, RiGraduationCapLine,
  RiBuilding2Line
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { AdminProfile, ProfilePageProps, StudentProfile, TeacherProfile, UserRole } from "./profileInterface";
import { formatJoinDate, getCompleteness, memberSinceRelative } from "./profileUtils";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { CompletenessBar } from "@/components/profile/CompletenessBar";
import { Card } from "@/components/profile/Card";
import { StudentDetails } from "@/components/profile/StudentDetails";
import { TeacherDetails } from "@/components/profile/TeacherDetails";
import { AdminDetails } from "@/components/profile/AdminDetails";
import { EditableField } from "@/components/profile/EditableField";




const ACCENT_MAP = {
  teal:   { icon:"text-teal-600 dark:text-teal-400",   bg:"bg-teal-100/70 dark:bg-teal-950/50",   border:"border-teal-200/70 dark:border-teal-800/50"   },
  violet: { icon:"text-violet-600 dark:text-violet-400", bg:"bg-violet-100/70 dark:bg-violet-950/50", border:"border-violet-200/70 dark:border-violet-800/50" },
  amber:  { icon:"text-amber-600 dark:text-amber-400", bg:"bg-amber-100/70 dark:bg-amber-950/50", border:"border-amber-200/70 dark:border-amber-800/50"  },
  sky:    { icon:"text-sky-600 dark:text-sky-400",     bg:"bg-sky-100/70 dark:bg-sky-950/50",     border:"border-sky-200/70 dark:border-sky-800/50"      },
};

const ROLE_META: Record<UserRole, { label: string; color: string }> = {
  STUDENT: { label: "Student",  color: "bg-sky-100/80 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 border-sky-200/70 dark:border-sky-800/60" },
  TEACHER: { label: "Teacher",  color: "bg-teal-100/80 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 border-teal-200/70 dark:border-teal-800/60" },
  ADMIN:   { label: "Admin",    color: "bg-violet-100/80 dark:bg-violet-950/50 text-violet-700 dark:text-violet-400 border-violet-200/70 dark:border-violet-800/60" },
};







// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function ProfilePage({
  user,
  profile,
  stats = {},
  badges = [],
  recentClusters = [],
  onSave,
}: ProfilePageProps) {
  const [localProfile, setLocalProfile] = useState(profile);
  const [localAvatar,  setLocalAvatar]  = useState<string | null | undefined>(
    user.image ?? (user.role === "ADMIN" ? (profile as AdminProfile).avatarUrl : undefined)
  );
  const [bio,         setBio]         = useState((profile as any).bio ?? "");
  const [bioEditing,  setBioEditing]  = useState(false);
  const [saved,       setSaved]       = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const roleMeta    = ROLE_META[user.role];
  const completeness = useMemo(() => getCompleteness(user.role, localProfile), [user.role, localProfile]);

  const flashSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2200); };

  const handlePatch = async (patch: Partial<StudentProfile | TeacherProfile | AdminProfile>) => {
    setLocalProfile(p => ({ ...p, ...patch }));
    try { await onSave?.(patch); } catch { /* TODO: toast error */ }
  };

  // Role-specific stat definitions
  const statCards = user.role === "STUDENT"
    ? [
        { label: "Clusters",    value: stats.clusters  ?? 0, icon: <RiFlaskLine />,         accent: "teal"   },
        { label: "Tasks done",  value: stats.tasks     ?? 0, icon: <RiCheckLine />,          accent: "violet" },
        { label: "Badges",      value: stats.badges    ?? 0, icon: <RiAwardLine />,           accent: "amber"  },
        { label: "Submissions", value: stats.submissions ?? 0,icon:<RiCalendarCheckLine />,  accent: "sky"    },
      ]
    : user.role === "TEACHER"
    ? [
        { label: "Clusters",  value: stats.clusters ?? 0, icon: <RiFlaskLine />,         accent: "teal"   },
        { label: "Members",   value: stats.members  ?? 0, icon: <RiGroupLine />,          accent: "violet" },
        { label: "Sessions",  value: stats.sessions ?? 0, icon: <RiCalendarCheckLine />, accent: "amber"  },
        { label: "Badges",    value: stats.badges   ?? 0, icon: <RiAwardLine />,          accent: "sky"    },
      ]
    : [
        { label: "Managed clusters", value: stats.clusters ?? 0, icon: <RiFlaskLine />,     accent: "teal"   },
        { label: "Total sessions",   value: stats.sessions ?? 0, icon: <RiCalendarCheckLine />, accent: "violet" },
        { label: "Total members",    value: stats.members  ?? 0, icon: <RiGroupLine />,     accent: "amber"  },
        { label: "Active today",     value: 0,                   icon: <RiSparklingFill />, accent: "sky"    },
      ];

  return (
    /* No SidebarProvider — this is a child of the layout */
    <div className="flex flex-col gap-6 p-5 lg:p-7 pt-6 max-w-5xl mx-auto w-full">

      {/* ── Hero card ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Cover strip */}
        <div className="h-24 relative overflow-hidden
                        bg-gradient-to-r from-teal-600/20 via-teal-500/12 to-teal-400/8
                        dark:from-teal-600/15 dark:via-teal-500/8 dark:to-teal-400/4 border-b border-border">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,.04)_1px,transparent_1px)] bg-[size:22px_22px]" />
          {/* Role-coloured top line */}
          <div className={cn("absolute top-0 left-0 right-0 h-1",
            user.role === "STUDENT" ? "bg-gradient-to-r from-sky-500/0 via-sky-500 to-sky-500/0"
            : user.role === "ADMIN"  ? "bg-gradient-to-r from-violet-500/0 via-violet-500 to-violet-500/0"
            : "bg-gradient-to-r from-teal-500/0 via-teal-500 to-teal-500/0"
          )} />
        </div>

        <div className="px-6 pb-6">
          {/* Avatar row */}
          <div className="flex items-end justify-between -mt-10 mb-4 flex-wrap gap-3">
            <ProfileAvatar name={user.name} src={localAvatar} size="lg"
              onUpload={() => fileRef.current?.click()} />
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]; if (!file) return;
                const url = URL.createObjectURL(file);
                setLocalAvatar(url); flashSaved();
              }} />
            <div className="flex items-center gap-2 pb-1">
              {saved && (
                <span className="flex items-center gap-1.5 text-[12.5px] font-semibold
                                 text-teal-600 dark:text-teal-400 animate-in fade-in-0 duration-200">
                  <RiCheckLine /> Saved
                </span>
              )}
              <Link href="/dashboard/settings"
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl
                           border border-border bg-muted/50 hover:bg-muted
                           text-[13px] font-semibold text-foreground/80 hover:text-foreground transition-all">
                <RiEditLine className="text-sm" /> Edit settings
              </Link>
            </div>
          </div>

          {/* Name + meta */}
          <div className="mb-5">
            <div className="flex items-center gap-2.5 flex-wrap mb-2">
              <h1 className="text-[1.35rem] font-extrabold tracking-tight text-foreground leading-none">
                {user.name}
              </h1>
              {/* Role badge */}
              <span className={cn("text-[10.5px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border", roleMeta.color)}>
                {roleMeta.label}
              </span>
              {/* Teacher verification badge */}
              {user.role === "TEACHER" && (
                <span className={cn(
                  "text-[10.5px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border",
                  (localProfile as TeacherProfile).isVerified
                    ? "bg-teal-100/70 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border-teal-200/70 dark:border-teal-800/50"
                    : "bg-amber-100/70 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/70 dark:border-amber-800/50"
                )}>
                  {(localProfile as TeacherProfile).isVerified ? "✓ Verified" : "⏳ Pending"}
                </span>
              )}
              {/* Admin super badge */}
              {user.role === "ADMIN" && (localProfile as AdminProfile).isSuperAdmin && (
                <span className="text-[10.5px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border
                                 bg-violet-100/70 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400
                                 border-violet-200/70 dark:border-violet-800/50">
                  Super Admin
                </span>
              )}
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* Role-specific primary meta */}
              {user.role === "STUDENT" && (
                <>
                  {(localProfile as StudentProfile).institution && (
                    <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                      <RiBuilding2Line className="text-muted-foreground/50 text-sm" />
                      {(localProfile as StudentProfile).institution}
                    </span>
                  )}
                  {(localProfile as StudentProfile).programme && (
                    <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                      <RiGraduationCapLine className="text-muted-foreground/50 text-sm" />
                      {(localProfile as StudentProfile).programme}
                    </span>
                  )}
                  {(localProfile as StudentProfile).batch && (
                    <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                      <RiGroupLine className="text-muted-foreground/50 text-sm" />
                      Batch {(localProfile as StudentProfile).batch}
                    </span>
                  )}
                </>
              )}
              {user.role === "TEACHER" && (
                <>
                  {(localProfile as TeacherProfile).designation && (
                    <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                      <RiBriefcaseLine className="text-muted-foreground/50 text-sm" />
                      {(localProfile as TeacherProfile).designation}
                    </span>
                  )}
                  {(localProfile as TeacherProfile).institution && (
                    <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                      <RiBuilding2Line className="text-muted-foreground/50 text-sm" />
                      {(localProfile as TeacherProfile).institution}
                    </span>
                  )}
                  {(localProfile as TeacherProfile).experience != null && (
                    <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                      <RiTimeLine className="text-muted-foreground/50 text-sm" />
                      {(localProfile as TeacherProfile).experience}y experience
                    </span>
                  )}
                </>
              )}
              {user.role === "ADMIN" && (
                <>
                  {(localProfile as AdminProfile).organization && (
                    <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                      <RiBuilding2Line className="text-muted-foreground/50 text-sm" />
                      {(localProfile as AdminProfile).organization}
                    </span>
                  )}
                  {(localProfile as AdminProfile).designation && (
                    <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                      <RiBriefcaseLine className="text-muted-foreground/50 text-sm" />
                      {(localProfile as AdminProfile).designation}
                    </span>
                  )}
                </>
              )}
              {/* Joined date — always shown */}
              <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground" title={formatJoinDate(user.createdAt)}>
                <RiCalendarCheckLine className="text-muted-foreground/50 text-sm" />
                Joined {formatJoinDate(user.createdAt)}
                <span className="text-[11.5px] text-muted-foreground/50">({memberSinceRelative(user.createdAt)})</span>
              </span>
              {/* Email */}
              <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <RiMailLine className="text-muted-foreground/50 text-sm" />
                {user.email}
              </span>
            </div>
          </div>

          {/* Stat pills */}
          <div className="flex flex-wrap gap-2.5">
            {statCards.map(s => {
              const a = ACCENT_MAP[s.accent as keyof typeof ACCENT_MAP];
              return (
                <div key={s.label}
                  className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border", a.bg, a.border)}>
                  <span className={cn("text-base", a.icon)}>{s.icon}</span>
                  <span className={cn("text-[15px] font-extrabold tabular-nums", a.icon)}>{s.value}</span>
                  <span className="text-[11.5px] font-medium text-muted-foreground">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Completeness bar ──────────────────────────────── */}
      <CompletenessBar filled={completeness.filled} total={completeness.total} role={user.role} />

      {/* ── Main two-column grid ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

        {/* ── LEFT: bio + role-specific ── */}
        <div className="flex flex-col gap-5">

          {/* Bio — same for all roles */}
          <Card title="Bio" description="Displayed on your public profile.">
            {bioEditing ? (
              <div className="flex flex-col gap-3">
                <textarea autoFocus value={bio} onChange={e => setBio(e.target.value)} rows={4}
                  className="w-full rounded-xl px-4 py-3 text-[13.5px] font-medium leading-relaxed resize-none
                             bg-muted/50 border border-teal-400/60 dark:border-teal-500/50 text-foreground
                             focus:outline-none focus:ring-2 focus:ring-teal-400/25 transition-all" />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => { setBio((profile as any).bio ?? ""); setBioEditing(false); }}
                    className="h-9 px-4 rounded-xl border border-border bg-muted/50 hover:bg-muted
                               text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-all">
                    Cancel
                  </button>
                  <button onClick={() => { setBioEditing(false); handlePatch({ bio } as any); flashSaved(); }}
                    className="h-9 px-4 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600
                               text-white text-[13px] font-bold shadow-sm shadow-teal-600/20 transition-all">
                    Save bio
                  </button>
                </div>
              </div>
            ) : (
              <div onClick={() => setBioEditing(true)}
                className="group cursor-pointer rounded-xl p-3 -m-3
                           hover:bg-muted/40 border border-transparent hover:border-border transition-all">
                {bio
                  ? <p className="text-[13.5px] text-foreground/80 leading-relaxed">{bio}</p>
                  : <p className="text-[13.5px] text-muted-foreground/40 italic">No bio yet — click to add one.</p>
                }
                <p className="mt-2 text-[12px] text-muted-foreground/0 group-hover:text-muted-foreground/40
                              flex items-center gap-1 transition-colors">
                  <RiEditLine /> Click to edit
                </p>
              </div>
            )}
          </Card>

          {/* Role-specific sections */}
          {user.role === "STUDENT" && (
            <StudentDetails
              profile={localProfile as StudentProfile}
              onSave={p => handlePatch(p as Partial<StudentProfile>)}
              flashSaved={flashSaved}
            />
          )}
          {user.role === "TEACHER" && (
            <TeacherDetails
              profile={localProfile as TeacherProfile}
              onSave={p => handlePatch(p as Partial<TeacherProfile>)}
              flashSaved={flashSaved}
            />
          )}
          {user.role === "ADMIN" && (
            <AdminDetails profile={localProfile as AdminProfile} />
          )}

          {/* Contact — Student & Admin only */}
          {user.role !== "TEACHER" && (
            <Card title="Contact Information">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <EditableField label="Phone"
                  value={(localProfile as StudentProfile | AdminProfile).phone ?? ""}
                  icon={<RiPhoneLine />}
                  onSave={v => { handlePatch({ phone: v } as any); flashSaved(); }} />
                {user.role === "STUDENT" && (
                  <EditableField label="Address"
                    value={(localProfile as StudentProfile).address ?? ""}
                    icon={<RiMapPinLine />}
                    onSave={v => { handlePatch({ address: v } as any); flashSaved(); }} />
                )}
              </div>
            </Card>
          )}
        </div>

        {/* ── RIGHT: badges, clusters, security ── */}
        <div className="flex flex-col gap-5">

          {/* Badges */}
          {badges.length > 0 && (
            <Card title="Badges" description="Earned through activity.">
              <div className="grid grid-cols-3 gap-2">
                {badges.map(b => (
                  <div key={b.label}
                    className="flex flex-col items-center gap-1 p-2.5 rounded-xl
                               bg-muted/40 hover:bg-muted/70 border border-border
                               transition-colors cursor-default group">
                    <span className="text-2xl group-hover:scale-110 transition-transform">{b.icon}</span>
                    <span className="text-[10.5px] font-semibold text-foreground/70 text-center leading-tight">{b.label}</span>
                    <span className="text-[9.5px] text-muted-foreground/50">{b.earned}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Clusters — Teacher & Admin */}
          {(user.role === "TEACHER" || user.role === "ADMIN") && recentClusters.length > 0 && (
            <Card title="Clusters" description="Your recent clusters."
              action={
                <Link href="/dashboard/clusters"
                  className="flex items-center gap-1 text-[12px] font-semibold
                             text-teal-600 dark:text-teal-400 hover:text-teal-700 transition-colors">
                  All <RiArrowRightLine />
                </Link>
              }>
              <div className="flex flex-col gap-2">
                {recentClusters.map(c => (
                  <div key={c.name}
                    className="flex items-center gap-2.5 p-3 rounded-xl
                               bg-muted/30 hover:bg-muted/60 border border-border transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-teal-100/60 dark:bg-teal-950/40
                                    border border-teal-200/60 dark:border-teal-800/40
                                    flex items-center justify-center text-teal-600 dark:text-teal-400
                                    text-xs flex-shrink-0">
                      <RiFlaskLine />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-foreground truncate">{c.name}</p>
                      <p className="text-[10.5px] text-muted-foreground">{c.members} members</p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                      <span className="text-[11px] font-bold tabular-nums text-foreground/60">{c.health}</span>
                      <div className="w-8 h-1 rounded-full bg-muted overflow-hidden">
                        <div className={cn("h-full rounded-full",
                          c.health >= 80 ? "bg-teal-500" : c.health >= 50 ? "bg-amber-400" : "bg-red-400"
                        )} style={{ width: `${c.health}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Student — my sessions quick link */}
          {user.role === "STUDENT" && (
            <Card title="My Activity">
              <div className="flex flex-col gap-2">
                {[
                  { label: "My Clusters",     href: "/dashboard/clusters",  icon: <RiFlaskLine /> },
                  { label: "My Tasks",         href: "/dashboard/tasks",     icon: <RiCalendarCheckLine /> },
                  { label: "My Certificates",  href: "/dashboard/certificates", icon: <RiAwardLine /> },
                ].map(item => (
                  <Link key={item.label} href={item.href}
                    className="flex items-center gap-2.5 p-3 rounded-xl
                               bg-muted/30 hover:bg-muted/60 border border-border
                               transition-all group">
                    <span className="w-7 h-7 rounded-lg bg-teal-100/60 dark:bg-teal-950/40
                                     border border-teal-200/60 dark:border-teal-800/40
                                     flex items-center justify-center text-teal-600 dark:text-teal-400 text-xs flex-shrink-0">
                      {item.icon}
                    </span>
                    <span className="flex-1 text-[13px] font-semibold text-foreground">{item.label}</span>
                    <RiArrowRightLine className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors text-sm" />
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Account security */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-[13px] font-bold text-foreground mb-3">Account Security</p>
            <Link href="/dashboard/settings/change-password"
              className="flex items-center gap-2.5 p-3 rounded-xl
                         bg-muted/30 hover:bg-muted/60 border border-border
                         transition-all group">
              <div className="w-7 h-7 rounded-lg bg-teal-100/60 dark:bg-teal-950/40
                              border border-teal-200/60 dark:border-teal-800/40
                              flex items-center justify-center text-teal-600 dark:text-teal-400 text-xs flex-shrink-0">
                <RiShieldCheckLine />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-semibold text-foreground">Change Password</p>
                <p className="text-[11px] text-muted-foreground">Keep your account secure</p>
              </div>
              <RiArrowRightLine className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}