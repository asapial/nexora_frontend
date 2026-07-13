"use client";

import { Component, type ErrorInfo, type ReactNode, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useMascotPreferences } from "@/hooks/useMascotPreferences";
import { SENSITIVE_MASCOT_PATHS } from "@/lib/mascot/constants";
import "./mascot.module.css";

const DeferredMascot = dynamic(
  () => import("./Mascot").then((module) => module.Mascot),
  { ssr: false, loading: () => null },
);

interface IdleDeadlineLike {
  readonly didTimeout: boolean;
  timeRemaining(): number;
}

type IdleWindow = Window & {
  requestIdleCallback?: (
    callback: (deadline: IdleDeadlineLike) => void,
    options?: { timeout: number },
  ) => number;
  cancelIdleCallback?: (id: number) => void;
};

export function scheduleIdleTask(callback: () => void): () => void {
  const idleWindow = window as IdleWindow;
  if (idleWindow.requestIdleCallback && idleWindow.cancelIdleCallback) {
    const id = idleWindow.requestIdleCallback(callback, { timeout: 1500 });
    return () => idleWindow.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(callback, 600);
  return () => window.clearTimeout(id);
}

class MascotErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Nimbi] Mascot rendering was disabled after an error.", error, info);
    }
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function MascotLoader() {
  const pathname = usePathname();
  const { preferences, ready } = useMascotPreferences();
  const [shouldLoad, setShouldLoad] = useState(false);
  const isSensitivePath = SENSITIVE_MASCOT_PATHS.some((path) =>
    pathname.startsWith(path),
  );

  useEffect(() => {
    if (!ready || !preferences.enabled || isSensitivePath) {
      setShouldLoad(false);
      return;
    }
    return scheduleIdleTask(() => setShouldLoad(true));
  }, [isSensitivePath, preferences.enabled, ready]);

  if (!ready || !preferences.enabled || isSensitivePath || !shouldLoad) {
    return null;
  }

  return (
    <MascotErrorBoundary>
      <DeferredMascot />
    </MascotErrorBoundary>
  );
}
