"use client";

import * as React from "react";
import Link from "next/link";
import {
  RiLogoutBoxLine,
  RiSettings3Line,
  RiShieldCheckLine,
  RiUserLine,
  RiMoreLine,
  RiMoonLine,
  RiSunLine,

} from "react-icons/ri";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { toast } from "sonner";

export interface NavUserData {
  name:    string;
  email:   string;
  avatar?: string;
  role?:   string;
}

// ─── Avatar ───────────────────────────────────────────────
function UserAvatar({
  name,
  src,
  size = "md",
  isActive = true,
}: {
  name: string;
  src?: string;
  size?: "sm" | "md";
  isActive?: boolean;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const dim = size === "sm" ? 28 : 36;
  const textSize = size === "sm" ? "text-[10.5px]" : "text-[12px]";

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: dim, height: dim }}
    >

      <div className="absolute inset-0 rounded-full bg-teal-500/25 blur-md scale-110" />

      <div className="relative w-full h-full rounded-full p-[2px] bg-gradient-to-br from-teal-400 to-teal-600">
        <div className="w-full h-full rounded-full overflow-hidden bg-background flex items-center justify-center">
          
          {src ? (
            <img
              src={src}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span
              className={cn(
                "font-bold text-teal-700 dark:text-teal-300",
                textSize
              )}
            >
              {initials}
            </span>
          )}

        </div>
      </div>


      {isActive && (
        <span
          className="
            absolute 
            bottom-0 right-0
            translate-x-1/4 translate-y-1/4
            w-2.5 h-2.5
            rounded-full
            bg-green-500
            border-2 border-background
            shadow-md
          "
        />
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────
export function NavUser({ user }: { user: NavUserData }) {
  const { isMobile } = useSidebar();
  const { theme, setTheme } = useTheme();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={cn(
                "h-auto rounded-xl px-3 py-2.5 gap-3",
                "border border-transparent",
                "hover:border-sidebar-border hover:bg-sidebar-accent",
                "transition-all duration-150",
                "data-[state=open]:border-sidebar-border data-[state=open]:bg-sidebar-accent"
              )}
            >
              <UserAvatar name={user.name} src={user.avatar} />

              <div className="flex-1 min-w-0 text-left">
                <p className="truncate text-[13px] font-semibold leading-none text-sidebar-foreground mb-0.5">
                  {user.name}
                </p>
                <p className="truncate text-[11px] leading-none text-sidebar-foreground/45">
                  {user.email}
                </p>
              </div>

              <RiMoreLine className="flex-shrink-0 text-base text-sidebar-foreground/35" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          {/* ── Dropdown ── */}
          <DropdownMenuContent
            side={isMobile ? "bottom" : "top"}
            align="end"
            sideOffset={6}
            className="w-64 rounded-xl border border-border bg-popover shadow-xl"
          >
            {/* User header */}
            <DropdownMenuLabel className="p-0">
              <div className="flex items-center gap-3 px-4 py-3.5">
                <UserAvatar name={user.name} src={user.avatar} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">{user.name}</p>
                  <p className="text-[11.5px] text-muted-foreground truncate">{user.email}</p>
                </div>
                {user.role && (
                  <span className="
                    flex-shrink-0 text-[10px] font-bold tracking-wider uppercase
                    px-2 py-0.5 rounded-full
                    bg-teal-100/80 dark:bg-teal-950/60
                    text-teal-700 dark:text-teal-400
                    border border-teal-200/70 dark:border-teal-800/60
                  ">
                    {user.role}
                  </span>
                )}
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* Account links */}
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="gap-2.5 px-4 py-2.5 cursor-pointer">
                <Link href="/dashboard/profile">
                  <RiUserLine className="text-base text-muted-foreground" />
                  <span className="text-[13px]">My Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="gap-2.5 px-4 py-2.5 cursor-pointer">
                <Link href="/dashboard/settings">
                  <RiSettings3Line className="text-base text-muted-foreground" />
                  <span className="text-[13px]">Account Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="gap-2.5 px-4 py-2.5 cursor-pointer">
                <Link href="/auth/changePassword">
                  <RiShieldCheckLine className="text-base text-muted-foreground" />
                  <span className="text-[13px]">Change Password</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* Theme switcher */}
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => setTheme("light")}
                className={cn(
                  "gap-2.5 px-4 py-2.5 cursor-pointer",
                  theme === "light" && "text-teal-700 dark:text-teal-300"
                )}
              >
                <RiSunLine className="text-base text-muted-foreground" />
                <span className="text-[13px]">Light</span>
                {theme === "light" && (
                  <span className="ml-auto text-[10px] font-bold text-teal-600 dark:text-teal-400">Active</span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("dark")}
                className={cn(
                  "gap-2.5 px-4 py-2.5 cursor-pointer",
                  theme === "dark" && "text-teal-700 dark:text-teal-300"
                )}
              >
                <RiMoonLine className="text-base text-muted-foreground" />
                <span className="text-[13px]">Dark</span>
                {theme === "dark" && (
                  <span className="ml-auto text-[10px] font-bold text-teal-600 dark:text-teal-400">Active</span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("system")}
                className={cn(
                  "gap-2.5 px-4 py-2.5 cursor-pointer",
                  theme === "system" && "text-teal-700 dark:text-teal-300"
                )}
              >
                <RiMoonLine className="text-base text-muted-foreground" />
                <span className="text-[13px]">System</span>
                {theme === "system" && (
                  <span className="ml-auto text-[10px] font-bold text-teal-600 dark:text-teal-400">Active</span>
                )}
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* Sign out */}
            <DropdownMenuItem
              className="gap-2.5 px-4 py-2.5 cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/30"
              onClick={async () => { 
                const res = await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); 
                const data = await res.json();
                if(data.success){
                  toast.success("Logout Successfylly",{position:"top-right"});
                  window.location.href="/"
                  
                }
              
              }}
            >
              <RiLogoutBoxLine className="text-base" />
              <span className="text-[13px]">Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}