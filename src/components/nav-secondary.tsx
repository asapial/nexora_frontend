"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export interface NavSecondaryItem {
  title: string;
  url:   string;
  icon:  React.ReactNode;
}

export function NavSecondary({
  items,
  className,
}: {
  items:      NavSecondaryItem[];
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup className={cn("px-2 py-2", className)}>
      {/* Thin separator above */}
      <div className="mx-1 mb-2 h-px bg-sidebar-border/50" />

      <SidebarMenu className="gap-0.5">
        {items.map((item) => {
          const isActive = pathname === item.url || pathname.startsWith(item.url + "/");

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                size="sm"
                tooltip={item.title}
                className={cn(
                  "h-8 gap-2.5 rounded-lg px-2.5 text-[12.5px] font-medium",
                  "transition-colors duration-150",
                  "text-sidebar-foreground/45 hover:text-sidebar-foreground/75 hover:bg-sidebar-accent",
                  isActive && [
                    "!text-teal-700 dark:!text-teal-300",
                    "!bg-teal-500/8 dark:!bg-teal-400/8",
                  ]
                )}
              >
                <Link href={item.url}>
                  <span className={cn(
                    "flex-shrink-0 text-[16px] transition-colors",
                    isActive
                      ? "text-teal-600 dark:text-teal-400"
                      : "text-sidebar-foreground/35"
                  )}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}