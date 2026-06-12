import { z } from "zod";

export const registerFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200)
    .regex(/[a-z]/, "Include a lowercase letter")
    .regex(/[A-Z]/, "Include an uppercase letter")
    .regex(/\d/, "Include a number"),
  confirmPassword: z.string(),
}).refine((value) => value.password === value.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const teacherApplicationFormSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().max(40).optional(),
  designation: z.string().trim().max(120).optional(),
  institution: z.string().trim().max(200).optional(),
  department: z.string().trim().max(120).optional(),
  specialization: z.string().trim().max(200).optional(),
  experience: z.union([z.literal(""), z.coerce.number().int().min(0).max(80)]),
  bio: z.string().trim().min(20, "Bio must be at least 20 characters").max(3000),
  linkedinUrl: z.union([z.literal(""), z.string().url()]),
  website: z.union([z.literal(""), z.string().url()]),
});

const examQuestionSchema = z.object({
  type: z.enum(["MCQ", "CQ"]),
  prompt: z.string().trim().min(1),
  marks: z.coerce.number().positive(),
  explanation: z.string().max(3000),
  options: z.array(z.object({ text: z.string(), isCorrect: z.boolean() })),
}).superRefine((question, ctx) => {
  if (question.type === "MCQ" && (question.options.filter((item) => item.text.trim()).length < 2 || question.options.filter((item) => item.isCorrect).length !== 1)) {
    ctx.addIssue({ code: "custom", message: "Each MCQ needs two options and one correct answer" });
  }
});

export const examFormSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(2000),
  clusterId: z.string().min(1, "Select a cluster"),
  type: z.enum(["MCQ", "CQ", "MIXED"]),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  durationMinutes: z.coerce.number().int().min(1).max(1440),
  questions: z.array(examQuestionSchema).min(1),
}).superRefine((value, ctx) => {
  const start = new Date(value.startTime);
  const end = new Date(value.endTime);
  if (Number.isNaN(start.getTime()) || start.getTime() - Date.now() < 24 * 60 * 60 * 1000) ctx.addIssue({ code: "custom", message: "Start time must be at least 24 hours away", path: ["startTime"] });
  if (Number.isNaN(end.getTime()) || end <= start) ctx.addIssue({ code: "custom", message: "End time must be after start time", path: ["endTime"] });
});

export const courseImageRequestSchema = z.object({
  imageBase64: z.string().max(8 * 1024 * 1024).regex(/^data:image\/(png|jpeg|jpg|webp);base64,/i),
});
