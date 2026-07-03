import { NextRequest, NextResponse } from "next/server";

type AuthRole = "ADMIN" | "TEACHER" | "STUDENT";

type SessionPayload = {
  userData?: {
    role?: AuthRole;
    emailVerified?: boolean;
  };
};

type SessionResult = {
  data: SessionPayload | null;
  setCookies: string[];
};

function getBackendUrl() {
  return process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL;
}

function getSetCookieHeaders(headers: Headers) {
  const getSetCookie = (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  const setCookies = getSetCookie?.call(headers);
  if (setCookies?.length) return setCookies;

  const singleSetCookie = headers.get("set-cookie");
  return singleSetCookie ? splitCombinedSetCookieHeader(singleSetCookie) : [];
}

function splitCombinedSetCookieHeader(header: string) {
  const cookies: string[] = [];
  let start = 0;
  let inExpires = false;

  for (let index = 0; index < header.length; index++) {
    const char = header[index];
    const lookbehind = header.slice(Math.max(0, index - 8), index + 1).toLowerCase();

    if (lookbehind.endsWith("expires=")) {
      inExpires = true;
    }

    if (inExpires && char === ";") {
      inExpires = false;
    }

    if (char === "," && !inExpires) {
      const nextPart = header.slice(index + 1);
      if (/^\s*[^=;,\s]+=/.test(nextPart)) {
        cookies.push(header.slice(start, index).trim());
        start = index + 1;
      }
    }
  }

  const finalCookie = header.slice(start).trim();
  if (finalCookie) cookies.push(finalCookie);
  return cookies;
}

function mergeCookieHeader(cookieHeader: string, setCookies: string[]) {
  const cookies = new Map<string, string>();

  cookieHeader.split(";").forEach((cookie) => {
    const [rawName, ...rawValue] = cookie.trim().split("=");
    if (rawName && rawValue.length > 0) {
      cookies.set(rawName, rawValue.join("="));
    }
  });

  setCookies.forEach((setCookie) => {
    const cookiePair = setCookie.split(";")[0];
    const separatorIndex = cookiePair.indexOf("=");
    if (separatorIndex < 1) return;

    const name = cookiePair.slice(0, separatorIndex).trim();
    const value = cookiePair.slice(separatorIndex + 1);
    const lowerCookie = setCookie.toLowerCase();

    if (value === "" || lowerCookie.includes("max-age=0")) {
      cookies.delete(name);
      return;
    }

    cookies.set(name, value);
  });

  return Array.from(cookies.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

function withAuthCookies(response: NextResponse, setCookies: string[]) {
  setCookies.forEach((cookie) => response.headers.append("set-cookie", cookie));
  return response;
}

async function fetchSession(cookieHeader: string): Promise<SessionResult> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) return { data: null, setCookies: [] };

  const fetchMe = async (cookies: string) => {
    const res = await fetch(new URL("/api/auth/me", backendUrl), {
      headers: { Cookie: cookies },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });

    const json = await res.json().catch(() => null);
    return { res, json };
  };

  try {
    const first = await fetchMe(cookieHeader);

    if (first.res.ok && first.json?.success) {
      return { data: first.json.data ?? null, setCookies: getSetCookieHeaders(first.res.headers) };
    }

    if (first.res.status !== 401 || !cookieHeader.includes("refreshToken=")) {
      return { data: null, setCookies: [] };
    }

    const refreshRes = await fetch(new URL("/api/auth/refresh-token", backendUrl), {
      method: "POST",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });

    const refreshSetCookies = getSetCookieHeaders(refreshRes.headers);
    if (!refreshRes.ok) {
      return { data: null, setCookies: refreshSetCookies };
    }

    const refreshedCookieHeader = mergeCookieHeader(cookieHeader, refreshSetCookies);
    const retry = await fetchMe(refreshedCookieHeader);

    if (!retry.res.ok || !retry.json?.success) {
      return { data: null, setCookies: refreshSetCookies };
    }

    return {
      data: retry.json.data ?? null,
      setCookies: [...refreshSetCookies, ...getSetCookieHeaders(retry.res.headers)],
    };
  } catch {
    return { data: null, setCookies: [] };
  }
}

export async function proxy(request: NextRequest) {
  let isAuthenticated = false;
  let role: AuthRole | null = null;
  let emailVerified = false;

  const pathname = request.nextUrl.pathname;
  const isCoursesRoot = pathname === "/courses";
  const isCourseDetail =
    pathname.startsWith("/courses/") && pathname.split("/").length === 3;

  if (isCoursesRoot || isCourseDetail) {
    return NextResponse.next();
  }

  const authResult = await fetchSession(request.headers.get("cookie") ?? "");

  if (authResult.data?.userData?.role) {
    isAuthenticated = true;
    role = authResult.data.userData.role;
    emailVerified = authResult.data.userData.emailVerified ?? false;
  }

  const isCourseEnroll =
    pathname.startsWith("/courses/") && pathname.endsWith("/enroll");

  if (isCourseEnroll && !isAuthenticated) {
    return withAuthCookies(
      NextResponse.redirect(new URL("/auth/signin", request.url)),
      authResult.setCookies
    );
  }

  if (isAuthenticated && !emailVerified) {
    if (pathname !== "/auth/verifyEmail") {
      return withAuthCookies(
        NextResponse.redirect(new URL("/auth/verifyEmail", request.url)),
        authResult.setCookies
      );
    }

    return withAuthCookies(NextResponse.next(), authResult.setCookies);
  }

  if (isAuthenticated && emailVerified && pathname === "/auth/verifyEmail") {
    return withAuthCookies(
      NextResponse.redirect(new URL("/dashboard", request.url)),
      authResult.setCookies
    );
  }

  if (!isAuthenticated) {
    return withAuthCookies(
      NextResponse.redirect(new URL("/auth/signin", request.url)),
      authResult.setCookies
    );
  }

  if (role === "STUDENT") {
    if (
      pathname.startsWith("/dashboard/admin") ||
      pathname.startsWith("/dashboard/teacher")
    ) {
      return withAuthCookies(
        NextResponse.redirect(new URL("/dashboard", request.url)),
        authResult.setCookies
      );
    }
  }

  if (role === "TEACHER") {
    if (
      pathname.startsWith("/dashboard/admin") ||
      pathname.startsWith("/dashboard/student")
    ) {
      return withAuthCookies(
        NextResponse.redirect(new URL("/dashboard", request.url)),
        authResult.setCookies
      );
    }
  }

  if (role === "ADMIN") {
    if (
      pathname.startsWith("/dashboard/teacher") ||
      pathname.startsWith("/dashboard/student")
    ) {
      return withAuthCookies(
        NextResponse.redirect(new URL("/dashboard", request.url)),
        authResult.setCookies
      );
    }
  }

  return withAuthCookies(NextResponse.next(), authResult.setCookies);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/auth/verifyEmail",
    "/courses/:id/enroll",
  ],
};
