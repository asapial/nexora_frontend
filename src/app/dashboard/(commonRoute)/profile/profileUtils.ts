// ─────────────────────────────────────────────────────────────
// COMPLETENESS — per-role required fields

import { AdminProfile, StudentProfile, TeacherProfile, UserRole } from "./profileInterface";

// ─────────────────────────────────────────────────────────────
export function getCompleteness(role: UserRole, profile: StudentProfile | TeacherProfile | AdminProfile) {
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
export function formatJoinDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

export function memberSinceRelative(iso: string) {
  const ms   = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86400000);
  if (days < 30)  return `${days} day${days !== 1 ? "s" : ""} ago`;
  if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) !== 1 ? "s" : ""} ago`;
  const yrs = Math.floor(days / 365);
  return `${yrs} year${yrs !== 1 ? "s" : ""} ago`;
}