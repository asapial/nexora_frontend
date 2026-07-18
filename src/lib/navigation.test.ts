import { describe, expect, it } from "vitest";
import { findLongestMatchingRoute, routeMatchesPath } from "./navigation";

describe("routeMatchesPath", () => {
  it("matches a route exactly or at a path-segment boundary", () => {
    expect(routeMatchesPath("/dashboard/student/exams", "/dashboard/student/exams")).toBe(true);
    expect(routeMatchesPath("/dashboard/student/exams/results/42", "/dashboard/student/exams/results")).toBe(true);
    expect(routeMatchesPath("/dashboard/student/examshield", "/dashboard/student/exams")).toBe(false);
  });
});

describe("findLongestMatchingRoute", () => {
  const routes = [
    "/dashboard/student/exams",
    "/dashboard/student/exams/results",
  ];

  it("selects the most specific active destination", () => {
    expect(findLongestMatchingRoute("/dashboard/student/exams/results/42", routes))
      .toBe("/dashboard/student/exams/results");
  });

  it("keeps the base destination active for an exam attempt", () => {
    expect(findLongestMatchingRoute("/dashboard/student/exams/42", routes))
      .toBe("/dashboard/student/exams");
  });

  it("returns undefined when no destination matches", () => {
    expect(findLongestMatchingRoute("/dashboard/student/courses", routes)).toBeUndefined();
  });
});
