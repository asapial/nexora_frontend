import { AdminPermission, AdminProfile } from "@/app/dashboard/(commonRoute)/profile/profileInterface";
import { RiBookOpenLine, RiBriefcaseLine, RiBuilding2Line, RiGlobalLine, RiLinkedinBoxLine, RiMapPinLine, RiShieldCheckLine } from "react-icons/ri";
import { Card } from "./Card";
import { Tag } from "./Tag";
import { cn } from "@/lib/utils";
import { formatJoinDate } from "@/app/dashboard/(commonRoute)/profile/profileUtils";
import { EditableField } from "./EditableField";

export function AdminDetails({
  profile, onSave, flashSaved,
}: {
  profile:    AdminProfile;
  onSave:     (p: Partial<AdminProfile>) => void;
  flashSaved: () => void;
}) {
  const PERM_LABELS: Record<string, string> = {
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
      {/* Super admin banner */}
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

      {/* Permissions — read-only, controlled by system */}
      {profile.permissions?.length > 0 && (
        <Card title="Permissions" description="Assigned by the platform — contact support to change.">
          <div className="flex flex-wrap gap-2">
            {profile.permissions.map(p => (
              <span key={p}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold
                           bg-violet-100/70 dark:bg-violet-950/40
                           text-violet-700 dark:text-violet-400
                           border border-violet-200/60 dark:border-violet-800/50">
                <RiShieldCheckLine className="text-xs" />
                {PERM_LABELS[p] ?? p}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Professional — all editable */}
      <Card title="Professional Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <EditableField label="Designation"   value={profile.designation ?? ""}  icon={<RiBriefcaseLine />}  onSave={v => { onSave({ designation: v }); flashSaved(); }} />
          <EditableField label="Department"    value={profile.department ?? ""}   icon={<RiBookOpenLine />}   onSave={v => { onSave({ department: v }); flashSaved(); }} />
          <EditableField label="Organisation"  value={profile.organization ?? ""} icon={<RiBuilding2Line />}  onSave={v => { onSave({ organization: v }); flashSaved(); }} />
          <EditableField label="Nationality"   value={profile.nationality ?? ""}  icon={<RiMapPinLine />}     onSave={v => { onSave({ nationality: v }); flashSaved(); }} />
        </div>
      </Card>

      {/* Security info — read-only */}
      <Card title="Security Details">
        <div className="flex flex-col divide-y divide-border/50">
          <div className="flex items-center justify-between py-2.5">
            <span className="text-[13px] text-muted-foreground">Two-factor authentication</span>
            <span className={cn(
              "text-[13px] font-semibold",
              profile.twoFactorEnabled
                ? "text-teal-600 dark:text-teal-400"
                : "text-muted-foreground"
            )}>
              {profile.twoFactorEnabled ? "Enabled ✓" : "Disabled"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <span className="text-[13px] text-muted-foreground">Last active</span>
            <span className="text-[13px] font-semibold text-foreground">
              {profile.lastActiveAt ? formatJoinDate(profile.lastActiveAt) : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <span className="text-[13px] text-muted-foreground">Last login IP</span>
            <span className="text-[13px] font-mono font-semibold text-foreground">
              {profile.lastLoginIp || "—"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <span className="text-[13px] text-muted-foreground">IP whitelist</span>
            <span className="text-[13px] font-semibold text-foreground">
              {profile.ipWhitelist?.length > 0 ? `${profile.ipWhitelist.length} IPs` : "None"}
            </span>
          </div>
        </div>
      </Card>

      {/* Links */}
      <Card title="Links">
        <div className="flex flex-col gap-3">
          <EditableField label="LinkedIn" value={profile.linkedinUrl ?? ""} icon={<RiLinkedinBoxLine />} type="url" onSave={v => { onSave({ linkedinUrl: v }); flashSaved(); }} />
          <EditableField label="Website"  value={profile.website ?? ""}    icon={<RiGlobalLine />}      type="url" onSave={v => { onSave({ website: v }); flashSaved(); }} />
        </div>
      </Card>
    </>
  );
}