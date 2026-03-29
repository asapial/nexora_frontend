"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { AmbientBg1, AmbientBg2, AmbientBg3, AmbientBg4, AmbientBg5, AmbientBg6 } from "@/components/backgrounds/AmbientBg";
import {
  Breadcrumb, BreadcrumbItem,
  BreadcrumbList, BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";

function getGreeting(): string {
  const hour = new Date().getHours(); 
  if (hour >= 5  && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
}


function DashboardHeader() {
  const [name, setName]           = useState<string>("");
  const [greeting, setGreeting]   = useState<string>("");

  useEffect(() => {

    setGreeting(getGreeting());

    const fetchUser = async () => {
      try {
        const res  = await fetch("/api/auth/me", { credentials: "include" });
        const data = await res.json();

        console.log(data)

        if (data.success) {

          const fullName = data?.data?.userData?.name || "";

          setName(fullName);
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };

    fetchUser();
  }, []);

  return (
    <header className="
      sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2
      border-b border-border
      bg-background/80 backdrop-blur-md
      px-4
      transition-[width,height] ease-linear
      group-has-data-[collapsible=icon]/sidebar-wrapper:h-12
    ">
      <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground transition-colors" />

      <Separator
        orientation="vertical"
        className="mx-1 data-[orientation=vertical]:h-4 bg-border"
      />

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="text-[13.5px] font-semibold text-foreground">
              Dashboard
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-2">
        <span className="hidden sm:block text-[12.5px] text-muted-foreground">
          {greeting && name
            ? `${greeting}, ${name} ` 
            : greeting                 
          }
        </span>
        <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
      </div>
    </header>
  );
}

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <DashboardHeader />
          <div>
               <AmbientBg1></AmbientBg1>
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}