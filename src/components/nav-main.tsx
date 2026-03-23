"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export interface NavMainItem {
  title: string;
  url:   string;
  icon:  React.ReactNode;
}

export function NavMain({ items }: { items: NavMainItem[] }) {
  const pathname = usePathname();

  return (
    <SidebarGroup className="px-2 py-2">
      <SidebarGroupLabel className="
        mb-1 h-6 px-2
        text-[10px] font-bold tracking-[.12em] uppercase
        text-sidebar-foreground/35
      ">
        Menu
      </SidebarGroupLabel>

      <SidebarMenu className="gap-0.5">
        {items.map((item) => {
          const isActive =
            pathname === item.url ||
            (item.url !== "/dashboard" && pathname.startsWith(item.url + "/"));

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                tooltip={item.title}
                className={cn(
                  // base
                  "h-9 gap-2.5 rounded-lg px-2.5 text-[13px] font-medium",
                  "transition-colors duration-150",
                  // idle
                  "text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                  // active — teal tint
                  isActive && [
                    "!bg-teal-500/10 dark:!bg-teal-400/10",
                    "!text-teal-700 dark:!text-teal-300",
                    "font-semibold",
                    "hover:!bg-teal-500/15 dark:hover:!bg-teal-400/15",
                  ]
                )}
              >
                <Link href={item.url}>
                  {/* Icon */}
                  <span className={cn(
                    "flex-shrink-0 text-[17px] transition-colors duration-150",
                    isActive
                      ? "text-teal-600 dark:text-teal-400"
                      : "text-sidebar-foreground/40"
                  )}>
                    {item.icon}
                  </span>

                  {/* Label */}
                  <span className="truncate">{item.title}</span>

                  {/* Active left bar — absolutely positioned inside the li */}
                  {isActive && (
                    <span
                      aria-hidden
                      className="
                        pointer-events-none absolute left-0 top-1.5 bottom-1.5
                        w-[3px] rounded-r-full bg-teal-500 dark:bg-teal-400
                      "
                    />
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}