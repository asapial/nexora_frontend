import { NextRequest, NextResponse } from "next/server";

// This local callback bridge must run before the catch-all backend API proxy.
export async function GET(request: NextRequest) {
  const url = new URL("/auth/google/callback", request.url);
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });
  return NextResponse.redirect(url);
}
