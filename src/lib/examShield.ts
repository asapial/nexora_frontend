export type ExamStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "CANCELLED";
export type ExamType = "MCQ" | "CQ" | "MIXED";
export type ExamMode = "REGULAR" | "PRO";
export type ProctorSensitivity = "RELAXED" | "STANDARD" | "STRICT";

export interface ProctorPolicy {
  cameraRequired: boolean;
  snapshotEnabled: boolean;
  sensitivity: ProctorSensitivity;
  studentWarnings: boolean;
  roughPaperAllowed: boolean;
  evidenceRetentionDays: number;
}

export interface ExamSummary {
  id: string;
  title: string;
  description?: string | null;
  type: ExamType;
  examMode: ExamMode;
  proctorPolicy?: ProctorPolicy | null;
  status: ExamStatus;
  startTime: string;
  endTime: string;
  durationMinutes?: number | null;
  rejectionReason?: string | null;
  resultsPublishedAt?: string | null;
  answerSheetPublishedAt?: string | null;
  resultEmailsSentAt?: string | null;
  cluster?: { id: string; name: string } | null;
  _count: { questions: number; attempts: number; assignments: number };
}

export interface ProctorEvent {
  id: string;
  type: string;
  occurredAt: string;
  durationMs?: number | null;
  confidence?: number | null;
  evidenceUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  reviewDecision?: "PENDING" | "DISMISSED" | "CONFIRMED_CONCERN" | "NEEDS_FOLLOW_UP";
  reviewNote?: string | null;
}

export interface ExamAttempt {
  id: string;
  status: string;
  score?: number | null;
  totalMarks?: number | null;
  percentage?: number | null;
  suspicious: boolean;
  suspiciousCount: number;
  startedAt: string;
  submittedAt?: string | null;
  resultEmailSentAt?: string | null;
  proctorFeedClearedAt?: string | null;
  user: { id: string; name: string; email: string };
  proctorEvents: ProctorEvent[];
  answers?: Array<{ id: string; awardedMarks: number }>;
}

export interface ExamDetail extends Omit<ExamSummary, "_count"> {
  attempts: ExamAttempt[];
  questions: Array<{ id: string; marks: number }>;
  cluster?: {
    id: string;
    name: string;
    members: Array<{ user: { id: string; name: string; email: string } }>;
  } | null;
}

export interface ClusterOption {
  id: string;
  name: string;
  members?: unknown[];
}

export const formatExamDate = (value: string) =>
  new Date(value).toLocaleString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export const examPhase = (exam: Pick<ExamSummary, "status" | "startTime" | "endTime">) => {
  const now = Date.now();
  if (exam.status !== "APPROVED") return exam.status;
  if (now < new Date(exam.startTime).getTime()) return "UPCOMING";
  if (now < new Date(exam.endTime).getTime()) return "LIVE";
  return "COMPLETED";
};

export const downloadCsv = (filename: string, rows: Array<Array<string | number>>) => {
  const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  const csv = rows.map((row) => row.map(escape).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};
