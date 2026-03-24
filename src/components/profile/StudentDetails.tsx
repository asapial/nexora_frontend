import { StudentProfile } from "@/app/dashboard/(commonRoute)/profile/profileInterface";
import { EditableField } from "./EditableField";
import { RiBookOpenLine, RiBuilding2Line, RiCalendarCheckLine, RiGithubLine, RiGlobalLine, RiGraduationCapLine, RiGroupLine, RiLinkedinBoxLine, RiMapPinLine, RiTimeLine, RiTrophyLine, RiUserLine } from "react-icons/ri";
import { Card } from "./Card";
import { Tag } from "./Tag";
import Link from "next/link";

export function StudentDetails({ profile, onSave, flashSaved }: {
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