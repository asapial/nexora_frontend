"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RiArrowDownSLine } from "react-icons/ri";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export interface NavDocSubItem {
  title: string;
  url:   string;
}

export interface NavDocItem {
  title:     string;
  url:       string;
  icon:      React.ReactNode;
  isActive?: boolean;
  items?:    NavDocSubItem[];
}

export function NavDocuments({ items, label }: { items: NavDocItem[]; label?: string }) {
  const pathname = usePathname();

  return (
    <SidebarGroup className="px-2 py-2">
      {label && (
        <SidebarGroupLabel className="
          mb-1 h-6 px-2
          text-[10px] font-bold tracking-[.12em] uppercase
          text-sidebar-foreground/35
        ">
          {label}
        </SidebarGroupLabel>
      )}

      <SidebarMenu className="gap-0.5">
        {items.map((item) => {
          const hasChildren  = !!item.items?.length;
          const isGroupActive =
            pathname === item.url ||
            pathname.startsWith(item.url + "/") ||
            (item.items?.some((s) => pathname === s.url || pathname.startsWith(s.url + "/")) ?? false);

          if (!hasChildren) {
            // flat link
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isGroupActive}
                  tooltip={item.title}
                  className={cn(
                    "h-9 gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors duration-150",
                    "text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                    isGroupActive && [
                      "!bg-teal-500/10 dark:!bg-teal-400/10",
                      "!text-teal-700 dark:!text-teal-300",
                      "font-semibold",
                    ]
                  )}
                >
                  <Link href={item.url}>
                    <span className={cn(
                      "flex-shrink-0 text-[17px] transition-colors duration-150",
                      isGroupActive
                        ? "text-teal-600 dark:text-teal-400"
                        : "text-sidebar-foreground/40"
                    )}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          // collapsible group
          return (
            <Collapsible
              key={item.title}
              defaultOpen={isGroupActive || item.isActive}
              asChild
            >
              <SidebarMenuItem>
                {/* ── Trigger ── */}
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isGroupActive}
                    className={cn(
                      "h-9 gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors duration-150 cursor-pointer",
                      "text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                      isGroupActive && [
                        "!bg-teal-500/10 dark:!bg-teal-400/10",
                        "!text-teal-700 dark:!text-teal-300",
                        "font-semibold",
                      ]
                    )}
                  >
                    {/* icon */}
                    <span className={cn(
                      "flex-shrink-0 text-[17px] transition-colors duration-150",
                      isGroupActive
                        ? "text-teal-600 dark:text-teal-400"
                        : "text-sidebar-foreground/40"
                    )}>
                      {item.icon}
                    </span>

                    <span className="flex-1 truncate">{item.title}</span>

                    {/* chevron — rotates via group-data-[state] */}
                    <RiArrowDownSLine className="
                      ml-auto flex-shrink-0 text-base
                      text-sidebar-foreground/35
                      transition-transform duration-200
                      group-data-[state=open]/collapsible:rotate-180
                    " />
                  </SidebarMenuButton>
                </CollapsibleTrigger>

                {/* ── Sub-items ── */}
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items!.map((sub) => {
                      const isSubActive =
                        pathname === sub.url ||
                        pathname.startsWith(sub.url + "/");

                      return (
                        <SidebarMenuSubItem key={sub.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isSubActive}
                            className={cn(
                              "h-7 text-[12.5px] transition-colors duration-150",
                              isSubActive
                                ? "!text-teal-700 dark:!text-teal-300 font-semibold !bg-teal-500/8 dark:!bg-teal-400/8"
                                : "text-sidebar-foreground/55 hover:text-sidebar-foreground"
                            )}
                          >
                            <Link href={sub.url}>{sub.title}</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}