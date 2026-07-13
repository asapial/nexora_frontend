"use client";

import { useEffect, type ReactNode } from "react";
import { suppressMascot } from "@/lib/mascot/eventBus";

export function MascotSuppressionBoundary({ children, mode="hidden", reason="workflow" }: { children:ReactNode; mode?:"hidden"|"speech"; reason?:string }) {
  useEffect(() => suppressMascot({ hide:mode==="hidden", speech:mode==="speech", reason }), [mode,reason]);
  return children;
}
