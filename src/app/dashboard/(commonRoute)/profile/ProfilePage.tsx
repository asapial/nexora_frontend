"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import {
  RiUserLine, RiMailLine, RiPhoneLine, RiMapPinLine, RiGlobalLine,
  RiGithubLine, RiLinkedinBoxLine, RiCameraLine, RiEditLine,
  RiCheckLine, RiCloseLine, RiFlaskLine, RiCalendarCheckLine,
  RiGroupLine, RiAwardLine, RiArrowRightLine, RiShieldCheckLine,
  RiTimeLine, RiBriefcaseLine, RiBookOpenLine, RiSearchLine,
  RiMicroscopeLine, RiSparklingFill, RiGraduationCapLine,
  RiBuilding2Line, RiTrophyLine, RiAlertLine,
  RiInformationLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// TYPES — mirror Prisma models exactly
// ─────────────────────────────────────────────────────────────
type UserRole = "STUDENT" | "TEACHER" | "ADMIN";
type MemberSubtype = "EMERGING" | "ACTIVE" | "GRADUATED" | "ALUMNI";

type AdminPermission =
  | "MANAGE_STUDENTS" | "MANAGE_TEACHERS" | "MANAGE_ADMINS"
  | "MANAGE_CLUSTERS" | "MANAGE_SESSIONS" | "MANAGE_RESOURCES"
  | "MANAGE_TASKS"    | "MANAGE_CERTIFICATES"
  | "VIEW_ANALYTICS"  | "VIEW_AUDIT_LOGS"
  | "MANAGE_SETTINGS" | "MANAGE_ANNOUNCEMENTS";

interface BaseUser {
  id:        string;
  name:      string;
  email:     string;
  role:      UserRole;
  image?:    string | null;
  createdAt: string; // ISO date string
}

interface StudentProfile {
  id:                 string;
  studentType:        MemberSubtype;
  phone?:             string;
  address?:           string;
  bio?:               string;
  nationality?:       string;
  institution?:       string;
  department:         string;
  batch?:             string;
  programme?:         string;
  cgpa?:              number;
  enrollmentYear?:    string;
  expectedGraduation?:string;
  skills:             string[];
  linkedinUrl?:       string;
  githubUrl?:         string;
  website?:           string;
  portfolioUrl?:      string;
  createdAt:          string;
  updatedAt:          string;
}

interface TeacherProfile {
  id:                string;
  designation?:      string;
  department?:       string;
  institution?:      string;
  bio?:              string;
  website?:          string;
  linkedinUrl?:      string;
  specialization?:   string;
  experience?:       number;
  researchInterests: string[];
  googleScholarUrl?: string;
  officeHours?:      string;
  isVerified:        boolean;
  verifiedAt?:       string;
  rejectedAt?:       string;
  rejectReason?:     string;
  createdAt:         string;
  updatedAt:         string;
}

interface AdminProfile {
  id:               string;
  phone?:           string;
  bio?:             string;
  nationality?:     string;
  avatarUrl?:       string;
  designation?:     string;
  department?:      string;
  organization?:    string;
  linkedinUrl?:     string;
  website?:         string;
  isSuperAdmin:     boolean;
  permissions:      AdminPermission[];
  managedModules:   string[];
  twoFactorEnabled: boolean;
  ipWhitelist:      string[];
  lastActiveAt?:    string;
  lastLoginIp?:     string;
  notes?:           string;
  createdAt:        string;
  updatedAt:        string;
}

interface ProfilePageProps {
  user:    BaseUser;
  profile: StudentProfile | TeacherProfile | AdminProfile;
  /** Platform stats — passed from server */
  stats?: {
    clusters?:  number;
    sessions?:  number;
    members?:   number;
    tasks?:     number;
    badges?:    number;
    submissions?: number;
  };
  badges?: { icon: string; label: string; earned: string }[];
  recentClusters?: { name: string; members: number; health: number; role: string }[];
  onSave?: (patch: Partial<StudentProfile | TeacherProfile | AdminProfile>) => Promise<void>;
}

// ─────────────────────────────────────────────────────────────
// COMPLETENESS — per-role required fields
// ─────────────────────────────────────────────────────────────
function getCompleteness(role: UserRole, profile: StudentProfile | TeacherProfile | AdminProfile) {
  if (role === "STUDENT") {
    const p = profile as StudentProfile;
    const fields: [string, unknown][] = [
      ["Phone",               p.phone],
      ["Bio",                 p.bio],
      ["Nationality",         p.nationality],
      ["Institution",         p.institution],
      ["Department",          p.department],
      ["Batch",               p.batch],
      ["Programme",           p.programme],
      ["Enrollment year",     p.enrollmentYear],
      ["Expected graduation", p.expectedGraduation],
      ["Skills",              p.skills?.length > 0 ? p.skills : null],
      ["LinkedIn",            p.linkedinUrl],
      ["GitHub",              p.githubUrl],
    ];
    const filled = fields.filter(([, v]) => v != null && v !== "");
    return { fields, filled: filled.length, total: fields.length };
  }
  if (role === "TEACHER") {
    const p = profile as TeacherProfile;
    const fields: [string, unknown][] = [
      ["Designation",          p.designation],
      ["Department",           p.department],
      ["Institution",          p.institution],
      ["Bio",                  p.bio],
      ["Specialization",       p.specialization],
      ["Experience (years)",   p.experience != null ? p.experience : null],
      ["Research interests",   p.researchInterests?.length > 0 ? p.researchInterests : null],
      ["Office hours",         p.officeHours],
      ["Website",              p.website],
      ["LinkedIn",             p.linkedinUrl],
      ["Google Scholar",       p.googleScholarUrl],
    ];
    const filled = fields.filter(([, v]) => v != null && v !== "");
    return { fields, filled: filled.length, total: fields.length };
  }
  // ADMIN
  const p = profile as AdminProfile;
  const fields: [string, unknown][] = [
    ["Phone",        p.phone],
    ["Bio",          p.bio],
    ["Designation",  p.designation],
    ["Department",   p.department],
    ["Organisation", p.organization],
    ["LinkedIn",     p.linkedinUrl],
    ["Website",      p.website],
  ];
  const filled = fields.filter(([, v]) => v != null && v !== "");
  return { fields, filled: filled.length, total: fields.length };
}

// ─────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────
function formatJoinDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

function memberSinceRelative(iso: string) {
  const ms   = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86400000);
  if (days < 30)  return `${days} day${days !== 1 ? "s" : ""} ago`;
  if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) !== 1 ? "s" : ""} ago`;
  const yrs = Math.floor(days / 365);
  return `${yrs} year${yrs !== 1 ? "s" : ""} ago`;
}

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
// SMALL COMPONENTS
// ─────────────────────────────────────────────────────────────

/** Avatar with optional upload button */
function ProfileAvatar({ name, src, size = "lg", onUpload }: {
  name: string; src: string | null | undefined; size?: "sm" | "md" | "lg"; onUpload?: () => void;
}) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const dim = size === "lg" ? "w-24 h-24 text-3xl" : size === "md" ? "w-14 h-14 text-xl" : "w-10 h-10 text-sm";
  return (
    <div className={cn("relative flex-shrink-0", dim)}>
      {src
        ? <img src={src} alt={name} className={cn(dim, "rounded-2xl object-cover border-2 border-border")} />
        : <div className={cn(dim, "rounded-2xl flex items-center justify-center font-extrabold border-2",
            "bg-teal-600/15 dark:bg-teal-400/12 text-teal-700 dark:text-teal-300 border-teal-300/50 dark:border-teal-600/30")}>
            {initials}
          </div>
      }
      {onUpload && (
        <button onClick={onUpload}
          className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl
                     bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600
                     border-2 border-background flex items-center justify-center
                     text-white text-sm shadow-lg shadow-teal-600/25 transition-all hover:scale-105">
          <RiCameraLine />
        </button>
      )}
    </div>
  );
}

/** Click-to-edit field */
function EditableField({ label, value, icon, type = "text", onSave }: {
  label: string; value: string; icon: React.ReactNode; type?: string;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value);
  const commit = () => { onSave(draft); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-bold tracking-[.08em] uppercase text-muted-foreground/70">{label}</label>
      {editing ? (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-base pointer-events-none">{icon}</span>
            <input autoFocus type={type} value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel(); }}
              className="w-full h-10 pl-9 pr-4 rounded-xl text-[13.5px] font-medium
                         bg-muted/50 border border-teal-400/60 dark:border-teal-500/50
                         text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400/25
                         dark:focus:ring-teal-500/25 transition-all duration-150" />
          </div>
          <button onClick={commit}
            className="w-9 h-9 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600
                       text-white flex items-center justify-center text-sm shadow-sm shadow-teal-600/20
                       transition-all flex-shrink-0"><RiCheckLine /></button>
          <button onClick={cancel}
            className="w-9 h-9 rounded-xl border border-border bg-muted/50 hover:bg-muted
                       text-muted-foreground flex items-center justify-center text-sm
                       transition-all flex-shrink-0"><RiCloseLine /></button>
        </div>
      ) : (
        <div onClick={() => setEditing(true)}
          className="group flex items-center gap-2.5 h-10 px-3 rounded-xl cursor-pointer
                     bg-muted/30 hover:bg-muted/60 border border-transparent hover:border-border transition-all">
          <span className="text-muted-foreground/50 text-base flex-shrink-0">{icon}</span>
          <span className="flex-1 text-[13.5px] text-foreground truncate">
            {value || <span className="text-muted-foreground/35 italic text-[13px]">Not set</span>}
          </span>
          <RiEditLine className="text-sm text-muted-foreground/0 group-hover:text-muted-foreground/40 transition-colors flex-shrink-0" />
        </div>
      )}
    </div>
  );
}

/** Card with header */
function Card({ title, description, action, children, className }: {
  title: string; description?: string; action?: React.ReactNode;
  children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card overflow-hidden", className)}>
      <div className="flex items-start justify-between px-5 py-4 border-b border-border">
        <div>
          <h2 className="text-[14px] font-bold text-foreground leading-none mb-0.5">{title}</h2>
          {description && <p className="text-[12px] text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

/** Tag pill */
function Tag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[12px] font-semibold
                     bg-muted/60 text-foreground/70 border border-border">
      {label}
    </span>
  );
}

/** Profile completeness bar */
function CompletenessBar({ filled, total, role }: { filled: number; total: number; role: UserRole }) {
  const pct = Math.round((filled / total) * 100);
  const incomplete = total - filled;
  const color = pct === 100 ? "bg-teal-500" : pct >= 70 ? "bg-teal-500" : pct >= 40 ? "bg-amber-400" : "bg-red-400";
  const textColor = pct === 100 ? "text-teal-600 dark:text-teal-400" : pct >= 70 ? "text-teal-600 dark:text-teal-400" : pct >= 40 ? "text-amber-600 dark:text-amber-400" : "text-red-500 dark:text-red-400";

  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-4">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <RiInformationLine className="text-base text-muted-foreground/60" />
          <span className="text-[13px] font-bold text-foreground">Profile completeness</span>
        </div>
        <span className={cn("text-[14px] font-extrabold tabular-nums", textColor)}>
          {pct}%
        </span>
      </div>

      {/* Bar */}
      <div className="h-2 rounded-full bg-muted overflow-hidden mb-2.5">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Status line */}
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-muted-foreground">
          {pct === 100
            ? "Your profile is fully complete 🎉"
            : incomplete === 1
            ? "1 field missing — nearly there!"
            : `${incomplete} fields incomplete`}
        </p>
        {pct < 100 && (
          <Link href="/dashboard/settings"
            className="text-[12px] font-semibold text-teal-600 dark:text-teal-400
                       hover:text-teal-700 dark:hover:text-teal-300 transition-colors flex items-center gap-1">
            Complete <RiArrowRightLine className="text-xs" />
          </Link>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ROLE-SPECIFIC DETAIL SECTIONS
// ─────────────────────────────────────────────────────────────

function StudentDetails({ profile, onSave, flashSaved }: {
  profile: StudentProfile;
  onSave: (p: Partial<StudentProfile>) => void;
  flashSaved: () => void;
}) {
  return (
    <>
      {/* Academic info */}
      <Card title="Academic Information" description="Your enrolment details and programme.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <EditableField label="Institution"          value={profile.institution ?? ""}         icon={<RiBuilding2Line />}     onSave={v => { onSave({ institution: v }); flashSaved(); }} />
          <EditableField label="Department"           value={profile.department ?? ""}          icon={<RiBookOpenLine />}      onSave={v => { onSave({ department: v }); flashSaved(); }} />
          <EditableField label="Programme"            value={profile.programme ?? ""}           icon={<RiGraduationCapLine />} onSave={v => { onSave({ programme: v }); flashSaved(); }} />
          <EditableField label="Batch"                value={profile.batch ?? ""}               icon={<RiGroupLine />}         onSave={v => { onSave({ batch: v }); flashSaved(); }} />
          <EditableField label="Enrollment year"      value={profile.enrollmentYear ?? ""}      icon={<RiCalendarCheckLine />} onSave={v => { onSave({ enrollmentYear: v }); flashSaved(); }} />
          <EditableField label="Expected graduation"  value={profile.expectedGraduation ?? ""}  icon={<RiTimeLine />}          onSave={v => { onSave({ expectedGraduation: v }); flashSaved(); }} />
          <EditableField label="CGPA"                 value={profile.cgpa != null ? String(profile.cgpa) : ""} icon={<RiTrophyLine />} onSave={v => { onSave({ cgpa: parseFloat(v) || undefined }); flashSaved(); }} />
          <EditableField label="Nationality"          value={profile.nationality ?? ""}         icon={<RiMapPinLine />}        onSave={v => { onSave({ nationality: v }); flashSaved(); }} />
        </div>
      </Card>

      {/* Skills */}
      <Card title="Skills" description="Technologies and tools you work with.">
        <div className="flex flex-wrap gap-2 mb-3">
          {profile.skills?.length > 0
            ? profile.skills.map(s => <Tag key={s} label={s} />)
            : <p className="text-[13px] text-muted-foreground italic">No skills added yet.</p>
          }
        </div>
        <p className="text-[11.5px] text-muted-foreground">
          Edit skills in <Link href="/dashboard/settings" className="text-teal-600 dark:text-teal-400 hover:underline font-semibold">Account Settings</Link>.
        </p>
      </Card>

      {/* Links */}
      <Card title="Links & Portfolio">
        <div className="flex flex-col gap-3">
          <EditableField label="LinkedIn"  value={profile.linkedinUrl ?? ""}  icon={<RiLinkedinBoxLine />} type="url" onSave={v => { onSave({ linkedinUrl: v }); flashSaved(); }} />
          <EditableField label="GitHub"    value={profile.githubUrl ?? ""}    icon={<RiGithubLine />}             onSave={v => { onSave({ githubUrl: v }); flashSaved(); }} />
          <EditableField label="Website"   value={profile.website ?? ""}      icon={<RiGlobalLine />}      type="url" onSave={v => { onSave({ website: v }); flashSaved(); }} />
          <EditableField label="Portfolio" value={profile.portfolioUrl ?? ""} icon={<RiUserLine />}        type="url" onSave={v => { onSave({ portfolioUrl: v }); flashSaved(); }} />
        </div>
      </Card>
    </>
  );
}

function TeacherDetails({ profile, onSave, flashSaved }: {
  profile: TeacherProfile;
  onSave: (p: Partial<TeacherProfile>) => void;
  flashSaved: () => void;
}) {
  return (
    <>
      {/* Verification badge */}
      {!profile.isVerified && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl
                        bg-amber-50/60 dark:bg-amber-950/20
                        border border-amber-200/70 dark:border-amber-800/50">
          <RiAlertLine className="text-amber-500 dark:text-amber-400 text-base mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-amber-700 dark:text-amber-400">Verification pending</p>
            <p className="text-[12px] text-amber-600/70 dark:text-amber-500/70">
              Your teacher account is awaiting admin approval. You have limited access until verified.
            </p>
            {profile.rejectReason && (
              <p className="text-[12px] text-red-600 dark:text-red-400 mt-1 font-medium">
                Rejection reason: {profile.rejectReason}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Professional */}
      <Card title="Professional Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <EditableField label="Designation"    value={profile.designation ?? ""}   icon={<RiBriefcaseLine />}  onSave={v => { onSave({ designation: v }); flashSaved(); }} />
          <EditableField label="Department"     value={profile.department ?? ""}    icon={<RiBookOpenLine />}   onSave={v => { onSave({ department: v }); flashSaved(); }} />
          <EditableField label="Institution"    value={profile.institution ?? ""}   icon={<RiBuilding2Line />}  onSave={v => { onSave({ institution: v }); flashSaved(); }} />
          <EditableField label="Specialization" value={profile.specialization ?? ""}icon={<RiSearchLine />}     onSave={v => { onSave({ specialization: v }); flashSaved(); }} />
          <EditableField label="Experience (yrs)"value={profile.experience != null ? String(profile.experience) : ""} icon={<RiTimeLine />} onSave={v => { onSave({ experience: parseInt(v) || undefined }); flashSaved(); }} />
          <EditableField label="Office hours"   value={profile.officeHours ?? ""}  icon={<RiCalendarCheckLine />} onSave={v => { onSave({ officeHours: v }); flashSaved(); }} />
        </div>
      </Card>

      {/* Research */}
      <Card title="Research" description="Your research interests and academic presence.">
        <div className="flex flex-wrap gap-2 mb-4">
          {profile.researchInterests?.length > 0
            ? profile.researchInterests.map(r => <Tag key={r} label={r} />)
            : <p className="text-[13px] text-muted-foreground italic">No research interests added.</p>
          }
        </div>
        <div className="flex flex-col gap-3">
          <EditableField label="Google Scholar" value={profile.googleScholarUrl ?? ""} icon={<RiMicroscopeLine />} type="url" onSave={v => { onSave({ googleScholarUrl: v }); flashSaved(); }} />
        </div>
      </Card>

      {/* Links */}
      <Card title="Links">
        <div className="flex flex-col gap-3">
          <EditableField label="LinkedIn" value={profile.linkedinUrl ?? ""} icon={<RiLinkedinBoxLine />} type="url" onSave={v => { onSave({ linkedinUrl: v }); flashSaved(); }} />
          <EditableField label="Website"  value={profile.website ?? ""}     icon={<RiGlobalLine />}      type="url" onSave={v => { onSave({ website: v }); flashSaved(); }} />
        </div>
      </Card>
    </>
  );
}

function AdminDetails({ profile }: { profile: AdminProfile }) {
  const PERM_LABELS: Record<AdminPermission, string> = {
    MANAGE_STUDENTS:      "Manage Students",
    MANAGE_TEACHERS:      "Manage Teachers",
    MANAGE_ADMINS:        "Manage Admins",
    MANAGE_CLUSTERS:      "Manage Clusters",
    MANAGE_SESSIONS:      "Manage Sessions",
    MANAGE_RESOURCES:     "Manage Resources",
    MANAGE_TASKS:         "Manage Tasks",
    MANAGE_CERTIFICATES:  "Manage Certificates",
    VIEW_ANALYTICS:       "View Analytics",
    VIEW_AUDIT_LOGS:      "View Audit Logs",
    MANAGE_SETTINGS:      "Manage Settings",
    MANAGE_ANNOUNCEMENTS: "Manage Announcements",
  };

  return (
    <>
      {/* Super admin badge */}
      {profile.isSuperAdmin && (
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl
                        bg-violet-50/60 dark:bg-violet-950/20
                        border border-violet-200/70 dark:border-violet-800/50">
          <RiShieldCheckLine className="text-violet-600 dark:text-violet-400 text-lg flex-shrink-0" />
          <div>
            <p className="text-[13px] font-bold text-violet-700 dark:text-violet-400">Super Administrator</p>
            <p className="text-[12px] text-violet-600/70 dark:text-violet-500/70">
              Full unrestricted access to all platform features and settings.
            </p>
          </div>
        </div>
      )}

      {/* Permissions */}
      <Card title="Permissions" description="Modules this admin account can manage.">
        <div className="flex flex-wrap gap-2">
          {profile.permissions?.length > 0
            ? profile.permissions.map(p => (
                <span key={p}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold
                             bg-violet-100/70 dark:bg-violet-950/40
                             text-violet-700 dark:text-violet-400
                             border border-violet-200/60 dark:border-violet-800/50">
                  <RiShieldCheckLine className="text-xs" />
                  {PERM_LABELS[p]}
                </span>
              ))
            : <p className="text-[13px] text-muted-foreground italic">No specific permissions assigned.</p>
          }
        </div>
      </Card>

      {/* Managed modules */}
      {profile.managedModules?.length > 0 && (
        <Card title="Managed Modules">
          <div className="flex flex-wrap gap-2">
            {profile.managedModules.map(m => <Tag key={m} label={m.charAt(0).toUpperCase() + m.slice(1)} />)}
          </div>
        </Card>
      )}

      {/* Professional */}
      <Card title="Professional Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold tracking-[.08em] uppercase text-muted-foreground/70">Designation</span>
            <span className="text-[13.5px] text-foreground">{profile.designation || <span className="text-muted-foreground/40 italic text-[13px]">Not set</span>}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold tracking-[.08em] uppercase text-muted-foreground/70">Organisation</span>
            <span className="text-[13.5px] text-foreground">{profile.organization || <span className="text-muted-foreground/40 italic text-[13px]">Not set</span>}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold tracking-[.08em] uppercase text-muted-foreground/70">Department</span>
            <span className="text-[13.5px] text-foreground">{profile.department || <span className="text-muted-foreground/40 italic text-[13px]">Not set</span>}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold tracking-[.08em] uppercase text-muted-foreground/70">2FA</span>
            <span className={cn("text-[13.5px] font-semibold", profile.twoFactorEnabled ? "text-teal-600 dark:text-teal-400" : "text-muted-foreground")}>
              {profile.twoFactorEnabled ? "Enabled ✓" : "Disabled"}
            </span>
          </div>
        </div>
      </Card>

      {/* Security */}
      <Card title="Security Details">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-[13px] text-muted-foreground">Last active</span>
            <span className="text-[13px] font-semibold text-foreground">
              {profile.lastActiveAt ? formatJoinDate(profile.lastActiveAt) : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-[13px] text-muted-foreground">Last login IP</span>
            <span className="text-[13px] font-mono font-semibold text-foreground">{profile.lastLoginIp || "—"}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-[13px] text-muted-foreground">IP whitelist</span>
            <span className="text-[13px] font-semibold text-foreground">
              {profile.ipWhitelist?.length > 0 ? `${profile.ipWhitelist.length} IPs` : "None"}
            </span>
          </div>
        </div>
      </Card>

      {/* Links */}
      <Card title="Links">
        <div className="flex flex-col gap-2">
          {profile.linkedinUrl && (
            <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-[13.5px] text-teal-600 dark:text-teal-400 hover:underline">
              <RiLinkedinBoxLine /> {profile.linkedinUrl}
            </a>
          )}
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-[13.5px] text-teal-600 dark:text-teal-400 hover:underline">
              <RiGlobalLine /> {profile.website}
            </a>
          )}
          {!profile.linkedinUrl && !profile.website && (
            <p className="text-[13px] text-muted-foreground italic">No links added.</p>
          )}
        </div>
      </Card>
    </>
  );
}

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