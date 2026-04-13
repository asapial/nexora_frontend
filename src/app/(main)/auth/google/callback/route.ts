import { NextRequest, NextResponse } from "next/server";

/**
 * GET /auth/google/callback
 *
 * The backend redirects here after a successful Google OAuth flow.
 * Tokens are passed as query params so they can be set as httpOnly cookies
 * on the frontend domain (avoids the cross-origin cookie problem between
 * backend and frontend when they are on different domains in production).
 *
 * This route is intentionally placed OUTSIDE /api/ so Next.js rewrite rules
 * (/api/auth/:path* and /api/:path*) do NOT proxy it to the backend.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const accessToken  = searchParams.get("accessToken");
  const refreshToken = searchParams.get("refreshToken");
  // The raw BetterAuth session token — passed from the backend so we can set it
  // as a cookie on THE FRONTEND DOMAIN. This is essential in production where
  // backend and frontend live on different domains and BetterAuth's own cookie
  // (set on the backend domain during OAuth) never reaches the frontend.
  const sessionToken = searchParams.get("sessionToken");
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  if (!accessToken || !refreshToken) {
    return NextResponse.redirect(
      new URL("/auth/login?error=oauth_failed", request.url)
    );
  }

  // Prevent open-redirect attacks
  const isValidPath =
    redirectPath.startsWith("/") && !redirectPath.startsWith("//");
  const finalRedirect = isValidPath ? redirectPath : "/dashboard";

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

  // Set the BetterAuth session token on the FRONTEND domain.
  // checkAuth (backend middleware) reads this cookie when the frontend sends it
  // via Next.js server-side fetches (userService.getSession → /api/auth/me).
  // Without this, production auth always fails because the frontend's cookie jar
  // never had the session_token — only the backend domain received that cookie.
  if (sessionToken) {
    response.cookies.set("better-auth.session_token", sessionToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days — match BetterAuth session expiry
    });
  }

  return response;
}

