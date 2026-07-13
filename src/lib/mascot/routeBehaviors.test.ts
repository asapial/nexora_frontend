import test from "node:test";
import assert from "node:assert/strict";
import { getMascotRouteBehavior } from "./routeBehaviors.ts";

test("maps high-value learning routes to contextual states", () => {
  assert.equal(
    getMascotRouteBehavior("/dashboard/student/courses/course-1")?.reaction,
    "reading",
  );
  assert.equal(
    getMascotRouteBehavior("/dashboard/teacher/courses/create")?.reaction,
    "writing",
  );
  assert.equal(
    getMascotRouteBehavior("/dashboard/admin/approvals/courses")?.reaction,
    "reviewing",
  );
});

test("keeps authentication guidance generic and password-safe", () => {
  const signIn = getMascotRouteBehavior("/auth/signin");
  const recovery = getMascotRouteBehavior("/auth/resetPassword");
  assert.equal(signIn?.reaction, "waving");
  assert.equal(recovery?.reaction, "waiting");
  assert.doesNotMatch(`${signIn?.message ?? ""}${recovery?.message ?? ""}`, /password|code/i);
});
