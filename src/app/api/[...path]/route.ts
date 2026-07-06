import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const AUTH_REFRESH_EXCLUDED_PREFIXES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/demo-login",
  "/api/auth/verify-login-totp",
  "/api/auth/refresh-token",
  "/api/auth/logout",
  "/api/auth/verify-email",
  "/api/auth/resend-verification-email",
  "/api/auth/forgetPassword",
  "/api/auth/verifyResetOtp",
  "/api/auth/resetPassword",
];

function getBackendUrl() {
  return process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL;
}

function isLongRunningAiPath(pathname: string) {
  return /^\/api\/resource\/[^/]+\/(?:process-ai|summary\/regenerate|citations\/reanalyze)$/.test(pathname);
}

function getTimeoutMs(request: NextRequest) {
  if (isLongRunningAiPath(request.nextUrl.pathname)) return 180_000;
  return request.method === "GET" || request.method === "HEAD" ? 12_000 : 60_000;
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

function isRefreshExcludedPath(pathname: string) {
  return AUTH_REFRESH_EXCLUDED_PREFIXES.some((prefix) => (
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  ));
}

function decodeJwtExpiresAt(token?: string) {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decodedPayload = JSON.parse(Buffer.from(normalizedPayload, "base64").toString("utf8"));
    return typeof decodedPayload.exp === "number" ? decodedPayload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function shouldRefreshBeforeProxy(request: NextRequest) {
  if (isRefreshExcludedPath(request.nextUrl.pathname)) return false;
  if (!request.cookies.get("refreshToken")?.value) return false;

  const accessTokenExpiresAt = decodeJwtExpiresAt(request.cookies.get("accessToken")?.value);
  if (!accessTokenExpiresAt) return true;

  return accessTokenExpiresAt <= Date.now() + 30_000;
}

function shouldAttemptRefresh(request: NextRequest, response: Response) {
  if (response.status !== 401) return false;
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  if (!request.cookies.get("refreshToken")?.value) return false;
  return !isRefreshExcludedPath(request.nextUrl.pathname);
}

function buildRequestHeaders(request: NextRequest, cookieHeader?: string) {
  const headers = new Headers(request.headers);

  for (const key of HOP_BY_HOP_HEADERS) {
    headers.delete(key);
  }

  headers.delete("host");
  headers.set("x-forwarded-host", request.headers.get("host") ?? "");
  headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));
  if (cookieHeader !== undefined) {
    headers.set("cookie", cookieHeader);
  }

  return headers;
}

function buildResponseHeaders(headers: Headers, extraSetCookies: string[] = []) {
  const responseHeaders = new Headers();

  headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });

  const setCookies = [...extraSetCookies, ...getSetCookieHeaders(headers)];
  if (setCookies?.length) {
    responseHeaders.delete("set-cookie");
    for (const cookie of setCookies) {
      responseHeaders.append("set-cookie", cookie);
    }
  }

  return responseHeaders;
}

async function fetchBackend(
  request: NextRequest,
  target: URL,
  cookieHeader?: string,
  bodySource: Request = request,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs(request));

  try {
    const init: RequestInit & { duplex?: "half" } = {
      method: request.method,
      headers: buildRequestHeaders(request, cookieHeader),
      redirect: "manual",
      cache: "no-store",
      signal: controller.signal,
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = bodySource.body;
      init.duplex = "half";
    }

    return await fetch(target, init);
  } finally {
    clearTimeout(timeout);
  }
}

async function refreshAccessToken(backendUrl: string, cookieHeader: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    return await fetch(new URL("/api/auth/refresh-token", backendUrl), {
      method: "POST",
      headers: { Cookie: cookieHeader },
      redirect: "manual",
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function proxyToBackend(request: NextRequest) {
  const backendUrl = getBackendUrl();

  if (!backendUrl) {
    return NextResponse.json(
      { success: false, message: "Backend URL is not configured." },
      { status: 500 },
    );
  }

  const target = new URL(request.nextUrl.pathname + request.nextUrl.search, backendUrl);

  try {
    let attemptedRefresh = false;
    let responseSetCookies: string[] = [];
    let cookieHeader = request.headers.get("cookie") ?? "";

    if (shouldRefreshBeforeProxy(request)) {
      attemptedRefresh = true;
      const refreshResponse = await refreshAccessToken(backendUrl, cookieHeader);
      responseSetCookies = getSetCookieHeaders(refreshResponse.headers);

      if (refreshResponse.ok) {
        cookieHeader = mergeCookieHeader(cookieHeader, responseSetCookies);
      }
    }

    const backendResponse = await fetchBackend(request, target, cookieHeader);

    if (!attemptedRefresh && shouldAttemptRefresh(request, backendResponse)) {
      const refreshResponse = await refreshAccessToken(
        backendUrl,
        cookieHeader,
      );
      const refreshSetCookies = getSetCookieHeaders(refreshResponse.headers);

      if (refreshResponse.ok) {
        const retryRequest = request.clone();
        const refreshedCookieHeader = mergeCookieHeader(cookieHeader, refreshSetCookies);
        const retryResponse = await fetchBackend(
          request,
          target,
          refreshedCookieHeader,
          retryRequest,
        );

        return new NextResponse(retryResponse.body, {
          status: retryResponse.status,
          statusText: retryResponse.statusText,
          headers: buildResponseHeaders(retryResponse.headers, refreshSetCookies),
        });
      }

      return new NextResponse(backendResponse.body, {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        headers: buildResponseHeaders(backendResponse.headers, refreshSetCookies),
      });
    }

    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: buildResponseHeaders(backendResponse.headers, responseSetCookies),
    });
  } catch (error) {
    const isAbortError = error instanceof DOMException && error.name === "AbortError";

    return NextResponse.json(
      {
        success: false,
        message: isAbortError
          ? "Backend request timed out. Please try again."
          : "Backend request failed. Please try again.",
      },
      { status: isAbortError ? 504 : 502 },
    );
  }
}

export const GET = proxyToBackend;
export const POST = proxyToBackend;
export const PUT = proxyToBackend;
export const PATCH = proxyToBackend;
export const DELETE = proxyToBackend;
