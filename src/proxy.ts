import { NextRequest, NextResponse } from "next/server";
import { userService } from "./services/user.service";

// Middleware to protect routes based on user roles
export async function proxy(request: NextRequest) {
  let isAuthenticated = false;
  let role: "ADMIN" | "TEACHER" | "STUDENT" | null = null;
  let emailVerified = false;

  // Get session from your auth service
  const { data } = await userService.getSession();

  if (data?.data?.userData?.role) {
    isAuthenticated = true;
    role = data.data.userData.role;
    emailVerified = data.data.userData.emailVerified ?? false;
  }

  const pathname = request.nextUrl.pathname;

  // -------------------------
  // COURSES RULES
  // -------------------------
  const isCoursesRoot = pathname === "/courses";
  const isCourseDetail =
    pathname.startsWith("/courses/") && pathname.split("/").length === 3;

  // 🔓 Allow public courses pages (catalog + detail)
  if (isCoursesRoot || isCourseDetail) {
    return NextResponse.next();
  }

  // 🔒 Protect /courses/:id/enroll (requires auth)
  const isCourseEnroll =
    pathname.startsWith("/courses/") && pathname.endsWith("/enroll");

  if (isCourseEnroll && !isAuthenticated) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  // -------------------------
  // EMAIL VERIFICATION CHECK
  // -------------------------
  // If user is authenticated but email is NOT verified,
  // redirect to verify-email page for all protected routes
  if (isAuthenticated && !emailVerified) {
    if (pathname !== "/auth/verifyEmail") {
      return NextResponse.redirect(
        new URL("/auth/verifyEmail", request.url)
      );
    }
    // Allow access to the verify-email page itself
    return NextResponse.next();
  }

  // If user IS verified and tries to visit verify-email, send to dashboard
  if (isAuthenticated && emailVerified && pathname === "/auth/verifyEmail") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  //* User is not authenticated at all
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  // -------------------------
  // STUDENT ROUTES
  // -------------------------
  if (role === "STUDENT") {
    // Students cannot access admin or teacher dashboard routes
    if (
      pathname.startsWith("/dashboard/admin") ||
      pathname.startsWith("/dashboard/teacher")
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // -------------------------
  // TEACHER ROUTES
  // -------------------------
  if (role === "TEACHER") {
    // Teachers cannot access admin or student-specific dashboard routes
    if (
      pathname.startsWith("/dashboard/admin") ||
      pathname.startsWith("/dashboard/student")
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // -------------------------
  // ADMIN ROUTES
  // -------------------------
  if (role === "ADMIN") {
    // Admins cannot access teacher or student-specific dashboard routes
    if (
      pathname.startsWith("/dashboard/teacher") ||
      pathname.startsWith("/dashboard/student")
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // -------------------------
  // Default: allow access
  // -------------------------
  return NextResponse.next();
}

// -------------------------
// Apply middleware only to protected routes
// -------------------------
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/auth/verifyEmail",
    "/courses/:id/enroll",
  ],
};