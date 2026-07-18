import { expect, test } from "vitest";
import { getMascotRouteBehavior } from "./routeBehaviors.ts";

test("maps high-value learning routes to contextual states", () => {
  expect(getMascotRouteBehavior("/dashboard/student/courses/course-1")?.reaction).toBe("reading");
  expect(getMascotRouteBehavior("/dashboard/teacher/courses/create")?.reaction).toBe("writing");
  expect(getMascotRouteBehavior("/dashboard/admin/approvals/courses")?.reaction).toBe("reviewing");
});

test("keeps authentication guidance generic and password-safe", () => {
  const signIn = getMascotRouteBehavior("/auth/signin");
  const recovery = getMascotRouteBehavior("/auth/resetPassword");
  expect(signIn?.reaction).toBe("waving");
  expect(recovery?.reaction).toBe("waiting");
  expect(`${signIn?.message ?? ""}${recovery?.message ?? ""}`).not.toMatch(/password|code/i);
});
