
// ─────────────────────────────────────────────────────────────
// TYPES — mirror Prisma models exactly
// ─────────────────────────────────────────────────────────────
export type UserRole = "STUDENT" | "TEACHER" | "ADMIN";
export type MemberSubtype = "EMERGING" | "ACTIVE" | "GRADUATED" | "ALUMNI";

export type AdminPermission =
  | "MANAGE_STUDENTS" | "MANAGE_TEACHERS" | "MANAGE_ADMINS"
  | "MANAGE_CLUSTERS" | "MANAGE_SESSIONS" | "MANAGE_RESOURCES"
  | "MANAGE_TASKS"    | "MANAGE_CERTIFICATES"
  | "VIEW_ANALYTICS"  | "VIEW_AUDIT_LOGS"
  | "MANAGE_SETTINGS" | "MANAGE_ANNOUNCEMENTS";



export interface BaseUser {
  id:        string;
  name:      string;
  email:     string;
  role:      UserRole;
  image?:    string | null;
  createdAt: string; // ISO date string
}

export interface StudentProfile {
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

export interface TeacherProfile {
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

export interface AdminProfile {
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

export interface ProfilePageProps {
  user:    BaseUser;
  profile: StudentProfile | TeacherProfile | AdminProfile;
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