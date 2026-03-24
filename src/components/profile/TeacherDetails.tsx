import { TeacherProfile } from "@/app/dashboard/(commonRoute)/profile/profileInterface";
import { RiAlertLine, RiBookOpenLine, RiBriefcaseLine, RiBuilding2Line, RiCalendarCheckLine, RiGlobalLine, RiLinkedinBoxLine, RiMicroscopeLine, RiSearchLine, RiTimeLine } from "react-icons/ri";
import { EditableField } from "./EditableField";
import { Card } from "./Card";
import { Tag } from "./Tag";

export function TeacherDetails({ profile, onSave, flashSaved }: {
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