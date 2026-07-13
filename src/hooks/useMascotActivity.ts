"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { MascotPreferences } from "@/types/mascot";
import { emitMascotEvent } from "@/lib/mascot/eventBus";
import { MASCOT_ROUTE_COOLDOWN_MS } from "@/lib/mascot/constants";

const PENDING_LOGIN_KEY = "nimbi:pending-login:v1";

export function markMascotLoginPending(displayName?: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem("nimbi:login-celebrated:v1");
    sessionStorage.setItem(PENDING_LOGIN_KEY, displayName ?? "1");
  } catch {}
}

export function useMascotActivity(preferences: MascotPreferences, enabled: boolean): void {
  const pathname = usePathname();
  const lastPathRef = useRef(pathname);
  const lastRouteReactionRef = useRef(0);
  const announcedInitialRouteRef = useRef(false);

  useEffect(() => {
    if (!enabled || !preferences.activityReactionsEnabled) return;
    let pending: string | null = null;
    try { pending = sessionStorage.getItem(PENDING_LOGIN_KEY); if (pending) sessionStorage.removeItem(PENDING_LOGIN_KEY); } catch {}
    if (document.cookie.split("; ").includes("nimbi_login_pending=1")) {
      pending ??= "1";
      document.cookie = "nimbi_login_pending=; Max-Age=0; path=/; SameSite=Lax";
    }
    if (pending) emitMascotEvent("user_logged_in", { displayName: pending === "1" ? undefined : pending });
  }, [enabled, preferences.activityReactionsEnabled]);

  useEffect(() => {
    if (!enabled || !preferences.activityReactionsEnabled || announcedInitialRouteRef.current) return;
    announcedInitialRouteRef.current = true;
    emitMascotEvent("route_changed", { pathname });
  }, [enabled, pathname, preferences.activityReactionsEnabled]);

  useEffect(() => {
    if (!enabled || !preferences.activityReactionsEnabled || lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;
    const now = Date.now();
    if (now - lastRouteReactionRef.current >= MASCOT_ROUTE_COOLDOWN_MS) {
      lastRouteReactionRef.current = now;
      emitMascotEvent("route_changed", { pathname });
    }
  }, [enabled, pathname, preferences.activityReactionsEnabled]);

  useEffect(() => {
    if (!enabled || !preferences.activityReactionsEnabled) return;
    const offline = () => emitMascotEvent("network_offline");
    const online = () => emitMascotEvent("network_online");
    window.addEventListener("offline", offline);
    window.addEventListener("online", online);
    if (!navigator.onLine) offline();
    return () => {
      window.removeEventListener("offline", offline);
      window.removeEventListener("online", online);
    };
  }, [enabled, preferences.activityReactionsEnabled]);
}
