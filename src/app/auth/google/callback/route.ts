import { NextRequest, NextResponse } from "next/server";

/**
 * GET /auth/google/callback
 *
 * The backend redirects here after a successful Google OAuth flow.
 * Tokens are passed as query params so they can be set as httpOnly cookies
 * on the frontend domain (avoids the cross-origin cookie problem between
 * localhost:4000 backend and localhost:3000 frontend).
 *
 * This route is intentionally placed OUTSIDE /api/ so Next.js rewrite rules
 * (/api/auth/:path* and /api/:path*) do NOT proxy it to the backend.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const accessToken = searchParams.get("accessToken");
  const refreshToken = searchParams.get("refreshToken");
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  if (!accessToken || !refreshToken) {
    return NextResponse.redirect(
      new URL("/auth/login?error=oauth_failed", request.url)
    );
  }

  // Prevent open-redirect attacks
  const isValidPath =
    redirectPath.startsWith("/") && !redirectPath.startsWith("//");
  const finalRedirect = isValidPath ? redirectPath : "/dashboard/student";

  const response = NextResponse.redirect(new URL(finalRedirect, request.url));

  const isProd = process.env.NODE_ENV === "production";

  response.cookies.set("accessToken", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
  });

  response.cookies.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}
