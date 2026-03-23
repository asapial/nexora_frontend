import { NextRequest, NextResponse } from "next/server";

// This path (/api/auth/set-tokens) is intercepted by the Next.js rewrite rule
// "/api/auth/:path*" and proxied to the backend, so it never runs.
// The actual handler lives at /auth/google/callback (outside /api/).
export async function GET(request: NextRequest) {
  const url = new URL("/auth/google/callback", request.url);
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });
  return NextResponse.redirect(url);
}
