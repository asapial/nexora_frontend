"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  AmbientBg1,
  AmbientBg2,
  AmbientBg3,
  AmbientBg4,
  AmbientBg5,
  AmbientBg6,
} from "@/components/backgrounds/AmbientBg";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

import { Separator } from "@/components/ui/separator";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { TooltipProvider } from "@/components/ui/tooltip";

import { useEffect, useState } from "react";

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────
type BgIndex = 1 | 2 | 3 | 4 | 5 | 6;

// ─────────────────────────────────────────
// GREETING
// ─────────────────────────────────────────
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
}

// ─────────────────────────────────────────
// BACKGROUND LOGIC
// ─────────────────────────────────────────
const getAmbientBgByHour = (hour: number): BgIndex => {
  if (hour >= 0 && hour < 4) return 1;
  if (hour >= 4 && hour < 8) return 2;
  if (hour >= 8 && hour < 12) return 3;
  if (hour >= 12 && hour < 16) return 4;
  if (hour >= 16 && hour < 20) return 5;
  return 6;
};


const ambientComponents: Record<BgIndex, React.FC> = {
  1: AmbientBg1,
  2: AmbientBg2,
  3: AmbientBg3,
  4: AmbientBg4,
  5: AmbientBg5,
  6: AmbientBg6,
};

// ─────────────────────────────────────────
// HOOK: AUTO BACKGROUND SWITCH
// ─────────────────────────────────────────
function useAmbientBg(): BgIndex {
  const [bgIndex, setBgIndex] = useState<BgIndex>(() =>
    getAmbientBgByHour(new Date().getHours())
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const hour = new Date().getHours();
      setBgIndex(getAmbientBgByHour(hour));
    }, 60 * 1000); // every minute

    return () => clearInterval(interval);
  }, []);

  return bgIndex;
}

// ─────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────
function DashboardHeader() {
  const [name, setName] = useState("");
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    setGreeting(getGreeting());

    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed request");

        const data = await res.json();

        if (data.success) {
          setName(data?.data?.userData?.name || "");
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };

    fetchUser();
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 backdrop-blur-md px-4">
      <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground transition-colors" />

      <Separator orientation="vertical" className="mx-1 h-4 bg-border" />

      {/* <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="text-[13.5px] font-semibold">
              Dashboard
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb> */}

      <div className="ml-auto flex items-center gap-2">
        <span className="hidden sm:block text-[12.5px] text-muted-foreground">
          {greeting && name ? `${greeting}, ${name}` : greeting}
        </span>
        <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
      </div>
    </header>
  );
}

// ─────────────────────────────────────────
// LAYOUT
// ─────────────────────────────────────────
export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const bgIndex = useAmbientBg();
  const AmbientComponent = ambientComponents[bgIndex];

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />

        <SidebarInset>
          <DashboardHeader />

          <div className="relative min-h-screen">
            {/* Background */}
            <div className="fixed inset-0 ">
              <AmbientComponent />
            </div>

            {/* Content */}
            <div className="relative z-10">
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}