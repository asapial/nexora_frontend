// ─── Enums ────────────────────────────────────────────────
export type CourseStatus = "DRAFT" | "PENDING_APPROVAL" | "PUBLISHED" | "CLOSED" | "REJECTED";
export type MissionStatus = "DRAFT" | "PENDING_APPROVAL" | "PUBLISHED" | "REJECTED";
export type MissionContentType = "VIDEO" | "TEXT" | "PDF";
export type PriceApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
export type PaymentStatus = "FREE" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";

// ─── Course ───────────────────────────────────────────────
export interface Course {
  id: string;
  teacherId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  tags: string[];
  price: number;
  isFree: boolean;
  priceApprovalStatus: PriceApprovalStatus;
  priceApprovalNote?: string;
  requestedPrice?: number;
  teacherRevenuePercent: number;
  status: CourseStatus;
  isFeatured: boolean;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectedNote?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { enrollments: number; missions: number };
  totalRevenue?: number;
  teacherEarning?: number;
}

// ─── Mission ──────────────────────────────────────────────
export interface CourseMission {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  status: MissionStatus;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectedNote?: string;
  createdAt: string;
  updatedAt: string;
  contents?: MissionContent[];
  _count?: { contents: number };
}

// ─── Content ──────────────────────────────────────────────
export interface MissionContent {
  id: string;
  missionId: string;
  type: MissionContentType;
  title: string;
  order: number;
  videoUrl?: string;
  duration?: number;
  textBody?: string;
  pdfUrl?: string;
  fileSize?: number;
  createdAt: string;
}

// ─── Enrollment ───────────────────────────────────────────
export interface CourseEnrollment {
  id: string;
  courseId: string;
  userId: string;
  progress: number;
  completedAt?: string;
  enrolledAt: string;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  amountPaid?: number;
  teacherEarning?: number;
  user?: { id: string; name: string; email: string; image?: string };
}

// ─── Price Request ────────────────────────────────────────
export interface CoursePriceRequest {
  id: string;
  courseId: string;
  requestedPrice: number;
  note?: string;
  status: PriceApprovalStatus;
  adminNote?: string;
  reviewedAt?: string;
  createdAt: string;
}

// ─── Revenue ──────────────────────────────────────────────
export interface RevenueTransaction {
  id: string;
  courseId: string;
  courseTitle?: string;
  studentName?: string;
  totalAmount: number;
  teacherPercent: number;
  teacherEarning: number;
  platformEarning: number;
  transactedAt: string;
}