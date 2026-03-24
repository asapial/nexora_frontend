import { AdminPermission, AdminProfile } from "@/app/dashboard/(commonRoute)/profile/profileInterface";
import { RiGlobalLine, RiLinkedinBoxLine, RiShieldCheckLine } from "react-icons/ri";
import { Card } from "./Card";
import { Tag } from "./Tag";
import { cn } from "@/lib/utils";
import { formatJoinDate } from "@/app/dashboard/(commonRoute)/profile/profileUtils";

export function AdminDetails({ profile }: { profile: AdminProfile }) {
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
              <RiGlobalLine/> {profile.website}
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