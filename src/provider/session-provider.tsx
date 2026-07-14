"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type NexoraRole = "STUDENT" | "TEACHER" | "ADMIN";

export interface NexoraSessionUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: NexoraRole;
}

interface SessionContextValue {
  user: NexoraSessionUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

function parseSessionUser(payload: unknown): NexoraSessionUser | null {
  const response = payload as {
    success?: boolean;
    data?: { userData?: Record<string, unknown> } & Record<string, unknown>;
  };
  if (!response?.success || !response.data) return null;
  const raw = response.data.userData ?? response.data;
  const role = typeof raw.role === "string" ? raw.role.toUpperCase() : "";
  if (
    typeof raw.name !== "string" ||
    typeof raw.email !== "string" ||
    !["STUDENT", "TEACHER", "ADMIN"].includes(role)
  ) return null;
  return {
    id: typeof raw.id === "string" ? raw.id : typeof raw.userId === "string" ? raw.userId : "",
    name: raw.name,
    email: raw.email,
    image: typeof raw.image === "string" ? raw.image : undefined,
    role: role as NexoraRole,
  };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<NexoraSessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/me", { credentials: "include" });
      setUser(response.ok ? parseSessionUser(await response.json()) : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { credentials: "include" })
      .then(async (response) => response.ok ? parseSessionUser(await response.json()) : null)
      .then((nextUser) => { if (active) setUser(nextUser); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const value = useMemo(() => ({ user, loading, refresh }), [loading, refresh, user]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}

export function useOptionalSession(): SessionContextValue | undefined {
  return useContext(SessionContext);
}
